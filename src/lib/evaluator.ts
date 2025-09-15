// src/lib/evaluator.ts
// Safe evaluator wrapper + rules loader. Avoids string eval entirely.
export { evaluateEligibility } from "../../types/eligibility";
export { loadRules, loadRulesWithIssues } from "./engine/loader";

// Minimal loader. Loads JSON by scholarship id and returns a normalized array.
export async function loadRules(id: string): Promise<EligibilityRule[]> {
  try {
    switch (id) {
      case "aas": {
        const mod = await import("../../types/rules/aas.json");
        const data = (mod as any).default ?? mod;
        if (Array.isArray(data)) return data as EligibilityRule[];
        console.warn("AAS rules are not an array. Returning empty.");
        return [];
      }
      case "chevening": {
        const mod = await import("../../types/rules/chevening.json");
        const data = (mod as any).default ?? mod;
        if (Array.isArray(data)) return data as EligibilityRule[];
        console.warn("Chevening rules are not an array. Returning empty.");
        return [];
      }
      default:
        console.warn(`Unknown ruleset id: ${id}`);
        return [];
    }
  } catch (err) {
    console.warn(`Failed to load rules for '${id}':`, err);
    return [];
  }
}
