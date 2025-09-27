import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/atoms/Button';
import { t } from '@/lib/i18n';
import { renderField, schemaForStep } from '@/components/form/renderer';

type ActiveForm = {
  formSet: any;
  steps: any[];
  questionsByStep: Record<string, any[]>;
};

function toAnswerSetFromDefs(answers: Record<string, any>, steps: any[], byStep: Record<string, any[]>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const s of steps) {
    const qs = (byStep[s._id.id] ?? []) as any[];
    for (const q of qs) {
      const val = answers[q.key];
      const k = q.mapTo || q.key;
      switch (q.type) {
        case 'number': out[k] = typeof val === 'number' ? val : (val != null ? Number(val) : val); break;
        case 'boolean': out[k] = !!val; break;
        default: out[k] = val; break;
      }
    }
  }
  return out;
}

export const FormPreview: React.FC<{ active: ActiveForm | null }>= ({ active }) => {
  const [stepIdx, setStepIdx] = React.useState(0);
  const [allValues, setAllValues] = React.useState<Record<string, any>>({});
  if (!active || !active.formSet) return (
    <div className="rounded border bg-white p-4 text-sm text-muted-foreground">Chưa có Form Set active để preview.</div>
  );

  const steps = active.steps.slice().sort((a, b) => a.order - b.order);
  const currentStep = steps[stepIdx];
  const questions = (active.questionsByStep[currentStep._id.id] ?? []).slice().sort((a: any, b: any) => a.order - b.order);
  const schema = schemaForStep(questions);

  const form = useForm<any>({ resolver: zodResolver(schema), defaultValues: questions.reduce((acc: any, q: any)=>{ acc[q.key] = allValues[q.key] ?? (q.type==='multi-select' ? [] : undefined); return acc; }, {}), mode: 'onChange' });

  const onNext = form.handleSubmit((vals) => {
    setAllValues((p) => ({ ...p, ...vals }));
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1);
  });
  const onPrev = () => { if (stepIdx > 0) setStepIdx(stepIdx - 1); };
  const onFinish = form.handleSubmit((vals) => {
    const merged = { ...allValues, ...vals };
    const answerSet = toAnswerSetFromDefs(merged, steps, active.questionsByStep);
    (window as any).previewAnswers = merged;
    (window as any).previewAnswerSet = answerSet;
    alert('Đã tạo AnswerSet. Mở console và xem window.previewAnswerSet');
  });

  return (
    <div className="rounded border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Preview Form - {active.formSet.name} (v{active.formSet.version})</h3>
        <div className="text-sm text-muted-foreground">Bước {stepIdx + 1}/{steps.length}</div>
      </div>
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
              <Button type="button" onClick={onFinish}>Hoàn tất (tạo AnswerSet)</Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};
