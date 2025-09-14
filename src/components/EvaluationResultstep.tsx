type Props = {
  result: EvaluationResult
}
// src/components/EvaluationResult.tsx

import React from 'react';

interface EvaluationResult {
  passed: boolean;
  failedRules: { id: string; message: string }[];
}

interface EvaluationResultProps {
  result: EvaluationResult;
}

export const EvaluationResult: React.FC<EvaluationResultProps> = ({ result }) => {
  return (
    <div className="mt-6 border rounded p-4">
      {result.passed ? (
        <div className="text-green-600 font-semibold text-lg">
          ✅ Bạn đủ điều kiện nhận học bổng!
        </div>
      ) : (
        <>
          <div className="text-red-600 font-semibold mb-2">
            ❌ Bạn không đủ điều kiện vì:
          </div>
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
