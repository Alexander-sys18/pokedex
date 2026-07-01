"use client";

import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { useCallback, useMemo } from "react";
import { POKEMON_TYPES } from "./pokedex/constants";
import { DEFAULT_SORT, type PokedexFilters, type SortKey } from "./pokedex/search";
import type { GenerationNumber, PokemonTypeName } from "./pokedex/types";

const SORT_KEYS: readonly SortKey[] = ["dex-asc", "dex-desc", "name-asc", "name-desc"];

/**
 * URL search-param schema for the list view. Absent params fall back to the
 * "no filter" state, so a clean `/` shows everything in dex order.
 */
const filterParsers = {
  q: parseAsString.withDefault(""),
  type: parseAsStringLiteral(POKEMON_TYPES),
  gen: parseAsInteger,
  sort: parseAsStringLiteral(SORT_KEYS).withDefault(DEFAULT_SORT),
};

function isGeneration(value: number | null): value is GenerationNumber {
  return value !== null && value >= 1 && value <= 9;
}

export interface FilterState {
  filters: PokedexFilters;
  setQuery: (query: string) => void;
  setType: (type: PokemonTypeName | null) => void;
  setGeneration: (generation: GenerationNumber | null) => void;
  setSort: (sort: SortKey) => void;
  reset: () => void;
}

/**
 * Read/write the list filters through the URL. Uses `history: "replace"` so the
 * back button returns from a detail page straight to the list (rather than
 * stepping through each keystroke), which is what preserves the browsing state.
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
      generation: isGeneration(raw.gen) ? raw.gen : null,
      sort: raw.sort,
    }),
    [raw.q, raw.type, raw.gen, raw.sort],
  );

  const setQuery = useCallback((query: string) => void setRaw({ q: query }), [setRaw]);
  const setType = useCallback((type: PokemonTypeName | null) => void setRaw({ type }), [setRaw]);
  const setGeneration = useCallback(
    (generation: GenerationNumber | null) => void setRaw({ gen: generation }),
    [setRaw],
  );
  const setSort = useCallback((sort: SortKey) => void setRaw({ sort }), [setRaw]);
  const reset = useCallback(
    () => void setRaw({ q: "", type: null, gen: null, sort: DEFAULT_SORT }),
    [setRaw],
  );

  return { filters, setQuery, setType, setGeneration, setSort, reset };
}
