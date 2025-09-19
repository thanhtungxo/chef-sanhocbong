import React, { useMemo, useState } from "react";
import { Progress } from "@/components/atoms/Progress";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Radio } from "@/components/atoms/Radio";
import { Label } from "@/components/atoms/Label";
import { Button } from "@/components/atoms/Button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/atoms/Card";
import { toast } from "sonner";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { EligibilityResult } from "../../../types/eligibility";
import { evaluateScholarshipsLocally } from "@/lib/submit";
import { t } from "@/lib/i18n";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle, User, Mail, CalendarDays, Briefcase, Building2, Globe, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type IdString = string;

interface FormData {
  fullName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  countryOfCitizenship: string;
  currentCity: string;
  highestQualification: string;
  yearsOfExperience: number;
  currentJobTitle: string;
  employerName: string;
  isEmployerVietnameseOwned: boolean;
  employmentSector: string;
  hasWorkedInMilitaryPolice: boolean;
  planToReturn: boolean;
  hasStudiedAbroadOnGovScholarship: boolean;
  englishTestType: string;
  englishScore?: number;
}

export function LegacyWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    countryOfCitizenship: "",
    currentCity: "",
    highestQualification: "",
    yearsOfExperience: 0,
    currentJobTitle: "",
    employerName: "",
    isEmployerVietnameseOwned: false,
    employmentSector: "",
    hasWorkedInMilitaryPolice: false,
    planToReturn: false,
    hasStudiedAbroadOnGovScholarship: false,
    englishTestType: "",
    englishScore: undefined,
  });
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scholarships = useQuery(api.scholarships.listScholarships, {});
  const scholarshipConfig = useMemo(() => {
    if (!scholarships) {
      return {
        aas: { enabled: true, name: "AAS" },
        chevening: { enabled: true, name: "Chevening" },
        activeNames: null as string[] | null,
      };
    }
    const byId = new Map(scholarships.map((s) => [s.id, s]));
    return {
      aas: {
        enabled: byId.get("aas")?.isEnabled ?? false,
        name: byId.get("aas")?.name ?? "AAS",
      },
      chevening: {
        enabled: byId.get("chevening")?.isEnabled ?? false,
        name: byId.get("chevening")?.name ?? "Chevening",
      },
      activeNames: scholarships.filter((s) => s.isEnabled).map((s) => s.name),
    };
  }, [scholarships]);

  const isAasEnabled = scholarshipConfig.aas.enabled;
  const aasName = scholarshipConfig.aas.name;
  const isCheveningEnabled = scholarshipConfig.chevening.enabled;
  const cheveningName = scholarshipConfig.chevening.name;
  const hasAnyScholarship = isAasEnabled || isCheveningEnabled;
  const subtitleText = scholarshipConfig.activeNames === null
    ? t('ui.subtitle', 'Check your eligibility for AAS and Chevening scholarships')
    : scholarshipConfig.activeNames.length
      ? `Check your eligibility for ${scholarshipConfig.activeNames.join(' & ')}`
      : 'Currently no scholarships are enabled.';

  const totalSteps = 4;

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!hasAnyScholarship) {
        toast.warning('No scholarships are currently enabled.');
        setIsSubmitting(false);
        return;
      }
      const enabledIds: string[] = [];
      const nameOverrides: Record<string, string> = {};
      if (isAasEnabled) {
        enabledIds.push('aas');
        nameOverrides.aas = aasName;
      }
      if (isCheveningEnabled) {
        enabledIds.push('chevening');
        nameOverrides.chevening = cheveningName;
      }
      const res = await evaluateScholarshipsLocally(formData as any, enabledIds, nameOverrides);
      setResult(res);
      setCurrentStep(5);
      toast.success('Application submitted successfully!');
    } catch (e) {
      toast.error('Failed to submit application. Please try again.');
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };
  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      fullName: "",
      email: "",
      dateOfBirth: "",
      gender: "",
      countryOfCitizenship: "",
      currentCity: "",
      highestQualification: "",
      yearsOfExperience: 0,
      currentJobTitle: "",
      employerName: "",
      isEmployerVietnameseOwned: false,
      employmentSector: "",
      hasWorkedInMilitaryPolice: false,
      planToReturn: false,
      hasStudiedAbroadOnGovScholarship: false,
      englishTestType: "",
      englishScore: undefined,
    });
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <span className="mx-auto inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">??</span>
          <h1 className="mt-2 text-2xl font-heading font-semibold bg-gradient-to-r from-green-500 to-orange-400 bg-clip-text text-transparent">{t('ui.title', 'Scholarship Eligibility Checker')}</h1>
          <p className="text-sm text-muted-foreground">{subtitleText}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {!hasAnyScholarship && (
            <div className="mb-6 rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              All scholarships are currently disabled in the admin dashboard. Enable at least one to use this wizard.
            </div>
          )}
          {currentStep <= totalSteps && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">{t('ui.step.progress', `BÆ°á»›c ${currentStep} of ${totalSteps}`)}</span>
                <span className="text-sm text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}% {t('ui.complete', 'Complete')}</span>
              </div>
              <Progress value={(currentStep / totalSteps) * 100} />
              <div className="mt-2 flex items-center justify-center gap-2 text-sm">
                {[1,2,3,4].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => { if (idx <= currentStep) setCurrentStep(idx) }}
                    className={`px-3 py-1 rounded-full border ${idx < currentStep ? 'bg-primary/10 text-foreground hover:bg-primary/20' : idx === currentStep ? 'bg-primary text-white' : 'bg-muted text-muted-foreground cursor-not-allowed'} transition-colors`}
                    disabled={idx > currentStep}
                    aria-disabled={idx > currentStep}
                  >
                    {idx}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <PersonalInfoStep formData={formData} updateFormData={updateFormData} onNext={nextStep} />
          )}
          {currentStep === 2 && (
            <EducationWorkStep formData={formData} updateFormData={updateFormData} onNext={nextStep} onPrev={prevStep} />
          )}
          {currentStep === 3 && (
            <EmploymentStep formData={formData} updateFormData={updateFormData} onNext={nextStep} onPrev={prevStep} />
          )}
          {currentStep === 4 && (
            <FinalQuestionsStep formData={formData} updateFormData={updateFormData} onSubmit={handleSubmit} onPrev={prevStep} isSubmitting={isSubmitting} isSubmitAllowed={hasAnyScholarship} />
          )}
          {currentStep === 5 && result && (
            <ResultsPage result={result} onReset={resetForm} />
          )}
        </div>
      </div>
    </div>
  );
}

