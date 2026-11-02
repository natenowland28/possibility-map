import { z } from "zod";
import { describeError, refineTheme } from "@/lib/ai";
import { AnswersSchema, ObservationsSchema, SectionIdSchema, ThemeListSchema } from "@/lib/api-schemas";

const Body = z.object({
  sectionId: SectionIdSchema,
  answers: AnswersSchema,
  observations: ObservationsSchema,
  themes: ThemeListSchema.min(1),
  index: z.number().int().min(0),
  feedback: z.string().max(4000),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.index >= parsed.data.themes.length) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const { sectionId, answers, observations, themes, index, feedback } = parsed.data;
    const theme = await refineTheme(sectionId, answers, observations, themes, index, feedback);
    return Response.json({ theme });
  } catch (err) {
    console.error("[refine]", err);
    const { message, status } = describeError(err);
    return Response.json({ error: message }, { status });
  }
}
