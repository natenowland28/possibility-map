"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Eraser, PencilLine, RotateCcw, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SECTIONS } from "@/config/methodology";
import { useJourney } from "@/lib/journey";
import { Button } from "@/components/ui";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Lets a participant begin again before sending: keep their work and revise it, or wipe it and start fresh. */
export function StartOverDialog({ open, onClose }: Props) {
  const { journey, startOver } = useJourney();
  const panel = useRef<HTMLDivElement>(null);
  const firstOption = useRef<HTMLButtonElement>(null);

  const answers = SECTIONS.reduce(
    (n, s) => n + Object.values(journey.sections[s.id].answers).filter((a) => a.trim()).length,
    0,
  );
  const themes = SECTIONS.reduce((n, s) => n + (journey.sections[s.id].themes?.length ?? 0), 0);

  // Focus, Escape, a simple focus trap, and no background scroll while open.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => firstOption.current?.focus(), 50);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab" && panel.current) {
        const items = panel.current.querySelectorAll<HTMLElement>("button:not([disabled])");
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  const choose = (mode: "revise" | "fresh") => {
    onClose();
    startOver(mode);
  };

  // Rendered at the document root so the page's transition transforms can't clip it.
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.div
            className="absolute inset-0 bg-ink/30 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-over-title"
            aria-describedby="start-over-desc"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.16, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[28px] bg-card-solid p-6 shadow-[0_30px_80px_-20px_rgba(31,27,22,0.45)] sm:p-8"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 grid size-9 cursor-pointer place-items-center rounded-full text-muted transition hover:bg-ink/5 hover:text-ink"
            >
              <X className="size-4" />
            </button>

            <div className="grid size-12 place-items-center rounded-full bg-ink/5 text-ink">
              <RotateCcw className="size-5" />
            </div>
            <h2 id="start-over-title" className="font-display mt-4 text-3xl text-ink">
              Begin again?
            </h2>
            <p id="start-over-desc" className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
              Nothing has been sent to your facilitator yet. Choose how you&apos;d like to start over.
            </p>

            <div className="mt-6 space-y-3">
              <button
                ref={firstOption}
                onClick={() => choose("revise")}
                className="group flex w-full cursor-pointer items-start gap-4 rounded-2xl border border-line bg-white p-4 text-left transition hover:border-vision/40 hover:shadow-[0_10px_30px_-16px_var(--vision)] focus-visible:border-vision/50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-vision-soft text-vision">
                  <PencilLine className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink">Revise my answers</span>
                    <span className="rounded-full bg-vision-soft px-2 py-0.5 text-[10px] font-bold tracking-wide text-vision uppercase">
                      Keeps your work
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
                    Go back to the first Ideal question with everything you&apos;ve written still there. Anything you
                    don&apos;t change keeps its themes.
                  </span>
                </span>
                <ArrowRight className="mt-2.5 hidden size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-vision sm:block" />
              </button>

              <button
                onClick={() => choose("fresh")}
                className="group flex w-full cursor-pointer items-start gap-4 rounded-2xl border border-line bg-white p-4 text-left transition hover:border-red-300 hover:shadow-[0_10px_30px_-16px_rgba(220,38,38,0.6)] focus-visible:border-red-300"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
                  <Eraser className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-ink">Start fresh</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
                    Clear all {answers} answers and {themes} themes, then begin again from Ideal with a blank page.
                  </span>
                  <span className="mt-1.5 block text-xs text-muted">You&apos;ll be able to undo this for a few seconds.</span>
                </span>
                <ArrowRight className="mt-2.5 hidden size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-red-600 sm:block" />
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="ghost" onClick={onClose}>
                Keep reviewing
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
