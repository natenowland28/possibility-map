import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Possibility Map — a guided self-discovery",
  description:
    "A reflective, voice-first journey through Ideal, Vision and Vector. Speak your answers, review what the AI notices, and shape the themes of your Possibility Map.",
};

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="grain min-h-full flex flex-col">{children}</body>
    </html>
  );
}
