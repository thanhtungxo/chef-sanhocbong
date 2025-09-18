import React from 'react';
import { SectionTitle } from '../atoms/SectionTitle';
import { FormInput } from '../atoms/FormInput';
import { StepNavigation } from '../molecules/StepNavigation';
import { Card, CardHeader, CardContent, CardFooter } from '../atoms/Card';
import { motion } from 'framer-motion';
import { Briefcase, Building2 } from 'lucide-react';
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormControl, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/atoms/Input'
import { AlertCircle } from 'lucide-react'

interface Props {
  jobTitle: string;
  employer: string;
  onChangeJobTitle: (val: string) => void;
  onChangeEmployer: (val: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const WorkInfoStep: React.FC<Props> = ({
  jobTitle,
  employer,
  onChangeJobTitle,
  onChangeEmployer,
  onBack,
  onNext,
}) => {
  const schema = z.object({
    jobTitle: z.string().min(1, 'Job title is required'),
    employer: z.string().min(1, 'Employer is required'),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { jobTitle, employer },
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
              <SectionTitle subtitle="Tell us about your current role and employer.">
                <Briefcase className="inline-block mr-2 h-5 w-5" /> Work Information
              </SectionTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                            </span>
                            <Input
                              aria-invalid={!!form.formState.errors.jobTitle}
                              aria-describedby="jobTitle-message"
                              className={'pl-10 ' + (form.formState.errors.jobTitle ? 'border-destructive focus-visible:ring-destructive' : '')}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                field.onChange(e)
                                onChangeJobTitle((e.target as HTMLInputElement).value)
                              }}
                              placeholder="Senior Developer"
                            />
                            {form.formState.errors.jobTitle && (
                              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage id="jobTitle-message" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            </span>
                            <Input
                              aria-invalid={!!form.formState.errors.employer}
                              aria-describedby="employer-message"
                              className={'pl-10 ' + (form.formState.errors.employer ? 'border-destructive focus-visible:ring-destructive' : '')}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                field.onChange(e)
                                onChangeEmployer((e.target as HTMLInputElement).value)
                              }}
                              placeholder="Acme Corp"
                            />
                            {form.formState.errors.employer && (
                              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage id="employer-message" />
                      </FormItem>
                    )}
                  />
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
