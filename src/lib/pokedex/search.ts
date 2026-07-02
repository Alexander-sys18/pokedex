import { normalizeSearch } from "@/lib/utils";
import type { GenerationNumber, PokedexEntry, PokemonTypeName } from "./types";

export type SortKey = "dex-asc" | "dex-desc" | "name-asc" | "name-desc";

export const DEFAULT_SORT: SortKey = "dex-asc";

export interface PokedexFilters {
  /** Raw search text as typed by the user. */
  query: string;
  type: PokemonTypeName | null;
  /** A second required type — enables dual-type filtering (e.g. Fire + Flying). */
  type2: PokemonTypeName | null;
  generation: GenerationNumber | null;
  sort: SortKey;
}

export const EMPTY_FILTERS: PokedexFilters = {
  query: "",
  type: null,
  type2: null,
  generation: null,
  sort: DEFAULT_SORT,
};

/** A Pokédex entry with its name pre-normalized for fast, repeated searching. */
export interface SearchableEntry extends PokedexEntry {
  normalizedName: string;
}

export interface FilterResult {
  results: SearchableEntry[];
  /**
   * Ids whose name matched the query directly (as opposed to being pulled in
   * because they share an evolution family). Lets the UI highlight the exact
   * Pokémon the user searched for.
   */
  directMatchIds: Set<number>;
}

/** Pre-normalize names once so per-keystroke filtering stays cheap. */
export function toSearchable(entries: readonly PokedexEntry[]): SearchableEntry[] {
  return entries.map((entry) => ({
    ...entry,
    normalizedName: normalizeSearch(entry.name),
  }));
}

const SORTERS: Record<SortKey, (a: SearchableEntry, b: SearchableEntry) => number> = {
  "dex-asc": (a, b) => a.id - b.id,
  "dex-desc": (a, b) => b.id - a.id,
  "name-asc": (a, b) => a.name.localeCompare(b.name),
  "name-desc": (a, b) => b.name.localeCompare(a.name),
};

/**
 * Apply the search query, type/generation filters and sort to the index.
 *
 * The search is **evolution-aware**: when the query matches a Pokémon, every
 * member of its evolution family is included too (searching "pikachu" also
 * surfaces "pichu" and "raichu"). Type/generation filters are then applied to
 * the expanded set, so all active constraints combine with AND semantics.
 */
export function applyFilters(
  entries: readonly SearchableEntry[],
  filters: PokedexFilters,
): FilterResult {
  const normalizedQuery = normalizeSearch(filters.query);
  const directMatchIds = new Set<number>();

  let results: SearchableEntry[];

  if (normalizedQuery.length === 0) {
    results = entries.slice();
  } else {
    // 1. Direct name matches and the families they belong to.
    const matchedFamilies = new Set<number>();
    for (const entry of entries) {
      if (entry.normalizedName.includes(normalizedQuery)) {
        directMatchIds.add(entry.id);
        matchedFamilies.add(entry.familyId);
      }
    }
    // 2. Expand to every member of the matched evolution families.
    results = entries.filter((entry) => matchedFamilies.has(entry.familyId));
  }

  // 3. Type, second-type and generation filters (AND with the search result).
  if (filters.type !== null) {
    const type = filters.type;
    results = results.filter((entry) => entry.types.includes(type));
  }
  if (filters.type2 !== null) {
    const type2 = filters.type2;
    results = results.filter((entry) => entry.types.includes(type2));
  }
  if (filters.generation !== null) {
    const generation = filters.generation;
    results = results.filter((entry) => entry.generation === generation);
  }

  // 4. Sort (stable — Array.prototype.sort is stable in modern engines).
  results.sort(SORTERS[filters.sort]);

  // Keep the direct-match set consistent with what's actually shown: a direct
  // match can be removed by the type/generation filters, and leaving it in would
  // skew consumers (e.g. the "includes evolutions" hint) and highlight nothing.
  const visibleIds = new Set(results.map((entry) => entry.id));
  const visibleDirectMatches = new Set<number>();
  for (const id of directMatchIds) {
    if (visibleIds.has(id)) visibleDirectMatches.add(id);
  }

  return { results, directMatchIds: visibleDirectMatches };
}

/** True when any filter narrows the default (all Pokémon, dex order) view. */
export function hasActiveFilters(filters: PokedexFilters): boolean {
  return (
    normalizeSearch(filters.query).length > 0 ||
    filters.type !== null ||
    filters.type2 !== null ||
    filters.generation !== null
  );
}
