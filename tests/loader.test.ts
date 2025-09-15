import { describe, it, expect } from 'vitest';
import { loadRules, listAvailableRuleIds } from '@/lib/engine/loader';

describe('rule loader', () => {
  it('discovers rule ids from JSON files', () => {
    const ids = listAvailableRuleIds();
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toContain('aas');
  });

  it('loads rules for a known id', async () => {
    const rules = await loadRules('aas');
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
  });
});

