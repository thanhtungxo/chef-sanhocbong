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
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';

const DEFAULT_SCHOLARSHIP_NAMES: Record<string, string> = {
  aas: 'AAS',
  chevening: 'Chevening',
};

export const EligibilityChecker: React.FC = () => {
  const step = useEligibilityStore((s) => s.step);
  const setStep = useEligibilityStore((s) => s.setStep);
  const updateField = useEligibilityStore((s) => s.updateField);
  const formData = useEligibilityStore((s) => s.formData);
  const reset = useEligibilityStore((s) => s.reset);

  const scholarships = useQuery(api.scholarships.listScholarships, {});
  const activeForm = useQuery(api.forms.getActiveForm, {});
  const isAasEnabled = scholarships ? scholarships.some((s) => s.id === 'aas' && s.isEnabled) : true;
  const isCheEnabled = scholarships ? scholarships.some((s) => s.id === 'chevening' && s.isEnabled) : true;
  const aasName = scholarships?.find((s) => s.id === 'aas')?.name ?? DEFAULT_SCHOLARSHIP_NAMES.aas;
  const cheName = scholarships?.find((s) => s.id === 'chevening')?.name ?? DEFAULT_SCHOLARSHIP_NAMES.chevening;
  const hasAnyScholarship = isAasEnabled || isCheEnabled;

  // Build label/placeholder map from Convex active form
  const getFromActive = React.useCallback((key: string) => {
    if (!activeForm || !activeForm.questionsByStep) return null as any;
    for (const stepId of Object.keys(activeForm.questionsByStep)) {
      const arr = (activeForm.questionsByStep as any)[stepId] as any[];
      const found = arr?.find((q: any) => q.key === key);
      if (found) return found;
    }
    return null;
  }, [activeForm]);
  const getLabel = React.useCallback((key: string, fallback: string) => {
    const q = getFromActive(key);
    if (!q) return fallback;
    return q.ui?.labelText ?? t(q.labelKey, q.labelKey ?? fallback) ?? fallback;
  }, [getFromActive]);
  const getPlaceholder = React.useCallback((key: string, fallback: string) => {
    const q = getFromActive(key);
    if (!q) return fallback;
    const k = q.ui?.placeholderKey as string | undefined;
    return k ? t(k, fallback) : fallback;
  }, [getFromActive]);

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

    if (!hasAnyScholarship) {
      toast.warning('No scholarships are currently enabled.');
      return;
    }

    const answers = toAnswerSet(formData as any);
    const errors: string[] = [];

    if (isAasEnabled) {
      const { result, errors: evalErrors } = await engine.evaluate('aas', answers);
      setAasEligible(result.passed);
      setAasReasons(result.failedRules.map((r) => t(r.messageKey, r.message)));
      errors.push(...evalErrors);
    } else {
      setAasEligible(false);
      setAasReasons([]);
    }

    if (isCheEnabled) {
      const { result, errors: evalErrors } = await engine.evaluate('chevening', answers);
      setCheEligible(result.passed);
      setCheReasons(result.failedRules.map((r) => t(r.messageKey, r.message)));
      errors.push(...evalErrors);
    } else {
      setCheEligible(false);
      setCheReasons([]);
    }

    setRuleIssues(Array.from(new Set(errors)));
    setStep(3);
    toast.success('Eligibility check complete!');
  };

  const onBack = () => {
    if (step > 0) setStep(step - 1);
  };

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
          aasEligible: isAasEnabled ? !!result.aasEligible : false,
          aasReasons: isAasEnabled ? result.aasReasons ?? [] : [],
          cheveningEligible: isCheEnabled ? !!result.cheveningEligible : false,
          cheveningReasons: isCheEnabled ? result.cheveningReasons ?? [] : [],
        });
        toast.success(t('ui.save.success', 'Submission saved'));
      } catch (e) {
        toast.error(t('ui.save.error', 'Failed to save submission'));
      }
    };
    return () => {
      delete (window as any).useConvexSaveSubmission;
    };
  }, [saveSubmissionMutation, isAasEnabled, isCheEnabled]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50 flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="mx-auto inline-flex items-center justify-center text-3xl">dYZ"</div>
          <h1 className="mt-2 text-2xl font-heading font-semibold bg-gradient-to-r from-green-500 to-orange-400 bg-clip-text text-transparent">Sanhocbong Eligibility</h1>
          {!hasAnyScholarship && (
            <p className="mt-2 text-sm text-red-600">All scholarships are currently disabled in the admin dashboard.</p>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Bước {Math.min(step + 1, 4)}/4</span>
            <span className="text-sm text-muted-foreground">{Math.round(((Math.min(step, 3) + 1) / 4) * 100)}%</span>
          </div>
          <Progress value={((Math.min(step, 3) + 1) / 4) * 100} />
          <div className="mt-2 flex items-center justify-center gap-2 text-sm">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (idx <= step) setStep(idx);
                }}
                className={`px-3 py-1 rounded-full border ${idx < step ? 'bg-primary/10 text-foreground hover:bg-primary/20' : idx === step ? 'bg-primary text-white' : 'bg-muted text-muted-foreground cursor-not-allowed'} transition-colors`}
                disabled={idx > step}
                aria-disabled={idx > step}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
            {step === 0 && (
              <PersonalInfoStep
                fullName={(formData as any).fullName ?? ''}
                setFullName={(v) => updateField('fullName' as any, v)}
                getLabel={getLabel}
                getPlaceholder={getPlaceholder}
                email={(formData as any).email ?? ''}
                setEmail={(v) => updateField('email' as any, v)}
                dateOfBirth={(formData as any).dateOfBirth ?? ''}
                setDateOfBirth={(v) => updateField('dateOfBirth' as any, v)}
                gender={(formData as any).gender ?? ''}
                setGender={(v) => updateField('gender' as any, v)}
                countryOfCitizenship={(formData as any).countryOfCitizenship ?? ''}
                setCountryOfCitizenship={(v) => updateField('countryOfCitizenship' as any, v)}
                currentCity={(formData as any).currentCity ?? ''}
                setCurrentCity={(v) => updateField('currentCity' as any, v)}
                age={formData.age?.toString() ?? ''}
                setAge={(v) => updateField('age', v ? Number(v) : null)}
                onNext={onNext}
              />
            )}
            {step === 1 && (
              <WorkInfoStep
                jobTitle={formData.jobTitle}
                employer={formData.employer}
                getLabel={getLabel}
                getPlaceholder={getPlaceholder}
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
                getLabel={getLabel}
                getPlaceholder={getPlaceholder}
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
                showAas={isAasEnabled}
                showChevening={isCheEnabled}
                aasName={aasName}
                cheveningName={cheName}
                formData={formData as any}
                onEdit={() => setStep(0)}
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
