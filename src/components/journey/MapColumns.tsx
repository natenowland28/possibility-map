"use client";

import { motion } from "motion/react";
import { PencilLine } from "lucide-react";
import { SECTIONS } from "@/config/methodology";
import type { Journey } from "@/lib/types";

/** All fifteen themes, side by side, one column per section. */
export function MapColumns({ journey, onEdit }: { journey: Journey; onEdit?: (section: number) => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {SECTIONS.map((s, si) => (
        <motion.section
          key={s.id}
          data-section={s.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 * si, duration: 0.55 }}
          className="glass print-break flex flex-col rounded-3xl p-6"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">0{si + 1}</div>
              <h2 className="font-display mt-1 text-3xl text-ink">{s.title}</h2>
              <p className="text-sm text-ink-soft italic">{s.tagline}</p>
            </div>
            {onEdit && (
              <button
                onClick={() => onEdit(si)}
                className="no-print inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                <PencilLine className="size-3" /> Edit
              </button>
            )}
          </div>
          <ol className="mt-5 space-y-4">
            {(journey.sections[s.id].themes ?? []).map((t, i) => (
              <li key={t.id} className="print-break border-t border-line pt-4 first:border-0 first:pt-0">
                <div className="flex gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
                  <div>
                    <h3 className="font-display text-lg leading-snug text-ink">
                      <span className="sr-only">{i + 1}. </span>
                      {t.heading}
                    </h3>
                    <p className="mt-1 text-[14.5px] leading-relaxed text-ink-soft">{t.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </motion.section>
      ))}
    </div>
  );
}
