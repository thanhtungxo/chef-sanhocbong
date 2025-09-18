import React, { useState } from "react";
import { Progress } from "@/components/atoms/Progress";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Radio } from "@/components/atoms/Radio";
import { Label } from "@/components/atoms/Label";
import { Button } from "@/components/atoms/Button";
import { toast } from "sonner";
import { evaluateScholarshipsLocally } from "@/lib/submit";
import { t } from "@/lib/i18n";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

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

interface EligibilityResult {
  applicationId: IdString;
  aasEligible: boolean;
  aasReasons: string[];
  cheveningEligible: boolean;
  cheveningReasons: string[];
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
      const res = await evaluateScholarshipsLocally(formData as any);
      setResult(res as any);
      setCurrentStep(5);
      toast.success("Application submitted successfully!");
    } catch (e) {
      toast.error("Failed to submit application. Please try again.");
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('ui.title', 'Scholarship Eligibility Checker')}</h1>
          <p className="text-lg text-gray-600">{t('ui.subtitle', 'Check your eligibility for AAS and Chevening scholarships')}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentStep <= totalSteps && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">{t('ui.step.progress', `Bước ${currentStep} of ${totalSteps}`)}</span>
                <span className="text-sm text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}% {t('ui.complete', 'Complete')}</span>
              </div>
              <Progress value={(currentStep / totalSteps) * 100} />
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
            <FinalQuestionsStep formData={formData} updateFormData={updateFormData} onSubmit={handleSubmit} onPrev={prevStep} isSubmitting={isSubmitting} />
          )}
          {currentStep === 5 && result && (
            <ResultsPage result={result} onReset={resetForm} />
          )}
        </div>
      </div>
    </div>
  );
}

