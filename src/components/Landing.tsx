"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Check, Ear, Mail, MessageCircleHeart, Mic, PencilLine, Sparkles } from "lucide-react";
import { PROGRAM, SECTIONS } from "@/config/methodology";
import { Ambient } from "@/components/Ambient";
import { Logo } from "@/components/Logo";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

function Wave() {
  return (
    <div className="flex h-8 items-center gap-[3px]">
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-vision/70"
          animate={{ height: [6, 8 + ((i * 37) % 22), 6] }}
          transition={{ duration: 1 + (i % 5) * 0.18, repeat: Infinity, ease: "easeInOut", delay: i * 0.04 }}
        />
      ))}
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto h-[520px] w-full max-w-[460px] [&_.glass]:bg-white/90">
      {/* Question card */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -3 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="glass absolute left-0 top-0 w-[86%] rounded-3xl p-6"
        data-section="vision"
      >
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Vision · Question 1 of 4</div>
        <p className="font-display mt-3 text-[21px] leading-snug text-ink">
          Imagine it&apos;s five years from now and life feels deeply right…
        </p>
        <div className="mt-5 flex items-center gap-4">
          <span className="relative grid size-12 place-items-center rounded-full bg-ink text-white">
            <motion.span
              className="absolute inset-0 rounded-full border border-vision/50"
              animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            <Mic className="size-5" />
          </span>
          <Wave />
        </div>
        <p className="mt-4 text-sm italic text-muted">“I wake up in a house with a lot of light and a garden…”</p>
      </motion.div>

      {/* Observation card */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0, rotate: 2 }}
        transition={{ delay: 0.55, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="glass absolute right-0 top-[236px] w-[80%] rounded-3xl p-5"
        data-section="ideal"
      >
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
          <Ear className="size-3.5" /> Observation
        </div>
        <p className="font-display mt-2 text-[16px] leading-snug text-ink">
          You come most alive when you&apos;re helping someone else see more clearly.
        </p>
        <div className="mt-3 flex gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
            <Check className="size-3" /> That&apos;s true
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-ink-soft">
            <PencilLine className="size-3" /> Not quite
          </span>
        </div>
      </motion.div>

      {/* Theme card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0, rotate: -1.5 }}
        transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="glass absolute bottom-0 left-[6%] w-[78%] rounded-3xl p-5 ring-1 ring-vector/30"
        data-section="vector"
      >
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-full bg-accent text-white">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          <span className="font-display text-xl text-ink">Momentum by Design</span>
        </div>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
          You know what helps you move: a date on the calendar and someone to be accountable to…
        </p>
      </motion.div>
    </div>
  );
}

const STEPS = [
  { icon: Mic, title: "Speak freely", body: "Answer reflective questions out loud. Your words are transcribed live — or type if you prefer." },
  { icon: Sparkles, title: "AI reflects", body: "After each section, the AI shares 3–5 observations drawn from your own language." },
  { icon: MessageCircleHeart, title: "Confirm or correct", body: "You decide what's true. Corrections in your own words shape everything that follows." },
  { icon: Mail, title: "Receive your map", body: "Approve five themes per section. Your facilitator turns all fifteen into your Possibility Map." },
];

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Ambient />

      <header className="relative z-20">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="flex items-center gap-1 text-sm">
            <a href="#how" className="hidden rounded-full px-4 py-2 text-ink-soft hover:text-ink sm:inline">
              How it works
            </a>
            <Link href="/admin" className="rounded-full px-4 py-2 text-ink-soft hover:text-ink">
              Facilitator
            </Link>
            <Link
              href="/journey"
              className="ml-1 inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 font-medium text-white hover:bg-ink/90"
            >
              Begin <ArrowRight className="size-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pt-10 pb-24 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3.5 py-1.5 text-xs font-medium text-ink-soft"
            >
              <span className="flex -space-x-1">
                <span className="size-2.5 rounded-full bg-ideal" />
                <span className="size-2.5 rounded-full bg-vision" />
                <span className="size-2.5 rounded-full bg-vector" />
              </span>
              A guided, voice-first self-discovery
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="font-display mt-6 text-[52px] leading-[1.02] font-light tracking-tight text-ink sm:text-7xl"
            >
              Discover what&apos;s <em className="font-normal text-vision">possible</em>,
              <br className="hidden sm:block" /> in your own words.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl"
            >
              Speak through three reflective chapters — <strong className="font-semibold text-ideal">Ideal</strong>,{" "}
              <strong className="font-semibold text-vision">Vision</strong> and{" "}
              <strong className="font-semibold text-vector">Vector</strong>. A thoughtful AI listens, reflects back what it
              notices, and helps you shape the fifteen themes of your personal Possibility Map.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/journey"
                className="group inline-flex h-14 items-center gap-2 rounded-full bg-ink px-7 text-base font-medium text-white shadow-[0_14px_34px_-14px_rgba(31,27,22,0.7)] transition hover:bg-ink/90"
              >
                Begin your journey
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <span className="text-sm text-muted">About {PROGRAM.estimatedMinutes} minutes · saves as you go</span>
            </motion.div>
          </div>
          <HeroPreview />
        </section>

        {/* Three chapters */}
        <section className="mx-auto max-w-6xl px-5 pb-24">
          <motion.div {...fadeUp} className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft">Three chapters</div>
            <h2 className="font-display mt-3 text-4xl font-light text-ink sm:text-5xl">From who you are, to where you&apos;re going.</h2>
          </motion.div>
          <div className="relative mt-12 grid gap-5 md:grid-cols-3">
            {SECTIONS.map((s, i) => (
              <motion.div
                key={s.id}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.12 }}
                data-section={s.id}
                className="glass relative rounded-3xl p-7"
              >
                <div className="grid size-11 place-items-center rounded-full bg-accent font-display text-lg text-white shadow-[0_10px_24px_-10px_var(--accent)]">
                  {i + 1}
                </div>
                <h3 className="font-display mt-6 text-3xl text-ink">{s.title}</h3>
                <p className="font-display text-lg text-accent italic">{s.tagline}</p>
                <p className="mt-3 leading-relaxed text-ink-soft">{s.description}</p>
                <div className="mt-5 border-t border-line pt-4 text-sm text-muted">
                  {s.questions.length} questions · observations · 5 themes
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-10 px-5 pb-24">
          <motion.div {...fadeUp} className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft">How it works</div>
            <h2 className="font-display mt-3 text-4xl font-light text-ink sm:text-5xl">You lead. The AI listens.</h2>
          </motion.div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((st, i) => (
              <motion.div
                key={st.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                className="rounded-3xl border border-line bg-white/50 p-6"
              >
                <div className="flex items-center justify-between">
                  <st.icon className="size-6 text-ink" strokeWidth={1.5} />
                  <span className="font-display text-sm text-muted">0{i + 1}</span>
                </div>
                <h3 className="font-display mt-8 text-2xl text-ink">{st.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{st.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-[36px] bg-ink px-8 py-16 text-center text-white sm:px-16"
          >
            <div className="absolute -top-24 -left-24 size-72 rounded-full bg-ideal/40 blur-3xl" />
            <div className="absolute -right-20 -bottom-28 size-80 rounded-full bg-vision/40 blur-3xl" />
            <div className="absolute top-10 right-1/3 size-48 rounded-full bg-vector/30 blur-3xl" />
            <div className="relative">
              <h2 className="font-display mx-auto max-w-2xl text-4xl leading-tight font-light sm:text-5xl">
                Find a quiet moment. Your map begins with a single answer.
              </h2>
              <Link
                href="/journey"
                className="mt-9 inline-flex h-14 items-center gap-2 rounded-full bg-white px-7 font-medium text-ink transition hover:bg-white/90"
              >
                Begin your journey <ArrowRight className="size-4" />
              </Link>
              <p className="mt-5 text-sm text-white/60">Private to you and your facilitator · Works best in Chrome, Edge or Safari</p>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted">
          <Logo className="opacity-70" />
          <span>A proof-of-concept for guided self-discovery.</span>
        </div>
      </footer>
    </div>
  );
}
