import { create } from "zustand";

type FormData = {
  fullName: string;
  age: number | null;
  jobTitle: string;
  employer: string;
  englishTestType: string;
  englishScore: number | null;
};

type State = {
  step: number;
  formData: FormData;
  setStep: (s: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
};

export const useEligibilityStore = create<State>((set) => ({
  step: 0,
  formData: {
    fullName: "",
    age: null,
    jobTitle: "",
    employer: "",
    englishTestType: "",
    englishScore: null,
  },
  setStep: (s) => set({ step: s }),
  nextStep: () => set((st) => ({ step: st.step + 1 })),
  prevStep: () => set((st) => ({ step: Math.max(0, st.step - 1) })),
  reset: () =>
    set({
      step: 0,
      formData: {
        fullName: "",
        age: null,
        jobTitle: "",
        employer: "",
        englishTestType: "",
        englishScore: null,
      },
    }),
  updateField: (key, value) =>
    set((st) => ({ formData: { ...st.formData, [key]: value } })),
}));

