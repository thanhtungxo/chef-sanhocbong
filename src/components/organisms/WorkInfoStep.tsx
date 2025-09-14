import React from 'react';
import { SectionTitle } from '../atoms/SectionTitle';
import { FormInput } from '../atoms/FormInput';
import { StepNavigation } from '../molecules/StepNavigation';

interface Props {
  jobTitle: string;
  employer: string;
  onChangeJobTitle: (val: string) => void;
  onChangeEmployer: (val: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const WorkInfoStep: React.FC<Props> = ({
  jobTitle,
  employer,
  onChangeJobTitle,
  onChangeEmployer,
  onBack,
  onNext,
}) => {
  return (
    <div>
      <SectionTitle>Work Information</SectionTitle>
      <FormInput label="Job Title" value={jobTitle} onChange={onChangeJobTitle} />
      <FormInput label="Employer Name" value={employer} onChange={onChangeEmployer} />
      <StepNavigation onBack={onBack} onNext={onNext} />
    </div>
  );
};
