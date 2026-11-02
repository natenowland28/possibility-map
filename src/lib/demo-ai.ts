import "server-only";
import type { Section } from "@/config/methodology";
import type { AnswerInput, ObservationInput, PriorSection, ThemeInput } from "@/lib/ai";

/**
 * Demo mode: a small offline stand-in for the AI so the experience can be
 * clicked through without an API key. It reads the participant's words,
 * picks up recurring motifs and quotes them back. Real reflections come from
 * Claude once ANTHROPIC_API_KEY is set.
 */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Motif {
  key: string;
  words: RegExp;
  observation: string;
  heading: string;
  body: string;
}

const MOTIFS: Motif[] = [
  {
    key: "helping",
    words: /\b(help|helping|support|coach|teach|guide|mentor|clarity|untangle|see what)\b/i,
    observation:
      "You come most alive when you're helping someone else see more clearly — your energy rises when another person's thinking starts to untangle.",
    heading: "The Clarifier",
    body: "You have a gift for helping people see what they couldn't see before. When others are stuck, you bring calm, honest questions and a way of finding the thread in the tangle. This isn't a skill you perform; it's how you naturally show up, and it's where you feel most like yourself.",
  },
  {
    key: "honesty",
    words: /\b(honest|honesty|truth|believe|integrity|uncomfortable|authentic)\b/i,
    observation:
      "Honesty isn't an abstract value for you — you've already made real, costly choices to stay true to what you believe.",
    heading: "Truth Over Comfort",
    body: "You've shown that you'll choose integrity even when it costs you. You tell people the truth kindly, and you need your work to be something you genuinely believe in. This is a foundation, not a preference: when your actions match your values, you have a steadiness that others trust.",
  },
  {
    key: "creating",
    words: /\b(design|designing|create|creating|build|scratch|make|making|write|writing|book)\b/i,
    observation:
      "You light up at the very beginning of things — the blank page, the empty room, the moment when anything is still possible.",
    heading: "Maker of Beginnings",
    body: "You are drawn to the moment before something exists — the workshop not yet designed, the garden not yet planted, the idea not yet shaped. Creating from scratch absorbs you completely. Your future work will feel most right when it leaves room for you to invent, shape and build things that carry your fingerprints.",
  },
  {
    key: "family",
    words: /\b(family|kids|children|partner|home|dinner|present)\b/i,
    observation:
      "Being present for the people you love is a non-negotiable — any picture of success that costs you that time isn't success to you.",
    heading: "Presence at Home",
    body: "Your family isn't a side note to your ambitions; it's part of the definition of a life that feels right. You want to be there for dinners, adventures and ordinary moments. Any path forward will need to protect that presence — and you'll do your best work when it does.",
  },
  {
    key: "freedom",
    words: /\b(freedom|free|own my time|independen\w*|alarm|choose|autonomy)\b/i,
    observation:
      "Freedom over your own time shows up again and again — it seems to be less a perk you want and more the oxygen you need.",
    heading: "Owning Your Time",
    body: "What feels most alive in your vision is freedom: waking without an alarm, shaping your own days, no longer performing for someone else's goals. You are seeking a life where your time reflects your values, and where the rhythm of your days gives you room to think, create and be present.",
  },
  {
    key: "courage",
    words: /\b(brave|braver|courage|courageous|scary|fear|afraid|risk)\b/i,
    observation:
      "You want to help others become braver, and there's a parallel invitation in your own story to make a courageous move of your own.",
    heading: "Courage, Shared",
    body: "You imagine people leaving their time with you braver than they arrived. That same courage is asking something of you, too. The change you hope to inspire in others is the change you are stepping into yourself — and your example may become one of the most powerful things you offer.",
  },
  {
    key: "curiosity",
    words: /\b(curious|curiosity|learn|learning|ideas|questions|explore)\b/i,
    observation:
      "Curiosity is part of your engine — without new ideas and questions to explore, you describe yourself going flat.",
    heading: "A Restless Curiosity",
    body: "You need to keep learning to feel alive. Questions, ideas and long walks where you think out loud are where your best insights arrive. Your path forward should keep feeding that curiosity — work that keeps you growing will keep you energised, and that energy is contagious to the people around you.",
  },
  {
    key: "community",
    words: /\b(community|group|groups|together|people|network|founders|leaders)\b/i,
    observation:
      "You think in terms of groups and connection — not just helping individuals, but creating spaces where people support each other.",
    heading: "Gathering People",
    body: "You picture small groups, shared rooms and a community that keeps supporting each other long after a program ends. You're not only a guide for individuals; you're someone who creates places where people can think together. That instinct to gather is a quiet strength worth building around.",
  },
  {
    key: "action",
    words: /\b(step|steps|book|deadline|date|accountab\w*|start|talk to|30 days|january)\b/i,
    observation:
      "You already know your next moves — and you've noticed that deadlines and accountability are what turn your intentions into action.",
    heading: "Momentum by Design",
    body: "You've named concrete steps, and you know what helps you take them: a date on the calendar and someone to be accountable to. Rather than waiting for perfect conditions, you can design for momentum — small, real commitments that build evidence and confidence with every step you take.",
  },
  {
    key: "perfection",
    words: /\b(perfect|overthink|overthinking|worry|what people will think|wait)\b/i,
    observation:
      "The thing most likely to slow you down isn't a lack of ability — it's waiting until it feels perfect and worrying about how it will look.",
    heading: "Good Enough to Begin",
    body: "You've been honest that overthinking and the wish for perfection can hold you back. Yet the evidence is already on your side — what you've tried has worked. Your next chapter asks you to trust that evidence, to begin before you feel ready, and to let the work improve in motion.",
  },
  {
    key: "resources",
    words: /\b(savings|runway|supportive|strengths|good at|skills|asked if)\b/i,
    observation:
      "You have more already in place than you might give yourself credit for — skills, people in your corner and real demand.",
    heading: "Already Resourced",
    body: "Your strengths, your supportive partner, your network and the people already asking for your help are real assets, not wishful thinking. You are further along than the vision might make you feel. Seeing these resources clearly can turn a scary leap into a well-supported next step.",
  },
];

