import React from 'react';
import { SectionTitle } from '../atoms/SectionTitle';
import { FormInput } from '../atoms/FormInput';
import { StepNavigation } from '../molecules/StepNavigation';

interface Props {
  testType: string;
  score: string;
  setTestType: (val: string) => void;
  setScore: (val: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const EnglishInfoStep: React.FC<Props> = ({
  testType,
  score,
  setTestType,
  setScore,
  onBack,
  onNext,
}) => {
  return (
    <div>
      <SectionTitle>English Proficiency</SectionTitle>

      <div className="mb-4">
        <label className="block font-medium mb-1">Test Type</label>
        <select
          className="w-full border px-3 py-2 rounded"
          value={testType}
          onChange={(e) => setTestType(e.target.value)}
        >
          <option value="">Select</option>
          <option value="IELTS">IELTS</option>
          <option value="TOEFL">TOEFL</option>
          <option value="PTE">PTE</option>
        </select>
      </div>

      <FormInput
        label="Score"
        type="number"
        value={score}
        onChange={setScore}
      />

      <StepNavigation onBack={onBack} onNext={onNext} />
    </div>
  );
};
