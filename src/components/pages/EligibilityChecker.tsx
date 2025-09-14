import { import { useEligibilityStore } from "@/store/eligibilityStore";

const step = useEligibilityStore((state) => state.step);
const setStep = useEligibilityStore((state) => state.setStep);
const formData = useEligibilityStore((state) => state.formData);
const updateField = useEligibilityStore((state) => state.updateField);
 } from 'react';
import { PersonalInfoStep } from '../organisms/PersonalInfoStep';
import { StepNavigation } from '../molecules/StepNavigation';
import { EligibilityResultStep } from '../organisms/EligibilityResultStep';

export const EligibilityChecker = () => {
  const [step, setStep] = import { useEligibilityStore } from "@/store/eligibilityStore";

const step = useEligibilityStore((state) => state.step);
const setStep = useEligibilityStore((state) => state.setStep);
const formData = useEligibilityStore((state) => state.formData);
const updateField = useEligibilityStore((state) => state.updateField);
(0);

  // State tạm thời (sau này bạn có thể dùng zustand nếu muốn)
  const [fullName, setFullName] = import { useEligibilityStore } from "@/store/eligibilityStore";

const step = useEligibilityStore((state) => state.step);
const setStep = useEligibilityStore((state) => state.setStep);
const formData = useEligibilityStore((state) => state.formData);
const updateField = useEligibilityStore((state) => state.updateField);
('');
  const [age, setAge] = import { useEligibilityStore } from "@/store/eligibilityStore";

const step = useEligibilityStore((state) => state.step);
const setStep = useEligibilityStore((state) => state.setStep);
const formData = useEligibilityStore((state) => state.formData);
const updateField = useEligibilityStore((state) => state.updateField);
('');

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded mt-10">
      {step === 0 && (
        <PersonalInfoStep fullName={fullName} setFullName={setFullName} age={age} setAge={setAge} />
      )}
      {step === 1 && (
        <EligibilityResultStep fullName={fullName} age={age} />
      )}

      <StepNavigation
        onBack={handleBack}
        onNext={handleNext}
        showBack={step > 0}
        isLastStep={step === 1}
      />
    </div>
  );
};
