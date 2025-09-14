import { evaluateEligibility, loadRules } from "./evaluator";
import { AnswerSet, EligibilityResult } from "@/types/eligibility";
import { v4 as uuidv4 } from "uuid";

export async function evaluateScholarshipsLocally(
  formData: AnswerSet
): Promise<EligibilityResult> {
  const aasRules = await loadRules("aas");
  const chvRules = await loadRules("chevening");

  const aasResult = evaluateEligibility(formData, aasRules);
  const chvResult = evaluateEligibility(formData, chvRules);

  return {
    applicationId: uuidv4() as any, // fake ID
    aasEligible: aasResult.passed,
    aasReasons: aasResult.failedRules.map(r => r.message),
    cheveningEligible: chvResult.passed,
    cheveningReasons: chvResult.failedRules.map(r => r.message),
  };
}
