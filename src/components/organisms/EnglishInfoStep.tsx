import React from 'react';
import { SectionTitle } from '../atoms/SectionTitle';
import { FormInput } from '../atoms/FormInput';
import { StepNavigation } from '../molecules/StepNavigation';
import { Label } from '../atoms/Label';
import { Card, CardHeader, CardContent, CardFooter } from '../atoms/Card';

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
    <div className="max-w-xl mx-auto p-4">
      <Card>
        <CardHeader>
          <SectionTitle>English Proficiency</SectionTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label className="font-medium mb-1">Test Type</Label>
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
        </CardContent>
        <CardFooter>
          <StepNavigation onBack={onBack} onNext={onNext} />
        </CardFooter>
      </Card>
    </div>
  );
};
