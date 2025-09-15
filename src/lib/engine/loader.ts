import type { RuleNode } from "./schema";
import { validateRules } from "./schema";

// Build a map of all JSON rules at build time via Vite's glob import
const ruleModules = import.meta.glob("../../../types/rules/*.json", { eager: true });

function extractId(filePath: string): string {
  // e.g. '../../../types/rules/aas.json' -> 'aas'
  const m = filePath.match(/([^\\/]+)\.json$/i);
  return m ? m[1] : filePath;
}

function getRawRulesJsonById(id: string): unknown | undefined {
  for (const [path, mod] of Object.entries(ruleModules)) {
    if (extractId(path) === id) {
      // Vite JSON imports expose default
      return (mod as any).default ?? mod;
    }
  }
  return undefined;
}

export async function loadRulesWithIssues(id: string): Promise<{ rules: RuleNode[]; issues: string[] }> {
  try {
    const json = getRawRulesJsonById(id);
    if (json === undefined) {
      const issue = `Unknown ruleset id: ${id}`;
      console.warn(`[rules] ${issue}`);
      return { rules: [] as RuleNode[], issues: [issue] };
    }
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

export async function loadRules(id: string): Promise<RuleNode[]> {
  const { rules } = await loadRulesWithIssues(id);
  return rules;
}

// Optional: expose the discovered ids for UI listing
export function listAvailableRuleIds(): string[] {
  const ids = new Set<string>();
  for (const p of Object.keys(ruleModules)) ids.add(extractId(p));
  return Array.from(ids);
}
