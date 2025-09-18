import React from 'react';
import { useEligibilityStore } from '@/store/eligibilityStore';
import { PersonalInfoStep } from '../organisms/PersonalInfoStep';
import { WorkInfoStep } from '../organisms/WorkInfoStep';
import { EnglishInfoStep } from '../organisms/EnglishInfoStep';
import { EligibilityResultStep } from '../organisms/EligibilityResultStep';
import { useEligibilityEngine } from '@/lib/useEligibilityEngine';
import { toAnswerSet } from '@/lib/mappers';
import { t } from '@/lib/i18n';
import { Progress } from '@/components/atoms/Progress';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';

/* eslint-disable */
export const EligibilityChecker: React.FC = () => {
  const step = useEligibilityStore((s) => s.step);
  const setStep = useEligibilityStore((s) => s.setStep);
  const updateField = useEligibilityStore((s) => s.updateField);
  const formData = useEligibilityStore((s) => s.formData);
  const reset = useEligibilityStore((s) => s.reset);

  const engine = useEligibilityEngine();
  const [aasEligible, setAasEligible] = React.useState<boolean>(false);
  const [cheEligible, setCheEligible] = React.useState<boolean>(false);
  const [aasReasons, setAasReasons] = React.useState<string[]>([]);
  const [cheReasons, setCheReasons] = React.useState<string[]>([]);
  const [ruleIssues, setRuleIssues] = React.useState<string[]>([]);

  const onNext = async () => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }

    // Prepare answers via centralized mapper
    const answers = toAnswerSet(formData as any);

    const [aEval, cEval] = await Promise.all([
      engine.evaluate('aas', answers),
      engine.evaluate('chevening', answers),
    ]);
    const { result: aas, errors: aErrors } = aEval;
    const { result: che, errors: cErrors } = cEval;

    setAasEligible(aas.passed);
    setCheEligible(che.passed);
    setAasReasons(aas.failedRules.map((r) => t(r.messageKey, r.message)));
    setCheReasons(che.failedRules.map((r) => t(r.messageKey, r.message)));
    const issues = [...aErrors, ...cErrors];
    setRuleIssues(Array.from(new Set(issues)));
    setStep(3);
    toast.success('🎉 Eligibility check complete!');
  };

  const onBack = () => {
    if (step > 0) setStep(step - 1);
  };

  // Convex integration helper used by the results step (non-blocking save)
  const saveSubmissionMutation = useMutation(api.submissions.saveSubmission);
  React.useEffect(() => {
    (window as any).useConvexSaveSubmission = async ({ formData, result }: any) => {
      try {
        await saveSubmissionMutation({
          fullName: formData.fullName ?? '',
          email: formData.email ?? '',
          dateOfBirth: formData.dateOfBirth ?? '',
          gender: formData.gender ?? '',
          countryOfCitizenship: formData.countryOfCitizenship ?? formData.country ?? '',
          currentCity: formData.currentCity ?? '',
          englishTestType: formData.englishTestType ?? '',
          englishScore: typeof formData.englishScore === 'number' ? formData.englishScore : undefined,
          currentJobTitle: formData.currentJobTitle ?? formData.jobTitle ?? '',
          employerName: formData.employerName ?? formData.employer ?? '',
          aasEligible: !!result.aasEligible,
          aasReasons: result.aasReasons ?? [],
          cheveningEligible: !!result.cheveningEligible,
          cheveningReasons: result.cheveningReasons ?? [],
        });
        toast.success(t('ui.save.success', 'Submission saved'));
      } catch (e) {
        toast.error(t('ui.save.error', 'Failed to save submission'));
      }
    };
    return () => {
      delete (window as any).useConvexSaveSubmission;
    };
  }, [saveSubmissionMutation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50 flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-3xl">
      <div className="text-center mb-8">
        <div className="mx-auto inline-flex items-center justify-center text-3xl">🎓</div>
        <h1 className="mt-2 text-2xl font-heading font-semibold bg-gradient-to-r from-green-500 to-orange-400 bg-clip-text text-transparent">Sanhocbong Eligibility</h1>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Bước {Math.min(step + 1, 4)}/4</span>
          <span className="text-sm text-muted-foreground">{Math.round(((Math.min(step, 3) + 1) / 4) * 100)}%</span>
        </div>
        <Progress value={((Math.min(step, 3) + 1) / 4) * 100} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
          {step === 0 && (
            <PersonalInfoStep
              fullName={formData.fullName}
              setFullName={(v) => updateField('fullName', v)}
              age={formData.age?.toString() ?? ''}
              setAge={(v) => updateField('age', v ? Number(v) : null)}
              onNext={onNext}
            />
          )}
          {step === 1 && (
            <WorkInfoStep
              jobTitle={formData.jobTitle}
              employer={formData.employer}
              onChangeJobTitle={(v) => updateField('jobTitle', v)}
              onChangeEmployer={(v) => updateField('employer', v)}
              onBack={onBack}
              onNext={onNext}
            />
          )}
          {step === 2 && (
            <EnglishInfoStep
              testType={formData.englishTestType}
              score={formData.englishScore?.toString() ?? ''}
              setTestType={(v) => updateField('englishTestType', v)}
              setScore={(v) => updateField('englishScore', v ? Number(v) : null)}
              onBack={onBack}
              onNext={onNext}
            />
          )}
      {step === 3 && (
        <EligibilityResultStep
          aasEligible={aasEligible}
          cheveningEligible={cheEligible}
          aasReasons={aasReasons}
          cheveningReasons={cheReasons}
          formData={formData as any}
          onRestart={() => {
            reset();
            setAasEligible(false);
            setCheEligible(false);
            setAasReasons([]);
            setCheReasons([]);
            setRuleIssues([]);
          }}
        />
      )}
        </motion.div>
      </AnimatePresence>

      {step === 3 && ruleIssues.length > 0 && (
        <div className="mt-4 p-3 rounded bg-yellow-100 text-yellow-800 text-sm">
          Rule validation issues: {ruleIssues.join('; ')}
        </div>
      )}
      </div>
    </div>
  );
};

