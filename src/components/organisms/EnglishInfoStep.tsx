import React from 'react';
import { SectionTitle } from '../atoms/SectionTitle';
import { FormInput } from '../atoms/FormInput';
import { StepNavigation } from '../molecules/StepNavigation';
import { Label } from '../atoms/Label';
import { Card, CardHeader, CardContent, CardFooter } from '../atoms/Card';
import { motion } from 'framer-motion';
import { Globe, FlaskConical, BarChart3 } from 'lucide-react';
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormControl, FormLabel, FormMessage } from '@/components/ui/form'
import { Select } from '../atoms/Select'
import { Input } from '../atoms/Input'
import { AlertCircle } from 'lucide-react'

interface Props {
  testType: string;
  score: string;
  setTestType: (val: string) => void;
  setScore: (val: string) => void;
  onBack: () => void;
  onNext: () => void;
  getLabel?: (key: string, fallback: string) => string;
  getPlaceholder?: (key: string, fallback: string) => string;
  getOptions?: (key: string) => { value: string; label: string }[] | null;
  hasField?: (key: string) => boolean;
}

export const EnglishInfoStep: React.FC<Props> = ({
  testType,
  score,
  setTestType,
  setScore,
  onBack,
  onNext,
  getLabel,
  getPlaceholder,
  getOptions,
  hasField,
}) => {
  const schema = z.object({
    testType: (hasField?.('englishTestType') ? z.string().min(1, 'Chọn bài kiểm tra') : z.string().optional()) as any,
    score: (hasField?.('englishOverall')
      ? z.union([z.string(), z.number()])
          .transform((v) => (v === '' ? undefined : Number(v)))
          .refine((v) => v === undefined || (!Number.isNaN(v) && v >= 0), 'Điểm không hợp lệ')
      : z.union([z.string(), z.number()]).optional()) as any,
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { testType, score },
    mode: 'onChange',
  })
  const [shake, setShake] = React.useState(false)
  const handleNext = form.handleSubmit(
    () => onNext(),
    () => {
      setShake(true)
      setTimeout(() => setShake(false), 300)
    }
  )

  return (
    <div className="max-w-xl mx-auto p-6 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <motion.div animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.3 }}>
          <Card className="rounded-lg shadow-xl border border-primary/20 bg-gradient-to-b from-primary/5 via-background to-primary/5">
            <CardHeader>
              <SectionTitle subtitle="Choose your English test and enter your score.">
                <Globe className="inline-block mr-2 h-5 w-5" /> English Proficiency
              </SectionTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  {hasField?.('englishTestType') && (
                  <FormField
                    control={form.control}
                    name="testType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{getLabel?.('englishTestType','Test Type') ?? 'Test Type'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none">
                              <FlaskConical className="h-4 w-4 text-muted-foreground" />
                            </span>
                            <Select
                              aria-invalid={!!form.formState.errors.testType}
                              aria-describedby="testType-message"
                              className={'pl-10 ' + (form.formState.errors.testType ? 'border-destructive focus-visible:ring-destructive' : '')}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                field.onChange(e)
                                setTestType((e.target as HTMLSelectElement).value)
                              }}
                            >
                              <option value="">{getPlaceholder?.('englishTestType','Select') ?? 'Select'}</option>
                              {(getOptions?.('englishTestType') ?? [
                                { value: 'IELTS', label: 'IELTS' },
                                { value: 'TOEFL', label: 'TOEFL' },
                                { value: 'PTE', label: 'PTE' },
                              ]).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </Select>
                            {form.formState.errors.testType && (
                              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage id="testType-message" />
                      </FormItem>
                    )}
                  />
                  )}

                  {hasField?.('englishOverall') && (
                  <FormField
                    control={form.control}
                    name="score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{getLabel?.('englishOverall','Score') ?? 'Score'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none">
                              <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </span>
                            <Input
                              type="number"
                              aria-invalid={!!form.formState.errors.score}
                              aria-describedby="score-message"
                              className={'pl-10 ' + (form.formState.errors.score ? 'border-destructive focus-visible:ring-destructive' : '')}
                              value={(field.value as any) ?? ''}
                              onChange={(e) => {
                                field.onChange(e)
                                setScore((e.target as HTMLInputElement).value)
                              }}
                              placeholder={getPlaceholder?.('englishOverall','Overall score') ?? 'Overall score'}
                            />
                            {form.formState.errors.score && (
                              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage id="score-message" />
                      </FormItem>
                    )}
                  />
                  )}
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <StepNavigation onBack={onBack} onNext={handleNext} />
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};
