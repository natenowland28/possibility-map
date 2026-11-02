"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, PencilLine, RefreshCw, RotateCcw, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SECTIONS } from "@/config/methodology";
import {
  answersFor,
  observationsKey,
  postJSON,
  priorThemes,
  themesKey,
  uid,
  useJourney,
} from "@/lib/journey";
import type { Observation } from "@/lib/types";
import { Button, cn } from "@/components/ui";
import { Thinking } from "@/components/Thinking";
import { VoiceInput } from "@/components/VoiceInput";

const PHRASES = [
  "Listening to what you shared…",
  "Noticing the patterns in your words…",
  "Looking for what lies beneath…",
  "Gathering a few observations…",
];

function ObservationCard({
  o,
  index,
  sectionId,
  serverTranscription,
}: {
  o: Observation;
  index: number;
  sectionId: (typeof SECTIONS)[number]["id"];
  serverTranscription: boolean;
}) {
  const { updateObservation } = useJourney();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(o.correction ?? "");
  const onDraft = useCallback((t: string) => setDraft(t), []);

  const save = () => {
    if (!draft.trim()) return;
    updateObservation(sectionId, o.id, { status: "corrected", correction: draft.trim() });
    setEditing(false);
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 * index, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "glass relative overflow-hidden rounded-3xl p-6 transition-shadow",
        o.status === "confirmed" && "ring-1 ring-accent/30",
        o.status === "corrected" && "ring-1 ring-ink/15",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1 transition-colors",
          o.status === "pending" ? "bg-transparent" : o.status === "confirmed" ? "bg-accent" : "bg-ink/60",
        )}
      />
      <div className="flex gap-4">
        <span className="font-display mt-0.5 text-sm font-medium text-accent/70">{String(index + 1).padStart(2, "0")}</span>
        <div className="flex-1">
          <p
            className={cn(
              "font-display text-[19px] leading-relaxed text-ink",
              o.status === "corrected" && "text-ink/45 line-through decoration-ink/20",
            )}
          >
            {o.text}
          </p>

          {o.status === "corrected" && !editing && (
            <div className="mt-4 rounded-2xl bg-white/80 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">In your words</div>
              <p className="mt-1 text-[16px] leading-relaxed text-ink">{o.correction}</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {editing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  <label className="mb-2 block text-sm font-medium text-ink-soft">What feels more accurate?</label>
                  <VoiceInput
                    variant="compact"
                    value={draft}
                    onChange={onDraft}
                    autoFocus
                    serverTranscription={serverTranscription}
                    placeholder="Say or type it in your own words…"
                  />
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="primary" onClick={save} disabled={!draft.trim()}>
                      Save correction
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!editing && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {o.status === "pending" ? (
                <>
                  <Button
                    size="sm"
                    variant="soft"
                    icon={<Check className="size-4" />}
                    onClick={() => updateObservation(sectionId, o.id, { status: "confirmed" })}
                  >
                    That&apos;s true
                  </Button>
                  <Button size="sm" variant="outline" icon={<PencilLine className="size-4" />} onClick={() => setEditing(true)}>
                    Not quite
                  </Button>
                </>
              ) : (
                <>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                      o.status === "confirmed" ? "bg-accent-soft text-accent" : "bg-ink/5 text-ink-soft",
                    )}
                  >
                    {o.status === "confirmed" ? <Check className="size-3.5" /> : <PencilLine className="size-3.5" />}
                    {o.status === "confirmed" ? "Confirmed" : "Corrected"}
                  </span>
                  {o.status === "corrected" && (
                    <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                      Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Undo2 className="size-3.5" />}
                    onClick={() => updateObservation(sectionId, o.id, { status: "pending", correction: undefined })}
                  >
                    Undo
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.li>
  );
}

export function ObservationsStep({ section }: { section: number }) {
  const { journey, setObservations, setThemes, go, status } = useJourney();
  const s = SECTIONS[section];
  const state = journey.sections[s.id];
  const observations = state.observations;
  const currentKey = observationsKey(journey, s.id);
  const stale = Boolean(observations && state.obsBasis && state.obsBasis !== currentKey);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { observations: list } = await postJSON<{ observations: string[] }>("/api/observations", {
        sectionId: s.id,
        answers: answersFor(journey, s.id),
        prior: priorThemes(journey, section),
      });
      setObservations(
        s.id,
        list.map((text) => ({ id: uid(), text, status: "pending" as const })),
        currentKey,
      );
      setThemes(s.id, null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [journey, s.id, section, setObservations, setThemes, currentKey]);

  useEffect(() => {
    if (!observations && !started.current) {
      started.current = true;
      generate();
    }
  }, [observations, generate]);

  const reviewed = observations?.filter((o) => o.status !== "pending").length ?? 0;
  const total = observations?.length ?? 0;
  const allReviewed = total > 0 && reviewed === total;

  const toThemes = () => {
    const key = themesKey(journey, s.id);
    if (state.themes && state.themesBasis !== key) setThemes(s.id, null);
    go({ kind: "themes", section });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">{s.title} · Reflection</div>
      <h1 className="font-display mt-4 text-[40px] leading-[1.1] font-light text-ink sm:text-5xl">
        {loading || !observations ? "Taking a moment to reflect…" : "Here’s what I noticed."}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">
        {loading || !observations
          ? "I’m reading through everything you shared."
          : "Confirm what rings true, and gently correct anything that doesn’t quite fit. Your corrections shape the themes that come next."}
      </p>

      <div className="mt-8">
        {error ? (
          <div className="glass rounded-3xl p-8 text-center">
            <p className="text-ink">{error}</p>
            <Button className="mt-5" variant="accent" onClick={generate} icon={<RotateCcw className="size-4" />}>
              Try again
            </Button>
          </div>
        ) : loading || !observations ? (
          <Thinking phrases={PHRASES} cards={4} />
        ) : (
          <>
            {stale && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/20 bg-accent-soft/60 px-4 py-3 text-sm text-ink">
                You changed your answers since these were written.
                <Button size="sm" variant="accent" onClick={generate} icon={<RefreshCw className="size-3.5" />}>
                  Refresh observations
                </Button>
              </div>
            )}
            <ul className="space-y-4">
              {observations.map((o, i) => (
                <ObservationCard
                  key={o.id}
                  o={o}
                  index={i}
                  sectionId={s.id}
                  serverTranscription={status?.transcription === "browser+server"}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      {!loading && observations && !error && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => go({ kind: "question", section, question: s.questions.length - 1 })}
            icon={<ArrowLeft className="size-4" />}
          >
            Back to answers
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">
              {reviewed} of {total} reviewed
            </span>
            <Button variant="accent" onClick={toThemes} disabled={!allReviewed} iconRight={<ArrowRight className="size-4" />}>
              Create my themes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
