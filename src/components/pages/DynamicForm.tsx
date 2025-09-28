import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { schemaForStep, renderField } from '@/components/form/renderer';
import { tOptional } from '@/lib/i18n';
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
  const questionsRaw = React.useMemo(
    () => (currentStep ? (active!.questionsByStep[currentStep._id.id] ?? []).slice().sort((a: any, b: any) => a.order - b.order) : []),
    [active, currentStep, stepIdx]
  );
  const questions = React.useMemo(() => {
    return questionsRaw.filter((q: any) => (q?.ui?.labelText as string | undefined) || tOptional(q?.labelKey));
  }, [questionsRaw]);
  const schema = React.useMemo(() => schemaForStep(questions), [questions]);

  const form = useForm<any>({    resolver: zodResolver(schema),    defaultValues: questions.reduce((acc: any, q: any) => {      acc[q.key] = allValues[q.key] ?? (q.type === 'multi-select' ? [] : undefined);      return acc;    }, {}),    mode: 'onChange'  });

  // Hàm kiểm tra xem câu hỏi có nên được hiển thị hay không
  const shouldShowQuestion = (q: any) => {
    // Nếu không có điều kiện hiển thị, luôn hiển thị
    if (!q.visibility?.when?.field) {
      return true;
    }

    const depField = q.visibility.when.field;
    const depValue = q.visibility.when.equals;
    
    // Lấy giá trị hiện tại của câu hỏi phụ thuộc
    // Kết hợp giá trị từ allValues (các bước trước) và form.watch (bước hiện tại)
    const currentValue = allValues[depField] ?? form.watch(depField);
    
    // So sánh giá trị, chấp nhận kiểu dữ liệu khác nhau (ví dụ '1' và 1)
    // Chuyển cả hai giá trị thành chuỗi trước khi so sánh
    return String(currentValue) === String(depValue);
  };

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
        {!loading && formSet && (
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">{formSet.name} (v{formSet.version})</h1>
            <div className="text-sm text-muted-foreground">{stepIdx + 1}/{steps.length}</div>
          </div>
        )}
        <Form {...form}>
          <form className="space-y-3" onSubmit={(e)=> e.preventDefault()}>
            {questions.map((q: any) => {
              const label = (q.ui?.labelText as string | undefined) ?? tOptional(q.labelKey);
              if (!label) return null;
               
              // Kiểm tra xem câu hỏi có nên được hiển thị hay không
              if (!shouldShowQuestion(q)) {
                return null;
              }
               
              return (
                <FormField key={q.key} name={q.key} control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      {renderField(q, field, form.watch)}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              );
            })}
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
      </div>
    </div>
  );
};
