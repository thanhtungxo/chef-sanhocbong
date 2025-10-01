import { describe, it, expect } from 'vitest';
import { toAnswerSet } from '../src/lib/mappers';

describe('toAnswerSet', () => {
  it('maps englishScore to ielts and yearsOfExperience to workExperience', () => {
    const out = toAnswerSet({ englishScore: '7.5', yearsOfExperience: '3' } as any);
    expect(out.ielts).toBe(7.5);
    expect(out.workExperience).toBe(3);
  });

  it('maps hasWorkedInMilitaryPolice to military and militaryBoolean (boolean)', () => {
    const out = toAnswerSet({ hasWorkedInMilitaryPolice: true } as any);
    expect(out.military).toBe(true);
    expect(out.militaryBoolean).toBe(true);
  });
});

