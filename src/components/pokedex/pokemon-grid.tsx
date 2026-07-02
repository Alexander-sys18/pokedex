"use client";

import { useEffect } from "react";
import type { SearchableEntry } from "@/lib/pokedex/search";
import { getListScroll, saveListScroll } from "@/lib/scroll-store";
import { PokemonCard } from "./pokemon-card";

interface PokemonGridProps {
  entries: SearchableEntry[];
  directMatchIds: Set<number>;
}

/**
 * Responsive card grid for one page of results (pagination keeps this at a
 * fixed, small size, so no virtualization is needed). Card heights are
 * deterministic (aspect-square artwork boxes), so restoring the scroll
 * position on back-navigation is exact even before images finish loading.
 */
export function PokemonGrid({ entries, directMatchIds }: PokemonGridProps) {
  // Restore the previous scroll position when coming back from a detail page,
  // and keep it in sync while the user scrolls (module store: survives
  // client-side navigation, resets on reload — exactly what the brief asks).
  useEffect(() => {
    const saved = getListScroll();
    if (saved > 0) window.scrollTo(0, saved);
    // rAF-throttled: one store write per frame instead of one per scroll event.
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        saveListScroll(window.scrollY);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {entries.map((entry, index) => (
        <PokemonCard
          key={entry.id}
          entry={entry}
          priority={index < 12}
          highlighted={directMatchIds.has(entry.id)}
        />
      ))}
    </div>
  );
}
