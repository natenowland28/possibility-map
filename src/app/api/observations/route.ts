import { z } from "zod";
import { describeError, generateObservations } from "@/lib/ai";
import { AnswersSchema, PriorSchema, SectionIdSchema } from "@/lib/api-schemas";

const Body = z.object({ sectionId: SectionIdSchema, answers: AnswersSchema, prior: PriorSchema });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  try {
    const { sectionId, answers, prior } = parsed.data;
    const observations = await generateObservations(sectionId, answers, prior);
    return Response.json({ observations });
  } catch (err) {
    console.error("[observations]", err);
    const { message, status } = describeError(err);
    return Response.json({ error: message }, { status });
  }
}
