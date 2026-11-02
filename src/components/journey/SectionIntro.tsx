"use client";

import { motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SECTIONS } from "@/config/methodology";
import { useJourney } from "@/lib/journey";
import { Button } from "@/components/ui";

export function SectionIntro({ section }: { section: number }) {
  const { go, journey } = useJourney();
  const s = SECTIONS[section];
  const minutes = Math.round(s.questions.length * 2.5 + 4);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="font-display text-[120px] leading-none font-extralight text-accent/25 sm:text-[160px]"
      >
        0{section + 1}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
          Section {section + 1} of {SECTIONS.length}
        </div>
        <h1 className="font-display mt-3 text-6xl font-light text-ink sm:text-7xl">{s.title}</h1>
        <p className="font-display mt-3 text-2xl text-ink-soft italic">{s.tagline}</p>
        <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">{s.description}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm text-ink-soft"
      >
        <span className="rounded-full bg-white/70 px-3 py-1">{s.questions.length} reflective questions</span>
        <span className="rounded-full bg-white/70 px-3 py-1">3–5 observations</span>
        <span className="rounded-full bg-white/70 px-3 py-1">5 themes</span>
        <span className="rounded-full bg-white/70 px-3 py-1">~{minutes} min</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-10 flex items-center justify-center gap-3"
      >
        {section > 0 && (
          <Button variant="ghost" size="lg" onClick={() => go({ kind: "sectionDone", section: section - 1 })} icon={<ArrowLeft className="size-4" />}>
            Back
          </Button>
        )}
        <Button
          variant="accent"
          size="lg"
          onClick={() => go({ kind: "question", section, question: 0 })}
          iconRight={<ArrowRight className="size-4" />}
        >
          {section === 0 && journey.name ? `I'm ready, let's begin` : `Begin ${s.title}`}
        </Button>
      </motion.div>
    </div>
  );
}
