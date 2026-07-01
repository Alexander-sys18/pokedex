"use client";

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SearchableEntry } from "@/lib/pokedex/search";
import { getListScroll, saveListScroll } from "@/lib/scroll-store";
import { PokemonCard } from "./pokemon-card";

interface PokemonGridProps {
  entries: SearchableEntry[];
  directMatchIds: Set<number>;
}

/** Row height in px (card height + vertical gap) — kept fixed for smooth virtualization. */
const ROW_STRIDE = 248;

function columnsForWidth(width: number): number {
  if (width < 480) return 2;
  if (width < 768) return 3;
  if (width < 1024) return 4;
  if (width < 1280) return 5;
  return 6;
}

/**
 * Window-virtualized responsive grid. Only the visible rows are mounted, so the
 * full 1025-Pokémon list scrolls at 60fps. The container reserves the full
 * height up front, which keeps native + manual scroll restoration accurate.
 */
export function PokemonGrid({ entries, directMatchIds }: PokemonGridProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ columns: number; offset: number } | null>(null);

  // Measure available width (→ columns) and the grid's document offset.
  useLayoutEffect(() => {
    const node = listRef.current;
    if (!node) return;

    const measure = () =>
      setLayout({
        columns: columnsForWidth(node.clientWidth),
        offset: node.offsetTop,
      });

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Persist the scroll position as the user scrolls (module-level store survives
  // client-side navigation, resets on reload).
  useEffect(() => {
    const onScroll = () => saveListScroll(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Restore the position when coming back from a detail page — but only once the
  // grid has measured and reserved its full height. Restoring earlier would clamp
  // scrollTo() against the short placeholder and lose deep positions.
  const didRestore = useRef(false);
  useLayoutEffect(() => {
    if (!layout || didRestore.current) return;
    didRestore.current = true;
    const saved = getListScroll();
    if (saved > 0) window.scrollTo(0, saved);
  }, [layout]);

  const columns = layout?.columns ?? 4;
  const rowCount = Math.ceil(entries.length / columns);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => ROW_STRIDE,
    overscan: 4,
    scrollMargin: layout?.offset ?? 0,
  });

  // Before measuring, render an invisible spacer so layout doesn't jump.
  if (!layout) {
    return <div ref={listRef} className="min-h-[60vh]" aria-hidden />;
  }

  return (
    <div ref={listRef} style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const start = virtualRow.index * columns;
        const rowEntries = entries.slice(start, start + columns);
        return (
          <div
            key={virtualRow.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
            }}
          >
            <div
              className="grid gap-4 pb-4"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {rowEntries.map((entry) => (
                <PokemonCard
                  key={entry.id}
                  entry={entry}
                  priority={virtualRow.index === 0}
                  highlighted={directMatchIds.has(entry.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
