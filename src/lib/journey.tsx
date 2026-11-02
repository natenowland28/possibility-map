"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SECTIONS, type SectionId } from "@/config/methodology";
import type { AppStatus, Journey, Observation, SectionState, Step, Theme } from "@/lib/types";

const STORAGE_KEY = "possibility-map:v1";

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "")
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const emptySection = (): SectionState => ({ answers: {}, inputMode: {}, observations: null, themes: null });

export function newJourney(): Journey {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: "",
    email: "",
    startedAt: now,
    updatedAt: now,
    step: { kind: "welcome" },
    sections: { ideal: emptySection(), vision: emptySection(), vector: emptySection() },
  };
}

const BLANK: Journey = {
  id: "",
  name: "",
  email: "",
  startedAt: "",
  updatedAt: "",
  step: { kind: "welcome" },
  sections: { ideal: emptySection(), vision: emptySection(), vector: emptySection() },
};

function load(): Journey | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Journey) : null;
  } catch {
    return null;
  }
}

function persist(j: Journey) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(j));
  } catch {
    /* storage can be unavailable (private mode); the journey still works in memory */
  }
}

export async function saveToServer(j: Journey, submit = false) {
  const res = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: j.id,
      name: j.name,
      email: j.email,
      startedAt: j.startedAt,
      submit,
      sections: j.sections,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Couldn't save. Please try again.");
  return json as { ok: true; emailed?: boolean };
}

/** Approved themes from sections before `sectionIndex`, used to give the AI continuity. */
export function priorThemes(j: Journey, sectionIndex: number) {
  return SECTIONS.slice(0, sectionIndex)
    .map((s) => ({
      sectionId: s.id,
      themes: (j.sections[s.id].themes ?? []).map((t) => ({ heading: t.heading, body: t.body })),
    }))
    .filter((p) => p.themes.length);
}

export function answersFor(j: Journey, sectionId: SectionId) {
  const s = SECTIONS.find((x) => x.id === sectionId)!;
  return s.questions.map((q) => ({ questionId: q.id, answer: j.sections[sectionId].answers[q.id] ?? "" }));
}

/** A short, stable fingerprint of some JSON-able value. */
export function fingerprint(value: unknown) {
  const str = JSON.stringify(value);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function observationsKey(j: Journey, sectionId: SectionId) {
  return fingerprint(answersFor(j, sectionId));
}

export function themesKey(j: Journey, sectionId: SectionId) {
  return fingerprint((j.sections[sectionId].observations ?? []).map((o) => [o.text, o.status, o.correction ?? ""]));
}

interface Ctx {
  journey: Journey;
  ready: boolean;
  status: AppStatus | null;
  hasSavedProgress: boolean;
  go: (step: Step) => void;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setAnswer: (section: SectionId, questionId: string, text: string, mode: "voice" | "text") => void;
  setObservations: (section: SectionId, list: Observation[] | null, basis?: string) => void;
  updateObservation: (section: SectionId, id: string, patch: Partial<Observation>) => void;
  setThemes: (section: SectionId, list: Theme[] | null, basis?: string) => void;
  updateTheme: (section: SectionId, id: string, patch: Partial<Theme>) => void;
  completeSection: (section: SectionId) => void;
  markSubmitted: () => void;
  restart: () => void;
}

const JourneyContext = createContext<Ctx | null>(null);

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  // A blank placeholder until mount: real ids and timestamps are created in the browser.
  const [journey, setJourney] = useState<Journey>(BLANK);
  const [ready, setReady] = useState(false);
  const [hasSavedProgress, setHasSaved] = useState(false);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const lastSyncedStep = useRef<string>("");

  useEffect(() => {
    const saved = load();
    /* eslint-disable react-hooks/set-state-in-effect -- hydrating from localStorage after mount */
    if (saved) {
      setJourney(saved);
      setHasSaved(saved.step.kind !== "welcome");
    } else {
      setJourney(newJourney());
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ ai: "demo", model: "demo", transcription: "browser" }));
  }, []);

  useEffect(() => {
    if (ready) persist(journey);
  }, [journey, ready]);

  // Keep the facilitator's dashboard current: sync whenever the participant moves to a new step.
  useEffect(() => {
    if (!ready || journey.step.kind === "welcome" || journey.submittedAt) return;
    const key = JSON.stringify(journey.step);
    if (key === lastSyncedStep.current) return;
    lastSyncedStep.current = key;
    const t = setTimeout(() => saveToServer(journey).catch(() => {}), 600);
    return () => clearTimeout(t);
  }, [journey, ready]);

  const update = useCallback((fn: (j: Journey) => Journey) => {
    setJourney((prev) => ({ ...fn(prev), updatedAt: new Date().toISOString() }));
  }, []);

  const patchSection = useCallback(
    (section: SectionId, fn: (s: SectionState) => SectionState) =>
      update((j) => ({ ...j, sections: { ...j.sections, [section]: fn(j.sections[section]) } })),
    [update],
  );

  const value = useMemo<Ctx>(
    () => ({
      journey,
      ready,
      status,
      hasSavedProgress,
      go: (step) => {
        update((j) => ({ ...j, step }));
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      },
      setName: (name) => update((j) => ({ ...j, name })),
      setEmail: (email) => update((j) => ({ ...j, email })),
      setAnswer: (section, questionId, text, mode) =>
        patchSection(section, (s) => ({
          ...s,
          answers: { ...s.answers, [questionId]: text },
          inputMode: { ...s.inputMode, [questionId]: mode },
        })),
      setObservations: (section, list, basis) =>
        patchSection(section, (s) => ({ ...s, observations: list, obsBasis: basis })),
      updateObservation: (section, id, patch) =>
        patchSection(section, (s) => ({
          ...s,
          observations: (s.observations ?? []).map((o) => (o.id === id ? { ...o, ...patch } : o)),
        })),
      setThemes: (section, list, basis) => patchSection(section, (s) => ({ ...s, themes: list, themesBasis: basis })),
      updateTheme: (section, id, patch) =>
        patchSection(section, (s) => ({
          ...s,
          themes: (s.themes ?? []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      completeSection: (section) =>
        patchSection(section, (s) => ({ ...s, completedAt: s.completedAt ?? new Date().toISOString() })),
      markSubmitted: () => update((j) => ({ ...j, submittedAt: new Date().toISOString(), step: { kind: "done" } })),
      restart: () => {
        const fresh = newJourney();
        lastSyncedStep.current = "";
        setJourney(fresh);
        setHasSaved(false);
      },
    }),
    [journey, ready, status, hasSavedProgress, update, patchSection],
  );

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney must be used inside <JourneyProvider>");
  return ctx;
}

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong. Please try again.");
  return json as T;
}
