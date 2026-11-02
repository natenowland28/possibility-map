"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Minimal typings for the Web Speech API, which TypeScript's DOM lib doesn't ship. */
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

function getRecognition(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export type SpeechEngine = "browser" | "server" | "none";

interface Options {
  /** Called with each finalised chunk of speech. */
  onFinal: (text: string) => void;
  serverAvailable: boolean;
}

const ERRORS: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Allow it in your browser's address bar, or type instead.",
  "service-not-allowed": "Voice input isn't allowed here. You can type your answer instead.",
  "audio-capture": "No microphone was found. Check it's connected, or type instead.",
  network: "Voice recognition needs an internet connection. Try again, or type instead.",
};

export function useSpeech({ onFinal, serverAvailable }: Options) {
  const [engine, setEngine] = useState<SpeechEngine>("none");
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  /** 0..1 microphone level, read by the visualiser on every animation frame. */
  const level = useRef(0);

  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const raf = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const wantListening = useRef(false);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    // Feature detection has to wait for the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEngine(getRecognition() ? "browser" : serverAvailable && typeof MediaRecorder !== "undefined" ? "server" : "none");
  }, [serverAvailable]);

  const stopMeter = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
    level.current = 0;
  }, []);

  const startMeter = useCallback(async () => {
    const media = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    stream.current = media;
    const ctx = new AudioContext();
    audioCtx.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(media).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += ((v - 128) / 128) ** 2;
      const rms = Math.sqrt(sum / data.length);
      level.current = level.current * 0.7 + Math.min(1, rms * 5) * 0.3;
      raf.current = requestAnimationFrame(tick);
    };
    tick();
    setSeconds(0);
    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return media;
  }, []);

  const stop = useCallback(() => {
    wantListening.current = false;
    recognition.current?.stop();
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
    setListening(false);
    setInterim("");
    stopMeter();
  }, [stopMeter]);

  const start = useCallback(async () => {
    setError(null);
    setInterim("");

    if (engine === "browser") {
      const Ctor = getRecognition()!;
      try {
        await startMeter();
      } catch {
        setError(ERRORS["not-allowed"]);
        return;
      }
      const rec = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = navigator.language || "en-US";
      rec.onresult = (e) => {
        let live = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) onFinalRef.current(r[0].transcript.trim());
          else live += r[0].transcript;
        }
        setInterim(live);
      };
      rec.onerror = (e) => {
        if (e.error === "no-speech" || e.error === "aborted") return;
        setError(ERRORS[e.error] || "Voice input stopped unexpectedly. Try again, or type instead.");
        wantListening.current = false;
      };
      rec.onend = () => {
        // Browsers end recognition after a pause; keep going until the user stops.
        if (wantListening.current) {
          try {
            rec.start();
            return;
          } catch {
            /* fall through to stop */
          }
        }
        setListening(false);
        setInterim("");
        stopMeter();
      };
      recognition.current = rec;
      wantListening.current = true;
      rec.start();
      setListening(true);
      return;
    }

    if (engine === "server") {
      let media: MediaStream;
      try {
        media = await startMeter();
      } catch {
        setError(ERRORS["not-allowed"]);
        return;
      }
      chunks.current = [];
      const mr = new MediaRecorder(media);
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
        if (!blob.size) return;
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append("audio", blob, "answer.webm");
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error);
          if (json.text) onFinalRef.current(String(json.text).trim());
        } catch (err) {
          setError(err instanceof Error && err.message ? err.message : "Transcription failed. Please type instead.");
        } finally {
          setTranscribing(false);
        }
      };
      recorder.current = mr;
      mr.start();
      setListening(true);
    }
  }, [engine, startMeter, stopMeter]);

  useEffect(() => () => {
    wantListening.current = false;
    recognition.current?.abort();
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
    stopMeter();
  }, [stopMeter]);

  return { engine, listening, transcribing, interim, error, seconds, level, start, stop, clearError: () => setError(null) };
}
