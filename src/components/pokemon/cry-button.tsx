"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CryButtonProps {
  /** Primary cry URL (ogg); `fallback` is tried if the first fails. */
  src: string | null;
  fallback?: string | null;
  className?: string;
}

/** Plays the Pokémon's cry. Hides itself if no audio is available/playable. */
export function CryButton({ src, fallback, className }: CryButtonProps) {
  const [playing, setPlaying] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const busyRef = useRef(false);

  // Stop the audio on unmount — a detached Audio element would otherwise keep
  // playing over the next page after a client-side navigation.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  if (!src || unsupported) return null;

  const play = async (url: string, retry: boolean): Promise<void> => {
    try {
      audioRef.current?.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.volume = 0.5;
      audio.onended = () => setPlaying(false);
      // Mid-stream failures fire "error", never "ended" — don't pulse forever.
      audio.onerror = () => setPlaying(false);
      setPlaying(true);
      await audio.play();
    } catch (error) {
      // pause() on a still-pending play() (rapid re-click, unmount) rejects
      // with AbortError — that's not a codec problem, so never treat it as
      // "unsupported".
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (retry && fallback && fallback !== url) {
        await play(fallback, false);
      } else {
        // Browser can't play ogg (e.g. some Safari versions) — hide the button.
        setPlaying(false);
        setUnsupported(true);
      }
    }
  };

  const handleClick = () => {
    // Ignore clicks while a play() is still settling: pausing a pending play()
    // would reject it and cascade through the fallback chain.
    if (busyRef.current) return;
    busyRef.current = true;
    void play(src, true).finally(() => {
      busyRef.current = false;
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Reproducir grito"
      title="Escuchar su grito"
      className={cn(
        "border-border bg-surface/90 text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur",
        "hover:bg-surface-hover focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none",
        playing && "border-border-strong",
        className,
      )}
    >
      <Volume2 className={cn("size-3.5", playing && "animate-pulse")} />
      Grito
    </button>
  );
}
