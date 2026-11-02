"use client";

import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Wand2 } from "lucide-react";
import { useCallback } from "react";
import { SECTIONS } from "@/config/methodology";
import { useJourney } from "@/lib/journey";
import { Button } from "@/components/ui";
import { VoiceInput } from "@/components/VoiceInput";

export function QuestionStep({ section, question }: { section: number; question: number }) {
  const { journey, setAnswer, go, status } = useJourney();
  const s = SECTIONS[section];
  const q = s.questions[question];
  const value = journey.sections[s.id].answers[q.id] ?? "";
  const isLast = question === s.questions.length - 1;
  const hasAnswer = value.trim().length > 0;

  const onChange = useCallback(
    (text: string, mode: "voice" | "text") => setAnswer(s.id, q.id, text, mode),
    [setAnswer, s.id, q.id],
  );

  const next = () => {
    if (isLast) {
      // New answers mean fresh observations.
      go({ kind: "observations", section });
    } else {
      go({ kind: "question", section, question: question + 1 });
    }
  };
  const back = () =>
    question === 0 ? go({ kind: "intro", section }) : go({ kind: "question", section, question: question - 1 });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          {s.title} · Question {question + 1} of {s.questions.length}
        </div>
        <div className="flex gap-1.5">
          {s.questions.map((qq, i) => (
            <span
              key={qq.id}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === question ? "w-6 bg-accent" : journey.sections[s.id].answers[qq.id]?.trim() ? "w-1.5 bg-accent/50" : "w-1.5 bg-ink/10"
              }`}
            />
          ))}
        </div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="font-display mt-6 text-[34px] leading-[1.15] font-light text-ink sm:text-[44px]"
      >
        {q.prompt}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-lg leading-relaxed text-ink-soft"
      >
        {q.hint}
      </motion.p>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }} className="mt-8">
        <VoiceInput
          key={q.id}
          value={value}
          onChange={onChange}
          serverTranscription={status?.transcription === "browser+server"}
          autoFocus
        />
      </motion.div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={back} icon={<ArrowLeft className="size-4" />}>
          Back
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {status?.ai === "demo" && !hasAnswer && (
            <Button variant="outline" size="md" onClick={() => onChange(q.sample, "text")} icon={<Wand2 className="size-4" />}>
              Try a sample answer
            </Button>
          )}
          <Button variant="accent" onClick={next} disabled={!hasAnswer} iconRight={<ArrowRight className="size-4" />}>
            {isLast ? "Reflect on my answers" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
