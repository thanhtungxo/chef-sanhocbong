import type { AnswerSet, EvaluationResult } from "../../types/eligibility";
import { loadRulesWithIssues, evaluateEligibility } from "./evaluator";

// Hook-like utility to evaluate a selected scholarship ruleset
// Returns a small API rather than directly coupling to React state.
export function useEligibilityEngine() {
  return {
    async evaluate(
      scholarshipId: "aas" | "chevening",
      answers: AnswerSet
    ): Promise<{ result: EvaluationResult; errors: string[] }> {
      const errors: string[] = [];
      const out = await loadRulesWithIssues(scholarshipId).catch((e) => ({ rules: [], issues: [`Failed to load rules: ${String(e)}`] }));
      if (out.issues.length) errors.push(...out.issues);
      const result = evaluateEligibility(answers, out.rules);
      return { result, errors };
    },
  };
}
