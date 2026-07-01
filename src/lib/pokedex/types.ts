/** The 18 canonical Pokémon types. */
export type PokemonTypeName =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

/** Generations I–IX currently covered by the national dex (ids 1–1025). */
export type GenerationNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * A single row in the prebuilt Pokédex index — everything the list view needs
 * to render and filter without hitting the network.
 */
export interface PokedexEntry {
  /** National dex number, also the default-form pokemon id in PokéAPI. */
  id: number;
  /** PokéAPI slug, e.g. "mr-mime". */
  name: string;
  generation: GenerationNumber;
  types: PokemonTypeName[];
  /** Evolution-chain id: groups a Pokémon with its pre/evolutions. */
  familyId: number;
}

/** The complete prebuilt index, generated from PokéAPI and read at runtime. */
export interface Pokedex {
  /** ISO timestamp of when the index was generated. */
  generatedAt: string;
  /**
   * Number of distinct evolution families in the index. Handy metadata for the
   * UI ("N Pokémon · M familias"); evolution grouping itself uses
   * `PokedexEntry.familyId`.
   */
  familyCount: number;
  entries: PokedexEntry[];
}

/** A base stat (HP, Attack, …) as returned by PokéAPI. */
export interface StatValue {
  name: string;
  base: number;
}

/** A node in an evolution chain; `children` models branching (e.g. Eevee). */
export interface EvolutionNode {
  id: number;
  name: string;
  children: EvolutionNode[];
}

/** Full data for the detail page — fetched live from PokéAPI (ISR-cached). */
export interface PokemonDetail {
  id: number;
  name: string;
  generation: GenerationNumber;
  types: PokemonTypeName[];
  stats: StatValue[];
  statTotal: number;
  /** Height in metres. */
  heightMeters: number;
  /** Weight in kilograms. */
  weightKilograms: number;
  abilities: string[];
  /** Localized Pokédex flavor text (Spanish preferred, English fallback). */
  description: string | null;
  /** Root of the evolution tree, or null for Pokémon without evolutions. */
  evolutionRoot: EvolutionNode | null;
  /** All dex ids present in this Pokémon's evolution family. */
  familyIds: number[];
}
