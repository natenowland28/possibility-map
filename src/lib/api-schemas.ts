import { z } from "zod";

const text = (max: number) => z.string().max(max);

export const SectionIdSchema = z.enum(["ideal", "vision", "vector"]);

export const AnswersSchema = z
  .array(z.object({ questionId: text(64), answer: text(8000) }))
  .max(20);

export const ObservationsSchema = z
  .array(
    z.object({
      text: text(2000),
      status: z.enum(["pending", "confirmed", "corrected"]),
      correction: text(4000).optional(),
    }),
  )
  .max(10);

export const ThemeListSchema = z.array(z.object({ heading: text(200), body: text(3000) })).max(10);

export const PriorSchema = z
  .array(z.object({ sectionId: SectionIdSchema, themes: ThemeListSchema }))
  .max(3)
  .default([]);
