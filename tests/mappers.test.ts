import { describe, it, expect } from 'vitest';
import { toAnswerSet } from '@/lib/mappers';

describe('toAnswerSet', () => {
  it('maps englishScore to ielts and yearsOfExperience to workExperience', () => {
    const out = toAnswerSet({ englishScore: '7.5', yearsOfExperience: '3' } as any);
    expect(out.ielts).toBe(7.5);
    expect(out.workExperience).toBe(3);
  });

  it('maps booleans to canonical keys', () => {
    const out = toAnswerSet({ hasWorkedInMilitaryPolice: true, isEmployerVietnameseOwned: false } as any);
    expect(out.military).toBe(true);
    expect(out.companyOwnership).toBe('non_vietnamese');
  });
});

