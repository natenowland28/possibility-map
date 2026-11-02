import { z } from "zod";
import { deleteSession, listSessions, storageMode } from "@/lib/storage";
import { aiMode, MODEL } from "@/lib/ai";
import { AI_INSTRUCTIONS, SECTIONS } from "@/config/methodology";

const PASSWORD = process.env.ADMIN_PASSWORD || "possibility";

function authorised(req: Request) {
  return req.headers.get("x-admin-password") === PASSWORD;
}

const unauthorised = () => Response.json({ error: "Incorrect password" }, { status: 401 });

/** Facilitator dashboard data: every session plus the current methodology. */
export async function POST(req: Request) {
  if (!authorised(req)) return unauthorised();
  const sessions = await listSessions();
  return Response.json({
    sessions,
    config: {
      ai: aiMode(),
      model: aiMode() === "claude" ? MODEL : "demo",
      storage: storageMode,
      emailNotifications: Boolean(process.env.RESEND_API_KEY && process.env.FACILITATOR_EMAIL),
      defaultPassword: !process.env.ADMIN_PASSWORD,
    },
    methodology: { instructions: AI_INSTRUCTIONS, sections: SECTIONS },
  });
}

export async function DELETE(req: Request) {
  if (!authorised(req)) return unauthorised();
  const parsed = z.object({ id: z.string().min(1).max(64) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  await deleteSession(parsed.data.id);
  return Response.json({ ok: true });
}
