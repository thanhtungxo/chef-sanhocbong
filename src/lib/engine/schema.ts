import { z } from "zod";

export const RuleTypeEnum = z.enum(["minScore", "boolean", "select", "text"]);
export const SeverityEnum = z.enum(["blocker", "warn"]).default("blocker");

export const LeafRuleSchema = z.object({
  id: z.string().min(1),
  type: RuleTypeEnum,
  field: z.string().min(1),
  value: z.any(),
  message: z.string().min(1),
  messageKey: z.string().optional(),
  severity: SeverityEnum.optional(),
});

export const GroupRuleSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    operator: z.enum(["all", "any"]),
    rules: z.array(RuleNodeSchema),
    message: z.string().optional(),
    messageKey: z.string().optional(),
    severity: SeverityEnum.optional(),
  })
);

export const RuleNodeSchema: z.ZodType<any> = z.union([LeafRuleSchema, GroupRuleSchema]);

export const RulesArraySchema = z.array(RuleNodeSchema);

export type RuleNode = z.infer<typeof RuleNodeSchema>;

export function validateRules(json: unknown): { rules: RuleNode[]; issues: string[] } {
  const issues: string[] = [];
  const res = RulesArraySchema.safeParse(json);
  if (!res.success) {
    for (const issue of res.error.issues) {
      issues.push(`${issue.path.join(".")}: ${issue.message}`);
    }
    return { rules: [], issues };
  }
  return { rules: res.data, issues };
}
