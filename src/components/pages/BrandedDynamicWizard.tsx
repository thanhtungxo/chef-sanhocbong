import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { schemaForStep, renderField } from '@/components/form/renderer';
import { tOptional } from '@/lib/i18n';
import { Button } from '@/components/atoms/Button';

export const BrandedDynamicWizard: React.FC = () => {
  const active = useQuery(api.forms.getActiveForm, {});
  const [stepIdx, setStepIdx] = React.useState(0);
  const [allValues, setAllValues] = React.useState<Record<string, any>>({});

  const loading = active === undefined;
  const steps = React.useMemo(
    () => (active?.steps ?? []).slice().sort((a: any, b: any) => a.order - b.order),
    [active]
  );
  const currentStep = steps[stepIdx] ?? null;
  const currentStepKey = React.useMemo(() => {
    if (!currentStep) return undefined;
    const raw = currentStep._id as any;
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object' && raw && 'id' in raw && raw.id) return String(raw.id);
    return String(raw ?? '');
  }, [currentStep]);
  const questionsRaw = React.useMemo(
    () => (currentStepKey ? (active!.questionsByStep[currentStepKey] ?? []).slice().sort((a: any, b: any) => a.order - b.order) : []),
    [active, currentStepKey, stepIdx]
  );

  // Only render questions that have a label from DB or i18n (no fallback)
  const questions = React.useMemo(() => {
    return questionsRaw.filter((q: any) => (q?.ui?.labelText as string | undefined) || tOptional(q?.labelKey));
  }, [questionsRaw]);

  const schema = React.useMemo(() => schemaForStep(questions), [questions]);

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: questions.reduce((acc: any, q: any) => {
      acc[q.key] = allValues[q.key] ?? (q.type === 'multi-select' ? [] : undefined);
      return acc;
    }, {}),
    mode: 'onChange'
  });

  const onNext = form.handleSubmit((vals) => {
    setAllValues((p) => ({ ...p, ...vals }));
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1);
  });
  const onPrev = () => { if (stepIdx > 0) setStepIdx(stepIdx - 1); };
  const onFinish = form.handleSubmit((vals) => {
    const merged = { ...allValues, ...vals };
    (window as any).dynamicFormValues = merged;
  });

  const stepTitle = currentStep ? tOptional(currentStep.titleKey) : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow p-6">
        {active === null && (
          <div className="text-sm text-red-600">Chưa có Form Set nào được kích hoạt.</div>
        )}
        {!loading && active && stepTitle && (
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">{stepTitle}</h1>
            <div className="text-sm text-muted-foreground">{stepIdx + 1}/{steps.length}</div>
          </div>
        )}
        {active && (
        <Form {...form}>
          <form className="space-y-3" onSubmit={(e)=> e.preventDefault()}>
            {questions.map((q: any) => (
              <FormField key={q.key} name={q.key} control={form.control} render={({ field }) => {
                const label = (q.ui?.labelText as string | undefined) ?? tOptional(q.labelKey);
                if (!label) return null;
                return (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      {renderField(q, field, form.watch)}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }} />
            ))}
            <div className="flex justify-between">
              <Button type="button" onClick={onPrev} disabled={stepIdx === 0}>←</Button>
              {stepIdx < steps.length - 1 ? (
                <Button type="button" onClick={onNext}>→</Button>
              ) : (
                <Button type="button" onClick={onFinish}>✓</Button>
              )}
            </div>
          </form>
        </Form>
        )}
      </div>
    </div>
  );
};
