import { describe, expect, it } from "vitest";
import { POKEMON_TYPES } from "./constants";
import { defensiveEffectiveness, defensiveGroups } from "./type-chart";
import type { PokemonTypeName } from "./types";

const mult = (defenders: PokemonTypeName[], attacker: PokemonTypeName): number =>
  defensiveEffectiveness(defenders).get(attacker)!;

describe("defensiveEffectiveness", () => {
  it("computes Charizard (fire/flying) matchups", () => {
    const eff = defensiveEffectiveness(["fire", "flying"]);
    expect(eff.get("rock")).toBe(4); // 2 × 2
    expect(eff.get("water")).toBe(2);
    expect(eff.get("electric")).toBe(2);
    expect(eff.get("ground")).toBe(0); // flying immunity
    expect(eff.get("grass")).toBe(0.25); // 0.5 × 0.5
    expect(eff.get("bug")).toBe(0.25);
    expect(eff.get("fighting")).toBe(0.5);
    expect(eff.get("normal")).toBe(1);
  });

  it("computes Pikachu (electric) matchups", () => {
    const eff = defensiveEffectiveness(["electric"]);
    expect(eff.get("ground")).toBe(2);
    expect(eff.get("flying")).toBe(0.5);
    expect(eff.get("steel")).toBe(0.5);
    expect(eff.get("electric")).toBe(0.5);
    expect(eff.get("water")).toBe(1);
  });

  it("computes Eevee (normal) matchups", () => {
    const eff = defensiveEffectiveness(["normal"]);
    expect(eff.get("fighting")).toBe(2);
    expect(eff.get("ghost")).toBe(0);
    expect(eff.get("fire")).toBe(1);
  });
});

describe("defensiveGroups", () => {
  it("groups Charizard's matchups into the right buckets", () => {
    const groups = defensiveGroups(["fire", "flying"]);
    expect(groups.x4).toEqual(["rock"]);
    expect(groups.x2.sort()).toEqual(["electric", "water"]);
    expect(groups.zero).toEqual(["ground"]);
    expect(groups.quarter.sort()).toEqual(["bug", "grass"]);
    expect(groups.half.sort()).toEqual(["fairy", "fighting", "fire", "steel"]);
  });

  it("leaves neutral matchups out of every bucket", () => {
    const groups = defensiveGroups(["normal"]);
    const bucketed = [
      ...groups.x4,
      ...groups.x2,
      ...groups.half,
      ...groups.quarter,
      ...groups.zero,
    ];
    expect(bucketed.sort()).toEqual(["fighting", "ghost"]);
  });
});

describe("official immunities (the six ×0 rules)", () => {
  it("matches the canonical Gen VI+ immunity list", () => {
    expect(mult(["ghost"], "normal")).toBe(0);
    expect(mult(["ghost"], "fighting")).toBe(0);
    expect(mult(["normal"], "ghost")).toBe(0);
    expect(mult(["flying"], "ground")).toBe(0);
    expect(mult(["ground"], "electric")).toBe(0);
    expect(mult(["dark"], "psychic")).toBe(0);
    expect(mult(["steel"], "poison")).toBe(0);
    expect(mult(["fairy"], "dragon")).toBe(0);
  });
});

describe("chart integrity across all 18 types", () => {
  it("only ever produces the six legal multipliers", () => {
    const legal = new Set([0, 0.25, 0.5, 1, 2, 4]);
    for (const a of POKEMON_TYPES) {
      for (const b of POKEMON_TYPES) {
        expect(legal.has(mult([a], b))).toBe(true); // single type
        expect(legal.has(mult([a, b], b))).toBe(true); // dual type
      }
    }
  });

  it("bucketing agrees with the raw multiplier for every typing", () => {
    for (const type of POKEMON_TYPES) {
      const g = defensiveGroups([type]);
      const listed = new Set([...g.x4, ...g.x2, ...g.half, ...g.quarter, ...g.zero]);
      for (const attacker of POKEMON_TYPES) {
        const m = mult([type], attacker);
        expect(listed.has(attacker)).toBe(m !== 1);
      }
    }
  });
});
