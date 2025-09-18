import React from 'react';
import { SectionTitle } from '../atoms/SectionTitle';
import { FormInput } from '../atoms/FormInput';
import { StepNavigation } from '../molecules/StepNavigation';
import { Card, CardHeader, CardContent, CardFooter } from '../atoms/Card';

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
    <div className="max-w-xl mx-auto p-4">
      <Card>
        <CardHeader>
          <SectionTitle>Work Information</SectionTitle>
        </CardHeader>
        <CardContent>
          <FormInput label="Job Title" value={jobTitle} onChange={onChangeJobTitle} />
          <FormInput label="Employer Name" value={employer} onChange={onChangeEmployer} />
        </CardContent>
        <CardFooter>
          <StepNavigation onBack={onBack} onNext={onNext} />
        </CardFooter>
      </Card>
    </div>
  );
};
