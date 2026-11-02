"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, CheckCheck, PencilLine, RotateCcw, Sparkles, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PROGRAM, SECTIONS, type SectionId } from "@/config/methodology";
import { answersFor, postJSON, priorThemes, themesKey, uid, useJourney } from "@/lib/journey";
import type { Theme } from "@/lib/types";
import { Button, cn } from "@/components/ui";
import { Thinking } from "@/components/Thinking";
import { VoiceInput } from "@/components/VoiceInput";

const PHRASES = [
  "Weaving your words together…",
  "Honouring your corrections…",
  "Finding the threads that matter…",
  "Shaping five themes for your map…",
];

type Mode = "view" | "edit" | "refine";

function ThemeCard({ t, index, sectionId, section }: { t: Theme; index: number; sectionId: SectionId; section: number }) {
  const { journey, updateTheme, status } = useJourney();
  const [mode, setMode] = useState<Mode>("view");
  const [heading, setHeading] = useState(t.heading);
  const [body, setBody] = useState(t.body);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onFeedback = useCallback((x: string) => setFeedback(x), []);

  const startEdit = () => {
    setHeading(t.heading);
    setBody(t.body);
    setMode("edit");
  };

  const saveEdit = () => {
    updateTheme(sectionId, t.id, { heading: heading.trim(), body: body.trim(), edited: true, approved: true });
    setMode("view");
  };

  const refine = async () => {
    setBusy(true);
    setError(null);
    try {
      const themes = journey.sections[sectionId].themes ?? [];
      const { theme } = await postJSON<{ theme: { heading: string; body: string } }>("/api/refine", {
        sectionId,
        answers: answersFor(journey, sectionId),
        observations: journey.sections[sectionId].observations ?? [],
        themes: themes.map((x) => ({ heading: x.heading, body: x.body })),
        index,
        feedback,
        prior: priorThemes(journey, section),
      });
      updateTheme(sectionId, t.id, { heading: theme.heading, body: theme.body, approved: false, edited: false });
      setFeedback("");
      setMode("view");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't refine this theme.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "glass group relative overflow-hidden rounded-3xl p-6 sm:p-7 transition-all duration-300",
        t.approved && "ring-1 ring-accent/35 shadow-[0_18px_50px_-24px_var(--accent)]",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full font-display text-sm transition-colors",
            t.approved ? "bg-accent text-white" : "bg-accent-soft text-accent",
          )}
        >
          {t.approved ? <Check className="size-4" strokeWidth={2.5} /> : index + 1}
        </div>

        <div className="min-w-0 flex-1">
          {mode === "edit" ? (
            <div className="space-y-3">
              <input
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                className="font-display w-full rounded-xl border border-line bg-white/80 px-3 py-2 text-2xl text-ink focus:border-accent/40 focus:outline-none focus:ring-4 focus:ring-accent/10"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-line bg-white/80 px-3 py-2 text-[16px] leading-relaxed text-ink focus:border-accent/40 focus:outline-none focus:ring-4 focus:ring-accent/10"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit} disabled={!heading.trim() || !body.trim()}>
                  Save &amp; approve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMode("view")}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={t.heading + t.body} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 className="font-display text-[26px] leading-tight text-ink">{t.heading}</h3>
                <p className="mt-2.5 text-[16.5px] leading-relaxed text-ink-soft">{t.body}</p>
                {t.edited && <div className="mt-2 text-xs text-muted">Edited by you</div>}
              </motion.div>
            </AnimatePresence>
          )}

          <AnimatePresence initial={false}>
            {mode === "refine" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-5 rounded-2xl bg-white/70 p-4">
                  <label className="mb-2 block text-sm font-medium text-ink-soft">
                    What would make this feel more like you?
                  </label>
                  <VoiceInput
                    variant="compact"
                    value={feedback}
                    onChange={onFeedback}
                    autoFocus
                    serverTranscription={status?.transcription === "browser+server"}
                    placeholder="e.g. “It’s less about helping, more about seeing potential in people.”"
                  />
                  {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="accent" onClick={refine} loading={busy} icon={<Sparkles className="size-3.5" />}>
                      {busy ? "Refining…" : "Refine theme"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setMode("view")} disabled={busy}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {mode === "view" && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {t.approved ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                    <Check className="size-3.5" /> Approved
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Undo2 className="size-3.5" />}
                    onClick={() => updateTheme(sectionId, t.id, { approved: false })}
                  >
                    Undo
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="soft"
                  icon={<Check className="size-4" />}
                  onClick={() => updateTheme(sectionId, t.id, { approved: true })}
                >
                  Approve
                </Button>
              )}
              <Button size="sm" variant="ghost" icon={<PencilLine className="size-3.5" />} onClick={startEdit}>
                Edit wording
              </Button>
              <Button size="sm" variant="ghost" icon={<Sparkles className="size-3.5" />} onClick={() => setMode("refine")}>
                Refine with AI
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.li>
  );
}

