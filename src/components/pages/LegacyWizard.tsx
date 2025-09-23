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
  currentProvince: string;
  highestQualification: string;
  gpa: number;
  yearsOfExperience: number;
  employerName: string;
  employerType?: string;
  hasWorkedInMilitaryPolice: boolean;
  governmentScholarship: boolean;
  governmentScholarshipCountry?: string;
  englishTest: {
    type: string;
    overall?: number;
    listening?: number;
    reading?: number;
    writing?: number;
    speaking?: number;
  };
  // New fields for Personal Info step
  hasSpouseAuNzCitizenOrPR?: boolean;
  hasCriminalRecordOrInvestigation?: boolean;
  // New fields for Education & Work step
  vulnerableGroups: string[];
}

export function LegacyWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    countryOfCitizenship: "",
    currentProvince: "",
    highestQualification: "",
    gpa: 0,
    yearsOfExperience: 0,
    employerName: "",
    employerType: "",
    hasWorkedInMilitaryPolice: false,
    governmentScholarship: false,
    governmentScholarshipCountry: '',
    englishTest: { type: '', overall: undefined, listening: undefined, reading: undefined, writing: undefined, speaking: undefined },
    hasSpouseAuNzCitizenOrPR: undefined,
    hasCriminalRecordOrInvestigation: undefined,
    vulnerableGroups: [],
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
      currentProvince: "",
      highestQualification: "",
      gpa: 0,
      yearsOfExperience: 0,
      employerName: "",
      employerType: "",
      hasWorkedInMilitaryPolice: false,
      governmentScholarship: false,
      governmentScholarshipCountry: '',
      englishTest: { type: '', overall: undefined, listening: undefined, reading: undefined, writing: undefined, speaking: undefined },
      hasSpouseAuNzCitizenOrPR: undefined,
      hasCriminalRecordOrInvestigation: undefined,
      vulnerableGroups: [],
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
  // Keep as string for downstream mapping to countryOfResidence
  countryOfCitizenship: z.string().min(1, 'Required'),
  currentProvince: z.string().min(1, 'Vui lòng ch?n t?nh/thành ph? b?n dang sinh s?ng.'),
  // moved to Final step
  // hasSpouseAuNzCitizenOrPR: z.boolean(),
  // hasCriminalRecordOrInvestigation: z.boolean(),
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
      currentProvince: formData.currentProvince ?? '',
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

  // Hardcoded list of 34 provinces/cities in Vietnam
  // Hardcoded list of 34 provinces/cities in Vietnam
  const PROVINCES = [
    'Hà Nội',
    'Hải Phòng',
    'Quảng Ninh',
    'Thái Nguyên',
    'Lạng Sơn',
    'Cao Bằng',
    'Bắc Kạn',
    'Tuyên Quang',
    'Hà Giang',
    'Lào Cai',
    'Yên Bái',
    'Sơn La',
    'Điện Biên',
    'Lai Châu',
    'Hòa Bình',
    'Thanh Hóa',
    'Nghệ An',
    'Hà Tĩnh',
    'Quảng Bình',
    'Quảng Trị',
    'Thừa Thiên Huế',
    'Đà Nẵng',
    'Quảng Nam',
    'Quảng Ngãi',
    'Bình Định',
    'Phú Yên',
    'Khánh Hòa',
    'Ninh Thuận',
    'Bình Thuận',
    'Thành phố Hồ Chí Minh',
    'Đồng Nai',
    'Bình Dương',
    'Bà Rịa - Vũng Tàu',
    'Cần Thơ',
  ];
  const [provinceOpen, setProvinceOpen] = useState(false);
  const provinceQuery = watch('currentProvince') ?? '';
  // Normalize text for accent-insensitive matching (e.g., đ -> d)
  const norm = (s: string) =>
    String(s)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .toLowerCase();
  const filteredProvinces = useMemo(() => {
    const q = norm(provinceQuery).trim();
    if (!q) return PROVINCES;
    return PROVINCES.filter((p) => norm(p).startsWith(q));
  }, [provinceQuery]);
  const genderOptions = [
    t('ui.gender.male', 'Male'),
    t('ui.gender.female', 'Female'),
    t('ui.gender.other', 'Other'),
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
                  <Input
                    ref={field.ref}
                    name={field.name}
                    value={field.value ?? ''}
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(errors.fullName)}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value);
                      updateFormData('fullName', value);
                    }}
                    placeholder={t('ui.fullName.placeholder', 'Enter your full name')}
                  />
                </FormControl>
                <FormMessage />
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
                  <Input
                    ref={field.ref}
                    name={field.name}
                    type="email"
                    value={field.value ?? ''}
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(errors.email)}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value);
                      updateFormData('email', value);
                    }}
                    placeholder={t('ui.email.placeholder', 'Enter your email address')}
                  />
                </FormControl>
                <FormMessage />
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
                  <Input
                    ref={field.ref}
                    name={field.name}
                    type="date"
                    value={field.value ?? ''}
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(errors.dateOfBirth)}
                    onChange={(e) => {
                      let value = e.target.value;
                      if (value) {
                        const parts = String(value).split('-');
                        if (parts.length >= 1) {
                          const year = (parts[0] ?? '').replace(/[^0-9]/g, '').slice(0, 4);
                          parts[0] = year;
                          value = parts.join('-');
                        }
                      }
                      field.onChange(value);
                      updateFormData('dateOfBirth', value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="currentProvince"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('ui.province.label', 'Bạn đang sinh sống tại tỉnh/thành phố nào?')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      ref={field.ref}
                      name={field.name}
                      type="text"
                      value={field.value ?? ''}
                      onBlur={() => setTimeout(() => setProvinceOpen(false), 100)}
                      aria-invalid={Boolean(errors.currentProvince)}
                      onFocus={() => setProvinceOpen(true)}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value);
                        updateFormData('currentProvince', value);
                        setProvinceOpen((value ?? '').length >= 1);
                      }}
                      placeholder={t('ui.province.placeholder', 'Nhập tên tỉnh/thành phố')}
                    />
                    {provinceOpen && filteredProvinces.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow">
                        <ul className="max-h-56 overflow-auto py-1">
                          {filteredProvinces.map((p) => (
                            <li key={p}>
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-muted"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  field.onChange(p);
                                  updateFormData('currentProvince', p);
                                  setProvinceOpen(false);
                                }}
                              >
                                {p}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
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
                          onChange={(e) => {
                            const value = e.target.value;
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
                <FormLabel>{t('ui.personal.vnres.label', 'Bạn có quốc tịch Việt Nam và đang cư trú tại Việt Nam *')}</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <Radio
                        name={field.name}
                        value="Vietnam"
                        checked={(field.value ?? '') === 'Vietnam'}
                        onChange={() => {
                          field.onChange('Vietnam');
                          updateFormData('countryOfCitizenship', 'Vietnam');
                        }}
                      />
                      <span>{t('ui.common.yes', 'Có')}</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <Radio
                        name={field.name}
                        value="Other"
                        checked={(field.value ?? '') === 'Other'}
                        onChange={() => {
                          field.onChange('Other');
                          updateFormData('countryOfCitizenship', 'Other');
                        }}
                      />
                      <span>{t('ui.common.no', 'Không')}</span>
                    </label>
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
    gpa: z.coerce.number(),
    vulnerableGroups: z.array(z.string())
      .nonempty('Required')
      .refine(arr => !(arr.includes('none') && arr.some(v => v !== 'none')), 'Invalid selection'),
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
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('ui.education.title', 'Education & Work Experience')}</h2>
      <Form {...form}>
        <motion.form className="space-y-4" onSubmit={(e)=>e.preventDefault()} animate={shake ? { x:[0,-6,6,-4,4,0] } : {}} transition={{ duration: 0.3 }}>
          <FormField name="highestQualification" control={form.control} render={({field}) => (
            <FormItem>
              <FormLabel>{t('ui.education.highest.label', 'Highest Completed Qualification *')}</FormLabel>
              <p className="text-xs text-muted-foreground">(thang điểm 10)</p>
              <FormControl>
                <Select value={field.value ?? ''} onChange={(e)=>{ field.onChange(e); updateFormData('highestQualification', (e.target as any).value) }}>
                  <option value="">{t('ui.education.highest.select', 'Select qualification')}</option>
                  <option value="Bachelor">{t('ui.education.highest.bachelor', "Bachelor's Degree")}</option>
                  <option value="Master">{t('ui.education.highest.master', "Master's Degree")}</option>
                  <option value="PhD">{t('ui.education.highest.phd', 'PhD')}</option>
                  <option value="Other">{t('ui.education.highest.other', 'Other')}</option>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="gpa" control={form.control} render={({field}) => (
            <FormItem>
              <FormLabel>{t('ui.education.gpa.label', 'GPA (10-point scale) *')}</FormLabel>
              <p className="text-xs text-muted-foreground">{t('ui.education.gpa.note', '(10-point scale)')}</p>
              <FormControl>
                <Input
                  type="number"
                  step={0.1}
                  value={(field.value as any) ?? ''}
                  onChange={(e)=>{
                    const v = parseFloat((e.target as HTMLInputElement).value);
                    field.onChange(Number.isNaN(v) ? undefined : v);
                    updateFormData('gpa', Number.isNaN(v) ? 0 : v);
                  }}
                  placeholder={t('ui.education.gpa.placeholder', 'On a 10-point scale')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="vulnerableGroups" control={form.control} render={() => {
            const selected: string[] = form.watch('vulnerableGroups') ?? [];
            const hasNone = selected.includes('none');
            const hasOthers = selected.some((v) => v !== 'none');
            const toggle = (value: string) => (checked: boolean) => {
              let next = [...selected];
              if (value === 'none') {
                next = checked ? ['none'] : [];
              } else {
                next = checked ? [...selected.filter(v=>v!=='none'), value] : selected.filter(v => v !== value);
              }
              form.setValue('vulnerableGroups', next, { shouldValidate: true });
              updateFormData('vulnerableGroups', next);
            };
            return (
              <FormItem>
                <FormLabel>{t('ui.education.vulnerable.label', 'Bạn có thuộc một trong các nhóm sau? *')}</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selected.includes('disability')}
                        onChange={(e)=>toggle('disability')(e.target.checked)}
                        disabled={hasNone}
                      />
                      <span className="text-sm font-medium leading-none">{t('ui.vulnerable.disability', 'Người khuyết tật')}</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selected.includes('hardship_area')}
                        onChange={(e)=>toggle('hardship_area')(e.target.checked)}
                        disabled={hasNone}
                      />
                      <span className="text-sm font-medium leading-none">{t('ui.vulnerable.hardship', 'Sinh sống/làm việc tại địa phương khó khăn (Xem danh sách địa phương ở đây)')}</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selected.includes('none')}
                        onChange={(e)=>toggle('none')(e.target.checked)}
                        disabled={hasOthers}
                      />
                      <span className="text-sm font-medium leading-none">{t('ui.vulnerable.none', 'Không thuộc nhóm nào')}</span>
                    </label>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )
          }} />
          
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
    employerType: z.string().min(1, 'Required'),
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
          <FormField name="employerType" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>{t('ui.employment.employerType.label', 'Co quan/don v? b?n dang làm vi?c')}</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Select value={field.value ?? ''} onChange={(e)=>{ const v = (e.target as any).value; field.onChange(e); updateFormData('employerType', v) }}>
                    <option value="">{t('ui.employment.employerType.select', 'Ch?n don v? công tác')}</option>
                    <option value="gov_levels">{t('ui.employment.employerType.opt.gov_levels', 'Co quan trung uong / c?p t?nh / c?p huy?n')}</option>
                    <option value="vocational_school">{t('ui.employment.employerType.opt.vocational_school', 'Tru?ng / co s? giáo d?c ngh? nghi?p')}</option>
                    <option value="research_institute">{t('ui.employment.employerType.opt.research_institute', 'Vi?n nghiên c?u (Nhà nu?c / VN)')}</option>
                    <option value="provincial_university">{t('ui.employment.employerType.opt.provincial_university', 'Tru?ng ÐH c?p t?nh')}</option>
                    <option value="major_city_university">{t('ui.employment.employerType.opt.major_city_university', 'Tru?ng ÐH ? Hà N?i, HCM, H?i Phòng, Ðà N?ng, C?n Tho')}</option>
                    <option value="vn_ngo">{t('ui.employment.employerType.opt.vn_ngo', 'T? ch?c phi chính ph? VN')}</option>
                    <option value="vn_company">{t('ui.employment.employerType.opt.vn_company', 'Công ty c?a Vi?t Nam')}</option>
                    <option value="intl_ngo">{t('ui.employment.employerType.opt.intl_ngo', 'T? ch?c phi chính ph? qu?c t?')}</option>
                    <option value="foreign_company">{t('ui.employment.employerType.opt.foreign_company', 'Công ty nu?c ngoài')}</option>
                  </Select>
                  {form.watch('employerType') === 'vn_company' && (
                    <p className="text-sm text-muted-foreground">
                      {t(
                        'ui.employment.employerType.note',
                        'Luu ý: "Công ty Vi?t Nam" nghia là doanh nghi?p du?c thành l?p và dang ký t?i Vi?t Nam. Các chi nhánh công ty nu?c ngoài t?i Vi?t Nam không du?c tính là công ty Vi?t Nam.'
                      )}
                    </p>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          {null}
          <FormField name="hasWorkedInMilitaryPolice" control={form.control} render={() => (
            <FormItem>
              <FormLabel>{t('ui.employment.military.label', 'B?n có dang ho?c dã t?ng là nhân s? thu?c quân d?i/công an không?')}</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <Radio name="hasWorkedInMilitaryPolice" value="true" checked={form.watch('hasWorkedInMilitaryPolice') === true} onChange={()=>{ form.setValue('hasWorkedInMilitaryPolice', true, { shouldValidate:true }); updateFormData('hasWorkedInMilitaryPolice', true) }} />
                    <span className="ml-3">{t('ui.common.yes', 'Có')}</span>
                  </label>
                  <label className="flex items-center">
                    <Radio name="hasWorkedInMilitaryPolice" value="false" checked={form.watch('hasWorkedInMilitaryPolice') === false} onChange={()=>{ form.setValue('hasWorkedInMilitaryPolice', false, { shouldValidate:true }); updateFormData('hasWorkedInMilitaryPolice', false) }} />
                    <span className="ml-3">{t('ui.common.no', 'Không')}</span>
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
    governmentScholarship: z.boolean(),
    governmentScholarshipCountry: z.string().optional(),
    hasSpouseAuNzCitizenOrPR: z.boolean(),
    hasCriminalRecordOrInvestigation: z.boolean(),
    englishTest: z.object({
      type: z.enum(['IELTS','TOEFL','PTE']),
      overall: z.coerce.number(),
      listening: z.coerce.number(),
      reading: z.coerce.number(),
      writing: z.coerce.number(),
      speaking: z.coerce.number(),
    })
  }).superRefine((v, ctx) => {
    if (v.governmentScholarship && !v.governmentScholarshipCountry) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Vui lòng chọn quốc gia', path: ['governmentScholarshipCountry'] });
    }
    const t = v.englishTest?.type;
    const ranges: Record<string, { overall: [number, number]; sub: [number, number] }> = {
      IELTS: { overall: [0, 9], sub: [0, 9] },
      TOEFL: { overall: [0, 120], sub: [0, 30] },
      PTE: { overall: [10, 90], sub: [10, 90] },
    };
    const r = ranges[t as keyof typeof ranges];
    if (r) {
      const { overall, listening, reading, writing, speaking } = v.englishTest;
      const inRange = (n: number, [min, max]: [number, number]) => Number.isFinite(n) && n >= min && n <= max;
      if (!inRange(overall, r.overall)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Điểm tổng phải trong khoảng ${r.overall[0]}-${r.overall[1]}`, path: ['englishTest','overall'] });
      if (!inRange(listening, r.sub)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Listening phải trong khoảng ${r.sub[0]}-${r.sub[1]}`, path: ['englishTest','listening'] });
      if (!inRange(reading, r.sub)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Reading phải trong khoảng ${r.sub[0]}-${r.sub[1]}`, path: ['englishTest','reading'] });
      if (!inRange(writing, r.sub)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Writing phải trong khoảng ${r.sub[0]}-${r.sub[1]}`, path: ['englishTest','writing'] });
      if (!inRange(speaking, r.sub)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Speaking phải trong khoảng ${r.sub[0]}-${r.sub[1]}`, path: ['englishTest','speaking'] });
    }
  })
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
          <FormField name="governmentScholarship" control={form.control} render={() => (
            <FormItem>
              <FormLabel>{t('ui.final.govscholar2.label', 'Bạn đã từng du học bằng học bổng chính phủ (của bất kì nước nào) chưa? *')}</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <Radio name="governmentScholarship" value="true" checked={form.watch('governmentScholarship') === true} onChange={()=>{ form.setValue('governmentScholarship', true, { shouldValidate:true }); updateFormData('governmentScholarship', true) }} />
                    <span className="ml-3">{t('ui.common.yes', 'Yes')}</span>
                  </label>
                  <label className="flex items-center">
                    <Radio name="governmentScholarship" value="false" checked={form.watch('governmentScholarship') === false} onChange={()=>{ form.setValue('governmentScholarship', false, { shouldValidate:true }); updateFormData('governmentScholarship', false); form.setValue('governmentScholarshipCountry',''); updateFormData('governmentScholarshipCountry',''); }} />
                    <span className="ml-3">{t('ui.common.no', 'No')}</span>
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <AnimatePresence>
            {form.watch('governmentScholarship') === true && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                <FormField name="governmentScholarshipCountry" control={form.control} render={({field}) => (
                  <FormItem>
                    <FormLabel>{t('ui.final.govscholar.country', 'Bạn đã nhận học bổng chính phủ của nước nào?')}</FormLabel>
                    <FormControl>
                      <Select value={field.value ?? ''} onChange={(e)=>{ field.onChange(e); updateFormData('governmentScholarshipCountry', (e.target as any).value) }}>
                        <option value="">{t('ui.select', 'Chọn')}</option>
                        <option value="Úc">Úc</option>
                        <option value="Mỹ">Mỹ</option>
                        <option value="Anh">Anh</option>
                        <option value="Pháp">Pháp</option>
                        <option value="New Zealand">New Zealand</option>
                        <option value="Nhật">Nhật</option>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </motion.div>
            )}
          </AnimatePresence>
          <FormField name="hasSpouseAuNzCitizenOrPR" control={form.control} render={() => (
            <FormItem>
              <FormLabel>{t('ui.personal.spouse.label', 'Bạn có vợ/chồng mang quốc tịch hoặc PR Úc/New Zealand không? *')}</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <Radio name="hasSpouseAuNzCitizenOrPR" value="true" checked={form.watch('hasSpouseAuNzCitizenOrPR') === true} onChange={()=>{ form.setValue('hasSpouseAuNzCitizenOrPR', true, { shouldValidate:true }); updateFormData('hasSpouseAuNzCitizenOrPR', true) }} />
                    <span className="ml-3">{t('ui.common.yes', 'Có')}</span>
                  </label>
                  <label className="flex items-center">
                    <Radio name="hasSpouseAuNzCitizenOrPR" value="false" checked={form.watch('hasSpouseAuNzCitizenOrPR') === false} onChange={()=>{ form.setValue('hasSpouseAuNzCitizenOrPR', false, { shouldValidate:true }); updateFormData('hasSpouseAuNzCitizenOrPR', false) }} />
                    <span className="ml-3">{t('ui.common.no', 'Không')}</span>
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="hasCriminalRecordOrInvestigation" control={form.control} render={() => (
            <FormItem>
              <FormLabel>{t('ui.personal.criminal.label', 'Bạn có từng bị kết án hoặc đang bị điều tra vì các hành vi phạm tội không? *')}</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <Radio name="hasCriminalRecordOrInvestigation" value="true" checked={form.watch('hasCriminalRecordOrInvestigation') === true} onChange={()=>{ form.setValue('hasCriminalRecordOrInvestigation', true, { shouldValidate:true }); updateFormData('hasCriminalRecordOrInvestigation', true) }} />
                    <span className="ml-3">{t('ui.common.yes', 'Có')}</span>
                  </label>
                  <label className="flex items-center">
                    <Radio name="hasCriminalRecordOrInvestigation" value="false" checked={form.watch('hasCriminalRecordOrInvestigation') === false} onChange={()=>{ form.setValue('hasCriminalRecordOrInvestigation', false, { shouldValidate:true }); updateFormData('hasCriminalRecordOrInvestigation', false) }} />
                    <span className="ml-3">{t('ui.common.no', 'Không')}</span>
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="englishTest.type" control={form.control} render={({field}) => (
            <FormItem>
              <FormLabel>{t('ui.final.english.title', 'Chứng chỉ tiếng Anh của bạn')}</FormLabel>
              <FormControl>
                <Select value={field.value ?? ''} onChange={(e)=>{ const v=(e.target as any).value; field.onChange(e); form.setValue('englishTest.type', v as any, { shouldValidate:true }); updateFormData('englishTest', { ...form.watch('englishTest'), type: v }) }}>
                  <option value="">{t('ui.final.testType.select', 'Select test type')}</option>
                  <option value="IELTS">IELTS</option>
                  <option value="TOEFL">TOEFL iBT</option>
                  <option value="PTE">PTE</option>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          {Boolean(form.watch('englishTest')?.type) && (
            <div className="grid md:grid-cols-5 gap-3">
              <FormField name="englishTest.overall" control={form.control} render={({field}) => (
                <FormItem>
                  <FormLabel>{t('ui.final.overall.label', 'Điểm tổng *')}</FormLabel>
                  <FormControl>
                    <Input type="number" step={0.1} value={(field.value as any) ?? ''} onChange={(e)=>{ const v=parseFloat((e.target as HTMLInputElement).value); field.onChange(v); updateFormData('englishTest', { ...form.watch('englishTest'), overall: v }); }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="englishTest.listening" control={form.control} render={({field}) => (
                <FormItem>
                  <FormLabel>Listening *</FormLabel>
                  <FormControl>
                    <Input type="number" step={0.1} value={(field.value as any) ?? ''} onChange={(e)=>{ const v=parseFloat((e.target as HTMLInputElement).value); field.onChange(v); updateFormData('englishTest', { ...form.watch('englishTest'), listening: v }); }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="englishTest.reading" control={form.control} render={({field}) => (
                <FormItem>
                  <FormLabel>Reading *</FormLabel>
                  <FormControl>
                    <Input type="number" step={0.1} value={(field.value as any) ?? ''} onChange={(e)=>{ const v=parseFloat((e.target as HTMLInputElement).value); field.onChange(v); updateFormData('englishTest', { ...form.watch('englishTest'), reading: v }); }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="englishTest.writing" control={form.control} render={({field}) => (
                <FormItem>
                  <FormLabel>Writing *</FormLabel>
                  <FormControl>
                    <Input type="number" step={0.1} value={(field.value as any) ?? ''} onChange={(e)=>{ const v=parseFloat((e.target as HTMLInputElement).value); field.onChange(v); updateFormData('englishTest', { ...form.watch('englishTest'), writing: v }); }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="englishTest.speaking" control={form.control} render={({field}) => (
                <FormItem>
                  <FormLabel>Speaking *</FormLabel>
                  <FormControl>
                    <Input type="number" step={0.1} value={(field.value as any) ?? ''} onChange={(e)=>{ const v=parseFloat((e.target as HTMLInputElement).value); field.onChange(v); updateFormData('englishTest', { ...form.watch('englishTest'), speaking: v }); }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
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
                    <span className="text-2xl mr-2">?</span>
                    <span className="font-semibold">You are eligible for {sch.name}!</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center text-red-700 mb-4">
                      <span className="text-2xl mr-2">?</span>
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
            <span className="text-2xl mr-2">??</span>
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





































