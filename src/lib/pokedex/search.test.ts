import { describe, expect, it } from "vitest";
import { applyFilters, hasActiveFilters, toSearchable, type PokedexFilters } from "./search";
import type { PokedexEntry } from "./types";

// A compact fixture with three evolution families plus a standalone Pokémon.
const ENTRIES: PokedexEntry[] = [
  // Charmander line (family 2) — gen 1.
  { id: 4, name: "charmander", generation: 1, types: ["fire"], familyId: 2 },
  { id: 5, name: "charmeleon", generation: 1, types: ["fire"], familyId: 2 },
  { id: 6, name: "charizard", generation: 1, types: ["fire", "flying"], familyId: 2 },
  // Pikachu line (family 10) — note Pichu is gen 2.
  { id: 25, name: "pikachu", generation: 1, types: ["electric"], familyId: 10 },
  { id: 26, name: "raichu", generation: 1, types: ["electric"], familyId: 10 },
  { id: 172, name: "pichu", generation: 2, types: ["electric"], familyId: 10 },
  // Eevee + one evolution (family 67).
  { id: 133, name: "eevee", generation: 1, types: ["normal"], familyId: 67 },
  { id: 134, name: "vaporeon", generation: 1, types: ["water"], familyId: 67 },
  // Standalone.
  { id: 128, name: "tauros", generation: 1, types: ["normal"], familyId: 99 },
];

const searchable = toSearchable(ENTRIES);

function filters(overrides: Partial<PokedexFilters>): PokedexFilters {
  return { query: "", type: null, generation: null, sort: "dex-asc", ...overrides };
}

const names = (entries: { name: string }[]) => entries.map((e) => e.name);

describe("applyFilters", () => {
  it("returns every Pokémon in dex order when no filters are active", () => {
    const { results } = applyFilters(searchable, filters({}));
    expect(results).toHaveLength(ENTRIES.length);
    expect(results.map((e) => e.id)).toEqual([4, 5, 6, 25, 26, 128, 133, 134, 172]);
  });

  describe("evolution-aware search", () => {
    it("surfaces the whole family when the query matches one member", () => {
      const { results, directMatchIds } = applyFilters(searchable, filters({ query: "pikachu" }));
      // Pikachu's family: Pichu + Pikachu + Raichu.
      expect(names(results).sort()).toEqual(["pichu", "pikachu", "raichu"]);
      // Only Pikachu matched the text directly.
      expect([...directMatchIds]).toEqual([25]);
    });

    it("matches partial, case-insensitive input", () => {
      const { results } = applyFilters(searchable, filters({ query: "  PIKA " }));
      expect(names(results).sort()).toEqual(["pichu", "pikachu", "raichu"]);
    });

    it("expands branching families from any member", () => {
      const { results } = applyFilters(searchable, filters({ query: "vaporeon" }));
      expect(names(results).sort()).toEqual(["eevee", "vaporeon"]);
    });

    it("returns nothing for an unknown name", () => {
      const { results } = applyFilters(searchable, filters({ query: "mewtwo" }));
      expect(results).toHaveLength(0);
    });
  });

  describe("type & generation filters", () => {
    it("filters by type", () => {
      const { results } = applyFilters(searchable, filters({ type: "fire" }));
      expect(names(results)).toEqual(["charmander", "charmeleon", "charizard"]);
    });

    it("filters by generation", () => {
      const { results } = applyFilters(searchable, filters({ generation: 2 }));
      expect(names(results)).toEqual(["pichu"]);
    });

    it("combines search and type with AND semantics", () => {
      // The whole Charmander family is pulled in by the search, but only
      // Charizard is Flying — the others are filtered out.
      const { results } = applyFilters(searchable, filters({ query: "charizard", type: "flying" }));
      expect(names(results)).toEqual(["charizard"]);
    });

    it("applies the generation filter to the evolution-expanded set", () => {
      const { results } = applyFilters(searchable, filters({ query: "pikachu", generation: 2 }));
      expect(names(results)).toEqual(["pichu"]);
    });

    it("drops direct matches removed by a filter from directMatchIds", () => {
      // Charmander is the direct hit, but the Flying filter leaves only its
      // evolution Charizard — so nothing shown is a direct match.
      const { results, directMatchIds } = applyFilters(
        searchable,
        filters({ query: "charmander", type: "flying" }),
      );
      expect(names(results)).toEqual(["charizard"]);
      expect(directMatchIds.size).toBe(0);
    });
  });

  describe("sorting", () => {
    it("sorts by name ascending", () => {
      const { results } = applyFilters(searchable, filters({ sort: "name-asc" }));
      expect(names(results).slice(0, 3)).toEqual(["charizard", "charmander", "charmeleon"]);
    });

    it("sorts by dex descending", () => {
      const { results } = applyFilters(searchable, filters({ sort: "dex-desc" }));
      expect(results[0]?.id).toBe(172);
    });
  });
});

describe("hasActiveFilters", () => {
  it("is false for the default view", () => {
    expect(hasActiveFilters(filters({}))).toBe(false);
  });

  it("ignores whitespace-only queries", () => {
    expect(hasActiveFilters(filters({ query: "   " }))).toBe(false);
  });

  it("is true when any filter narrows the view", () => {
    expect(hasActiveFilters(filters({ query: "pik" }))).toBe(true);
    expect(hasActiveFilters(filters({ type: "fire" }))).toBe(true);
    expect(hasActiveFilters(filters({ generation: 3 }))).toBe(true);
  });
});