const GENERIC: Record<string, ThemeInput[]> = {
  ideal: [
    { heading: "Your Natural Gifts", body: "" },
    { heading: "Values You Live By", body: "" },
    { heading: "Where Time Disappears", body: "" },
    { heading: "How Others Know You", body: "" },
    { heading: "Most Yourself", body: "" },
  ],
  vision: [
    { heading: "A Day That Feels Right", body: "" },
    { heading: "The Impact You Imagine", body: "" },
    { heading: "What You Will Build", body: "" },
    { heading: "Lighter and Freer", body: "" },
    { heading: "The People Beside You", body: "" },
  ],
  vector: [
    { heading: "Where You Stand Now", body: "" },
    { heading: "Strengths to Lean On", body: "" },
    { heading: "Moving Through Resistance", body: "" },
    { heading: "Your First Real Step", body: "" },
    { heading: "Direction Over Distance", body: "" },
  ],
};

function allText(answers: AnswerInput[]) {
  return answers.map((a) => a.answer).join(" ");
}

/** A short, natural quote from an answer: its first clause, up to ~14 words. */
function quote(answer: string | undefined) {
  if (!answer) return "";
  const first = answer.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s/)[0] ?? "";
  const words = first.replace(/[.!?]$/, "").split(" ");
  const clipped = words.slice(0, 14).join(" ");
  return words.length > 14 ? `${clipped}…` : clipped;
}

const usedHeadings = (prior: PriorSection[]) => new Set(prior.flatMap((p) => p.themes.map((t) => t.heading)));

const CORRECTION_HEADINGS: Record<string, string> = {
  ideal: "In Your Own Words",
  vision: "The Future, Your Way",
  vector: "Your Truest Direction",
};

function matchedMotifs(text: string, exclude = new Set<string>()) {
  return MOTIFS.filter((m) => !exclude.has(m.heading)).map((m) => ({ m, hits: (text.match(new RegExp(m.words, "gi")) || []).length }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map((x) => x.m);
}

export async function observations(
  section: Section,
  answers: AnswerInput[],
  prior: PriorSection[] = [],
): Promise<string[]> {
  await wait(1600);
  const text = allText(answers);
  const motifs = matchedMotifs(text, usedHeadings(prior)).slice(0, 4).map((m) => m.observation);
  const q = (i: number) => quote(answers.find((a) => a.questionId === section.questions[i]?.id)?.answer);

  const fallbacks = [
    q(0) && `When you describe "${q(0)}", there's a clear sense of what energises you — it seems to be a touchstone for who you are.`,
    q(1) && `The way you put it — "${q(1)}" — suggests this matters to you more than you might say out loud.`,
    q(2) && `There's a thread between "${q(2)}" and the rest of what you shared: it points to something you're not willing to compromise on.`,
    q(3) && `"${q(3)}" — the energy in these words suggests a direction you're already leaning toward.`,
  ].filter(Boolean) as string[];

  const out = [...motifs];
  for (const f of fallbacks) if (out.length < 4) out.push(f);
  if (out.length < 3) out.push("You chose your words carefully here, which suggests this section touched something important.");
  return out.slice(0, 5);
}

export async function themes(
  section: Section,
  answers: AnswerInput[],
  obs: ObservationInput[],
  prior: PriorSection[] = [],
): Promise<ThemeInput[]> {
  await wait(2000);
  const text = allText(answers) + " " + obs.map((o) => o.correction ?? "").join(" ");
  const used = usedHeadings(prior);
  const fromMotifs = matchedMotifs(text, used).map((m) => ({ heading: m.heading, body: m.body }));

  const corrections = obs.filter((o) => o.status === "corrected" && o.correction?.trim());
  const fromCorrections: ThemeInput[] = corrections.slice(0, 1).map((o) => ({
    heading: CORRECTION_HEADINGS[section.id],
    body: `You put it best yourself: "${quote(o.correction)}". This is an important truth about you — not the first interpretation, but the one you chose. Hold on to it as a compass point; it reflects what really matters to you in this part of your map.`,
  }));

  const generic = GENERIC[section.id].map((g, i) => {
    const q = quote(answers.find((a) => a.questionId === section.questions[i % section.questions.length]?.id)?.answer);
    return {
      heading: g.heading,
      body: q
        ? `When you said "${q}", you revealed something essential. It points to a part of you that deserves attention and room to grow — a quality that, when honoured, helps everything else in your life feel more aligned and more your own.`
        : "This part of your map is still taking shape. It may become clearer as you move through the rest of the exercise, and it's worth returning to with fresh eyes.",
    };
  });

  const seen = new Set<string>(used);
  const result: ThemeInput[] = [];
  for (const t of [...fromCorrections, ...fromMotifs, ...generic]) {
    if (seen.has(t.heading) || result.length >= 5) continue;
    seen.add(t.heading);
    result.push(t);
  }
  return result;
}

export async function refine(_section: Section, theme: ThemeInput, feedback: string): Promise<ThemeInput> {
  await wait(1400);
  const f = feedback.trim();
  return {
    heading: theme.heading,
    body: f
      ? `${theme.body.split(". ").slice(0, 2).join(". ").replace(/\.?$/, ".")} As you put it, ${f.replace(/\.$/, "").charAt(0).toLowerCase() + f.replace(/\.$/, "").slice(1)} — and that nuance is what makes this theme truly yours.`
      : theme.body,
  };
}
