"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import { SECTIONS } from "@/config/methodology";
import { useJourney } from "@/lib/journey";
import type { Step } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { cn } from "@/components/ui";

/** 0..1 progress through each section for the current step. */
function sectionProgress(step: Step, index: number): number {
  const total = SECTIONS[index].questions.length + 2;
  if (step.kind === "welcome") return 0;
  if (step.kind === "review" || step.kind === "done") return 1;
  const s = step.section;
  if (s > index) return 1;
  if (s < index) return 0;
  switch (step.kind) {
    case "intro":
      return 0.02;
    case "question":
      return step.question / total;
    case "observations":
      return (total - 2) / total;
    case "themes":
      return (total - 1) / total;
    case "sectionDone":
      return 1;
  }
}

export function JourneyHeader() {
  const { journey, status } = useJourney();
  const step = journey.step;

  return (
    <header className="no-print sticky top-0 z-30 border-b border-white/60 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
        <Link href="/" aria-label="Home" className="shrink-0">
          <Logo className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
        </Link>

        <nav aria-label="Progress" className="flex flex-1 items-center justify-center gap-2 sm:gap-3">
          {SECTIONS.map((s, i) => {
            const p = sectionProgress(step, i);
            const active = "section" in step && step.section === i && p < 1;
            const done = p >= 1;
            return (
              <div key={s.id} data-section={s.id} className="flex min-w-0 flex-1 max-w-44 flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded-full text-[9px] font-bold transition-colors",
                      done ? "bg-accent text-white" : active ? "bg-accent-soft text-accent" : "bg-ink/5 text-muted",
                    )}
                  >
                    {done ? <Check className="size-2.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "truncate text-xs font-semibold tracking-wide transition-colors",
                      active || done ? "text-ink" : "text-muted",
                    )}
                  >
                    {s.title}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-ink/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={false}
                    animate={{ width: `${p * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 22 }}
                  />
                </div>
              </div>
            );
          })}
        </nav>

        <div className="hidden shrink-0 md:block">
          {status?.ai === "demo" ? (
            <span
              title="No API key set — using built-in sample AI. Add ANTHROPIC_API_KEY for real reflections."
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
            >
              <Sparkles className="size-3" /> Demo AI
            </span>
          ) : status ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-500" /> AI connected
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
