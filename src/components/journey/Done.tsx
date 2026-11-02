"use client";

import { motion } from "motion/react";
import { Download, Mail, PenTool, RotateCcw, Sparkles } from "lucide-react";
import { useJourney } from "@/lib/journey";
import { Button } from "@/components/ui";
import { MapColumns } from "@/components/journey/MapColumns";

const NEXT = [
  { icon: Sparkles, title: "Received", body: "Your 15 themes are safely with your facilitator." },
  { icon: PenTool, title: "Crafted by hand", body: "They'll personally shape your themes into a Possibility Map." },
  { icon: Mail, title: "Delivered", body: "Your map arrives in your inbox." },
];

export function Done() {
  const { journey, restart } = useJourney();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="no-print mx-auto max-w-2xl text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className="mx-auto flex justify-center -space-x-4"
        >
          {["var(--ideal)", "var(--vision)", "var(--vector)"].map((c, i) => (
            <motion.span
              key={c}
              className="size-16 rounded-full opacity-85 mix-blend-multiply"
              style={{ background: c }}
              initial={{ y: 20 }}
              animate={{ y: [0, -6, 0] }}
              transition={{ delay: i * 0.2, duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </motion.div>
        <h1 className="font-display mt-8 text-5xl leading-[1.05] font-light text-ink sm:text-6xl">
          Thank you{journey.name ? `, ${journey.name}` : ""}.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          Your themes have been sent. Your Possibility Map will be on its way to{" "}
          <strong className="font-semibold text-ink">{journey.email}</strong>.
        </p>

        <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
          {NEXT.map((n, i) => (
            <motion.div
              key={n.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.12 }}
              className="glass rounded-2xl p-5"
            >
              <n.icon className="size-5 text-vision" />
              <div className="font-display mt-3 text-lg text-ink">{n.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{n.body}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => window.print()} icon={<Download className="size-4" />}>
            Save a copy (PDF)
          </Button>
          <Button variant="ghost" onClick={restart} icon={<RotateCcw className="size-4" />}>
            Start a new session
          </Button>
        </div>
      </div>

      <div className="mt-14">
        <div className="mb-6 hidden text-center print:block">
          <div className="font-display text-3xl">Possibility Map — {journey.name}</div>
          <div className="text-sm">Approved themes</div>
        </div>
        <MapColumns journey={journey} />
      </div>
    </div>
  );
}
