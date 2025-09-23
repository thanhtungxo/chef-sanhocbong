import type { AnswerSet } from "../../types/eligibility";

// Normalize different UI field names to the rule engine's expected keys.
// This is intentionally tolerant: it copies all incoming keys and fills
// canonical ones if possible.
export function toAnswerSet(input: Record<string, any>): AnswerSet {
  const out: Record<string, any> = { ...input };

  // Normalize age to number if provided as string
  if (out.age != null && typeof out.age !== "number") {
    const n = Number(out.age);
    out.age = Number.isFinite(n) ? n : out.age;
  }

  // English score -> IELTS score used by current rules
  if (out.ielts == null) {
    if (out.englishScore != null) {
      out.ielts = Number(out.englishScore);
    } else if (out.englishTest && typeof out.englishTest === "object") {
      const t = String(out.englishTest.type || "").toUpperCase();
      if (t === "IELTS" && out.englishTest.overall != null) {
        const n = Number(out.englishTest.overall);
        if (Number.isFinite(n)) out.ielts = n;
      }
    }
  }

  // Military background
  if (out.military == null) {
    if (typeof out.hasMilitaryBackground === "boolean") out.military = out.hasMilitaryBackground;
    else if (typeof out.hasWorkedInMilitaryPolice === "boolean") out.military = out.hasWorkedInMilitaryPolice;
  }

  // Company ownership
  if (out.companyOwnership == null) {
    if (typeof out.isEmployerVietnameseOwned === "boolean") {
      out.companyOwnership = out.isEmployerVietnameseOwned ? "vietnamese_owned" : "non_vietnamese";
    }
  }

  // Work experience (in years)
  if (out.workExperience == null && out.yearsOfExperience != null) {
    out.workExperience = Number(out.yearsOfExperience);
  }

  // Country of residence
  if (out.countryOfResidence == null) {
    if (out.country) out.countryOfResidence = String(out.country).toLowerCase();
    else if (out.countryOfCitizenship) out.countryOfResidence = String(out.countryOfCitizenship).toLowerCase();
  }

  // Return to home country commitment
  if (out.returnToHomeCountry == null && typeof out.planToReturn === "boolean") {
    out.returnToHomeCountry = out.planToReturn;
  }

  // Leadership potential
  if (out.hasLeadershipPotential == null && typeof out.leadershipPotential === "boolean") {
    out.hasLeadershipPotential = out.leadershipPotential;
  }

  return out as AnswerSet;
}
