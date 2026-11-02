# Possibility Map — AI-guided self-discovery

A voice-first web experience that guides participants through three reflective sections — **Ideal**, **Vision** and **Vector** — and hands the facilitator 15 approved themes plus the participant's email.

## The participant journey

1. **Welcome** — first name, what to expect, privacy note. Progress auto-saves; returning visitors resume where they left off.
2. **For each section**
   - **Questions**, one at a time. Tap the mic and speak — words are transcribed live with an audio-reactive mic, or type instead.
   - **Observations** — the AI shares 3–5 observations. Each is confirmed (*That's true*) or corrected (*Not quite*, in the participant's own words — spoken or typed).
   - **Themes** — the AI writes 5 themes (heading + paragraph) that treat corrections as the truth. Each theme can be approved, edited by hand, or refined by the AI from feedback. All 5 must be approved to continue.
3. **Review** — all 15 themes side by side, email + consent, submit.
4. **Thank you** — what happens next, plus *Save a copy (PDF)*.

## The facilitator dashboard — `/admin`

- Every participant, live: in-progress and submitted, with per-section progress.
- Per participant: the 15 themes, every observation with corrections highlighted, and the full answers (marked voice or typed).
- One-click **Copy themes**, per-participant JSON, and **CSV / JSON export** of everyone.
- Optional email to the facilitator on each submission.
- A read-only view of the current methodology.

## Customising the methodology

Everything lives in **`src/config/methodology.ts`**: section copy, questions and hints, each section's AI focus, and the overall AI instructions. No UI code changes are needed.

## Running it

```bash
npm install
cp .env.example .env.local   # optional — add ANTHROPIC_API_KEY for real AI
npm run dev                  # http://localhost:3000
```

Without an API key it runs in **Demo mode**: a built-in stand-in produces sample reflections, and each question offers *Try a sample answer*, so the whole flow can be clicked through in about 3 minutes. The dashboard password defaults to `possibility`.

## Deploying (≈10 minutes)

1. Push to GitHub and import into Vercel (or any Node host).
2. Set `ANTHROPIC_API_KEY`, `ADMIN_PASSWORD`, and Upstash Redis (`UPSTASH_REDIS_REST_URL`/`_TOKEN`, free tier) so data persists on serverless hosting.
3. Optionally set `RESEND_API_KEY` + `FACILITATOR_EMAIL` for submission emails.

## How it's built

| Piece | Choice |
|---|---|
| App | Next.js 16 (App Router), React 19, Tailwind CSS 4, Motion |
| AI | Claude via the official Anthropic SDK, structured JSON outputs validated with Zod, adaptive thinking, automatic refusal fallback |
| Voice | Browser Web Speech API (free, live captions; Chrome, Edge, Safari). Optional Whisper fallback for other browsers |
| Storage | JSON files locally; Upstash Redis when hosted |
| Email | Resend (optional) |

**Approximate AI cost:** about 7 AI calls per participant (observations + themes per section, plus refinements) — roughly **$0.30–0.60 per participant** on Claude Opus 5.5, so a 10-person pilot costs a few dollars. Browser voice-to-text is free.

### Project layout

```
src/config/methodology.ts   questions + AI instructions (edit this)
src/lib/ai.ts               Claude prompts and calls
src/lib/demo-ai.ts          offline demo reflections
src/lib/storage.ts          file / Redis storage
src/hooks/useSpeech.ts      voice capture, live transcript, mic level
src/components/journey/     the participant screens
src/components/admin/       the facilitator dashboard
src/app/api/*               observations, themes, refine, progress, transcribe, admin
```
