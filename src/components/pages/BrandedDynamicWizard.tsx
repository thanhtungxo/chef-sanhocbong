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
    
    // Debug logs to understand what's happening with the form data
    console.log('Wizard completed - merged data:', merged);
    console.log('Full name field exists (fullName):', 'fullName' in merged);
    console.log('Full name value (fullName):', merged.fullName);
    console.log('Full name field exists (fullname):', 'fullname' in merged);
    console.log('Full name value (fullname):', merged.fullname);
    
    // Also check if there might be other fields containing name information
    console.log('Other possible name fields:');
    for (const key of Object.keys(merged)) {
      if (key.toLowerCase().includes('name') && key !== 'fullName' && key !== 'fullname') {
        console.log(`- ${key}: ${merged[key]}`);
      }
    }
    
    try {
      // Extract name and email for submission (we'll use defaults if not available)
      const fullName = merged.fullname || merged.fullName || 'Unknown';
      const email = merged.email || 'unknown@example.com';
      
      // Submit the form data and evaluate against scholarship rules
      // Correct way to call convex mutation
      const evaluation = await evaluateForm({
        responses: merged,
        fullName,
        email,
      });
      
      // Extract username directly from merged data and store in ref
      let extractedUserName = "Thành viên";
      
      // First check if fullname (all lowercase) exists and is not empty
      if (merged.fullname && merged.fullname.trim()) {
        console.log('Attempting to extract username from fullname:', merged.fullname);
        const nameParts = merged.fullname.trim().split(/\s+/);
        console.log('Split name parts:', nameParts);
        
        // Ensure we have at least one part after splitting
        if (nameParts.length > 0) {
          extractedUserName = nameParts[nameParts.length - 1];
          console.log('Extracted username from fullname:', extractedUserName);
        } else {
          console.log('Name parts array is empty after splitting');
        }
      } else if (merged.fullName && merged.fullName.trim()) {
        console.log('Attempting to extract username from fullName:', merged.fullName);
        const nameParts = merged.fullName.trim().split(/\s+/);
        console.log('Split name parts:', nameParts);
        
        if (nameParts.length > 0) {
          extractedUserName = nameParts[nameParts.length - 1];
          console.log('Extracted username from fullName:', extractedUserName);
        }
      } else {
        console.log('Neither fullname nor fullName found in merged data');
        
        // Search for any other field that might contain a name
        for (const key of Object.keys(merged)) {
          if (key.toLowerCase().includes('name') && key !== 'fullName' && key !== 'fullname' && merged[key] && typeof merged[key] === 'string' && merged[key].trim()) {
            console.log('Found potential name in field', key, ':', merged[key]);
            const nameParts = merged[key].trim().split(/\s+/);
            if (nameParts.length > 0) {
              extractedUserName = nameParts[nameParts.length - 1];
              console.log('Extracted username from alternative field:', extractedUserName);
              break;
            }
          }
        }
      }
      
      // Final verification
      console.log('Final username to be displayed:', extractedUserName);
      userNameRef.current = extractedUserName;
      
      // Update allValues with the complete form data
      setAllValues(merged);
      
      // Log the full evaluation result
      console.log('Evaluation result:', evaluation);
      console.log('Scholarships count:', evaluation.scholarships?.length);
      console.log('Eligible count:', evaluation.scholarships?.filter(s => s.eligible).length);
      console.log('Overall eligible:', evaluation.eligible);
      console.log('Message type:', evaluation.messageType);
      
      // Set the evaluation results and show the results page
      // Use the new structure with scholarships, eligible, and messageType
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
            
            // Get the visible index for this question
            const questionNumber = questionIndexMap.get(q.key);
            
            return (
              <FormField
                key={q.key}
                name={q.key}
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {questionNumber && (
                        <span className="mr-2 font-medium" aria-hidden="true">{questionNumber}.</span>
                      )}
                      {label}
                    </FormLabel>
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
