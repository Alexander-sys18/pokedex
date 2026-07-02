"use client";

import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { useCallback, useMemo } from "react";
import { POKEMON_TYPES } from "./pokedex/constants";
import { DEFAULT_SORT, type PokedexFilters, type SortKey } from "./pokedex/search";
import type { GenerationNumber, PokemonTypeName } from "./pokedex/types";

const SORT_KEYS: readonly SortKey[] = ["dex-asc", "dex-desc", "name-asc", "name-desc"];

/**
 * URL search-param schema for the list view. Absent params fall back to the
 * "no filter, page 1" state, so a clean `/` shows everything in dex order.
 */
const filterParsers = {
  q: parseAsString.withDefault(""),
  type: parseAsStringLiteral(POKEMON_TYPES),
  type2: parseAsStringLiteral(POKEMON_TYPES),
  gen: parseAsInteger,
  sort: parseAsStringLiteral(SORT_KEYS).withDefault(DEFAULT_SORT),
  fav: parseAsBoolean.withDefault(false),
  p: parseAsInteger.withDefault(1),
};

function isGeneration(value: number | null): value is GenerationNumber {
  return value !== null && value >= 1 && value <= 9;
}

export interface FilterState {
  filters: PokedexFilters;
  /** Whether to show only favorites (client-side membership). */
  favoritesOnly: boolean;
  /** Current 1-based page (lives in the URL, so it survives back-navigation). */
  page: number;
  setQuery: (query: string) => void;
  setType: (type: PokemonTypeName | null) => void;
  setType2: (type: PokemonTypeName | null) => void;
  setGeneration: (generation: GenerationNumber | null) => void;
  setSort: (sort: SortKey) => void;
  setFavoritesOnly: (only: boolean) => void;
  setPage: (page: number) => void;
  reset: () => void;
}

/**
 * Read/write the list filters + page through the URL. Uses `history: "replace"`
 * so the back button returns from a detail page straight to the list (rather
 * than stepping through each keystroke), which is what preserves the browsing
 * state. Changing any filter resets the page to 1.
 */
export function useFilterState(): FilterState {
  const [raw, setRaw] = useQueryStates(filterParsers, {
    history: "replace",
    clearOnDefault: true,
    throttleMs: 120,
  });

  const filters = useMemo<PokedexFilters>(
    () => ({
      query: raw.q,
      type: raw.type,
      type2: raw.type2,
      generation: isGeneration(raw.gen) ? raw.gen : null,
      sort: raw.sort,
    }),
    [raw.q, raw.type, raw.type2, raw.gen, raw.sort],
  );

  const page = Math.max(1, raw.p);

  // Every filter change resets pagination — a page number only makes sense
  // relative to the result set it was computed against.
  const setQuery = useCallback((query: string) => void setRaw({ q: query, p: null }), [setRaw]);
  const setType = useCallback(
    (type: PokemonTypeName | null) => void setRaw({ type, p: null }),
    [setRaw],
  );
  const setType2 = useCallback(
    (type: PokemonTypeName | null) => void setRaw({ type2: type, p: null }),
    [setRaw],
  );
  const setGeneration = useCallback(
    (generation: GenerationNumber | null) => void setRaw({ gen: generation, p: null }),
    [setRaw],
  );
  const setSort = useCallback((sort: SortKey) => void setRaw({ sort, p: null }), [setRaw]);
  const setFavoritesOnly = useCallback(
    (only: boolean) => void setRaw({ fav: only, p: null }),
    [setRaw],
  );
  const setPage = useCallback(
    (next: number) => void setRaw({ p: next <= 1 ? null : next }),
    [setRaw],
  );
  const reset = useCallback(
    () =>
      void setRaw({ q: "", type: null, type2: null, gen: null, sort: DEFAULT_SORT, fav: false, p: null }),
    [setRaw],
  );

  return {
    filters,
    favoritesOnly: raw.fav,
    page,
    setQuery,
    setType,
    setType2,
    setGeneration,
    setSort,
    setFavoritesOnly,
    setPage,
    reset,
  };
}
