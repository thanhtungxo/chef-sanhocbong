import React from 'react';
import { SectionTitle } from '../atoms/SectionTitle';
import { FormInput } from '../atoms/FormInput';
import { StepNavigation } from '../molecules/StepNavigation';
import { Label } from '../atoms/Label';
import { Card, CardHeader, CardContent, CardFooter } from '../atoms/Card';
import { motion } from 'framer-motion';
import { Globe, FlaskConical, BarChart3 } from 'lucide-react';

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
    <div className="max-w-xl mx-auto p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="rounded-lg shadow-xl border border-primary/20 bg-gradient-to-b from-primary/5 via-background to-primary/5">
          <CardHeader>
            <SectionTitle>
              <Globe className="inline-block mr-2 h-5 w-5" /> English Proficiency
            </SectionTitle>
            <p className="text-sm text-muted-foreground">Choose your English test and enter your score.</p>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label className="font-medium mb-1">Test Type</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none">
                  <FlaskConical className="h-4 w-4 text-muted-foreground" />
                </span>
                <select
                  className="w-full border border-input bg-background text-foreground rounded-md px-3 py-2 pl-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="IELTS">IELTS</option>
                  <option value="TOEFL">TOEFL</option>
                  <option value="PTE">PTE</option>
                </select>
              </div>
            </div>

            <FormInput
              label="Score"
              type="number"
              value={score}
              onChange={setScore}
              icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
            />
          </CardContent>
          <CardFooter>
            <StepNavigation onBack={onBack} onNext={onNext} />
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};
