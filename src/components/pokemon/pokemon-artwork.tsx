"use client";

import Image from "next/image";
import { useState } from "react";
import { homeArtwork, officialArtwork, pixelSprite, shinyArtwork } from "@/lib/pokedex/image";
import { cn } from "@/lib/utils";

interface PokemonArtworkProps {
  id: number;
  alt: string;
  /** Responsive `sizes` hint for the fill image. */
  sizes: string;
  priority?: boolean;
  /** "shiny" swaps to the shiny official artwork (with normal as fallback). */
  variant?: "normal" | "shiny";
  className?: string;
}

/**
 * Fill-based Pokémon artwork that degrades gracefully: official artwork →
 * HOME render → pixel sprite (shiny variant falls back to the normal art).
 * Render inside a positioned, sized container. When toggling `variant`, pass a
 * changing `key` from the parent so the fallback index resets.
 */
export function PokemonArtwork({
  id,
  alt,
  sizes,
  priority,
  variant = "normal",
  className,
}: PokemonArtworkProps) {
  const sources =
    variant === "shiny"
      ? [shinyArtwork(id), officialArtwork(id), pixelSprite(id)]
      : [officialArtwork(id), homeArtwork(id), pixelSprite(id)];
  const [index, setIndex] = useState(0);

  return (
    <Image
      src={sources[Math.min(index, sources.length - 1)]!}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={index >= sources.length - 1}
      onError={() => setIndex((prev) => Math.min(prev + 1, sources.length - 1))}
      className={cn("object-contain", className)}
    />
  );
}
