import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { schemaForStep, renderField } from '@/components/form/renderer';
import { tOptional } from '@/lib/i18n';

export const BrandedDynamicWizard: React.FC = () => {
  const active = useQuery(api.forms.getActiveForm, {});
  const [stepIdx, setStepIdx] = React.useState(0);
  const [allValues, setAllValues] = React.useState<Record<string, any>>({});

  const loading = active === undefined;

  const steps = React.useMemo(() => {
    return (active?.steps ?? []).slice().sort((a: any, b: any) => a.order - b.order);
  }, [active]);

  const totalSteps = steps.length;

  React.useEffect(() => {
    if (totalSteps === 0) {
      setStepIdx(0);
      return;
    }
    if (stepIdx >= totalSteps) {
      setStepIdx(totalSteps - 1);
    }
  }, [totalSteps, stepIdx]);

  const currentStep = totalSteps ? steps[stepIdx] : null;
  const currentStepKey = React.useMemo(() => {
    if (!currentStep) return undefined;
    const raw = currentStep._id as any;
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object' && raw && 'id' in raw && raw.id) return String(raw.id);
    return String(raw ?? '');
  }, [currentStep]);

  const questionsRaw = React.useMemo(() => {
    if (!currentStepKey || !active) return [] as any[];
    const list = active.questionsByStep?.[currentStepKey] ?? [];
    return list.slice().sort((a: any, b: any) => a.order - b.order);
  }, [active, currentStepKey]);

  const questions = React.useMemo(() => {
    // Lọc ra những câu hỏi có label hợp lệ
    return questionsRaw.filter((q: any) => (q?.ui?.labelText as string | undefined) || tOptional(q?.labelKey));
  }, [questionsRaw]);



  const schema = React.useMemo(() => schemaForStep(questions), [questions]);

  const defaultValues = React.useMemo(() => {
    return questions.reduce((acc: Record<string, any>, q: any) => {
      acc[q.key] = allValues[q.key] ?? (q.type === 'multi-select' ? [] : undefined);
      return acc;
    }, {});
  }, [questions, allValues]);

  // Move form definition before shouldShowQuestion function
  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange'
  });

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

  React.useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const handlePrev = () => {
    if (stepIdx > 0) {
      setStepIdx(stepIdx - 1);
    }
  };

  const handleNext = form.handleSubmit((vals) => {
    setAllValues((prev) => ({ ...prev, ...vals }));
    if (stepIdx < totalSteps - 1) {
      setStepIdx(stepIdx + 1);
    }
  });

  const handleFinish = form.handleSubmit((vals) => {
    const merged = { ...allValues, ...vals };
    (window as any).dynamicFormValues = merged;
    console.log('Wizard completed', merged);
    alert('Hoàn thành! (Chưa gửi dữ liệu lên backend.)');
  });

  const stepTitle =
    (currentStep?.ui?.labelText as string | undefined) ??
    tOptional(currentStep?.titleKey) ??
    currentStep?.titleKey ??
    '';

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-sm text-gray-500">Đang tải form...</div>;
  }

  if (!active) {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-sm text-gray-500">Chưa có Form Set nào được kích hoạt.</div>;
  }

  if (totalSteps === 0) {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-sm text-gray-500">Form chưa có Step nào.</div>;
  }

  const isLastStep = stepIdx === totalSteps - 1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium">Bước {stepIdx + 1}/{totalSteps}</div>
          {stepTitle && <h2 className="text-lg font-semibold">{stepTitle}</h2>}
        </div>
        <progress className="w-full h-2" value={stepIdx + 1} max={totalSteps} />
      </div>

      <Form {...form}>
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          {questions.length === 0 && (
            <div className="text-sm text-gray-500">Chưa có câu hỏi nào cho bước này.</div>
          )}

          {questions.map((q: any) => {
            const label = (q.ui?.labelText as string | undefined) ?? tOptional(q.labelKey);
            if (!label) return null;
            
            // Kiểm tra xem câu hỏi có nên được hiển thị hay không
            if (!shouldShowQuestion(q)) {
              return null;
            }
            
            return (
              <FormField
                key={q.key}
                name={q.key}
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>{renderField(q, field, form.watch)}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          })}

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={stepIdx === 0}
              className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={isLastStep ? handleFinish : handleNext}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLastStep ? 'Hoàn thành' : 'Tiếp tục'}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
};
