"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

/** A calm, breathing orb with rotating phrases while the AI reflects. */
export function Thinking({ phrases, cards = 4 }: { phrases: string[]; cards?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % phrases.length), 2600);
    return () => clearInterval(t);
  }, [phrases.length]);

  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative grid size-32 place-items-center">
        <div className="animate-breathe absolute size-32 rounded-full bg-accent/15 blur-xl" />
        <div className="animate-breathe absolute size-20 rounded-full bg-accent/25 [animation-delay:-1.2s]" />
        <motion.div
          className="absolute size-24 rounded-full border border-dashed border-accent/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative size-10 rounded-full bg-accent shadow-[0_0_40px_var(--accent)]" />
      </div>
      <div className="mt-6 h-7 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="font-display text-xl text-ink-soft italic"
          >
            {phrases[i]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="mt-10 w-full space-y-3">
        {Array.from({ length: cards }).map((_, k) => (
          <motion.div
            key={k}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 * k }}
            className="glass rounded-2xl p-5"
          >
            <div className="shimmer h-3.5 w-11/12 rounded-full" />
            <div className="shimmer mt-2.5 h-3.5 w-8/12 rounded-full" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