const personalInfoSchema = z.object({
  fullName: z.string().min(1, 'Required'),
  email: z.string().min(1, 'Required').email('Invalid email'),
  dateOfBirth: z.string().min(1, 'Required'),
  gender: z.string().min(1, 'Required'),
  countryOfCitizenship: z.string().min(1, 'Required'),
  currentCity: z.string().min(1, 'Required'),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;

function PersonalInfoStep({ formData, updateFormData, onNext }: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  onNext: () => void;
}) {
  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: formData.fullName ?? '',
      email: formData.email ?? '',
      dateOfBirth: formData.dateOfBirth ?? '',
      gender: formData.gender ?? '',
      countryOfCitizenship: formData.countryOfCitizenship ?? '',
      currentCity: formData.currentCity ?? '',
    },
    mode: 'onChange',
  });
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = form;
  const [shake, setShake] = useState(false);

  const genderOptions = [
    t('ui.gender.male', 'Male'),
    t('ui.gender.female', 'Female'),
    t('ui.gender.other', 'Other'),
    t('ui.gender.na', 'Prefer not to say'),
  ];
  const genderValue = watch('gender');

  const handleNext = handleSubmit(
    () => {
      onNext();
    },
    () => {
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('ui.personal.title', 'Personal Information')}</h2>
      <Form {...form}>
        <motion.form
          className="space-y-4"
          onSubmit={(event) => event.preventDefault()}
          animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          <FormField
            control={control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ui.fullName.label', 'Full Name *')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <Input
                      ref={field.ref}
                      name={field.name}
                      value={field.value ?? ''}
                      onBlur={field.onBlur}
                      aria-invalid={Boolean(errors.fullName)}
                      aria-describedby="lw-fullname"
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value);
                        updateFormData('fullName', value);
                      }}
                      placeholder={t('ui.fullName.placeholder', 'Enter your full name')}
                      className="pl-10"
                    />
                    {errors.fullName && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                    )}
                  </div>
                </FormControl>
                <FormMessage id="lw-fullname" />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ui.email.label', 'Email Address *')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <Input
                      ref={field.ref}
                      name={field.name}
                      type="email"
                      value={field.value ?? ''}
                      onBlur={field.onBlur}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby="lw-email"
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value);
                        updateFormData('email', value);
                      }}
                      placeholder={t('ui.email.placeholder', 'Enter your email address')}
                      className="pl-10"
                    />
                    {errors.email && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                    )}
                  </div>
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">{t('ui.email.help', 'We only use this to email your results.')}</p>
                <FormMessage id="lw-email" />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ui.dob.label', 'Date of Birth *')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <Input
                      ref={field.ref}
                      name={field.name}
                      type="date"
                      value={field.value ?? ''}
                      onBlur={field.onBlur}
                      aria-invalid={Boolean(errors.dateOfBirth)}
                      aria-describedby="lw-dob"
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value);
                        updateFormData('dateOfBirth', value);
                      }}
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage id="lw-dob" />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ui.gender.label', 'Gender *')}</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {genderOptions.map((option) => (
                      <label key={option} className="flex items-center gap-3">
                        <Radio
                          name={field.name}
                          value={option}
                          checked={genderValue === option}
                          onChange={(event) => {
                            const value = event.target.value;
                            field.onChange(value);
                            updateFormData('gender', value);
                          }}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="countryOfCitizenship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ui.citizenship.label', 'Country of Citizenship *')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <Select
                      className="w-full pl-10"
                      value={field.value ?? ''}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value);
                        updateFormData('countryOfCitizenship', value);
                      }}
                    >
                      <option value="">{t('ui.citizenship.select', 'Select your country')}</option>
                      <option value="Vietnam">{t('ui.citizenship.vietnam', 'Vietnam')}</option>
                      <option value="Other">{t('ui.citizenship.other', 'Other')}</option>
                    </Select>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="currentCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ui.city.label', 'Current City of Residence *')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <Input
                      ref={field.ref}
                      name={field.name}
                      value={field.value ?? ''}
                      onBlur={field.onBlur}
                      aria-invalid={Boolean(errors.currentCity)}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value);
                        updateFormData('currentCity', value);
                      }}
                      placeholder={t('ui.city.placeholder', 'Enter your current city')}
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </motion.form>
      </Form>
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleNext}
          disabled={!isValid}
          className="bg-gradient-to-r from-primary to-primary/80 text-white hover:scale-105 transition-transform duration-200 h-11 px-6 rounded-md"
        >
          {t('ui.next', 'Next')}
        </Button>
      </div>
    </div>
  );
}

