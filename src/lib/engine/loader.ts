import type { RuleNode } from "./schema";
import { validateRules } from "./schema";
import type { ScholarshipId } from "./registry";

async function importJson(id: ScholarshipId): Promise<unknown> {
  switch (id) {
    case "aas": {
      const mod = await import("../../../types/rules/aas.json");
      return (mod as any).default ?? mod;
    }
    case "chevening": {
      const mod = await import("../../../types/rules/chevening.json");
      return (mod as any).default ?? mod;
    }
  }
}

export async function loadRulesWithIssues(id: ScholarshipId): Promise<{ rules: RuleNode[]; issues: string[] }> {
  try {
    const json = await importJson(id);
    const { rules, issues } = validateRules(json);
    if (issues.length) {
      console.warn(`[rules] Validation issues for '${id}':`, issues);
    }
    return { rules: rules as RuleNode[], issues };
  } catch (err) {
    console.warn(`[rules] Failed to load rules for '${id}':`, err);
    return { rules: [] as RuleNode[], issues: [String(err)] };
  }
}

export async function loadRules(id: ScholarshipId): Promise<RuleNode[]> {
  const { rules } = await loadRulesWithIssues(id);
  return rules;
}
