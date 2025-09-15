export type ScholarshipId = "aas" | "chevening";

export const scholarshipRegistry: { id: ScholarshipId; name: string }[] = [
  { id: "aas", name: "Australia Awards" },
  { id: "chevening", name: "Chevening" },
];

export function isScholarshipId(x: string): x is ScholarshipId {
  return scholarshipRegistry.some((s) => s.id === x);
}

