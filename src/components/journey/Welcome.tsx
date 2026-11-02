"use client";

import { motion } from "motion/react";
import { ArrowRight, Clock, Lock, Mic, RotateCcw } from "lucide-react";
import { PROGRAM, SECTIONS } from "@/config/methodology";
import { useJourney } from "@/lib/journey";
import { Button, Eyebrow } from "@/components/ui";

export function Welcome() {
  const { journey, setName, go, hasSavedProgress, restart } = useJourney();
  const resume = hasSavedProgress && journey.step.kind !== "welcome";

  const begin = () => go({ kind: "intro", section: 0 });

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <Eyebrow className="text-ink-soft">Welcome</Eyebrow>
        <h1 className="font-display mt-3 text-5xl leading-[1.05] font-light text-ink sm:text-6xl">
          Let&apos;s discover what&apos;s <em className="font-normal text-vision">possible</em> for you.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
          Over the next {PROGRAM.estimatedMinutes} minutes or so, you&apos;ll reflect on three questions of life — who you
          are, where you&apos;re drawn, and how you&apos;ll move. Speak freely; there are no wrong answers.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mt-10 grid gap-3 sm:grid-cols-3"
      >
        {SECTIONS.map((s, i) => (
          <div key={s.id} data-section={s.id} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">
                {i + 1}
              </span>
              <span className="font-display text-lg text-ink">{s.title}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.tagline}</p>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="glass mt-6 rounded-3xl p-6 sm:p-8"
      >
        {resume ? (
          <div>
            <h2 className="font-display text-2xl text-ink">Welcome back{journey.name ? `, ${journey.name}` : ""}.</h2>
            <p className="mt-2 text-ink-soft">Your progress was saved on this device. Pick up right where you left off.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => go(journey.step)} iconRight={<ArrowRight className="size-4" />}>
                Continue my journey
              </Button>
              <Button size="lg" variant="ghost" onClick={restart} icon={<RotateCcw className="size-4" />}>
                Start over
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (journey.name.trim()) begin();
            }}
          >
            <label htmlFor="name" className="font-display text-2xl text-ink">
              First, what should I call you?
            </label>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                id="name"
                autoFocus
                autoComplete="given-name"
                value={journey.name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your first name"
                className="h-14 flex-1 rounded-full border border-line bg-white/80 px-6 text-lg text-ink placeholder:text-muted/70 focus:border-accent/40 focus:outline-none focus:ring-4 focus:ring-accent/10"
              />
              <Button size="lg" type="submit" disabled={!journey.name.trim()} iconRight={<ArrowRight className="size-4" />}>
                Begin
              </Button>
            </div>
          </form>
        )}

        <div className="mt-7 grid gap-4 border-t border-line pt-6 text-sm text-ink-soft sm:grid-cols-3">
          <div className="flex gap-2.5">
            <Mic className="mt-0.5 size-4 shrink-0 text-vision" />
            <span>Speaking works best. Find a quiet spot and allow microphone access when asked.</span>
          </div>
          <div className="flex gap-2.5">
            <Clock className="mt-0.5 size-4 shrink-0 text-ideal" />
            <span>Your progress saves automatically. Take a break whenever you like.</span>
          </div>
          <div className="flex gap-2.5">
            <Lock className="mt-0.5 size-4 shrink-0 text-vector" />
            <span>Only your facilitator sees your responses. Nothing is shared publicly.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
