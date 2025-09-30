export type Severity = 'blocker' | 'warn';

export interface EligibilityRule {
  id: string;
  type: 'minScore' | 'boolean' | 'select' | 'text';
  field: string;
  value: any;
  message: string;
  messageKey?: string;
  severity?: Severity; // default 'blocker'
}

export interface RuleGroup {
  id: string;
  operator: 'all' | 'any';
  rules: RuleNode[];
  message?: string;
  messageKey?: string;
  severity?: Severity; // applies if group fails (optional)
}

export type RuleNode = EligibilityRule | RuleGroup;

export interface AnswerSet {
  [key: string]: any;
}

export interface EvaluationResult {
  passed: boolean; // true when there are no failed 'blocker' rules
  failedRules: EligibilityRule[]; // includes both blocker and warn failures
}

export function evaluateEligibility(
  answers: AnswerSet,
  rules: RuleNode[]
): EvaluationResult {
  const failed: EligibilityRule[] = [];

  const evalLeaf = (rule: EligibilityRule): boolean => {
    const userValue = answers[rule.field];
    switch (rule.type) {
      case 'minScore':
        return typeof userValue === 'number' && userValue >= rule.value;
      case 'boolean':
        return userValue === rule.value;
      case 'select':
        return userValue === rule.value;
      case 'text':
        return typeof userValue === 'string' && userValue.trim() !== '';
      default:
        return false;
    }
  };

  const visit = (node: RuleNode): boolean => {
    if ('type' in node) {
      const ok = evalLeaf(node);
      if (!ok) failed.push(node);
      return ok;
    }
    // group
    const results = node.rules.map(visit);
    const ok = node.operator === 'all' ? results.every(Boolean) : results.some(Boolean);
    // If group fails and group has its own message, push a synthetic failure
    if (!ok && node.message) {
      failed.push({
        id: node.id,
        type: 'text',
        field: '__group__',
        value: true,
        message: node.message,
        messageKey: node.messageKey,
        severity: node.severity ?? 'blocker',
      });
    }
    return ok;
  };

  for (const r of rules) visit(r);

  const hasBlocker = failed.some((r) => (r.severity ?? 'blocker') === 'blocker');
  return {
    passed: !hasBlocker,
    failedRules: failed,
  };
}

export interface ReasonObject {
  message: string;
}

export type Reason = string | ReasonObject;

export interface ScholarshipEvaluationSummary {
  id: string;
  name: string;
  eligible: boolean;
  reasons: Reason[];
}

export interface EligibilityResult {
  applicationId: string;
  scholarships: ScholarshipEvaluationSummary[];
  eligible: boolean;
  messageType: "fail_all" | "pass_all" | "pass_some";
}

