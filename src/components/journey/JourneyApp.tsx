"use client";

import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { SECTIONS } from "@/config/methodology";
import { JourneyProvider, useJourney } from "@/lib/journey";
import type { Step } from "@/lib/types";
import { Ambient } from "@/components/Ambient";
import { JourneyHeader } from "@/components/JourneyHeader";
import { Welcome } from "@/components/journey/Welcome";
import { SectionIntro } from "@/components/journey/SectionIntro";
import { QuestionStep } from "@/components/journey/QuestionStep";
import { ObservationsStep } from "@/components/journey/ObservationsStep";
import { ThemesStep } from "@/components/journey/ThemesStep";
import { SectionDone } from "@/components/journey/SectionDone";
import { Review } from "@/components/journey/Review";
import { Done } from "@/components/journey/Done";

function Screen({ step }: { step: Step }) {
  switch (step.kind) {
    case "welcome":
      return <Welcome />;
    case "intro":
      return <SectionIntro section={step.section} />;
    case "question":
      return <QuestionStep section={step.section} question={step.question} />;
    case "observations":
      return <ObservationsStep section={step.section} />;
    case "themes":
      return <ThemesStep section={step.section} />;
    case "sectionDone":
      return <SectionDone section={step.section} />;
    case "review":
      return <Review />;
    case "done":
      return <Done />;
  }
}

function Shell() {
  const { journey, ready } = useJourney();
  const step: Step = journey.submittedAt ? { kind: "done" } : journey.step;
  const sectionId = "section" in step ? SECTIONS[step.section]?.id : undefined;
  const tone = sectionId ?? "neutral";

  return (
    <div data-section={sectionId} className="relative flex min-h-screen flex-col">
      <Ambient tone={tone} />
      <JourneyHeader />
      <main className="relative z-10 flex-1 px-5 pt-10 pb-24 sm:pt-16">
        {!ready ? (
          <div className="grid min-h-[60vh] place-items-center text-muted">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={JSON.stringify(step)}
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Screen step={step} />
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

export function JourneyApp() {
  return (
    <JourneyProvider>
      <Shell />
    </JourneyProvider>
  );
}
