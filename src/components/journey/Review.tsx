"use client";

import { motion } from "motion/react";
import { ArrowLeft, Send } from "lucide-react";
import { useState } from "react";
import { SECTIONS } from "@/config/methodology";
import { saveToServer, useJourney } from "@/lib/journey";
import { Button } from "@/components/ui";
import { MapColumns } from "@/components/journey/MapColumns";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Review() {
  const { journey, setEmail, go, markSubmitted } = useJourney();
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = SECTIONS.reduce((n, s) => n + (journey.sections[s.id].themes?.filter((t) => t.approved).length ?? 0), 0);
  const valid = EMAIL.test(journey.email.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !consent) return;
    setBusy(true);
    setError(null);
    try {
      await saveToServer(journey, true);
      markSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft">Your map, in themes</div>
        <h1 className="font-display mt-4 text-5xl leading-[1.05] font-light text-ink sm:text-6xl">
          {journey.name ? `${journey.name}, here` : "Here"} is what you&apos;ve <em className="text-vision">uncovered</em>.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          {total} approved themes across Ideal, Vision and Vector. Take a moment with them — these become the foundation of your
          personal Possibility Map.
        </p>
      </div>

      <div className="mt-12">
        <MapColumns journey={journey} onEdit={(section) => go({ kind: "themes", section })} />
      </div>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass mx-auto mt-12 max-w-2xl rounded-3xl p-7 sm:p-9"
      >
        <h2 className="font-display text-3xl text-ink">Where should your Possibility Map go?</h2>
        <p className="mt-2 text-ink-soft">
          Your facilitator will personally craft your map from these themes and send it to you.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            autoComplete="email"
            value={journey.email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-14 flex-1 rounded-full border border-line bg-white/80 px-6 text-lg text-ink placeholder:text-muted/70 focus:border-accent/40 focus:outline-none focus:ring-4 focus:ring-accent/10"
          />
          <Button size="lg" type="submit" disabled={!valid || !consent} loading={busy} icon={<Send className="size-4" />}>
            Send my themes
          </Button>
        </div>
        <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-soft">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--vision)]"
          />
          I&apos;m happy to share my responses and approved themes with my facilitator so they can create my Possibility
          Map.
        </label>
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-800">{error}</p>}
      </motion.form>

      <div className="mt-8 text-center">
        <Button variant="ghost" onClick={() => go({ kind: "sectionDone", section: SECTIONS.length - 1 })} icon={<ArrowLeft className="size-4" />}>
          Back
        </Button>
      </div>
    </div>
  );
}
