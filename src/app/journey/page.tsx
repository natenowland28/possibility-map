import type { Metadata } from "next";
import { JourneyApp } from "@/components/journey/JourneyApp";

export const metadata: Metadata = {
  title: "Your journey — Possibility Map",
};

export default function JourneyPage() {
  return <JourneyApp />;
}
