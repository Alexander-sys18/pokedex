"use client";

import { Heart, SearchX } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useFavoriteIds } from "@/lib/favorites";
import { applyFilters, hasActiveFilters, toSearchable } from "@/lib/pokedex/search";
import type { PokedexEntry } from "@/lib/pokedex/types";
import { saveListScroll } from "@/lib/scroll-store";
import { useFilterState } from "@/lib/url-state";
import { FiltersBar } from "./filters-bar";
import { Pagination } from "./pagination";
import { PokemonGrid } from "./pokemon-grid";

interface PokedexExplorerProps {
  entries: PokedexEntry[];
}

/** Cards per page — small enough to render instantly, big enough to browse. */
const PAGE_SIZE = 60;

export function PokedexExplorer({ entries }: PokedexExplorerProps) {
  const state = useFilterState();
  const { filters, favoritesOnly } = state;
  const favoriteIds = useFavoriteIds();

  // Normalize names once; re-used across every keystroke.
  const searchable = useMemo(() => toSearchable(entries), [entries]);

  const { results: filtered, directMatchIds } = useMemo(
    () => applyFilters(searchable, filters),
    [searchable, filters],
  );

  // The favorites-only view is a client-side membership filter layered on top of
  // the pure filter result (favorites live in localStorage, not in the index).
  const results = useMemo(() => {
    if (!favoritesOnly) return filtered;
    const favSet = new Set(favoriteIds);
    return filtered.filter((entry) => favSet.has(entry.id));
  }, [filtered, favoritesOnly, favoriteIds]);

  // Pagination is a slice over the in-memory filtered list — instant, no
  // requests. The page number lives in the URL (restored on back-navigation)
  // and is clamped so a stale ?p= beyond the result set shows the last page.
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(state.page, pageCount);
  const pageItems = useMemo(
    () => results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [results, page],
  );

  // When the filters change, make sure the START of the results is visible —
  // but never yank the viewport to the absolute top of the page: if the user
  // is right there tweaking the filters, the screen must not move at all.
  // (Skipped on the first render / back-navigation, where scroll is restored.)
  const rootRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const root = rootRef.current;
    if (root && root.getBoundingClientRect().top < 0) {
      root.scrollIntoView({ block: "start" });
    }
    saveListScroll(window.scrollY);
  }, [filters.query, filters.type, filters.type2, filters.generation, filters.sort, favoritesOnly]);

  const goToPage = (next: number) => {
    state.setPage(next);
    // Pagination lives at the bottom — glide back to the start of the list
    // (not past the hero) so the new page reads from its first card.
    const root = rootRef.current;
    if (root && root.getBoundingClientRect().top < 0) {
      root.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  };

  const filtersActive = hasActiveFilters(filters) || favoritesOnly;
  const evolutionsIncluded =
    hasActiveFilters(filters) && !favoritesOnly && results.length > directMatchIds.size;
  const rangeStart = results.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, results.length);

  return (
    // scroll-mt clears the sticky header when we scrollIntoView this anchor.
    <div ref={rootRef} className="flex scroll-mt-20 flex-col gap-5">
      <FiltersBar state={state} favoritesCount={favoriteIds.length} />

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-semibold">{results.length}</span> Pokémon
          {filtersActive ? <span> de {entries.length}</span> : <span> en la Pokédex</span>}
          {results.length > 0 ? (
            <span>
              {" "}
              · mostrando {rangeStart}–{rangeEnd}
            </span>
          ) : null}
        </p>
        <div className="flex items-baseline gap-4">
          {evolutionsIncluded ? (
            <p className="text-muted-foreground text-xs">
              Incluye la cadena evolutiva de tu búsqueda
            </p>
          ) : null}
          {pageCount > 1 ? (
            <p className="text-muted-foreground text-xs">
              Página {page} de {pageCount}
            </p>
          ) : null}
        </div>
      </div>

      {results.length > 0 ? (
        <>
          <PokemonGrid entries={pageItems} directMatchIds={directMatchIds} />
          <Pagination page={page} pageCount={pageCount} onPageChange={goToPage} />
        </>
      ) : favoritesOnly && favoriteIds.length === 0 ? (
        <div className="border-border flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-4 py-12 text-center">
          <div className="bg-muted grid size-14 place-items-center rounded-full text-rose-500">
            <Heart className="size-7" />
          </div>
          <div className="space-y-1">
            <p className="text-foreground font-semibold">Aún no tienes favoritos</p>
            <p className="text-muted-foreground text-sm">
              Pulsa el corazón en cualquier Pokémon para guardarlo aquí.
            </p>
          </div>
          <button
            type="button"
            onClick={() => state.setFavoritesOnly(false)}
            className="bg-foreground text-background rounded-xl px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Ver toda la Pokédex
          </button>
        </div>
      ) : (
        <div className="border-border flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-4 py-12 text-center">
          <div className="bg-muted text-muted-foreground grid size-14 place-items-center rounded-full">
            <SearchX className="size-7" />
          </div>
          <div className="space-y-1">
            <p className="text-foreground font-semibold">Ningún Pokémon coincide</p>
            <p className="text-muted-foreground text-sm">
              Prueba con otro nombre, tipo o generación.
            </p>
          </div>
          <button
            type="button"
            onClick={state.reset}
            className="bg-foreground text-background rounded-xl px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
