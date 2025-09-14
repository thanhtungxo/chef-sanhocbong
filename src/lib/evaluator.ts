// src/lib/evaluator.ts
import { z } from "zod";
import { schema } from "@/ts/schema"; // tạo file này ngay sau
import { rules } from "@/ts/rules/aas.json"; // hoặc chevening nếu đang test chevening

interface Rule {
  id: string;
  string: string;
  condition: (data: z.infer<typeof schema>) => boolean;
}

export function evaluateEligibility(data: z.infer<typeof schema>) {
  const failedRules = rules.filter((rule) => {
    try {
      // Với rule dạng JSON rule engine, bạn có thể viết một evaluator riêng
      return !eval(rule.condition); // sẽ update sau
    } catch (err) {
      console.error("Invalid rule:", rule.id, err);
      return true;
    }
  });

  return {
    passed: failedRules.length === 0,
    failedRules,
  };
}
