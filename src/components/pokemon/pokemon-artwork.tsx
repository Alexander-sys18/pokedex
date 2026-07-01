"use client";

import Image from "next/image";
import { useState } from "react";
import { homeArtwork, officialArtwork, pixelSprite } from "@/lib/pokedex/image";
import { cn } from "@/lib/utils";

interface PokemonArtworkProps {
  id: number;
  alt: string;
  /** Responsive `sizes` hint for the fill image. */
  sizes: string;
  priority?: boolean;
  className?: string;
}

/**
 * Fill-based Pokémon artwork that degrades gracefully: official artwork →
 * HOME render → pixel sprite. Render inside a positioned, sized container.
 */
export function PokemonArtwork({ id, alt, sizes, priority, className }: PokemonArtworkProps) {
  const sources = [officialArtwork(id), homeArtwork(id), pixelSprite(id)];
  const [index, setIndex] = useState(0);

  return (
    <Image
      src={sources[index]!}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={index === sources.length - 1}
      onError={() => setIndex((prev) => Math.min(prev + 1, sources.length - 1))}
      className={cn("object-contain", className)}
    />
  );
}
