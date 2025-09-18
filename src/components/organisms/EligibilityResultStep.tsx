import React from 'react';
import { ResultMessage } from '../molecules/ResultMessage';
import { SectionTitle } from '../atoms/SectionTitle';
import { Button } from '../atoms/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../atoms/Card';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  aasEligible: boolean;
  cheveningEligible: boolean;
  aasReasons: string[];
  cheveningReasons: string[];
  onRestart: () => void;
  formData?: any;
}

export const EligibilityResultStep: React.FC<Props> = ({
  aasEligible,
  cheveningEligible,
  aasReasons,
  cheveningReasons,
  onRestart,
  formData,
}) => {
  // Save submission non-blocking when this step mounts
  const saveSubmission = (window as any).useConvexSaveSubmission as undefined | ((data: any) => Promise<void>);
  React.useEffect(() => {
    // Defer to a global helper injected by parent page to avoid tight coupling here
    if (saveSubmission && formData) {
      saveSubmission({
        formData,
        result: { aasEligible, aasReasons, cheveningEligible, cheveningReasons },
      }).catch(() => {});
    }
  }, []);
  return (
    <div className="max-w-xl mx-auto p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="rounded-lg shadow-xl border border-primary/20 bg-gradient-to-b from-primary/5 via-background to-primary/5">
          <CardHeader>
            <SectionTitle>
              <CheckCircle2 className="inline-block mr-2 h-5 w-5" /> Eligibility Result
            </SectionTitle>
            <p className="text-sm text-muted-foreground">Your scholarship eligibility status.</p>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <ResultMessage
                message={aasEligible ? 'You are eligible for AAS' : 'Not eligible for AAS'}
                type={aasEligible ? 'success' : 'error'}
              />
            {!aasEligible && (
              <ul className="list-disc ml-6 text-sm text-gray-600">
                {aasReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="mb-6">
            <ResultMessage
              message={cheveningEligible ? 'You are eligible for Chevening' : 'Not eligible for Chevening'}
              type={cheveningEligible ? 'success' : 'error'}
            />
            {!cheveningEligible && (
              <ul className="list-disc ml-6 text-sm text-gray-600">
                {cheveningReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </div>
          </CardContent>
          <CardFooter>
            <div className="w-full text-center">
              <Button className="bg-gradient-to-r from-primary to-primary/80 text-white hover:scale-105 transition-transform duration-200 h-11 px-6 rounded-md" onClick={onRestart}>Restart Form</Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};
