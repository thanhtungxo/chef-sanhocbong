import React from 'react';
import { SectionTitle } from '../atoms/SectionTitle';
import { FormInput } from '../atoms/FormInput';
import { StepNavigation } from '../molecules/StepNavigation';

interface Props {
  fullName: string;
  age: string;
  setFullName: (val: string) => void;
  setAge: (val: string) => void;
  onNext: () => void;
}

export const PersonalInfoStep: React.FC<Props> = ({
  fullName,
  age,
  setFullName,
  setAge,
  onNext,
}) => {
  return (
    <div>
      <SectionTitle>Personal Information</SectionTitle>
      <FormInput label="Full Name" value={fullName} onChange={setFullName} />
      <FormInput label="Age" type="number" value={age} onChange={setAge} />
      <StepNavigation onBack={() => {}} showBack={false} onNext={onNext} />
    </div>
  );
};

