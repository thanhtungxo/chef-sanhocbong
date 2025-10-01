import React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { schemaForStep, renderField } from '@/components/form/renderer';
import { tOptional } from '@/lib/i18n';
import { ResultPage } from './ResultPage';
import type { ScholarshipEvaluationSummary } from '../../../convex/shared/eligibility';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

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

  // Helper function to get visible questions for the current step
  const getVisibleQuestions = React.useMemo(() => {
    return questions.filter(q => shouldShowQuestion(q));
  }, [questions, form.watch, allValues]);

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

  // Add state to track if we've completed the wizard and should show results
  const [showResults, setShowResults] = React.useState(false);
  const [evaluationResults, setEvaluationResults] = React.useState<ScholarshipEvaluationSummary[]>([]);
  const [messageType, setMessageType] = React.useState<"fail_all" | "pass_all" | "pass_some">('pass_some');
  const [eligible, setEligible] = React.useState<boolean>(false);
  // We'll use a ref to store the username to avoid React state timing issues
  const userNameRef = React.useRef<string>("Thành viên");
  
  // Mutation to evaluate form responses
  const evaluateForm = useMutation(api.formEvaluation.submitAndEvaluateForm);
  
  const handleFinish = form.handleSubmit(async (vals) => {
    const merged = { ...allValues, ...vals };
    (window as any).dynamicFormValues = merged;
    
    try {
      // Extract name and email for submission (we'll use defaults if not available)
      const fullName = merged.fullname || merged.fullName || 'Unknown';
      const email = merged.email || 'unknown@example.com';
      
      // Submit the form data and evaluate against scholarship rules
      const evaluation = await evaluateForm({
        responses: merged,
        fullName,
        email,
      });
      
      // Extract username directly from merged data and store in ref
      let extractedUserName = "Thành viên";
      if (merged.fullname && merged.fullname.trim()) {
        const nameParts = merged.fullname.trim().split(/\s+/);
        if (nameParts.length > 0) extractedUserName = nameParts[nameParts.length - 1];
      } else if (merged.fullName && merged.fullName.trim()) {
        const nameParts = merged.fullName.trim().split(/\s+/);
        if (nameParts.length > 0) extractedUserName = nameParts[nameParts.length - 1];
      } else {
        for (const key of Object.keys(merged)) {
          if (key.toLowerCase().includes('name') && key !== 'fullName' && key !== 'fullname' && merged[key] && typeof merged[key] === 'string' && merged[key].trim()) {
            const nameParts = merged[key].trim().split(/\s+/);
            if (nameParts.length > 0) {
              extractedUserName = nameParts[nameParts.length - 1];
              break;
            }
          }
        }
      }
      userNameRef.current = extractedUserName;
      setAllValues(merged);
      setEvaluationResults(evaluation.scholarships || []);
      setMessageType(evaluation.messageType || 'pass_some');
      setEligible(evaluation.eligible || false);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred while processing your form. Please try again.');
    }
  });

  const stepTitle = 
    (currentStep?.ui?.labelText as string | undefined) ??
    tOptional(currentStep?.titleKey) ??
    currentStep?.titleKey ??
    '';

  // Accessibility: capture Enter to go next/finish
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (stepIdx < totalSteps - 1) handleNext(); else handleFinish();
    }
  };

  // Icons for timeline (fallback sequence)
  const stepIcons = ['👤', '🎓', '💼', '📑'];

  // Helper to get icon for a step based on metadata or title
  const getStepIcon = (step: any, idx: number) => {
    const explicit = step?.ui?.icon;
    if (typeof explicit === 'string' && explicit.trim().length > 0) {
      return explicit.trim();
    }
    const label = (step?.ui?.labelText as string | undefined) ?? tOptional(step?.titleKey) ?? step?.titleKey ?? '';
    const lower = typeof label === 'string' ? label.toLowerCase() : '';
    if (lower) {
      if (/(personal|profile|thông tin|cá nhân)/.test(lower)) return '👤';
      if (/(education|học vấn|school|degree)/.test(lower)) return '🎓';
      if (/(work|employment|job|kinh nghiệm|công việc)/.test(lower)) return '💼';
      if (/(document|paper|hồ sơ|tài liệu)/.test(lower)) return '📑';
    }
    return stepIcons[idx % stepIcons.length];
  };

  // Motion variants
  const stepVariants = {
    initial: { x: 40, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 }
  };

  const fieldVariants = {
    initial: { y: 8, opacity: 0 },
    animate: { y: 0, opacity: 1 },
  };

  // If we've completed the wizard and should show results, render ResultPage
  if (showResults) {
    return (
      <ResultPage
        userName={userNameRef.current}
        eligibilityResults={evaluationResults}
        messageType={messageType}
        eligible={eligible}
      />
    );
  }
  
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

  // Create a map of question keys to their visible index
  const questionIndexMap = new Map<string, number>();
  getVisibleQuestions.forEach((q, idx) => {
    questionIndexMap.set(q.key, idx + 1); // +1 for 1-based numbering
  });

  // Progress percentage
  const progressPercent = totalSteps > 0 ? ((stepIdx + 1) / totalSteps) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      {/* Skip to content link for accessibility */}
      <a href="#wizard-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-white dark:bg-gray-900 text-sm px-3 py-2 rounded-md shadow focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00d2ff]">Skip to content</a>
      {/* Header with brand logo and tagline */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5]">Sanhocbong</div>
          <div className="text-sm text-muted-foreground">Khám phá cơ hội học bổng phù hợp</div>
        </div>
        <div className="text-sm font-medium">Bước {stepIdx + 1}/{totalSteps}</div>
      </div>

      {/* Timeline progress with icons */}
      <div className="rounded-xl border bg-white/60 backdrop-blur p-4">
        <div className="flex items-center justify-between">
          {steps.map((s: any, i: number) => (
            <div key={(s as any)._id ?? i} className="flex-1 flex items-center">
              <motion.div
                className={`relative flex items-center justify-center w-9 h-9 rounded-full border shadow ${
                  i < stepIdx
                    ? 'bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] text-white border-transparent'
                    : i === stepIdx
                    ? 'bg-white text-gray-900 ring-2 ring-[#00d2ff]/70 ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
                    : 'bg-white text-gray-600'
                }`}
                aria-label={`Step ${i + 1}`}
                aria-current={i === stepIdx ? 'step' : undefined}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'tween', duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="text-base" aria-hidden="true">{getStepIcon(s, i)}</span>
                {i === stepIdx && (
                  <motion.div
                    className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-[#00d2ff]/50"
                    animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </motion.div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-1 mx-2 rounded bg-gray-200/60 overflow-hidden relative">
                  <motion.div
                    className="absolute left-0 top-0 h-1 bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5]"
                    initial={{ width: 0 }}
                    animate={{ width: i < stepIdx ? '100%' : i === stepIdx ? `${progressPercent}%` : '0%' }}
                    transition={{ duration: Math.min(0.6, Math.max(0.4, 0.45 + 0.03 * Math.max(0, totalSteps - 4))), ease: [0.25, 0.8, 0.25, 1] }}
                  />
                  {i === stepIdx && (
                    <motion.div
                      className="absolute left-0 top-0 h-1 blur-[3px] bg-gradient-to-r from-[#00d2ff]/40 to-[#3a7bd5]/40"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: `${progressPercent}%`, opacity: 1 }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {stepTitle && <h2 className="mt-3 text-lg font-semibold">{stepTitle}</h2>}
      </div>

      <Form {...form}>
        <AnimatePresence mode="wait">
          <motion.form
            id="wizard-content"
            key={stepIdx}
            className="space-y-4"
            onSubmit={(event) => event.preventDefault()}
            onKeyDown={handleKeyDown}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'tween', duration: 0.25 }}
            aria-label={`Form Step ${stepIdx + 1}`}
          >
            {questions.length === 0 && (
              <div className="text-sm text-gray-500">Chưa có câu hỏi nào cho bước này.</div>
            )}

            {questions.map((q: any, idx: number) => {
              const label = (q.ui?.labelText as string | undefined) ?? tOptional(q.labelKey);
              if (!label) return null;
              // Kiểm tra xem câu hỏi có nên được hiển thị hay không
              if (!shouldShowQuestion(q)) {
                return null;
              }
              // Get the visible index for this question
              const questionNumber = questionIndexMap.get(q.key);
              return (
                <motion.div
                  key={q.key}
                  variants={fieldVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.05 * idx }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="group rounded-2xl p-[1px] bg-transparent transition-all duration-300 group-hover:shadow-md group-focus-within:bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5]">
                    <div className="rounded-2xl border bg-white/70 dark:bg-gray-900/60 shadow-sm p-4 transition-all duration-300 hover:shadow-md">
                      <FormField
                        name={q.key}
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                              {questionNumber && (
                                <span className="mr-2 font-medium" aria-hidden="true">{questionNumber}.</span>
                              )}
                              {label}
                            </FormLabel>
                            {(q.ui?.hintText as string | undefined) && (
                              <div className="text-sm text-gray-500 italic">{q.ui.hintText}</div>
                            )}
                            <FormControl>
                              <div className="transition-transform">
                                {renderField(q, field, form.watch)}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <div className="flex items-center justify-between pt-4">
              <Button
                type="button"
                onClick={handlePrev}
                disabled={stepIdx === 0}
                variant="secondary"
                className="hover:scale-[1.03] transition-transform shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00d2ff]"
              >
                Quay lại
              </Button>
              <Button
                type="button"
                onClick={isLastStep ? handleFinish : handleNext}
                className="relative overflow-hidden bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] hover:shadow-[0_0_12px_rgba(58,123,213,0.45)] hover:scale-[1.05] active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00d2ff] dark:focus-visible:ring-offset-gray-900"
              >
                {isLastStep ? 'Hoàn thành' : 'Tiếp tục'}
              </Button>
            </div>
          </motion.form>
        </AnimatePresence>
      </Form>
    </div>
  );
};
