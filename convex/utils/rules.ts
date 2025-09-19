import type { RuleNode } from "../shared/engine/schema";
import { evaluateEligibility } from "../shared/eligibility";
import { validateRules } from "../shared/engine/schema";
import type { QueryCtx } from "../_generated/server";

export type ScholarshipId = string; // server accepts any string id

async function importJsonFallback(id: ScholarshipId): Promise<unknown | undefined> {
  try {
    switch (id) {
      case "aas": {
        const mod = await import("../shared/rules/aas.json");
        return (mod as any).default ?? mod;
      }
      case "chevening": {
        const mod = await import("../shared/rules/chevening.json");
        return (mod as any).default ?? mod;
      }
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

export async function loadRulesServer(ctx: QueryCtx, id: ScholarshipId): Promise<RuleNode[]> {
  try {
    // 1) Try DB ruleset marked as active
    const rows = await ctx.db
      .query("rulesets")
      .withIndex("by_scholarshipId", (q) => q.eq("scholarshipId", id))
      .collect();
    const active = rows.find((r) => r.isActive);
    if (active) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(active.json);
      } catch (e) {
        console.warn(`[server rules] Active ruleset for '${id}' has invalid JSON:`, e);
        parsed = undefined;
      }
      if (parsed !== undefined) {
        const { rules, issues } = validateRules(parsed);
        if (issues.length) console.warn(`[server rules] Validation issues for '${id}':`, issues);
        return rules as RuleNode[];
      }
    }

    // 2) Fallback to bundled JSON (useful in dev or before publishing)
    const json = await importJsonFallback(id);
    if (json !== undefined) {
      const { rules, issues } = validateRules(json);
      if (issues.length) console.warn(`[server rules] Validation issues (fallback) for '${id}':`, issues);
      return rules as RuleNode[];
    }

    console.warn(`[server rules] No rules found for '${id}'.`);
    return [] as RuleNode[];
  } catch (err) {
    console.warn(`[server rules] Failed to load rules for '${id}':`, err);
    return [] as RuleNode[];
  }
}

export function evaluateWithRules(answers: Record<string, any>, rules: RuleNode[]) {
  return evaluateEligibility(answers, rules);
}