function EducationWorkStep({ formData, updateFormData, onNext, onPrev }: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const schema = z.object({
    highestQualification: z.string().min(1, 'Required'),
    yearsOfExperience: z.coerce.number().min(0, 'Required'),
    currentJobTitle: z.string().min(1, 'Required'),
    employerName: z.string().min(1, 'Required'),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: formData as any,
    mode: 'onChange',
  })
  const [shake, setShake] = useState(false)
  const handleNext = form.handleSubmit(() => onNext(), () => { setShake(true); setTimeout(() => setShake(false), 300) })
  const canProceed = form.formState.isValid
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Education & Work Experience</h2>
      <Form {...form}>
        <motion.form className="space-y-4" onSubmit={(e)=>e.preventDefault()} animate={shake ? { x:[0,-6,6,-4,4,0] } : {}} transition={{ duration: 0.3 }}>
          <FormField name="highestQualification" control={form.control} render={({field}) => (
            <FormItem>
              <FormLabel>Highest Completed Qualification *</FormLabel>
              <FormControl>
                <Select value={field.value ?? ''} onChange={(e)=>{ field.onChange(e); updateFormData('highestQualification', (e.target as any).value) }}>
                  <option value="">Select qualification</option>
                  <option value="Bachelor">Bachelor's Degree</option>
                  <option value="Master">Master's Degree</option>
                  <option value="PhD">PhD</option>
                  <option value="Other">Other</option>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="yearsOfExperience" control={form.control} render={({field}) => (
            <FormItem>
              <FormLabel>Years of Full-time Work Experience *</FormLabel>
              <FormControl>
                <Input type="number" min={0} value={field.value as any} onChange={(e)=>{ field.onChange(e); updateFormData('yearsOfExperience', parseInt((e.target as HTMLInputElement).value) || 0) }} placeholder="Enter years of experience" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="currentJobTitle" control={form.control} render={({field}) => (
            <FormItem>
              <FormLabel>Current Job Title *</FormLabel>
              <FormControl>
                <Input value={field.value ?? ''} onChange={(e)=>{ field.onChange(e); updateFormData('currentJobTitle', (e.target as HTMLInputElement).value) }} placeholder="Enter your current job title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="employerName" control={form.control} render={({field}) => (
            <FormItem>
              <FormLabel>Employer Name *</FormLabel>
              <FormControl>
                <Input value={field.value ?? ''} onChange={(e)=>{ field.onChange(e); updateFormData('employerName', (e.target as HTMLInputElement).value) }} placeholder="Enter your employer name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </motion.form>
      </Form>
      <div className="flex justify-between">
        <Button onClick={onPrev} className="bg-gradient-to-r from-secondary to-secondary/80 text-white h-11 px-6 rounded-md">{t('ui.prev', 'Previous')}</Button>
        <Button onClick={handleNext} disabled={!canProceed} className="bg-gradient-to-r from-primary to-primary/80 text-white h-11 px-6 rounded-md">{t('ui.next', 'Next')}</Button>
      </div>
    </div>
  );
}

function EmploymentStep({ formData, updateFormData, onNext, onPrev }: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const schema = z.object({
    isEmployerVietnameseOwned: z.boolean(),
    employmentSector: z.string().min(1, 'Required'),
    hasWorkedInMilitaryPolice: z.boolean(),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: formData as any,
    mode: 'onChange',
  })
  const [shake, setShake] = useState(false)
  const handleNext = form.handleSubmit(() => onNext(), () => { setShake(true); setTimeout(()=>setShake(false), 300) })
  const canProceed = form.formState.isValid
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('ui.employment.title', 'Employment Details')}</h2>
      <Form {...form}>
        <motion.form className="space-y-4" onSubmit={(e)=>e.preventDefault()} animate={shake ? { x:[0,-6,6,-4,4,0] } : {}} transition={{ duration: 0.3 }}>
          <FormField name="isEmployerVietnameseOwned" control={form.control} render={() => (
            <FormItem>
              <FormLabel>{t('ui.employment.vnOwned.label', 'Is your employer Vietnamese-owned? *')}</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <Radio name="isEmployerVietnameseOwned" value="true" checked={form.watch('isEmployerVietnameseOwned') === true} onChange={()=>{ form.setValue('isEmployerVietnameseOwned', true, { shouldValidate:true }); updateFormData('isEmployerVietnameseOwned', true) }} />
                    <span className="ml-3">{t('ui.common.yes', 'Yes')}</span>
                  </label>
                  <label className="flex items-center">
                    <Radio name="isEmployerVietnameseOwned" value="false" checked={form.watch('isEmployerVietnameseOwned') === false} onChange={()=>{ form.setValue('isEmployerVietnameseOwned', false, { shouldValidate:true }); updateFormData('isEmployerVietnameseOwned', false) }} />
                    <span className="ml-3">{t('ui.common.no', 'No')}</span>
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="employmentSector" control={form.control} render={({field}) => (
            <FormItem>
              <FormLabel>{t('ui.employment.sector.label', 'Employment Sector *')}</FormLabel>
              <FormControl>
                <Select value={field.value ?? ''} onChange={(e)=>{ field.onChange(e); updateFormData('employmentSector', (e.target as any).value) }}>
                  <option value="">{t('ui.employment.sector.select', 'Select sector')}</option>
                  <option value="Government">{t('ui.employment.sector.government', 'Government')}</option>
                  <option value="Private">{t('ui.employment.sector.private', 'Private')}</option>
                  <option value="NGO">{t('ui.employment.sector.ngo', 'NGO')}</option>
                  <option value="Military/Security">{t('ui.employment.sector.military', 'Military/Security')}</option>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="hasWorkedInMilitaryPolice" control={form.control} render={() => (
            <FormItem>
              <FormLabel>{t('ui.employment.military.label', 'Have you ever worked for or served in the military or police? *')}</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <Radio name="hasWorkedInMilitaryPolice" value="true" checked={form.watch('hasWorkedInMilitaryPolice') === true} onChange={()=>{ form.setValue('hasWorkedInMilitaryPolice', true, { shouldValidate:true }); updateFormData('hasWorkedInMilitaryPolice', true) }} />
                    <span className="ml-3">{t('ui.common.yes', 'Yes')}</span>
                  </label>
                  <label className="flex items-center">
                    <Radio name="hasWorkedInMilitaryPolice" value="false" checked={form.watch('hasWorkedInMilitaryPolice') === false} onChange={()=>{ form.setValue('hasWorkedInMilitaryPolice', false, { shouldValidate:true }); updateFormData('hasWorkedInMilitaryPolice', false) }} />
                    <span className="ml-3">{t('ui.common.no', 'No')}</span>
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </motion.form>
      </Form>
      <div className="flex justify-between">
        <Button onClick={onPrev} className="bg-gradient-to-r from-secondary to-secondary/80 text-white h-11 px-6 rounded-md">{t('ui.prev', 'Previous')}</Button>
        <Button onClick={handleNext} disabled={!canProceed} className="bg-gradient-to-r from-primary to-primary/80 text-white h-11 px-6 rounded-md">{t('ui.next', 'Next')}</Button>
      </div>
    </div>
  );
}

function FinalQuestionsStep({ formData, updateFormData, onSubmit, onPrev, isSubmitting, isSubmitAllowed }: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  onSubmit: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
  isSubmitAllowed: boolean;
}) {
  const schema = z.object({
    planToReturn: z.boolean(),
    hasStudiedAbroadOnGovScholarship: z.boolean(),
    englishTestType: z.string().min(1,'Required'),
    englishScore: z.union([z.number(), z.undefined()]),
  }).refine((v)=> v.englishTestType==='None' || typeof v.englishScore === 'number', { message:'Overall Score required', path:['englishScore'] })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: formData as any,
    mode: 'onChange',
  })
  const [shake, setShake] = useState(false)
  const handleSubmitClick = form.handleSubmit(()=>onSubmit(), ()=>{ setShake(true); setTimeout(()=>setShake(false),300) })
  const canProceed = form.formState.isValid
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('ui.final.title', 'Final Questions')}</h2>
      <Form {...form}>
        <motion.form className="space-y-4" onSubmit={(e)=>e.preventDefault()} animate={shake ? { x:[0,-6,6,-4,4,0] } : {}} transition={{ duration: 0.3 }}>
          <FormField name="planToReturn" control={form.control} render={() => (
            <FormItem>
              <FormLabel>{t('ui.final.return.label', 'Do you plan to return to your country after finishing the scholarship? *')}</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <Radio name="planToReturn" value="true" checked={form.watch('planToReturn') === true} onChange={()=>{ form.setValue('planToReturn', true, { shouldValidate:true }); updateFormData('planToReturn', true) }} />
                    <span className="ml-3">{t('ui.common.yes', 'Yes')}</span>
                  </label>
                  <label className="flex items-center">
                    <Radio name="planToReturn" value="false" checked={form.watch('planToReturn') === false} onChange={()=>{ form.setValue('planToReturn', false, { shouldValidate:true }); updateFormData('planToReturn', false) }} />
                    <span className="ml-3">{t('ui.common.no', 'No')}</span>
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="hasStudiedAbroadOnGovScholarship" control={form.control} render={() => (
            <FormItem>
              <FormLabel>{t('ui.final.govscholar.label', 'Have you ever studied abroad on a government-funded scholarship? *')}</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <Radio name="hasStudiedAbroadOnGovScholarship" value="true" checked={form.watch('hasStudiedAbroadOnGovScholarship') === true} onChange={()=>{ form.setValue('hasStudiedAbroadOnGovScholarship', true, { shouldValidate:true }); updateFormData('hasStudiedAbroadOnGovScholarship', true) }} />
                    <span className="ml-3">{t('ui.common.yes', 'Yes')}</span>
                  </label>
                  <label className="flex items-center">
                    <Radio name="hasStudiedAbroadOnGovScholarship" value="false" checked={form.watch('hasStudiedAbroadOnGovScholarship') === false} onChange={()=>{ form.setValue('hasStudiedAbroadOnGovScholarship', false, { shouldValidate:true }); updateFormData('hasStudiedAbroadOnGovScholarship', false) }} />
                    <span className="ml-3">{t('ui.common.no', 'No')}</span>
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="englishTestType" control={form.control} render={({field}) => (
            <FormItem>
              <FormLabel>{t('ui.final.testType.label', 'English Proficiency Test Type *')}</FormLabel>
              <FormControl>
                <Select value={field.value ?? ''} onChange={(e)=>{ field.onChange(e); updateFormData('englishTestType', (e.target as any).value) }}>
                  <option value="">{t('ui.final.testType.select', 'Select test type')}</option>
                  <option value="IELTS">{t('ui.final.testType.ielts', 'IELTS')}</option>
                  <option value="TOEFL">{t('ui.final.testType.toefl', 'TOEFL')}</option>
                  <option value="PTE">{t('ui.final.testType.pte', 'PTE')}</option>
                  <option value="None">{t('ui.final.testType.none', 'None')}</option>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          {form.watch('englishTestType') && form.watch('englishTestType') !== 'None' && (
            <FormField name="englishScore" control={form.control} render={({field}) => (
              <FormItem>
                <FormLabel>{t('ui.final.overall.label', 'Overall Score *')}</FormLabel>
                <FormControl>
                  <Input type="number" step={0.1} value={(field.value as any) ?? ''} onChange={(e)=>{ const v = parseFloat((e.target as HTMLInputElement).value); field.onChange(Number.isNaN(v)? undefined : v); updateFormData('englishScore', Number.isNaN(v)? undefined : v) }} placeholder="Enter your overall score" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}
        </motion.form>
      </Form>
      <div className="flex justify-between">
        <Button onClick={onPrev} className="bg-gradient-to-r from-secondary to-secondary/80 text-white h-11 px-6 rounded-md">{t('ui.prev', 'Previous')}</Button>
        <Button onClick={handleSubmitClick} disabled={!canProceed || isSubmitting || !isSubmitAllowed} className="bg-gradient-to-r from-primary to-primary/80 text-white h-11 px-6 rounded-md">
          {isSubmitting ? t('ui.submitting', 'Submitting...') : t('ui.submit', 'Submit Application')}
        </Button>
      </div>
    </div>
  );
}
function ResultsPage({ result, onReset }: { result: EligibilityResult; onReset: () => void; }) {
  const styleMap: Record<string, { gradient: string; accent: string; badge: string; title: string }> = {
    aas: {
      gradient: "from-orange-50 to-orange-100",
      accent: "bg-orange-500",
      badge: "AAS",
      title: "Australia Awards",
    },
    chevening: {
      gradient: "from-blue-50 to-blue-100",
      accent: "bg-blue-500",
      badge: "CHV",
      title: "Chevening",
    },
  };

  const hasScholarships = result.scholarships.length > 0;
  const hasEligibleScholarship = result.scholarships.some((s) => s.eligible);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Scholarship Eligibility Results</h2>
        <p className="text-lg text-gray-600">
          {hasScholarships ? 'Here are your eligibility results for active scholarships.' : 'No scholarships are currently enabled.'}
        </p>
      </div>
      {hasScholarships && (
        <div className="grid md:grid-cols-2 gap-6">
          {result.scholarships.map((sch) => {
            const style = styleMap[sch.id] ?? {
              gradient: "from-slate-50 to-slate-100",
              accent: "bg-slate-500",
              badge: sch.id.slice(0, 3).toUpperCase(),
              title: sch.name,
            };
            return (
              <div key={sch.id} className={`bg-gradient-to-br ${style.gradient} p-6 rounded-lg border`}>
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 ${style.accent} rounded-full flex items-center justify-center mr-4`}>
                    <span className="text-white font-bold text-lg">{style.badge}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{style.title}</h3>
                </div>
                {sch.eligible ? (
                  <div className="flex items-center text-green-700 mb-4">
                    <span className="text-2xl mr-2">✔</span>
                    <span className="font-semibold">You are eligible for {sch.name}!</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center text-red-700 mb-4">
                      <span className="text-2xl mr-2">✔</span>
                      <span className="font-semibold">You are not eligible for {sch.name}</span>
                    </div>
                    {sch.reasons.length > 0 && (
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-2">Reasons:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {sch.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {hasScholarships && hasEligibleScholarship && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">🎉</span>
            <h4 className="text-lg font-semibold text-green-800">Congratulations!</h4>
          </div>
          <p className="text-green-700">You are eligible for at least one scholarship! We recommend you start preparing your application early. Good luck with your scholarship journey!</p>
        </div>
      )}
      <div className="text-center">
        <button onClick={onReset} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Check Another Application</button>
      </div>
    </div>
  );
}

























