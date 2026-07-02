import { describe, expect, it } from "vitest";
import { editDistance, fuzzyFindEntry } from "./fuzzy";
import type { PokedexEntry } from "./types";

const entry = (id: number, name: string): PokedexEntry => ({
  id,
  name,
  generation: 1,
  types: ["normal"],
  familyId: id,
});

const ENTRIES: PokedexEntry[] = [
  entry(768, "golisopod"),
  entry(94, "gengar"),
  entry(445, "garchomp"),
  entry(6, "charizard"),
  entry(150, "mewtwo"),
  entry(151, "mew"),
];

describe("editDistance", () => {
  it("mide inserciones, borrados y sustituciones", () => {
    expect(editDistance("gengar", "gengar", 2)).toBe(0);
    expect(editDistance("gholisopod", "golisopod", 2)).toBe(1);
    expect(editDistance("carizard", "charizard", 2)).toBe(1);
    expect(editDistance("gengur", "gengar", 2)).toBe(1);
  });

  it("corta en cuanto supera el máximo", () => {
    expect(editDistance("mewtwo", "charizard", 2)).toBeGreaterThan(2);
  });
});

describe("fuzzyFindEntry", () => {
  it("rescata erratas típicas del modelo (Gholisopod → Golisopod)", () => {
    expect(fuzzyFindEntry("Gholisopod", ENTRIES)?.id).toBe(768);
    expect(fuzzyFindEntry("Carizard", ENTRIES)?.id).toBe(6);
  });

  it("no convierte un Pokémon en otro distinto", () => {
    // "mew" vs "mewtwo" están a distancia 3 — jamás debe puentearse.
    expect(fuzzyFindEntry("mewtwoo", ENTRIES)?.id).toBe(150);
    expect(fuzzyFindEntry("pikachu", ENTRIES)).toBeNull();
  });

  it("rechaza consultas demasiado cortas para ser fiables", () => {
    expect(fuzzyFindEntry("mew", ENTRIES)).toBeNull();
  });
});
