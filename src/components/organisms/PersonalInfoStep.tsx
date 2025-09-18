import React from 'react'
import { FormInput } from '../atoms/FormInput'
import { SectionTitle } from '../atoms/SectionTitle'
import { StepNavigation } from '../molecules/StepNavigation'
import { Card, CardHeader, CardContent, CardFooter } from '../atoms/Card'
import { motion } from 'framer-motion'
import { User, CalendarDays } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormControl, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/atoms/Input'
import { AlertCircle } from 'lucide-react'

interface Props {
  fullName: string
  setFullName: (val: string) => void
  age: string
  setAge: (val: string) => void
  onNext: () => void
}

export const PersonalInfoStep: React.FC<Props> = ({ fullName, setFullName, age, setAge, onNext }) => {
  const schema = z.object({
    fullName: z.string().min(1, 'Vui lòng nhập họ và tên'),
    age: z.coerce.number().min(1, 'Tuổi không hợp lệ'),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { fullName, age },
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
              <SectionTitle subtitle="Vui lòng nhập thông tin cơ bản của bạn.">
                <User className="inline-block mr-2 h-5 w-5" /> Thông tin cá nhân
              </SectionTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ và tên</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </span>
                            <Input
                              aria-invalid={!!form.formState.errors.fullName}
                              aria-describedby="fullName-message"
                              className={
                                'pl-10 ' + (form.formState.errors.fullName ? 'border-destructive focus-visible:ring-destructive' : '')
                              }
                              value={field.value?.toString() ?? ''}
                              onChange={(e) => {
                                field.onChange(e)
                                setFullName((e.target as HTMLInputElement).value)
                              }}
                              placeholder="Nguyễn Văn A"
                            />
                            {form.formState.errors.fullName && (
                              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage id="fullName-message" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tuổi</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none">
                              <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            </span>
                            <Input
                              type="number"
                              aria-invalid={!!form.formState.errors.age}
                              aria-describedby="age-message"
                              className={
                                'pl-10 ' + (form.formState.errors.age ? 'border-destructive focus-visible:ring-destructive' : '')
                              }
                              value={field.value?.toString() ?? ''}
                              onChange={(e) => {
                                field.onChange(e)
                                setAge((e.target as HTMLInputElement).value)
                              }}
                              placeholder="18"
                            />
                            {form.formState.errors.age && (
                              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage id="age-message" />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <StepNavigation onBack={() => {}} onNext={handleNext} showBack={false} />
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
