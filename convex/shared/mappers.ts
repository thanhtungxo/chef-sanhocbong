import type { AnswerSet } from "./eligibility";

const numericKeys = new Set([
  "age",
  "gpa",
  "yearsOfExperience",
  "ieltsgrade",
  "ptegrade",
  "Toeflgrade",
  "toeflgrade",
  "workingtime",
]);

const coerceNumber = (value: any) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  return value;
};

const pickFirstIfArray = (value: any) => Array.isArray(value) ? value[0] : value;

export function toAnswerSet(input: Record<string, any>): AnswerSet {
  const out: Record<string, any> = { ...input };

  for (const key of Object.keys(out)) {
    if (numericKeys.has(key)) {
      const coerced = coerceNumber(out[key]);
      if (coerced === undefined) {
        delete out[key];
      } else {
        out[key] = coerced;
      }
    }
  }

  if (out.toeflgrade != null && out.Toeflgrade == null) {
    out.Toeflgrade = out.toeflgrade;
  }

  out.nhomyeuthe = pickFirstIfArray(out.nhomyeuthe);
  if (out.nhomyeuthe == null) {
    out.nhomyeuthe = "khongyeuthe";
  }

  out.highestQualification = pickFirstIfArray(out.highestQualification);
  out.englishProficiency = pickFirstIfArray(out.englishProficiency);
  out.govscholarship = pickFirstIfArray(out.govscholarship);
  out.countryscholarship = pickFirstIfArray(out.countryscholarship);
  out.employmenttype = pickFirstIfArray(out.employmenttype);
  out.employerType = pickFirstIfArray(out.employerType);

  if (typeof out.workingtime === "number") {
    if (out.yearsOfExperience == null) {
      out.yearsOfExperience = out.workingtime / 12;
    }
  }
  if (out.employmenttype == null && out.employerType != null) {
    out.employmenttype = out.employerType;
  }

  return out as AnswerSet;
}