function PersonalInfoStep({ formData, updateFormData, onNext }: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  onNext: () => void;
}) {
  const schema = z.object({
    fullName: z.string().min(1, 'Required'),
    email: z.string().email('Invalid email'),
    dateOfBirth: z.string().min(1, 'Required'),
    gender: z.string().min(1, 'Required'),
    countryOfCitizenship: z.string().min(1, 'Required'),
    currentCity: z.string().min(1, 'Required'),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: formData as any,
    mode: 'onChange',
  })
  const [shake, setShake] = useState(false)
  const canProceed = form.formState.isValid
  const handleNext = form.handleSubmit(
    () => onNext(),
    () => { setShake(true); setTimeout(() => setShake(false), 300) }
  )
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('ui.personal.title', 'Personal Information')}</h2>
      <Form {...form}>
        <motion.form className="space-y-4" onSubmit={(e) => e.preventDefault()} animate={shake ? { x: [0,-6,6,-4,4,0] } : {}} transition={{ duration: 0.3 }}>
          <FormField name="fullName" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>{t('ui.fullName.label', 'Full Name *')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input aria-invalid={!!form.formState.errors.fullName} aria-describedby="lw-fullname" value={field.value ?? ''} onChange={(e) => { field.onChange(e); updateFormData('fullName', (e.target as HTMLInputElement).value) }} placeholder={t('ui.fullName.placeholder', 'Enter your full name')} />
                  {form.formState.errors.fullName && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />}
                </div>
              </FormControl>
              <FormMessage id="lw-fullname" />
            </FormItem>
          )} />
          <FormField name="email" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>{t('ui.email.label', 'Email Address *')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type="email" aria-invalid={!!form.formState.errors.email} aria-describedby="lw-email" value={field.value ?? ''} onChange={(e) => { field.onChange(e); updateFormData('email', (e.target as HTMLInputElement).value) }} placeholder={t('ui.email.placeholder', 'Enter your email address')} />
                  {form.formState.errors.email && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />}
                </div>
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">{t('ui.email.help','Chúng tôi sẽ dùng để gửi kết quả kiểm tra.')}</p>
              <FormMessage id="lw-email" />
            </FormItem>
          )} />
          <FormField name="dateOfBirth" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>{t('ui.dob.label', 'Date of Birth *')}</FormLabel>
              <FormControl>
                <Input type="date" aria-invalid={!!form.formState.errors.dateOfBirth} aria-describedby="lw-dob" value={field.value ?? ''} onChange={(e) => { field.onChange(e); updateFormData('dateOfBirth', (e.target as HTMLInputElement).value) }} />
              </FormControl>
              <FormMessage id="lw-dob" />
            </FormItem>
          )} />
          <FormField name="gender" control={form.control} render={() => (
            <FormItem>
              <FormLabel>{t('ui.gender.label', 'Gender *')}</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {[t('ui.gender.male', 'Male'), t('ui.gender.female', 'Female'), t('ui.gender.other', 'Other'), t('ui.gender.na', 'Prefer not to say')].map((option) => (
                    <label key={option} className="flex items-center gap-3">
                      <Radio name="gender" value={option} checked={form.watch('gender') === option} onChange={(e) => { form.setValue('gender', (e.target as HTMLInputElement).value, { shouldValidate: true }); updateFormData('gender', (e.target as HTMLInputElement).value) }} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="countryOfCitizenship" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>{t('ui.citizenship.label', 'Country of Citizenship *')}</FormLabel>
              <FormControl>
                <Select value={field.value ?? ''} onChange={(e) => { field.onChange(e); updateFormData('countryOfCitizenship', (e.target as any).value) }}>
                  <option value="">{t('ui.citizenship.select', 'Select your country')}</option>
                  <option value="Vietnam">{t('ui.citizenship.vietnam', 'Vietnam')}</option>
                  <option value="Other">{t('ui.citizenship.other', 'Other')}</option>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="currentCity" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>{t('ui.city.label', 'Current City of Residence *')}</FormLabel>
              <FormControl>
                <Input value={field.value ?? ''} onChange={(e) => { field.onChange(e); updateFormData('currentCity', (e.target as HTMLInputElement).value) }} placeholder={t('ui.city.placeholder', 'Enter your current city')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </motion.form>
      </Form>
      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={!canProceed} className="bg-gradient-to-r from-primary to-primary/80 text-white hover:scale-105 transition-transform duration-200 h-11 px-6 rounded-md">{t('ui.next', 'Next')}</Button>
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
  const canProceed = formData.highestQualification && formData.yearsOfExperience >= 0 && formData.currentJobTitle && formData.employerName;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Education & Work Experience</h2>
      <div>
        <Label className="mb-2">Highest Completed Qualification *</Label>
        <Select value={formData.highestQualification} onChange={(e) => updateFormData("highestQualification", (e.target as any).value)}>
          <option value="">Select qualification</option>
          <option value="Bachelor">Bachelor's Degree</option>
          <option value="Master">Master's Degree</option>
          <option value="PhD">PhD</option>
          <option value="Other">Other</option>
        </Select>
      </div>
      <div>
        <Label className="mb-2">Years of Full-time Work Experience *</Label>
        <Input type="number" min={0} value={formData.yearsOfExperience} onChange={(e) => updateFormData("yearsOfExperience", parseInt((e.target as HTMLInputElement).value) || 0)} placeholder="Enter years of experience" />
      </div>
      <div>
        <Label className="mb-2">Current Job Title *</Label>
        <Input value={formData.currentJobTitle} onChange={(e) => updateFormData("currentJobTitle", (e.target as HTMLInputElement).value)} placeholder="Enter your current job title" />
      </div>
      <div>
        <Label className="mb-2">Employer Name *</Label>
        <Input value={formData.employerName} onChange={(e) => updateFormData("employerName", (e.target as HTMLInputElement).value)} placeholder="Enter your employer name" />
      </div>
      <div className="flex justify-between">
        <Button onClick={onPrev} className="bg-gradient-to-r from-secondary to-secondary/80 text-white h-11 px-6 rounded-md">{t('ui.prev', 'Previous')}</Button>
        <Button onClick={onNext} disabled={!canProceed} className="bg-gradient-to-r from-primary to-primary/80 text-white h-11 px-6 rounded-md">{t('ui.next', 'Next')}</Button>
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
  const canProceed = formData.employmentSector && formData.isEmployerVietnameseOwned !== undefined && formData.hasWorkedInMilitaryPolice !== undefined;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('ui.employment.title', 'Employment Details')}</h2>
      <div>
        <Label className="mb-2">{t('ui.employment.vnOwned.label', 'Is your employer Vietnamese-owned? *')}</Label>
        <div className="space-y-2">
          <label className="flex items-center">
            <Radio name="isEmployerVietnameseOwned" value="true" checked={formData.isEmployerVietnameseOwned === true} onChange={() => updateFormData("isEmployerVietnameseOwned", true)} />
            <span className="ml-3">{t('ui.common.yes', 'Yes')}</span>
          </label>
          <label className="flex items-center">
            <Radio name="isEmployerVietnameseOwned" value="false" checked={formData.isEmployerVietnameseOwned === false} onChange={() => updateFormData("isEmployerVietnameseOwned", false)} />
            <span className="ml-3">{t('ui.common.no', 'No')}</span>
          </label>
        </div>
      </div>
      <div>
        <Label className="mb-2">{t('ui.employment.sector.label', 'Employment Sector *')}</Label>
        <Select value={formData.employmentSector} onChange={(e) => updateFormData("employmentSector", (e.target as any).value)}>
          <option value="">{t('ui.employment.sector.select', 'Select sector')}</option>
          <option value="Government">{t('ui.employment.sector.government', 'Government')}</option>
          <option value="Private">{t('ui.employment.sector.private', 'Private')}</option>
          <option value="NGO">{t('ui.employment.sector.ngo', 'NGO')}</option>
          <option value="Military/Security">{t('ui.employment.sector.military', 'Military/Security')}</option>
        </Select>
      </div>
      <div>
        <Label className="mb-2">{t('ui.employment.military.label', 'Have you ever worked for or served in the military or police? *')}</Label>
        <div className="space-y-2">
          <label className="flex items-center">
            <Radio name="hasWorkedInMilitaryPolice" value="true" checked={formData.hasWorkedInMilitaryPolice === true} onChange={() => updateFormData("hasWorkedInMilitaryPolice", true)} />
            <span className="ml-3">{t('ui.common.yes', 'Yes')}</span>
          </label>
          <label className="flex items-center">
            <Radio name="hasWorkedInMilitaryPolice" value="false" checked={formData.hasWorkedInMilitaryPolice === false} onChange={() => updateFormData("hasWorkedInMilitaryPolice", false)} />
            <span className="ml-3">{t('ui.common.no', 'No')}</span>
          </label>
        </div>
      </div>
      <div className="flex justify-between">
        <Button onClick={onPrev} className="bg-gradient-to-r from-secondary to-secondary/80 text-white h-11 px-6 rounded-md">{t('ui.prev', 'Previous')}</Button>
        <Button onClick={onNext} disabled={!canProceed} className="bg-gradient-to-r from-primary to-primary/80 text-white h-11 px-6 rounded-md">{t('ui.next', 'Next')}</Button>
      </div>
    </div>
  );
}

function FinalQuestionsStep({ formData, updateFormData, onSubmit, onPrev, isSubmitting }: {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  onSubmit: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
}) {
  const canProceed = formData.planToReturn !== undefined && formData.hasStudiedAbroadOnGovScholarship !== undefined && formData.englishTestType && (formData.englishTestType === "None" || formData.englishScore !== undefined);
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('ui.final.title', 'Final Questions')}</h2>
      <div>
        <Label className="mb-2">{t('ui.final.return.label', 'Do you plan to return to your country after finishing the scholarship? *')}</Label>
        <div className="space-y-2">
          <label className="flex items-center">
            <Radio name="planToReturn" value="true" checked={formData.planToReturn === true} onChange={() => updateFormData("planToReturn", true)} />
            <span className="ml-3">{t('ui.common.yes', 'Yes')}</span>
          </label>
          <label className="flex items-center">
            <Radio name="planToReturn" value="false" checked={formData.planToReturn === false} onChange={() => updateFormData("planToReturn", false)} />
            <span className="ml-3">{t('ui.common.no', 'No')}</span>
          </label>
        </div>
      </div>
      <div>
        <Label className="mb-2">{t('ui.final.govscholar.label', 'Have you ever studied abroad on a government-funded scholarship? *')}</Label>
        <div className="space-y-2">
          <label className="flex items-center">
            <Radio name="hasStudiedAbroadOnGovScholarship" value="true" checked={formData.hasStudiedAbroadOnGovScholarship === true} onChange={() => updateFormData("hasStudiedAbroadOnGovScholarship", true)} />
            <span className="ml-3">{t('ui.common.yes', 'Yes')}</span>
          </label>
          <label className="flex items-center">
            <Radio name="hasStudiedAbroadOnGovScholarship" value="false" checked={formData.hasStudiedAbroadOnGovScholarship === false} onChange={() => updateFormData("hasStudiedAbroadOnGovScholarship", false)} />
            <span className="ml-3">{t('ui.common.no', 'No')}</span>
          </label>
        </div>
      </div>
      <div>
        <Label className="mb-2">{t('ui.final.testType.label', 'English Proficiency Test Type *')}</Label>
        <Select value={formData.englishTestType} onChange={(e) => updateFormData("englishTestType", (e.target as any).value)}>
          <option value="">{t('ui.final.testType.select', 'Select test type')}</option>
          <option value="IELTS">{t('ui.final.testType.ielts', 'IELTS')}</option>
          <option value="TOEFL">{t('ui.final.testType.toefl', 'TOEFL')}</option>
          <option value="PTE">{t('ui.final.testType.pte', 'PTE')}</option>
          <option value="None">{t('ui.final.testType.none', 'None')}</option>
        </Select>
      </div>
      {formData.englishTestType && formData.englishTestType !== "None" && (
        <div>
          <Label className="mb-2">{t('ui.final.overall.label', 'Overall Score *')}</Label>
          <Input type="number" step="0.1" value={formData.englishScore || ""} onChange={(e) => updateFormData("englishScore", parseFloat((e.target as HTMLInputElement).value) || undefined)} placeholder="Enter your overall score" />
        </div>
      )}
      <div className="flex justify-between">
        <Button onClick={onPrev} className="bg-gradient-to-r from-secondary to-secondary/80 text-white h-11 px-6 rounded-md">{t('ui.prev', 'Previous')}</Button>
        <Button onClick={onSubmit} disabled={!canProceed || isSubmitting} className="bg-gradient-to-r from-primary to-primary/80 text-white h-11 px-6 rounded-md">
          {isSubmitting ? t('ui.submitting', 'Submitting...') : t('ui.submit', 'Submit Application')}
        </Button>
      </div>
    </div>
  );
}

function ResultsPage({ result, onReset }: { result: EligibilityResult; onReset: () => void; }) {
  const hasEligibleScholarship = result.aasEligible || result.cheveningEligible;
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Scholarship Eligibility Results</h2>
        <p className="text-lg text-gray-600">Here are your eligibility results for both scholarships</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-4">
              <span className="text-white font-bold text-lg">AAS</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Australia Awards</h3>
          </div>
          {result.aasEligible ? (
            <div className="flex items-center text-green-700 mb-4"><span className="text-2xl mr-2">✔</span><span className="font-semibold">You are eligible to apply for AAS!</span></div>
          ) : (
            <div>
              <div className="flex items-center text-red-700 mb-4"><span className="text-2xl mr-2">✖</span><span className="font-semibold">You are not eligible for AAS</span></div>
              <div className="text-sm text-gray-700"><p className="font-medium mb-2">Reasons:</p><ul className="list-disc list-inside space-y-1">{result.aasReasons.map((r, i) => (<li key={i}>{r}</li>))}</ul></div>
            </div>
          )}
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4"><span className="text-white font-bold text-lg">CHV</span></div>
            <h3 className="text-xl font-semibold text-gray-900">Chevening</h3>
          </div>
          {result.cheveningEligible ? (
            <div className="flex items-center text-green-700 mb-4"><span className="text-2xl mr-2">✔</span><span className="font-semibold">You are eligible to apply for Chevening!</span></div>
          ) : (
            <div>
              <div className="flex items-center text-red-700 mb-4"><span className="text-2xl mr-2">✖</span><span className="font-semibold">You are not eligible for Chevening</span></div>
              <div className="text-sm text-gray-700"><p className="font-medium mb-2">Reasons:</p><ul className="list-disc list-inside space-y-1">{result.cheveningReasons.map((r, i) => (<li key={i}>{r}</li>))}</ul></div>
            </div>
          )}
        </div>
      </div>
      {hasEligibleScholarship && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-2"><span className="text-2xl mr-2">🎉</span><h4 className="text-lg font-semibold text-green-800">Congratulations!</h4></div>
          <p className="text-green-700">You are eligible for at least one scholarship! We recommend you start preparing your application early. Good luck with your scholarship journey!</p>
        </div>
      )}
      <div className="text-center"><button onClick={onReset} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Check Another Application</button></div>
    </div>
  );
}

