import React from 'react';
import { useEligibilityStore } from '@/store/eligibilityStore';
import { PersonalInfoStep } from '../organisms/PersonalInfoStep';
import { WorkInfoStep } from '../organisms/WorkInfoStep';
import { EnglishInfoStep } from '../organisms/EnglishInfoStep';
import { EligibilityResultStep } from '../organisms/EligibilityResultStep';
import { useEligibilityEngine } from '@/lib/useEligibilityEngine';
import { toAnswerSet } from '@/lib/mappers';
import { t } from '@/lib/i18n';

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
  };

  const onBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded mt-10">
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
      {step === 3 && ruleIssues.length > 0 && (
        <div className="mt-4 p-3 rounded bg-yellow-100 text-yellow-800 text-sm">
          Rule validation issues: {ruleIssues.join('; ')}
        </div>
      )}
    </div>
  );
};
