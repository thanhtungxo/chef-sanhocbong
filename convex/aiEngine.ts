import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Models
export const listModels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("ai_models").collect();
  },
});

export const getActiveModel = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("ai_models").withIndex("by_active", (q) => q.eq("isActive", true)).first();
  },
});

export const addModel = mutation({
  args: {
    provider: v.string(),
    model: v.string(),
    aliasKey: v.string(),
    status: v.string(), // 'Active' | 'Testing' | 'Disabled'
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("ai_models", { ...args, createdAt: now, updatedAt: now });
    // If setting active, mark others inactive
    if (args.isActive) {
      const all = await ctx.db.query("ai_models").collect();
      await Promise.all(all.filter(m => m._id !== id).map(m => ctx.db.patch(m._id, { isActive: false, updatedAt: Date.now() })));
    }
    return id;
  },
});

export const updateModel = mutation({
  args: {
    modelId: v.id("ai_models"),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    aliasKey: v.optional(v.string()),
    status: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { modelId, ...patch }) => {
    await ctx.db.patch(modelId, { ...patch, updatedAt: Date.now() });
    if (patch.isActive) {
      const all = await ctx.db.query("ai_models").collect();
      await Promise.all(all.filter(m => m._id !== modelId).map(m => ctx.db.patch(m._id, { isActive: false, updatedAt: Date.now() })));
    }
    return { ok: true };
  },
});

export const setActiveModel = mutation({
  args: { modelId: v.id("ai_models") },
  handler: async (ctx, { modelId }) => {
    const all = await ctx.db.query("ai_models").collect();
    await Promise.all(all.map(m => ctx.db.patch(m._id, { isActive: m._id === modelId, updatedAt: Date.now() })));
    return { ok: true };
  },
});

// Prompts
export const listPromptsByLayer = query({
  args: { layer: v.string() },
  handler: async (ctx, { layer }) => {
    return await ctx.db.query("ai_prompts").withIndex("by_layer", (q) => q.eq("layer", layer)).order("desc").collect();
  },
});

export const getActivePromptByLayer = query({
  args: { layer: v.string() },
  handler: async (ctx, { layer }) => {
    return await ctx.db.query("ai_prompts").withIndex("by_active_layer", (q) => q.eq("layer", layer).eq("isActive", true)).first();
  },
});

export const addPrompt = mutation({
  args: {
    layer: v.string(),
    title: v.optional(v.string()),
    version: v.string(),
    template: v.string(),
    modelId: v.id("ai_models"),
    temperature: v.number(),
    language: v.string(), // 'vi' | 'en'
    fallbackText: v.optional(v.string()),
    versionNote: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("ai_prompts", { ...args, createdAt: now, updatedAt: now });
    if (args.isActive) {
      const sameLayer = await ctx.db.query("ai_prompts").withIndex("by_layer", (q) => q.eq("layer", args.layer)).collect();
      await Promise.all(sameLayer.filter(p => p._id !== id).map(p => ctx.db.patch(p._id, { isActive: false, updatedAt: Date.now() })));
    }
    return id;
  },
});

export const updatePrompt = mutation({
  args: {
    promptId: v.id("ai_prompts"),
    title: v.optional(v.string()),
    version: v.optional(v.string()),
    template: v.optional(v.string()),
    modelId: v.optional(v.id("ai_models")),
    temperature: v.optional(v.number()),
    language: v.optional(v.string()),
    fallbackText: v.optional(v.string()),
    versionNote: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { promptId, ...patch }) => {
    await ctx.db.patch(promptId, { ...patch, updatedAt: Date.now() });
    if (patch.isActive) {
      const prompt = await ctx.db.get(promptId);
      if (prompt?.layer) {
        const sameLayer = await ctx.db.query("ai_prompts").withIndex("by_layer", (q) => q.eq("layer", prompt.layer)).collect();
        await Promise.all(sameLayer.filter(p => p._id !== promptId).map(p => ctx.db.patch(p._id, { isActive: false, updatedAt: Date.now() })));
      }
    }
    return { ok: true };
  },
});

export const publishPrompt = mutation({
  args: { promptId: v.id("ai_prompts") },
  handler: async (ctx, { promptId }) => {
    const prompt = await ctx.db.get(promptId);
    if (!prompt) return { ok: false, error: "Prompt not found" };
    const layer = prompt.layer;
    const sameLayer = await ctx.db.query("ai_prompts").withIndex("by_layer", (q) => q.eq("layer", layer)).collect();
    await Promise.all(sameLayer.map(p => ctx.db.patch(p._id, { isActive: p._id === promptId, updatedAt: Date.now() })));
    return { ok: true };
  },
});