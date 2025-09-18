import React from 'react';
import { SectionTitle } from '../atoms/SectionTitle';
import { FormInput } from '../atoms/FormInput';
import { StepNavigation } from '../molecules/StepNavigation';
import { Card, CardHeader, CardContent, CardFooter } from '../atoms/Card';
import { motion } from 'framer-motion';

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
    <div className="max-w-xl mx-auto p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="rounded-lg shadow-xl border border-primary/20 bg-gradient-to-b from-primary/5 via-background to-primary/5">
          <CardHeader>
            <SectionTitle>
              <span className="mr-2">💼</span> Work Information
            </SectionTitle>
            <p className="text-sm text-muted-foreground">Tell us about your current role and employer.</p>
          </CardHeader>
          <CardContent>
            <FormInput label="Job Title" value={jobTitle} onChange={onChangeJobTitle} icon={"🧑‍💼"} />
            <FormInput label="Employer Name" value={employer} onChange={onChangeEmployer} icon={"🏢"} />
          </CardContent>
          <CardFooter>
            <StepNavigation onBack={onBack} onNext={onNext} />
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};
