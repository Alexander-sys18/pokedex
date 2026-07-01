"use client";

import { ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PokemonArtwork } from "@/components/pokemon/pokemon-artwork";
import { TypeBadge } from "@/components/pokemon/type-badge";
import { primaryTypeColor } from "@/lib/pokedex/colors";
import { generationLabel } from "@/lib/pokedex/constants";
import type { PokedexEntry } from "@/lib/pokedex/types";
import { formatDexNumber, prettifyName } from "@/lib/utils";

/** Deterministic hash of the local date → same featured Pokémon all day. */
function pickIndexForToday(length: number): number {
  const now = new Date();
  const key = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

/**
 * "Pokémon del día" banner. Computed client-side (the home page is statically
 * prerendered, so the server has no notion of "today"). Renders a placeholder
 * of the same height until mounted to avoid layout shift.
 */
export function FeaturedPokemon({ entries }: { entries: PokedexEntry[] }) {
  const [entry, setEntry] = useState<PokedexEntry | null>(null);

  useEffect(() => {
    if (entries.length === 0) return;
    const frame = requestAnimationFrame(() => {
      setEntry(entries[pickIndexForToday(entries.length)] ?? null);
    });
    return () => cancelAnimationFrame(frame);
  }, [entries]);

  if (!entry) {
    return (
      // 106px = 72px artwork + 2×16px padding + 2×1px border (border-box).
      <div
        className="border-border bg-surface h-[106px] animate-pulse rounded-2xl border"
        aria-hidden
      />
    );
  }

  const color = primaryTypeColor(entry.types);

  return (
    <Link
      href={`/pokemon/${entry.id}`}
      className="group border-border bg-surface hover:border-border-strong hover:bg-surface-hover focus-visible:ring-ring relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      style={{ ["--type" as string]: color }}
    >
      <div className="relative size-[72px] shrink-0">
        <div className="type-aura absolute inset-0 rounded-full" aria-hidden />
        <PokemonArtwork
          id={entry.id}
          alt=""
          sizes="72px"
          className="transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <Star className="size-3.5 text-amber-500" />
          Pokémon del día · {formatDexNumber(entry.id)} · {generationLabel(entry.generation)}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-foreground truncate text-lg font-bold">{prettifyName(entry.name)}</h2>
          <div className="flex gap-1">
            {entry.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </div>
      </div>

      <ArrowRight className="text-muted-foreground group-hover:text-foreground size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
