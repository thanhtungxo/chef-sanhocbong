import { action, internalQuery, internalMutation } from "./_generated/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"

// Internal query: get active form set's question keys (latest active)
export const getActiveQuestionKeys = internalQuery({
  args: {},
  handler: async (ctx) => {
    const actives = await ctx.db
      .query("formSets")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect()
    if (!actives || actives.length === 0) return [] as string[]
    const active = actives
      .slice()
      .sort((a: any, b: any) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
      .at(-1)
    if (!active) return [] as string[]
    const qs = await ctx.db
      .query("formQuestions")
      .withIndex("by_formSet_step_order", (q) => q.eq("formSetId", active._id))
      .collect()
    const keys = Array.from(new Set(qs.map((q) => String((q as any).key || "").trim()).filter(Boolean)))
    return keys
  },
})

// Internal query: list all form submissions
export const listAllSubmissions = internalQuery({
  args: {},
  handler: async (ctx) => {
    const subs = await ctx.db.query("form_submissions").collect()
    return subs as any[]
  },
})

// Public action: ensure normalizedAnswers contains all active keys for all submissions
export const syncAnswers = action({
  args: {},
  handler: async (ctx): Promise<{ ok: true; keysCount: number; submissionsCount: number; patchedCount: number }> => {
    const keys: string[] = await ctx.runQuery(internal.answers.getActiveQuestionKeys, {})
    const subs: any[] = await ctx.runQuery(internal.answers.listAllSubmissions, {})

    let patchedCount = 0
    for (const key of keys) {
      const res: { ok: true; created: number } = await ctx.runMutation(internal.answers.backfillKeyAcrossSubmissions, { key })
      patchedCount += res.created
    }

    return { ok: true, keysCount: keys.length, submissionsCount: subs.length, patchedCount } as any
  },
})

// Internal mutation: backfill a single key across all submissions (normalizedAnswers JSON only)
export const backfillKeyAcrossSubmissions = internalMutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const subs = await ctx.db.query("form_submissions").collect()
    let patched = 0
    for (const sub of subs as any[]) {
      const normalized = (sub as any).normalizedAnswers ?? {}
      if (!(key in (normalized ?? {}))) {
        const patchObj = { ...(normalized ?? {}), [key]: null }
        await ctx.db.patch((sub as any)._id, { normalizedAnswers: patchObj } as any)
        patched++
      }
    }
    return { ok: true, created: patched } as any
  },
})

// Public action: sync a single key (used by Admin or HTTP endpoint)
export const syncAnswersForKey = action({
  args: { key: v.string() },
  handler: async (ctx, { key }): Promise<{ ok: true; created: number }> => {
    const res: { ok: true; created: number } = await ctx.runMutation(internal.answers.backfillKeyAcrossSubmissions, { key })
    return res
  },
})

// Internal mutation: rename a key across all submissions (normalizedAnswers JSON only)
export const renameKeyAcrossSubmissions = internalMutation({
  args: { oldKey: v.string(), newKey: v.string() },
  handler: async (ctx, { oldKey, newKey }) => {
    const subs = await ctx.db.query("form_submissions").collect()
    let normalizedUpdated = 0

    for (const sub of subs as any[]) {
      const normalized = (sub as any).normalizedAnswers ?? {}
      if (normalized && Object.prototype.hasOwnProperty.call(normalized, oldKey)) {
        const value = (normalized as any)[oldKey]
        const newObj = { ...(normalized as any) }
        delete (newObj as any)[oldKey]
        if (!(newKey in newObj)) (newObj as any)[newKey] = value
        await ctx.db.patch((sub as any)._id, { normalizedAnswers: newObj } as any)
        normalizedUpdated++
      }
    }

    return { ok: true, movedAnswers: 0, normalizedUpdated } as any
  },
})

// Public action: rename a key (used by Admin or HTTP endpoint)
export const syncRenameKey = action({
  args: { oldKey: v.string(), newKey: v.string() },
  handler: async (ctx, { oldKey, newKey }): Promise<{ ok: true; movedAnswers: number; normalizedUpdated: number }> => {
    const res: { ok: true; movedAnswers: number; normalizedUpdated: number } = await ctx.runMutation(internal.answers.renameKeyAcrossSubmissions, { oldKey, newKey })
    return res
  },
})