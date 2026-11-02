"use client";

import { motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SECTIONS } from "@/config/methodology";
import { useJourney } from "@/lib/journey";
import { Button } from "@/components/ui";

export function SectionDone({ section }: { section: number }) {
  const { journey, go } = useJourney();
  const s = SECTIONS[section];
  const next = SECTIONS[section + 1];
  const themes = journey.sections[s.id].themes ?? [];

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 14 }}
        className="relative grid size-24 place-items-center"
      >
        <motion.div
          className="absolute inset-0 rounded-full bg-accent/20"
          initial={{ scale: 0.8, opacity: 1 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        />
        <div className="grid size-20 place-items-center rounded-full bg-accent text-white shadow-[0_20px_50px_-15px_var(--accent)]">
          <svg viewBox="0 0 24 24" className="size-9" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Section complete</div>
        <h1 className="font-display mt-3 text-5xl font-light text-ink sm:text-6xl">Your {s.title}, in five themes.</h1>
      </motion.div>

      <div className="mt-10 flex max-w-2xl flex-wrap justify-center gap-2.5">
        {themes.map((t, i) => (
          <motion.span
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.12, type: "spring", stiffness: 200, damping: 18 }}
            className="font-display rounded-full border border-accent/20 bg-white/80 px-5 py-2.5 text-lg text-ink shadow-soft"
          >
            {t.heading}
          </motion.span>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-12 flex flex-col items-center gap-4"
      >
        {next ? (
          <p className="max-w-md text-ink-soft">
            Beautiful work{journey.name ? `, ${journey.name}` : ""}. Next comes <strong className="font-semibold text-ink">{next.title}</strong> —{" "}
            {next.tagline.toLowerCase()}.
          </p>
        ) : (
          <p className="max-w-md text-ink-soft">
            That&apos;s all three sections{journey.name ? `, ${journey.name}` : ""}. Let&apos;s look at your whole map together.
          </p>
        )}
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => go({ kind: "themes", section })} icon={<ArrowLeft className="size-4" />}>
            Back to themes
          </Button>
          <Button
            size="lg"
            onClick={() => go(next ? { kind: "intro", section: section + 1 } : { kind: "review" })}
            iconRight={<ArrowRight className="size-4" />}
          >
            {next ? `Continue to ${next.title}` : "Review my map"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
