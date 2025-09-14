// src/ts/schema.ts
import { z } from "zod";

export const schema = z.object({
  age: z.number(),
  englishScore: z.number(),
  country: z.string(),
  employment: z.string(),
  hasMilitaryBackground: z.boolean(),
  // thêm các field khác tùy rules bạn có
});
