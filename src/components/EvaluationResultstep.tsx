import React from "react";
import { evaluateEligibility } from "@/lib/evaluator";
import { z, schema } from "@/ts/schema";
import type { RuleNode as EvalRule, EvaluationResult } from "../../types/eligibility";

interface Props {
  formData: z.infer<typeof schema>;
  rules: EvalRule[];
}

export const EligibilityResultStep: React.FC<Props> = ({ formData, rules }) => {
  const result: EvaluationResult = evaluateEligibility(
    formData as Record<string, any>,
    rules
  );

  return (
    <div className="mt-6 border rounded p-4">
      {result.passed ? (
        <p className="text-green-600 font-semibold text-lg">
          You meet the eligibility requirements!
        </p>
      ) : (
        <>
          <p className="text-red-600 font-semibold mb-2">
            You are not eligible because:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {result.failedRules.map((rule) => (
              <li key={rule.id}>{rule.message}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

