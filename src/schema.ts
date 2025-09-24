// src/schema.ts
import { z } from "zod";

export const schema = z.object({
  // Personal info
  fullName: z.string().optional(),
  email: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  countryOfCitizenship: z.string().optional(),
  currentCity: z.string().optional(),

  // Existing minimal fields used by rules/mappers
  age: z.number(),
  englishScore: z.number(),
  country: z.string(),
  employment: z.string(),
  hasMilitaryBackground: z.boolean(),
});

