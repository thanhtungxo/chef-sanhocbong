import { evaluateEligibility, loadRules } from "./evaluator";
import { AnswerSet, EligibilityResult } from "../../types/eligibility";

const DEFAULT_NAME_MAP: Record<string, string> = {
  aas: "AAS",
  chevening: "Chevening",
};

export async function evaluateScholarshipsLocally(
  formData: AnswerSet,
  enabledIds: string[] = ["aas", "chevening"],
  nameOverrides: Record<string, string> = {}
): Promise<EligibilityResult> {
  const uniqueIds = Array.from(new Set(enabledIds));
  const shouldEvalAas = uniqueIds.includes("aas");
  const shouldEvalChevening = uniqueIds.includes("chevening");

  const [aasRules, cheRules] = await Promise.all([
    shouldEvalAas ? loadRules("aas") : Promise.resolve([]),
    shouldEvalChevening ? loadRules("chevening") : Promise.resolve([]),
  ]);

  const scholarships: EligibilityResult["scholarships"] = [];

  if (shouldEvalAas) {
    const aasResult = evaluateEligibility(formData, aasRules);
    scholarships.push({
      id: "aas",
      name: nameOverrides["aas"] ?? DEFAULT_NAME_MAP["aas"],
      eligible: aasResult.passed,
      reasons: aasResult.failedRules.map((r) => r.message),
    });
  }

  if (shouldEvalChevening) {
    const chvResult = evaluateEligibility(formData, cheRules);
    scholarships.push({
      id: "chevening",
      name: nameOverrides["chevening"] ?? DEFAULT_NAME_MAP["chevening"],
      eligible: chvResult.passed,
      reasons: chvResult.failedRules.map((r) => r.message),
    });
  }

  const applicationId =
    (globalThis.crypto?.randomUUID?.() ??
      `app_${Date.now()}_${Math.random().toString(36).slice(2)}`) as any;

  return {
    applicationId,
    scholarships,
  };
}
