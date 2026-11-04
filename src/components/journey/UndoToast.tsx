"use client";

import { AnimatePresence, motion } from "motion/react";
import { RotateCcw, X } from "lucide-react";
import { useEffect } from "react";
import { useJourney } from "@/lib/journey";

const SECONDS = 12;

/** Shown after "Start fresh", so a mis-click never costs someone their work. */
export function UndoToast() {
  const { canUndoStartOver, undoStartOver, dismissUndo } = useJourney();

  useEffect(() => {
    if (!canUndoStartOver) return;
    const t = setTimeout(dismissUndo, SECONDS * 1000);
    return () => clearTimeout(t);
  }, [canUndoStartOver, dismissUndo]);

  return (
    <div aria-live="polite" className="no-print pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <AnimatePresence>
        {canUndoStartOver && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-2xl bg-ink text-white shadow-[0_20px_50px_-15px_rgba(31,27,22,0.6)]"
          >
            <div className="flex items-center gap-3 py-3 pr-2 pl-4">
              <span className="min-w-0 flex-1 text-sm leading-snug">
                <span className="font-semibold">Started fresh.</span>{" "}
                <span className="text-white/70">Your previous answers were cleared.</span>
              </span>
              <button
                onClick={undoStartOver}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-semibold transition hover:bg-white/25"
              >
                <RotateCcw className="size-3.5" /> Undo
              </button>
              <button
                onClick={dismissUndo}
                aria-label="Dismiss"
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-white/40"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: SECONDS, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
