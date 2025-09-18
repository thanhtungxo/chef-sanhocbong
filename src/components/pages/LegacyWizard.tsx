import { useState } from "react";
import { Progress } from "@/components/atoms/Progress";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Radio } from "@/components/atoms/Radio";
import { Label } from "@/components/atoms/Label";
import { Button } from "@/components/atoms/Button";
import { toast } from "sonner";
import { evaluateScholarshipsLocally } from "@/lib/submit";
import { t } from "@/lib/i18n";

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
                <span className="text-sm text-muted-foreground">{t('ui.step.progress', `Bước ${currentStep}/${totalSteps}`)}</span>
                <span className="text-sm text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}% {t('ui.complete', 'Complete')}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                {[
                  t('ui.step.1','Bước 1: Thông tin cá nhân'),
                  t('ui.step.2','Bước 2: Học vấn & Công việc'),
                  t('ui.step.3','Bước 3: Việc làm'),
                  t('ui.step.4','Bước 4: Câu hỏi cuối'),
                ][currentStep-1]}
              </div>
              {/* Progress bar switched to shadcn/ui */}
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
  const canProceed = formData.fullName && formData.email && formData.dateOfBirth && formData.gender && formData.countryOfCitizenship && formData.currentCity;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('ui.personal.title', 'Personal Information')}</h2>
      <div>
        <Label className="mb-2">{t('ui.fullName.label', 'Full Name *')}</Label>
        <Input value={formData.fullName} onChange={(e) => updateFormData("fullName", (e.target as HTMLInputElement).value)} placeholder={t('ui.fullName.placeholder', 'Enter your full name')} />
        <p className="text-xs text-muted-foreground mt-1">{t('ui.fullName.help','Tên sẽ dùng cho liên hệ sau này.')}</p>
      </div>
      <div>
        <Label className="mb-2">{t('ui.email.label', 'Email Address *')}</Label>
        <Input type="email" value={formData.email} onChange={(e) => updateFormData("email", (e.target as HTMLInputElement).value)} placeholder={t('ui.email.placeholder', 'Enter your email address')} />
        <p className="text-xs text-muted-foreground mt-1">{t('ui.email.help','Chúng tôi sẽ dùng để gửi kết quả kiểm tra.')}</p>
      </div>
      <div>
        <Label className="mb-2">{t('ui.dob.label', 'Date of Birth *')}</Label>
        <Input type="date" value={formData.dateOfBirth} onChange={(e) => updateFormData("dateOfBirth", (e.target as HTMLInputElement).value)} />
      </div>
      <div>
        <Label className="mb-2">{t('ui.gender.label', 'Gender *')}</Label>
        <div className="space-y-2">
          {[t('ui.gender.male', 'Male'), t('ui.gender.female', 'Female'), t('ui.gender.other', 'Other'), t('ui.gender.na', 'Prefer not to say')].map((option) => (
            <label key={option} className="flex items-center gap-3">
              <Radio name="gender" value={option} checked={formData.gender === option} onChange={(e) => updateFormData("gender", (e.target as HTMLInputElement).value)} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label className="mb-2">{t('ui.citizenship.label', 'Country of Citizenship *')}</Label>
        <Select value={formData.countryOfCitizenship} onChange={(e) => updateFormData("countryOfCitizenship", (e.target as HTMLSelectElement).value)}>
          <option value="">{t('ui.citizenship.select', 'Select your country')}</option>
          <option value="Vietnam">{t('ui.citizenship.vietnam', 'Vietnam')}</option>
          <option value="Other">{t('ui.citizenship.other', 'Other')}</option>
        </Select>
      </div>
      <div>
        <Label className="mb-2">{t('ui.city.label', 'Current City of Residence *')}</Label>
        <Input value={formData.currentCity} onChange={(e) => updateFormData("currentCity", (e.target as HTMLInputElement).value)} placeholder={t('ui.city.placeholder', 'Enter your current city')} />
      </div>
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed} className="bg-gradient-to-r from-primary to-primary/80 text-white hover:scale-105 transition-transform duration-200 h-11 px-6 rounded-md">{t('ui.next', 'Next')}</Button>
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
        <label className="block text-sm font-medium text-gray-700 mb-2">Highest Completed Qualification *</label>
        <select value={formData.highestQualification} onChange={(e) => updateFormData("highestQualification", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="">Select qualification</option>
          <option value="Bachelor">Bachelor's Degree</option>
          <option value="Master">Master's Degree</option>
          <option value="PhD">PhD</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Years of Full-time Work Experience *</label>
        <input type="number" min="0" value={formData.yearsOfExperience} onChange={(e) => updateFormData("yearsOfExperience", parseInt(e.target.value) || 0)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter years of experience" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Current Job Title *</label>
        <input type="text" value={formData.currentJobTitle} onChange={(e) => updateFormData("currentJobTitle", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your current job title" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Employer Name *</label>
        <input type="text" value={formData.employerName} onChange={(e) => updateFormData("employerName", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your employer name" />
      </div>
      <div className="flex justify-between">
        <button onClick={onPrev} className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600">{t('ui.prev', 'Previous')}</button>
        <button onClick={onNext} disabled={!canProceed} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">{t('ui.next', 'Next')}</button>
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
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('ui.employment.vnOwned.label', 'Is your employer Vietnamese-owned? *')}</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="radio" name="isEmployerVietnameseOwned" value="true" checked={formData.isEmployerVietnameseOwned === true} onChange={() => updateFormData("isEmployerVietnameseOwned", true)} className="mr-3 text-blue-600" />
            {t('ui.common.yes', 'Yes')}
          </label>
          <label className="flex items-center">
            <input type="radio" name="isEmployerVietnameseOwned" value="false" checked={formData.isEmployerVietnameseOwned === false} onChange={() => updateFormData("isEmployerVietnameseOwned", false)} className="mr-3 text-blue-600" />
            {t('ui.common.no', 'No')}
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('ui.employment.sector.label', 'Employment Sector *')}</label>
        <select value={formData.employmentSector} onChange={(e) => updateFormData("employmentSector", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="">{t('ui.employment.sector.select', 'Select sector')}</option>
          <option value="Government">{t('ui.employment.sector.government', 'Government')}</option>
          <option value="Private">{t('ui.employment.sector.private', 'Private')}</option>
          <option value="NGO">{t('ui.employment.sector.ngo', 'NGO')}</option>
          <option value="Military/Security">{t('ui.employment.sector.military', 'Military/Security')}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('ui.employment.military.label', 'Have you ever worked for or served in the military or police? *')}</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="radio" name="hasWorkedInMilitaryPolice" value="true" checked={formData.hasWorkedInMilitaryPolice === true} onChange={() => updateFormData("hasWorkedInMilitaryPolice", true)} className="mr-3 text-blue-600" />
            {t('ui.common.yes', 'Yes')}
          </label>
          <label className="flex items-center">
            <input type="radio" name="hasWorkedInMilitaryPolice" value="false" checked={formData.hasWorkedInMilitaryPolice === false} onChange={() => updateFormData("hasWorkedInMilitaryPolice", false)} className="mr-3 text-blue-600" />
            {t('ui.common.no', 'No')}
          </label>
        </div>
      </div>
      <div className="flex justify-between">
        <button onClick={onPrev} className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600">{t('ui.prev', 'Previous')}</button>
        <button onClick={onNext} disabled={!canProceed} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">{t('ui.next', 'Next')}</button>
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
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('ui.final.return.label', 'Do you plan to return to your country after finishing the scholarship? *')}</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="radio" name="planToReturn" value="true" checked={formData.planToReturn === true} onChange={() => updateFormData("planToReturn", true)} className="mr-3 text-blue-600" />
            {t('ui.common.yes', 'Yes')}
          </label>
          <label className="flex items-center">
            <input type="radio" name="planToReturn" value="false" checked={formData.planToReturn === false} onChange={() => updateFormData("planToReturn", false)} className="mr-3 text-blue-600" />
            {t('ui.common.no', 'No')}
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('ui.final.govscholar.label', 'Have you ever studied abroad on a government-funded scholarship? *')}</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="radio" name="hasStudiedAbroadOnGovScholarship" value="true" checked={formData.hasStudiedAbroadOnGovScholarship === true} onChange={() => updateFormData("hasStudiedAbroadOnGovScholarship", true)} className="mr-3 text-blue-600" />
            {t('ui.common.yes', 'Yes')}
          </label>
          <label className="flex items-center">
            <input type="radio" name="hasStudiedAbroadOnGovScholarship" value="false" checked={formData.hasStudiedAbroadOnGovScholarship === false} onChange={() => updateFormData("hasStudiedAbroadOnGovScholarship", false)} className="mr-3 text-blue-600" />
            {t('ui.common.no', 'No')}
          </label>
        </div>
      </div>
      <div>
        <Label className="mb-2">{t('ui.final.testType.label', 'English Proficiency Test Type *')}</Label>
        <Select value={formData.englishTestType} onChange={(e) => updateFormData("englishTestType", (e.target as HTMLSelectElement).value)}>
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
            <div className="flex items-center text-green-700 mb-4"><span className="text-2xl mr-2">✅</span><span className="font-semibold">You are eligible to apply for AAS!</span></div>
          ) : (
            <div>
              <div className="flex items-center text-red-700 mb-4"><span className="text-2xl mr-2">❌</span><span className="font-semibold">You are not eligible for AAS</span></div>
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
            <div className="flex items-center text-green-700 mb-4"><span className="text-2xl mr-2">✅</span><span className="font-semibold">You are eligible to apply for Chevening!</span></div>
          ) : (
            <div>
              <div className="flex items-center text-red-700 mb-4"><span className="text-2xl mr-2">❌</span><span className="font-semibold">You are not eligible for Chevening</span></div>
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
