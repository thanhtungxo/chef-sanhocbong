// src/store/eligibilityStore.ts
import { create } from 'zustand';
import { z } from 'zod';
import { schema } from '@/ts/schema';

type FormData = z.infer<typeof schema>;

interface EligibilityState {
  step: number;
  formData: FormData;
  setStep: (step: number) => void;
  updateField: (field: keyof FormData, value: any) => void;
  reset: () => void;
}

export const useEligibilityStore = create<EligibilityState>((set) => ({
  step: 0,
  formData: {
    age: 0,
    englishScore: 0,
    country: '',
    employment: '',
    hasMilitaryBackground: false,
  },
  setStep: (step) => set({ step }),
  updateField: (field, value) =>
    set((state) => ({
      formData: {
        ...state.formData,
        [field]: value,
      },
    })),
  reset: () =>
    set({
      step: 0,
      formData: {
        age: 0,
        englishScore: 0,
        country: '',
        employment: '',
        hasMilitaryBackground: false,
      },
    }),
}));
