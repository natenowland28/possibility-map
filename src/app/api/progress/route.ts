import { z } from "zod";
import { saveSession, getSession } from "@/lib/storage";
import { notifyFacilitator } from "@/lib/notify";
import type { SessionRecord } from "@/lib/types";

const Observation = z.object({
  id: z.string().max(64),
  text: z.string().max(2000),
  status: z.enum(["pending", "confirmed", "corrected"]),
  correction: z.string().max(4000).optional(),
});
const Theme = z.object({
  id: z.string().max(64),
  heading: z.string().max(200),
  body: z.string().max(3000),
  approved: z.boolean(),
  edited: z.boolean().optional(),
});
const Section = z.object({
  answers: z.record(z.string().max(64), z.string().max(8000)),
  inputMode: z.record(z.string().max(64), z.enum(["voice", "text"])).default({}),
  observations: z.array(Observation).max(10).nullable(),
  themes: z.array(Theme).max(10).nullable(),
  obsBasis: z.string().max(64).optional(),
  themesBasis: z.string().max(64).optional(),
  completedAt: z.string().max(40).optional(),
});

const Body = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/),
  name: z.string().max(120),
  email: z.string().max(200),
  startedAt: z.string().max(40),
  submit: z.boolean().default(false),
  sections: z.object({ ideal: Section, vision: Section, vector: Section }),
});

/** Saves a participant's progress. With `submit: true`, finalises it and notifies the facilitator. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const b = parsed.data;

  if (b.submit && !z.email().safeParse(b.email.trim()).success) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const existing = await getSession(b.id);
  if (existing?.status === "submitted" && !b.submit) {
    return Response.json({ ok: true, status: "submitted" });
  }

  const now = new Date().toISOString();
  const record: SessionRecord = {
    id: b.id,
    name: b.name.trim(),
    email: b.email.trim(),
    status: b.submit ? "submitted" : "in_progress",
    startedAt: b.startedAt,
    updatedAt: now,
    submittedAt: b.submit ? now : existing?.submittedAt,
    sections: b.sections,
  };

  try {
    await saveSession(record);
  } catch (err) {
    console.error("[progress]", err);
    return Response.json({ error: "We couldn't save your progress. Please try again." }, { status: 500 });
  }

  let emailed = false;
  if (b.submit) {
    try {
      emailed = (await notifyFacilitator(record)).sent;
    } catch (err) {
      console.error("[notify]", err);
    }
  }
  return Response.json({ ok: true, status: record.status, emailed });
}
