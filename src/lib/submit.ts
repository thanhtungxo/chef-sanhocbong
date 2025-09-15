import { evaluateEligibility, loadRules } from "./evaluator";
import { AnswerSet, EligibilityResult } from "../../types/eligibility";

export async function evaluateScholarshipsLocally(
  formData: AnswerSet
): Promise<EligibilityResult> {
  const aasRules = await loadRules("aas");
  const chvRules = await loadRules("chevening");

  const aasResult = evaluateEligibility(formData, aasRules);
  const chvResult = evaluateEligibility(formData, chvRules);

  const applicationId = (globalThis.crypto?.randomUUID?.() ??
    `app_${Date.now()}_${Math.random().toString(36).slice(2)}`) as any;
  return {
    applicationId,
    aasEligible: aasResult.passed,
    aasReasons: aasResult.failedRules.map(r => r.message),
    cheveningEligible: chvResult.passed,
    cheveningReasons: chvResult.failedRules.map(r => r.message),
  };
}
