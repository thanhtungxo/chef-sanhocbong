import { describe, it, expect } from 'vitest';
import { evaluateEligibility, type RuleNode } from '../types/eligibility';

describe('evaluateEligibility', () => {
  it('passes when all blocker rules succeed', () => {
    const rules: RuleNode[] = [
      { id: 'r1', type: 'minScore', field: 'score', value: 10, message: 'min' },
    ];
    const res = evaluateEligibility({ score: 12 }, rules);
    expect(res.passed).toBe(true);
    expect(res.failedRules.length).toBe(0);
  });

  it('fails when a blocker rule fails', () => {
    const rules: RuleNode[] = [
      { id: 'r1', type: 'minScore', field: 'score', value: 10, message: 'min' },
    ];
    const res = evaluateEligibility({ score: 8 }, rules);
    expect(res.passed).toBe(false);
    expect(res.failedRules.map(r => r.id)).toContain('r1');
  });
});

