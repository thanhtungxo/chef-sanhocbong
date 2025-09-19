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
  showAas?: boolean;
  showChevening?: boolean;
  aasName?: string;
  cheveningName?: string;
  onRestart: () => void;
  formData?: any;
  onEdit?: () => void;
}

export const EligibilityResultStep: React.FC<Props> = ({
  aasEligible,
  cheveningEligible,
  aasReasons,
  cheveningReasons,
  showAas = true,
  showChevening = true,
  aasName = 'AAS',
  cheveningName = 'Chevening',
  onRestart,
  formData,
  onEdit,
}) => {
  const saveSubmission = (window as any).useConvexSaveSubmission as undefined | ((data: any) => Promise<void>);
  React.useEffect(() => {
    if (saveSubmission && formData) {
      saveSubmission({
        formData,
        result: {
          aasEligible: showAas ? aasEligible : false,
          aasReasons: showAas ? aasReasons : [],
          cheveningEligible: showChevening ? cheveningEligible : false,
          cheveningReasons: showChevening ? cheveningReasons : [],
        },
      }).catch(() => {});
    }
  }, [saveSubmission, formData, aasEligible, cheveningEligible, aasReasons, cheveningReasons, showAas, showChevening]);

  const visibleSections = [
    showAas && {
      id: 'aas',
      name: aasName,
      eligible: aasEligible,
      reasons: aasReasons,
    },
    showChevening && {
      id: 'chevening',
      name: cheveningName,
      eligible: cheveningEligible,
      reasons: cheveningReasons,
    },
  ].filter(Boolean) as Array<{ id: string; name: string; eligible: boolean; reasons: string[] }>;

  const hasEligibleScholarship = visibleSections.some((sch) => sch.eligible);

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
          <CardContent className="space-y-6">
            {visibleSections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scholarships are currently enabled.</p>
            ) : (
              visibleSections.map((sch) => (
                <div key={sch.id}>
                  <ResultMessage
                    message={sch.eligible ? `You are eligible for ${sch.name}` : `Not eligible for ${sch.name}`}
                    type={sch.eligible ? 'success' : 'error'}
                  />
                  {!sch.eligible && sch.reasons.length > 0 && (
                    <ul className="list-disc ml-6 text-sm text-gray-600">
                      {sch.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </CardContent>
          <CardFooter>
            <div className="w-full text-center">
              <div className="flex justify-center gap-3">
                <Button
                  variant="secondary"
                  className="bg-gradient-to-r from-blue-500 to-blue-400 text-white hover:scale-105 transition-transform duration-200 h-11 px-6 rounded-full"
                  onClick={onEdit}
                >
                  Edit answers
                </Button>
                <Button className="bg-gradient-to-r from-primary to-primary/80 text-white hover:scale-105 transition-transform duration-200 h-11 px-6 rounded-full" onClick={onRestart}>Restart Form</Button>
              </div>
              {visibleSections.length > 0 && hasEligibleScholarship && (
                <p className="mt-4 text-sm text-green-700">Congratulations! You are eligible for at least one scholarship.</p>
              )}
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};
