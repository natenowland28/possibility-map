import type { SectionId } from "@/config/methodology";

export type ObservationStatus = "pending" | "confirmed" | "corrected";

export interface Observation {
  id: string;
  text: string;
  status: ObservationStatus;
  correction?: string;
}

export interface Theme {
  id: string;
  heading: string;
  body: string;
  approved: boolean;
  /** True when the participant edited the wording themselves. */
  edited?: boolean;
}

export interface SectionState {
  answers: Record<string, string>;
  /** How each answer was captured, for the facilitator's context. */
  inputMode: Record<string, "voice" | "text">;
  observations: Observation[] | null;
  themes: Theme[] | null;
  /** Fingerprint of the answers the observations were generated from. */
  obsBasis?: string;
  /** Fingerprint of the reviewed observations the themes were generated from. */
  themesBasis?: string;
  completedAt?: string;
}

export type Step =
  | { kind: "welcome" }
  | { kind: "intro"; section: number }
  | { kind: "question"; section: number; question: number }
  | { kind: "observations"; section: number }
  | { kind: "themes"; section: number }
  | { kind: "sectionDone"; section: number }
  | { kind: "review" }
  | { kind: "done" };

export interface Journey {
  id: string;
  name: string;
  email: string;
  startedAt: string;
  updatedAt: string;
  submittedAt?: string;
  step: Step;
  sections: Record<SectionId, SectionState>;
}

/** What the facilitator sees for each participant. */
export interface SessionRecord {
  id: string;
  name: string;
  email: string;
  status: "in_progress" | "submitted";
  startedAt: string;
  updatedAt: string;
  submittedAt?: string;
  sections: Record<SectionId, SectionState>;
}

export interface AppStatus {
  ai: "claude" | "demo";
  model: string;
  transcription: "browser+server" | "browser";
}
