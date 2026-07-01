"use client";

import { SearchX } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { applyFilters, hasActiveFilters, toSearchable } from "@/lib/pokedex/search";
import type { PokedexEntry } from "@/lib/pokedex/types";
import { saveListScroll } from "@/lib/scroll-store";
import { useFilterState } from "@/lib/url-state";
import { FeaturedPokemon } from "./featured-pokemon";
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
  const { filters } = state;

  // Normalize names once; re-used across every keystroke.
  const searchable = useMemo(() => toSearchable(entries), [entries]);

  const { results, directMatchIds } = useMemo(
    () => applyFilters(searchable, filters),
    [searchable, filters],
  );

  // Pagination is a slice over the in-memory filtered list — instant, no
  // requests. The page number lives in the URL (restored on back-navigation)
  // and is clamped so a stale ?p= beyond the result set shows the last page.
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(state.page, pageCount);
  const pageItems = useMemo(
    () => results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [results, page],
  );

  // Jump back to the top whenever the filters change (but not on the first
  // render / when returning from a detail page — that state is restored).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    saveListScroll(0);
    window.scrollTo({ top: 0 });
  }, [filters.query, filters.type, filters.generation, filters.sort]);

  const goToPage = (next: number) => {
    state.setPage(next);
    saveListScroll(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filtersActive = hasActiveFilters(filters);
  const evolutionsIncluded = filtersActive && results.length > directMatchIds.size;
  const rangeStart = results.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, results.length);

  return (
    <div className="flex flex-col gap-5">
      <FiltersBar state={state} />

      {/* Daily highlight — hidden while the user is actively filtering. */}
      {!filtersActive ? <FeaturedPokemon entries={entries} /> : null}

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
      ) : (
        <div className="border-border flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-20 text-center">
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
