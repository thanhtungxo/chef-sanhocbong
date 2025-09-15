import React from 'react';
import { FormInput } from '../atoms/FormInput';
import { SectionTitle } from '../atoms/SectionTitle';
import { StepNavigation } from '../molecules/StepNavigation';

interface Props {
  fullName: string;
  setFullName: (val: string) => void;
  age: string;
  setAge: (val: string) => void;
  onNext: () => void;
}

export const PersonalInfoStep: React.FC<Props> = ({ fullName, setFullName, age, setAge, onNext }) => (
  <div>
    <SectionTitle>Thông tin cá nhân</SectionTitle>
    <FormInput label="Họ và tên" value={fullName} onChange={setFullName} />
    <FormInput label="Tuổi" value={age} onChange={setAge} type="number" />
    <StepNavigation onBack={() => {}} onNext={onNext} showBack={false} />
  </div>
);

