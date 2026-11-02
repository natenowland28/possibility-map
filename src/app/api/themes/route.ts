import { z } from "zod";
import { describeError, generateThemes } from "@/lib/ai";
import { AnswersSchema, ObservationsSchema, PriorSchema, SectionIdSchema } from "@/lib/api-schemas";

const Body = z.object({
  sectionId: SectionIdSchema,
  answers: AnswersSchema,
  observations: ObservationsSchema,
  prior: PriorSchema,
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  try {
    const { sectionId, answers, observations, prior } = parsed.data;
    const themes = await generateThemes(sectionId, answers, observations, prior);
    return Response.json({ themes });
  } catch (err) {
    console.error("[themes]", err);
    const { message, status } = describeError(err);
    return Response.json({ error: message }, { status });
  }
}
