import { POKEMON_TYPES } from "./constants";
import type { PokemonTypeName } from "./types";

/**
 * Canonical type-effectiveness chart (Gen VI+). Embedded as data — computing
 * weaknesses/resistances needs zero extra API requests.
 *
 * `CHART[attacker][defender]` is the multiplier when it differs from 1.
 */
type Multiplier = 0 | 0.5 | 2;

const CHART: Record<PokemonTypeName, Partial<Record<PokemonTypeName, Multiplier>>> = {
  normal: { rock: 0.5, steel: 0.5, ghost: 0 },
  fire: { grass: 2, ice: 2, bug: 2, steel: 2, fire: 0.5, water: 0.5, rock: 0.5, dragon: 0.5 },
  water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
  electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, dragon: 0.5, ground: 0 },
  grass: {
    water: 2,
    ground: 2,
    rock: 2,
    fire: 0.5,
    grass: 0.5,
    poison: 0.5,
    flying: 0.5,
    bug: 0.5,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: { grass: 2, ground: 2, flying: 2, dragon: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
  fighting: {
    normal: 2,
    ice: 2,
    rock: 2,
    dark: 2,
    steel: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    fairy: 0.5,
    ghost: 0,
  },
  poison: { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
  ground: { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: 0.5, bug: 0.5, flying: 0 },
  flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5, dark: 0 },
  bug: {
    grass: 2,
    psychic: 2,
    dark: 2,
    fire: 0.5,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    ghost: 0.5,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
  ghost: { psychic: 2, ghost: 2, dark: 0.5, normal: 0 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
  steel: { ice: 2, rock: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
  fairy: { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5, steel: 0.5 },
};

/** Damage multiplier of each attacking type against the given defensive typing. */
export function defensiveEffectiveness(
  defenderTypes: readonly PokemonTypeName[],
): Map<PokemonTypeName, number> {
  const result = new Map<PokemonTypeName, number>();
  for (const attacker of POKEMON_TYPES) {
    let multiplier = 1;
    for (const defender of defenderTypes) {
      multiplier *= CHART[attacker][defender] ?? 1;
    }
    result.set(attacker, multiplier);
  }
  return result;
}

export interface DefensiveGroups {
  /** ×4 — double weakness. */
  x4: PokemonTypeName[];
  /** ×2 — weakness. */
  x2: PokemonTypeName[];
  /** ×½ — resistance. */
  half: PokemonTypeName[];
  /** ×¼ — double resistance. */
  quarter: PokemonTypeName[];
  /** ×0 — immunity. */
  zero: PokemonTypeName[];
}

/** Group attacking types by how effective they are against this typing. */
export function defensiveGroups(defenderTypes: readonly PokemonTypeName[]): DefensiveGroups {
  const groups: DefensiveGroups = { x4: [], x2: [], half: [], quarter: [], zero: [] };
  for (const [type, multiplier] of defensiveEffectiveness(defenderTypes)) {
    if (multiplier === 4) groups.x4.push(type);
    else if (multiplier === 2) groups.x2.push(type);
    else if (multiplier === 0.5) groups.half.push(type);
    else if (multiplier === 0.25) groups.quarter.push(type);
    else if (multiplier === 0) groups.zero.push(type);
  }
  return groups;
}
