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
  /** How this node evolves FROM its parent ("Nivel 16", "Piedra Agua"…); null on the root. */
  method: string | null;
  children: EvolutionNode[];
}

/** An ability slot, with the hidden-ability flag. */
export interface AbilityInfo {
  name: string;
  hidden: boolean;
}

/** Wild-encounter locations for one game version. */
export interface VersionEncounters {
  /** PokéAPI version slug (e.g. "scarlet"). */
  version: string;
  /** Location-area slugs where the Pokémon appears in that version. */
  locations: string[];
}

/** One Pokédex flavor text, tagged with the game it comes from. */
export interface FlavorEntry {
  text: string;
  /** PokéAPI version slug, or null when the entry isn't tied to a version. */
  version: string | null;
}

/** An alternative form/variety (mega, regional, gmax…). */
export interface VarietyInfo {
  /** PokéAPI pokemon id of the form (may exceed the national dex range). */
  id: number;
  name: string;
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
  abilities: AbilityInfo[];
  /** Localized Pokédex flavor text (Spanish preferred, English fallback). */
  description: string | null;
  /** Root of the evolution tree, or null for Pokémon without evolutions. */
  evolutionRoot: EvolutionNode | null;
  /** All dex ids present in this Pokémon's evolution family. */
  familyIds: number[];

  // --- Identity & lore -------------------------------------------------------
  /** Localized category/genus, e.g. "Pokémon Ratón". */
  genus: string | null;
  /** Katakana name (decorative). */
  japaneseName: string | null;
  isLegendary: boolean;
  isMythical: boolean;
  isBaby: boolean;
  /** Extra Pokédex entries from different games ("curiosidades"). */
  flavorEntries: FlavorEntry[];

  // --- Training --------------------------------------------------------------
  baseExperience: number | null;
  /** 0–255; higher = easier to catch. */
  captureRate: number | null;
  /** 0–255 friendship when caught. */
  baseHappiness: number | null;
  /** PokéAPI growth-rate slug ("medium-slow"…), or null. */
  growthRate: string | null;
  /** Effort values granted when defeated, e.g. [{ name: "speed", value: 2 }]. */
  evYield: { name: string; value: number }[];
  /** Items the wild Pokémon may hold (prettified names). */
  heldItems: string[];

  // --- Breeding ---------------------------------------------------------------
  /** PokéAPI egg-group slugs. */
  eggGroups: string[];
  /** -1 = genderless; otherwise eighths that are female (0–8). */
  genderRate: number | null;
  /** Egg cycles to hatch. */
  hatchCounter: number | null;

  // --- Traits -----------------------------------------------------------------
  /** PokéAPI slugs (null when the API has no data). */
  habitat: string | null;
  color: string | null;
  shape: string | null;

  // --- Media & extras -----------------------------------------------------------
  /** Cry audio URLs (ogg). */
  cries: { latest: string | null; legacy: string | null };
  /** Where to find it in the wild, newest games first. */
  encounters: VersionEncounters[];
  /** Alternative forms (mega, regional…), excluding the default form. */
  varieties: VarietyInfo[];
}
