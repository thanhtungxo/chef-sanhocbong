import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Radio } from '@/components/atoms/Radio';
import { Button } from '@/components/atoms/Button';

type ActiveForm = {
  formSet: any;
  steps: any[];
  questionsByStep: Record<string, any[]>;
};

function buildZodField(q: any): z.ZodTypeAny {
  const required = !!q.required;
  const v = q.validation ?? {};
  const base = (() => {
    switch (q.type) {
      case 'number': {
        let t = z.coerce.number();
        if (typeof v.min === 'number') t = t.min(v.min);
        if (typeof v.max === 'number') t = t.max(v.max);
        return t;
      }
      case 'boolean':
        return z.boolean();
      case 'multi-select': {
        let t = z.array(z.string());
        if (required) t = t.nonempty('Required');
        return t;
      }
      case 'date':
      case 'autocomplete':
      case 'textarea':
      case 'text':
      case 'radio':
      case 'select':
      default: {
        let t = z.string();
        if (typeof v.pattern === 'string' && v.pattern) {
          try { t = t.regex(new RegExp(v.pattern)); } catch {}
        }
        return t;
      }
    }
  })();
  return required ? base : base.optional();
}

function schemaForStep(questions: any[]): z.ZodSchema<any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const q of questions) shape[q.key] = buildZodField(q);
  return z.object(shape);
}

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
        <h3 className="font-medium">Preview Form — {active.formSet.name} (v{active.formSet.version})</h3>
        <div className="text-sm text-muted-foreground">Bước {stepIdx + 1}/{steps.length}</div>
      </div>
      <Form {...form}>
        <form className="space-y-3" onSubmit={(e)=> e.preventDefault()}>
          {questions.length === 0 ? (
            <div className="text-sm text-muted-foreground">Step này chưa có câu hỏi.</div>
          ) : questions.map((q: any) => (
            <FormField key={q.key} name={q.key} control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>{q.labelKey}</FormLabel>
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

function renderField(q: any, field: any, watch: any) {
  const common = { name: field.name, value: field.value ?? '', onBlur: field.onBlur, ref: field.ref } as any;
  switch (q.type) {
    case 'number':
      return (
        <Input {...common} type="number" onChange={(e)=> field.onChange(e)} placeholder={q.ui?.placeholderKey ?? ''} />
      );
    case 'radio':
      return (
        <div className="space-y-2">
          {(q.options ?? []).map((opt: any) => (
            <label key={opt.value} className="flex items-center gap-2">
              <Radio name={field.name} value={opt.value} checked={field.value === opt.value} onChange={(e)=> field.onChange((e.target as any).value)} />
              <span>{opt.labelKey}</span>
            </label>
          ))}
        </div>
      );
    case 'select':
      return (
        <Select value={field.value ?? ''} onChange={(e)=> field.onChange(e)}>
          <option value="">--</option>
          {(q.options ?? []).map((opt: any)=> (
            <option key={opt.value} value={opt.value}>{opt.labelKey}</option>
          ))}
        </Select>
      );
    case 'multi-select':
      return (
        <div className="space-y-2">
          {(q.options ?? []).map((opt: any) => {
            const selected: string[] = Array.isArray(field.value) ? field.value : [];
            const checked = selected.includes(opt.value);
            return (
              <label key={opt.value} className="flex items-center gap-2">
                <input type="checkbox" checked={checked} onChange={(e)=> {
                  const next = e.target.checked ? [...selected, opt.value] : selected.filter(v=>v!==opt.value);
                  field.onChange(next);
                }} />
                <span>{opt.labelKey}</span>
              </label>
            );
          })}
        </div>
      );
    case 'checkbox':
    case 'boolean':
      return (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!field.value} onChange={(e)=> field.onChange(e.target.checked)} />
          <span>{q.ui?.placeholderKey ?? ''}</span>
        </label>
      );
    case 'date':
      return (<Input {...common} type="date" onChange={(e)=> field.onChange(e)} />);
    case 'textarea':
      return (<textarea name={field.name} value={field.value ?? ''} onChange={(e)=> field.onChange((e.target as any).value)} className="w-full border rounded px-3 py-2" placeholder={q.ui?.placeholderKey ?? ''} />);
    case 'autocomplete':
    case 'text':
    default:
      return (<Input {...common} type="text" onChange={(e)=> field.onChange(e)} placeholder={q.ui?.placeholderKey ?? ''} />);
  }
}