export function ThemesStep({ section }: { section: number }) {
  const { journey, setThemes, updateTheme, go, completeSection } = useJourney();
  const s = SECTIONS[section];
  const state = journey.sections[s.id];
  const themes = state.themes;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { themes: list } = await postJSON<{ themes: { heading: string; body: string }[] }>("/api/themes", {
        sectionId: s.id,
        answers: answersFor(journey, s.id),
        observations: state.observations ?? [],
        prior: priorThemes(journey, section),
      });
      setThemes(
        s.id,
        list.map((t) => ({ id: uid(), heading: t.heading, body: t.body, approved: false })),
        themesKey(journey, s.id),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [journey, s.id, section, setThemes, state.observations]);

  useEffect(() => {
    if (!themes && !started.current) {
      started.current = true;
      generate();
    }
  }, [themes, generate]);

  const approved = themes?.filter((t) => t.approved).length ?? 0;
  const total = themes?.length ?? PROGRAM.themesPerSection;
  const allApproved = Boolean(themes?.length) && approved === total;

  const finish = () => {
    completeSection(s.id);
    go({ kind: "sectionDone", section });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">{s.title} · Your themes</div>
        <h1 className="font-display mt-4 text-[40px] leading-[1.1] font-light text-ink sm:text-5xl">
          {loading || !themes ? "Shaping your themes…" : `Five themes from your ${s.title}.`}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          {loading || !themes
            ? "Bringing together your answers and the corrections you made."
            : "Approve each theme that feels true. You can adjust the wording yourself, or ask the AI to refine one."}
        </p>
      </div>

      <div className="mt-8">
        {error ? (
          <div className="glass mx-auto max-w-2xl rounded-3xl p-8 text-center">
            <p className="text-ink">{error}</p>
            <Button className="mt-5" variant="accent" onClick={generate} icon={<RotateCcw className="size-4" />}>
              Try again
            </Button>
          </div>
        ) : loading || !themes ? (
          <div className="mx-auto max-w-2xl">
            <Thinking phrases={PHRASES} cards={5} />
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {themes.map((t) => (
                    <span
                      key={t.id}
                      className={cn("h-1.5 w-7 rounded-full transition-colors duration-500", t.approved ? "bg-accent" : "bg-ink/10")}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted">
                  {approved} of {total} approved
                </span>
              </div>
              {!allApproved && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<CheckCheck className="size-4" />}
                  onClick={() => themes.forEach((t) => !t.approved && updateTheme(s.id, t.id, { approved: true }))}
                >
                  Approve all
                </Button>
              )}
            </div>
            <ul className="space-y-4">
              {themes.map((t, i) => (
                <ThemeCard key={t.id} t={t} index={i} sectionId={s.id} section={section} />
              ))}
            </ul>
          </>
        )}
      </div>

      {!loading && themes && !error && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => go({ kind: "observations", section })} icon={<ArrowLeft className="size-4" />}>
            Back to observations
          </Button>
          <Button variant="accent" size="lg" onClick={finish} disabled={!allApproved} iconRight={<ArrowRight className="size-4" />}>
            {allApproved ? `Complete ${s.title}` : `Approve all ${total} to continue`}
          </Button>
        </div>
      )}
    </div>
  );
}
