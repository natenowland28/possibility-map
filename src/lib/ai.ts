import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import {
  AI_INSTRUCTIONS,
  PROGRAM,
  SECTIONS,
  type Section,
  type SectionId,
} from "@/config/methodology";
import * as demo from "@/lib/demo-ai";

export const MODEL = process.env.AI_MODEL || "claude-opus-5-5";
type Effort = "low" | "medium" | "high" | "xhigh" | "max";
const EFFORT = (process.env.AI_EFFORT as Effort) || "medium";

export function aiMode(): "claude" | "demo" {
  if (process.env.AI_MODE === "demo") return "demo";
  return process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN ? "claude" : "demo";
}

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic();
  return client;
}

export interface AnswerInput {
  questionId: string;
  answer: string;
}
export interface ObservationInput {
  text: string;
  status: "pending" | "confirmed" | "corrected";
  correction?: string;
}
export interface ThemeInput {
  heading: string;
  body: string;
}
export interface PriorSection {
  sectionId: SectionId;
  themes: ThemeInput[];
}

const ObservationsSchema = z.object({
  observations: z
    .array(z.string().describe("One observation, 1–2 sentences, addressed to the participant as 'you'."))
    .describe(`Between ${PROGRAM.observationsPerSection.min} and ${PROGRAM.observationsPerSection.max} observations.`),
});

const ThemeSchema = z.object({
  heading: z.string().describe("An evocative heading of 2–6 words, Title Case, no trailing punctuation."),
  body: z.string().describe("A paragraph of 45–75 words in the second person."),
});

const ThemesSchema = z.object({
  themes: z.array(ThemeSchema).describe(`Exactly ${PROGRAM.themesPerSection} themes.`),
});

function sectionById(id: SectionId): Section {
  const s = SECTIONS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown section ${id}`);
  return s;
}

function systemPrompt(section: Section) {
  return `${AI_INSTRUCTIONS}

Current section: ${section.title} — ${section.tagline}.
${section.aiFocus}`;
}

function transcript(section: Section, answers: AnswerInput[]) {
  return section.questions
    .map((q) => {
      const a = answers.find((x) => x.questionId === q.id)?.answer?.trim();
      return `<qa>\n<question>${q.prompt}</question>\n<answer>${a || "(no answer given)"}</answer>\n</qa>`;
    })
    .join("\n");
}

function priorContext(prior: PriorSection[]) {
  if (!prior.length) return "";
  const blocks = prior
    .map((p) => {
      const title = sectionById(p.sectionId).title;
      return `<section name="${title}">\n${p.themes.map((t) => `- ${t.heading}: ${t.body}`).join("\n")}\n</section>`;
    })
    .join("\n");
  return `\n\nThemes the participant already approved in earlier sections (for continuity — build on them, don't repeat them):\n<approved_themes>\n${blocks}\n</approved_themes>`;
}

function reviewedObservations(observations: ObservationInput[]) {
  return observations
    .map((o) => {
      if (o.status === "corrected" && o.correction?.trim()) {
        return `- Observation: "${o.text}"\n  The participant CORRECTED this. Their words: "${o.correction.trim()}"`;
      }
      return `- Observation: "${o.text}"\n  The participant CONFIRMED this.`;
    })
    .join("\n");
}

async function callClaude<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system,
    thinking: { type: "adaptive" },
    output_config: { effort: EFFORT, format: betaZodOutputFormat(schema) },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{ role: "user", content: user }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The AI declined to respond to this input. Please rephrase and try again.");
  }
  if (!response.parsed_output) {
    throw new Error("The AI returned an unexpected response. Please try again.");
  }
  return response.parsed_output;
}

export async function generateObservations(
  sectionId: SectionId,
  answers: AnswerInput[],
  prior: PriorSection[],
): Promise<string[]> {
  const section = sectionById(sectionId);
  if (aiMode() === "demo") return demo.observations(section, answers, prior);

  const { min, max } = PROGRAM.observationsPerSection;
  const user = `Here are the participant's answers for the ${section.title} section:

<answers>
${transcript(section, answers)}
</answers>${priorContext(prior)}

Write ${min}–${max} meaningful observations about what you notice in these answers. Each should name a pattern, value, tension or energy that runs through what they said, quoting or echoing their words. The participant will confirm or correct each one, so make each observation a single clear claim they can agree or disagree with.`;

  const out = await callClaude(systemPrompt(section), user, ObservationsSchema);
  return out.observations.slice(0, max);
}

export async function generateThemes(
  sectionId: SectionId,
  answers: AnswerInput[],
  observations: ObservationInput[],
  prior: PriorSection[],
): Promise<ThemeInput[]> {
  const section = sectionById(sectionId);
  if (aiMode() === "demo") return demo.themes(section, answers, observations, prior);

  const n = PROGRAM.themesPerSection;
  const user = `Here are the participant's answers for the ${section.title} section:

<answers>
${transcript(section, answers)}
</answers>

You shared observations and the participant reviewed them. Treat their corrections as the truth — they override your original observation.

<reviewed_observations>
${reviewedObservations(observations)}
</reviewed_observations>${priorContext(prior)}

Now write exactly ${n} personalised themes for the ${section.title} section. Each theme has an evocative heading and a short paragraph. Together, the ${n} themes should cover distinct facets of what the participant shared — no two should overlap. These themes will become part of the participant's Possibility Map, so they should feel personal, true and worth keeping.`;

  const out = await callClaude(systemPrompt(section), user, ThemesSchema);
  return out.themes.slice(0, n);
}

export async function refineTheme(
  sectionId: SectionId,
  answers: AnswerInput[],
  observations: ObservationInput[],
  themes: ThemeInput[],
  index: number,
  feedback: string,
): Promise<ThemeInput> {
  const section = sectionById(sectionId);
  if (aiMode() === "demo") return demo.refine(section, themes[index], feedback);

  const others = themes
    .map((t, i) => (i === index ? null : `- ${t.heading}: ${t.body}`))
    .filter(Boolean)
    .join("\n");

  const user = `Here are the participant's answers for the ${section.title} section:

<answers>
${transcript(section, answers)}
</answers>

<reviewed_observations>
${reviewedObservations(observations)}
</reviewed_observations>

The participant asked you to revise one theme.

<theme_to_revise>
${themes[index].heading}: ${themes[index].body}
</theme_to_revise>

<their_feedback>
${feedback.trim() || "Make it feel more like me."}
</their_feedback>

The other themes in this section (keep the revised theme distinct from these):
<other_themes>
${others}
</other_themes>

Rewrite the theme so it honours their feedback. Return one theme.`;

  return callClaude(systemPrompt(section), user, ThemeSchema);
}

/** Turns SDK errors into short, human messages for the UI. */
export function describeError(err: unknown): { message: string; status: number } {
  if (err instanceof Anthropic.AuthenticationError) {
    return { message: "The AI key is invalid. Please check ANTHROPIC_API_KEY.", status: 500 };
  }
  if (err instanceof Anthropic.RateLimitError) {
    return { message: "The AI is busy right now. Please try again in a moment.", status: 429 };
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return { message: "Couldn't reach the AI service. Check your connection and try again.", status: 502 };
  }
  if (err instanceof Anthropic.APIError) {
    return { message: "The AI service had a problem. Please try again.", status: 502 };
  }
  if (err instanceof Error) return { message: err.message, status: 500 };
  return { message: "Something went wrong.", status: 500 };
}
