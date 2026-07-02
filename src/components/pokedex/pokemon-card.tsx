"use client";

import Link from "next/link";
import { memo } from "react";
import { FavoriteButton } from "@/components/pokemon/favorite-button";
import { PokemonArtwork } from "@/components/pokemon/pokemon-artwork";
import { TypeBadge } from "@/components/pokemon/type-badge";
import { LinkPending } from "@/components/ui/link-pending";
import { primaryTypeColor } from "@/lib/pokedex/colors";
import { generationShortLabel } from "@/lib/pokedex/constants";
import type { PokedexEntry } from "@/lib/pokedex/types";
import { useTilt } from "@/lib/use-tilt";
import { cn, formatDexNumber, prettifyName } from "@/lib/utils";

interface PokemonCardProps {
  entry: PokedexEntry;
  /** Eager-load artwork for the first rows (above the fold). */
  priority?: boolean;
  /** Direct search hit — outline it in its type color to stand out. */
  highlighted?: boolean;
}

const CARD_IMAGE_SIZES = "(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 200px";

/**
 * Memoized: a favorite toggle re-renders only its own heart (per-id store
 * subscription), and pagination/filter updates skip cards whose props are
 * unchanged.
 */
export const PokemonCard = memo(function PokemonCard({
  entry,
  priority,
  highlighted,
}: PokemonCardProps) {
  const color = primaryTypeColor(entry.types);
  const tiltRef = useTilt<HTMLAnchorElement>();

  return (
    <Link
      ref={tiltRef}
      href={`/pokemon/${entry.id}`}
      prefetch={false}
      aria-label={`${prettifyName(entry.name)}, ${formatDexNumber(entry.id)}`}
      className={cn(
        "poke-card group border-border bg-surface relative flex flex-col rounded-2xl border p-3",
        "shadow-[var(--shadow-card)] will-change-transform",
        "hover:border-border-strong hover:bg-surface-hover",
        "hover:shadow-[var(--shadow-card-hover)]",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
      )}
      style={{
        // `--type` powers the aura + dark-mode hover glow.
        ["--type" as string]: color,
        ...(highlighted ? { outline: `2px solid ${color}`, outlineOffset: "2px" } : {}),
      }}
    >
      {/* Dex number + generation on the left; the heart owns the right corner,
          so nothing ever overlaps. */}
      <div className="flex min-h-9 items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="text-muted-foreground font-mono text-xs tabular-nums">
            {formatDexNumber(entry.id)}
          </span>
          <span className="bg-muted text-muted-foreground truncate rounded-full px-2 py-0.5 text-[0.65rem] font-medium">
            {generationShortLabel(entry.generation)}
          </span>
        </span>
        <FavoriteButton id={entry.id} name={prettifyName(entry.name)} className="z-10 shrink-0" />
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[180px]">
        <div className="type-aura absolute inset-0 rounded-full" aria-hidden />
        <PokemonArtwork
          id={entry.id}
          alt=""
          sizes={CARD_IMAGE_SIZES}
          priority={priority}
          className="p-2 drop-shadow-sm transition-transform duration-300 ease-out group-hover:scale-110"
        />
      </div>

      <h3 className="text-foreground mt-1 text-center text-sm font-semibold">
        {prettifyName(entry.name)}
      </h3>

      <div className="mt-2 flex flex-wrap justify-center gap-1">
        {entry.types.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>

      {/* Holographic sheen overlay (opacity driven by useTilt). */}
      <div
        className="poke-card__sheen pointer-events-none absolute inset-0 rounded-2xl"
        aria-hidden
      />

      {/* "Loading" veil while the detail page is being fetched. */}
      <LinkPending />
    </Link>
  );
});
