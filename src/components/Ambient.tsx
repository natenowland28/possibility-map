"use client";

import { motion } from "motion/react";

/** Slow, softly drifting colour fields behind the page, tinted by the active section. */
export function Ambient({ tone = "neutral" }: { tone?: "neutral" | "ideal" | "vision" | "vector" }) {
  const palette = {
    neutral: ["#f2d9b8", "#dcd3f5", "#cfe9e2"],
    ideal: ["#f4cf9f", "#f7e0c2", "#efc9b8"],
    vision: ["#d4ccf7", "#e7defb", "#c9d6f6"],
    vector: ["#bfe6dc", "#d9efe6", "#c8e3ef"],
  }[tone];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      {palette.map((c, i) => (
        <motion.div
          key={i}
          className={i % 2 ? "animate-drift-slow absolute rounded-full" : "animate-drift absolute rounded-full"}
          animate={{ backgroundColor: c }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
          style={{
            width: ["58vmax", "46vmax", "40vmax"][i],
            height: ["58vmax", "46vmax", "40vmax"][i],
            top: ["-22vmax", "38%", "-8vmax"][i],
            left: ["-16vmax", "-14vmax", "62%"][i],
            filter: "blur(90px)",
            opacity: 0.55,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--bg)_85%)]" />
    </div>
  );
}
