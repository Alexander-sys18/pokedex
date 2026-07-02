"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "pokedex:oak-voice";

/** Markdown reads terribly aloud — strip formatting and skip tables/code. */
export function toSpeakableText(markdown: string): string {
  return (
    markdown
      .replace(/```[\s\S]*?```/g, " ")
      // An unclosed fence (truncated reply) would swallow everything after it
      // with the rule above — drop the orphan marker but keep the words.
      .replace(/```/g, " ")
      .replace(/^\|.*\|\s*$/gm, " ") // table rows
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → label
      .replace(/[*_#>`~]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Pick the most natural Spanish voice available. Quality varies wildly per
 * browser/OS: Edge exposes neural "(Natural)" voices, Chrome has decent
 * "Google español" voices, and plain SAPI voices sound robotic — so rank by
 * quality tier first, then prefer Latin American Spanish and classic male
 * names that fit the Professor.
 */
function pickSpanishVoice(): SpeechSynthesisVoice | null {
  const spanish = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("es"));
  if (spanish.length === 0) return null;

  const score = (v: SpeechSynthesisVoice): number => {
    let points = 0;
    const name = v.name.toLowerCase();
    // Quality tiers (neural voices are night-and-day better).
    if (name.includes("natural")) points += 100;
    if (name.includes("neural")) points += 90;
    if (name.includes("premium") || name.includes("enhanced")) points += 70;
    if (name.includes("google")) points += 60;
    if (name.includes("online")) points += 30;
    // Latin American Spanish sounds closer to home for most of our users.
    const lang = v.lang.toLowerCase();
    if (lang.includes("419") || lang.includes("mx") || lang.includes("us")) points += 10;
    // A seasoned male voice suits the Professor (light tiebreaker only).
    if (/(pablo|jorge|diego|enrique|alvaro|álvaro|raul|raúl|tomas|tomás)/.test(name)) points += 5;
    return points;
  };

  return [...spanish].sort((a, b) => score(b) - score(a))[0] ?? null;
}

/**
 * Professor Oak's voice via the browser's built-in Web Speech API — no keys,
 * no network. Exposes an on/off toggle (persisted), a `speak(text)` command
 * and a reactive `speaking` flag so the avatar can animate while he talks.
 */
export function useSpeech() {
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [enabled, setEnabledState] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [speaking, setSpeaking] = useState(false);
  // Chrome garbage-collects un-referenced utterances mid-speech, silencing
  // their end events — keep the active one alive here.
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Warm the async voice list on mount (getVoices() is empty until the
  // browser loads it) so the first speak() can already pick a Spanish voice,
  // and never keep talking over an unmounted panel.
  useEffect(() => {
    if (!supported) return;
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported) return;
      const clean = toSpeakableText(text);
      if (!clean) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(clean);
      const voice = pickSpanishVoice();
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang ?? "es-ES";
      // Natural settings: pitch-shifting synthetic voices distorts them badly,
      // so leave pitch alone and keep an unhurried professor cadence.
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [supported],
  );

  const setEnabled = useCallback(
    (value: boolean) => {
      setEnabledState(value);
      try {
        localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
      } catch {
        // Storage unavailable — the preference just won't persist.
      }
      if (!value) stop();
    },
    [stop],
  );

  return { supported, enabled, setEnabled, speaking, speak, stop };
}
