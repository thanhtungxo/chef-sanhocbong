import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { schemaForStep, renderField } from '@/components/form/renderer';
import { t } from '@/lib/i18n';
import { Button } from '@/components/atoms/Button';

export const DynamicForm: React.FC = () => {
  const active = useQuery(api.forms.getActiveForm, {});
  const [stepIdx, setStepIdx] = React.useState(0);
  const [allValues, setAllValues] = React.useState<Record<string, any>>({});

  // Keep hooks order stable across renders
  const loading = !active;
  const formSet = active?.formSet ?? null;
  const steps = React.useMemo(
    () => (active?.steps ?? []).slice().sort((a: any, b: any) => a.order - b.order),
    [active]
  );
  const currentStep = steps[stepIdx] ?? null;
  const questions = React.useMemo(
    () => (currentStep ? (active!.questionsByStep[currentStep._id.id] ?? []).slice().sort((a: any, b: any) => a.order - b.order) : []),
    [active, currentStep, stepIdx]
  );
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
    alert('Đã hoàn tất. Xem window.dynamicFormValues trong console.');
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow p-6">
        {loading ? (
          <div>Loading form…</div>
        ) : !formSet ? (
          <div>No active form set. Please contact admin.</div>
        ) : (
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">{formSet.name} (v{formSet.version})</h1>
            <div className="text-sm text-muted-foreground">Bước {stepIdx + 1}/{steps.length}</div>
          </div>
        )}
        <Form {...form}>
          <form className="space-y-3" onSubmit={(e)=> e.preventDefault()}>
            {questions.length === 0 ? (
              <div className="text-sm text-muted-foreground">Step này chưa có câu hỏi.</div>
            ) : questions.map((q: any) => (
              <FormField key={q.key} name={q.key} control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>{q.ui?.labelText ?? t(q.labelKey, q.labelKey)}</FormLabel>
                  <FormControl>
                    {renderField(q, field, form.watch)}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ))}
            <div className="flex justify-between">
              <Button type="button" onClick={onPrev} disabled={stepIdx === 0}>Trước</Button>
              {stepIdx < steps.length - 1 ? (
                <Button type="button" onClick={onNext}>Tiếp</Button>
              ) : (
                <Button type="button" onClick={onFinish}>Hoàn tất</Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};
