import type { RuleNode } from "../../src/lib/engine/schema";
import { evaluateEligibility } from "../../types/eligibility";
import { validateRules } from "../../src/lib/engine/schema";

export type ScholarshipId = "aas" | "chevening";

async function importJson(id: ScholarshipId): Promise<unknown> {
  switch (id) {
    case "aas": {
      const mod = await import("../../types/rules/aas.json");
      return (mod as any).default ?? mod;
    }
    case "chevening": {
      const mod = await import("../../types/rules/chevening.json");
      return (mod as any).default ?? mod;
    }
  }
}

export async function loadRulesServer(id: ScholarshipId): Promise<RuleNode[]> {
  try {
    const json = await importJson(id);
    const { rules, issues } = validateRules(json);
    if (issues.length) {
      console.warn(`[server rules] Validation issues for '${id}':`, issues);
    }
    return rules as RuleNode[];
  } catch (err) {
    console.warn(`[server rules] Failed to load rules for '${id}':`, err);
    return [] as RuleNode[];
  }
}

export function evaluateWithRules(answers: Record<string, any>, rules: RuleNode[]) {
  return evaluateEligibility(answers, rules);
}
