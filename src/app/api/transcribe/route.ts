/**
 * Server-side speech-to-text, used when the browser has no built-in speech
 * recognition (e.g. Firefox). Enabled by setting OPENAI_API_KEY (Whisper).
 */
export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return Response.json({ error: "Server transcription is not configured." }, { status: 501 });

  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return Response.json({ error: "No audio received." }, { status: 400 });
  }
  if (audio.size > 24 * 1024 * 1024) {
    return Response.json({ error: "That recording is too long. Please record a shorter answer." }, { status: 413 });
  }

  const upstream = new FormData();
  upstream.append("file", audio, "answer.webm");
  upstream.append("model", process.env.TRANSCRIBE_MODEL || "whisper-1");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: upstream,
  });
  if (!res.ok) {
    console.error("[transcribe]", res.status, await res.text().catch(() => ""));
    return Response.json({ error: "Transcription failed. Please try again or type your answer." }, { status: 502 });
  }
  const { text } = (await res.json()) as { text: string };
  return Response.json({ text });
}
