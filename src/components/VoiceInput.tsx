"use client";

import { AnimatePresence, motion } from "motion/react";
import { Keyboard, Loader2, Mic, Square, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useSpeech } from "@/hooks/useSpeech";
import { cn } from "@/components/ui";

interface Props {
  value: string;
  onChange: (text: string, mode: "voice" | "text") => void;
  placeholder?: string;
  serverTranscription?: boolean;
  variant?: "hero" | "compact";
  autoFocus?: boolean;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function join(a: string, b: string) {
  if (!a.trim()) return b.charAt(0).toUpperCase() + b.slice(1);
  const needsStop = !/[.!?…]$/.test(a.trim());
  return `${a.trim()}${needsStop ? "." : ""} ${b.charAt(0).toUpperCase() + b.slice(1)}`;
}

/** Rings that pulse with the live microphone level. */
function LevelRings({ level, active, size }: { level: React.RefObject<number>; active: boolean; size: number }) {
  const ring1 = useRef<HTMLDivElement>(null);
  const ring2 = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active) return;
    let id = 0;
    const loop = () => {
      const l = level.current ?? 0;
      if (ring1.current) ring1.current.style.transform = `scale(${1 + l * 0.55})`;
      if (ring2.current) ring2.current.style.transform = `scale(${1 + l * 1.05})`;
      id = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(id);
  }, [active, level]);

  if (!active) return null;
  return (
    <>
      <div
        ref={ring2}
        className="absolute rounded-full bg-accent/10 transition-transform duration-75"
        style={{ width: size, height: size }}
      />
      <div
        ref={ring1}
        className="absolute rounded-full bg-accent/20 transition-transform duration-75"
        style={{ width: size, height: size }}
      />
      <motion.div
        className="absolute rounded-full border border-accent/40"
        style={{ width: size, height: size }}
        initial={{ scale: 1, opacity: 0.6 }}
        animate={{ scale: 1.9, opacity: 0 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
      />
    </>
  );
}

export function VoiceInput({
  value,
  onChange,
  placeholder = "Your words will appear here…",
  serverTranscription = false,
  variant = "hero",
  autoFocus,
}: Props) {
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const onFinal = useCallback(
    (chunk: string) => {
      if (!chunk) return;
      const next = join(valueRef.current, chunk);
      valueRef.current = next;
      onChange(next, "voice");
    },
    [onChange],
  );

  const speech = useSpeech({ onFinal, serverAvailable: serverTranscription });
  const textRef = useRef<HTMLTextAreaElement>(null);
  const canSpeak = speech.engine !== "none";

  const toggle = () => (speech.listening ? speech.stop() : speech.start());

  const status = speech.transcribing
    ? "Transcribing…"
    : speech.listening
      ? `Listening · ${fmt(speech.seconds)}`
      : value
        ? "Tap to add more"
        : "Tap to speak";

  if (variant === "compact") {
    return (
      <div className="relative">
        <textarea
          ref={textRef}
          autoFocus={autoFocus}
          value={value + (speech.interim ? (value ? " " : "") + speech.interim : "")}
          readOnly={speech.listening}
          onChange={(e) => onChange(e.target.value, "text")}
          placeholder={placeholder}
          rows={3}
          className="block min-h-24 w-full resize-none rounded-2xl border border-line bg-white/80 px-4 py-3 pr-14 text-[15px] leading-relaxed text-ink placeholder:text-muted/70 focus:border-accent/40 focus:outline-none focus:ring-4 focus:ring-accent/10"
        />
        {canSpeak && (
          <button
            type="button"
            onClick={toggle}
            aria-label={speech.listening ? "Stop recording" : "Speak instead"}
            className={cn(
              "absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full transition cursor-pointer",
              speech.listening ? "bg-accent text-white" : "bg-accent-soft text-accent hover:brightness-95",
            )}
          >
            {speech.transcribing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : speech.listening ? (
              <Square className="size-3.5 fill-current" />
            ) : (
              <Mic className="size-4" />
            )}
          </button>
        )}
        {speech.listening && (
          <div className="mt-1.5 flex items-center gap-2 text-xs text-accent">
            <span className="size-1.5 animate-pulse rounded-full bg-accent" /> {status}
          </div>
        )}
        {speech.error && <p className="mt-1.5 text-xs text-red-700/80">{speech.error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {canSpeak ? (
        <div className="flex flex-col items-center">
          <div className="relative grid size-40 place-items-center">
            <LevelRings level={speech.level} active={speech.listening} size={104} />
            <motion.button
              type="button"
              onClick={toggle}
              whileTap={{ scale: 0.94 }}
              aria-label={speech.listening ? "Stop recording" : "Start speaking"}
              className={cn(
                "relative z-10 grid size-[104px] place-items-center rounded-full text-white transition-colors cursor-pointer",
                "shadow-[0_18px_40px_-14px_var(--accent),inset_0_1px_0_rgba(255,255,255,0.35)]",
                speech.listening ? "bg-ink" : "bg-accent hover:brightness-105",
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={speech.transcribing ? "t" : speech.listening ? "s" : "m"}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {speech.transcribing ? (
                    <Loader2 className="size-9 animate-spin" />
                  ) : speech.listening ? (
                    <Square className="size-7 fill-current" />
                  ) : (
                    <Mic className="size-10" strokeWidth={1.75} />
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
          <div className="-mt-1 flex h-6 items-center gap-2 text-sm font-medium text-ink-soft">
            {speech.listening && <span className="size-2 animate-pulse rounded-full bg-red-500" />}
            {status}
          </div>
          {speech.error && (
            <div className="mt-3 flex max-w-md items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
              <span className="flex-1">{speech.error}</span>
              <button onClick={speech.clearError} aria-label="Dismiss" className="cursor-pointer">
                <X className="size-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm text-ink-soft">
          <Keyboard className="size-4" /> Voice isn&apos;t available in this browser — Chrome, Edge or Safari support it. You can type below.
        </div>
      )}

      <div className="mt-6 w-full">
        <div
          className={cn(
            "glass relative rounded-3xl p-1.5 transition-all duration-300",
            speech.listening && "ring-4 ring-accent/15",
          )}
        >
          <textarea
            ref={textRef}
            autoFocus={autoFocus && !canSpeak}
            value={value}
            onChange={(e) => onChange(e.target.value, "text")}
            placeholder={canSpeak ? `${placeholder} Or simply type.` : placeholder}
            rows={4}
            className="block min-h-36 w-full resize-none rounded-[20px] bg-white/70 px-5 py-4 text-[17px] leading-relaxed text-ink placeholder:text-muted/70 focus:bg-white focus:outline-none"
          />
          <AnimatePresence>
            {speech.interim && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-5 pb-3 text-[17px] italic leading-relaxed text-muted"
              >
                {speech.interim}
                <span className="ml-1 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-accent" />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center justify-between px-4 pb-2 pt-1 text-xs text-muted">
            <span>{value.trim() ? `${value.trim().split(/\s+/).length} words` : " "}</span>
            {value && !speech.listening && (
              <button
                type="button"
                onClick={() => onChange("", "text")}
                className="rounded-full px-2 py-0.5 hover:bg-ink/5 hover:text-ink cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
