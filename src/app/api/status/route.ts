import { connection } from "next/server";
import { aiMode, MODEL } from "@/lib/ai";
import type { AppStatus } from "@/lib/types";

export async function GET() {
  await connection();
  const status: AppStatus = {
    ai: aiMode(),
    model: aiMode() === "claude" ? MODEL : "demo",
    transcription: process.env.OPENAI_API_KEY ? "browser+server" : "browser",
  };
  return Response.json(status);
}
