export interface EligibilityRule {
  id: string;
  type: 'minScore' | 'boolean' | 'select' | 'text';
  field: string;
  value: any;
  message: string;
}

export interface AnswerSet {
  [key: string]: any;
}

export interface EvaluationResult {
  passed: boolean;
  failedRules: EligibilityRule[];
}

export function evaluateEligibility(
  answers: AnswerSet,
  rules: EligibilityRule[]
): EvaluationResult {
  const failedRules = rules.filter((rule) => {
    const userValue = answers[rule.field];

    switch (rule.type) {
      case 'minScore':
        return typeof userValue !== 'number' || userValue < rule.value;
      case 'boolean':
        return userValue !== rule.value;
      case 'select':
        return userValue !== rule.value;
      case 'text':
        return typeof userValue !== 'string' || userValue.trim() === '';
      default:
        return true;
    }
  });

  return {
    passed: failedRules.length === 0,
    failedRules,
  };
}
