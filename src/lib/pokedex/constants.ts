import type { GenerationNumber, PokemonTypeName } from "./types";

/** Canonical type order (matches the official Pokédex ordering). */
export const POKEMON_TYPES: readonly PokemonTypeName[] = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

/** Brand color per type — used for badges, gradients and dark-mode glows. */
export const TYPE_COLORS: Record<PokemonTypeName, string> = {
  normal: "#9fa19f",
  fire: "#ff6b3d",
  water: "#4d90d5",
  electric: "#f4d23c",
  grass: "#63bb5b",
  ice: "#74cec0",
  fighting: "#ce4069",
  poison: "#ab5ec8",
  ground: "#d97845",
  flying: "#8fa8dd",
  psychic: "#f97176",
  bug: "#90c12c",
  rock: "#c7b78b",
  ghost: "#5269ac",
  dragon: "#0a6dc4",
  dark: "#5a5366",
  steel: "#5a8ea1",
  fairy: "#ec8fe6",
};

/** Spanish labels for each type. */
export const TYPE_LABELS_ES: Record<PokemonTypeName, string> = {
  normal: "Normal",
  fire: "Fuego",
  water: "Agua",
  electric: "Eléctrico",
  grass: "Planta",
  ice: "Hielo",
  fighting: "Lucha",
  poison: "Veneno",
  ground: "Tierra",
  flying: "Volador",
  psychic: "Psíquico",
  bug: "Bicho",
  rock: "Roca",
  ghost: "Fantasma",
  dragon: "Dragón",
  dark: "Siniestro",
  steel: "Acero",
  fairy: "Hada",
};

export const GENERATIONS: readonly GenerationNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const ROMAN: Record<GenerationNumber, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII",
  9: "IX",
};

/** Main region introduced with each generation. */
export const GENERATION_REGIONS: Record<GenerationNumber, string> = {
  1: "Kanto",
  2: "Johto",
  3: "Hoenn",
  4: "Sinnoh",
  5: "Teselia",
  6: "Kalos",
  7: "Alola",
  8: "Galar",
  9: "Paldea",
};

export function generationLabel(gen: GenerationNumber): string {
  return `Generación ${ROMAN[gen]}`;
}

export function generationShortLabel(gen: GenerationNumber): string {
  return `Gen ${ROMAN[gen]}`;
}

/** Order in which base stats are displayed, with Spanish labels. */
export const STAT_ORDER = [
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
] as const;

export const STAT_LABELS_ES: Record<string, string> = {
  hp: "PS",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. Especial",
  "special-defense": "Def. Especial",
  speed: "Velocidad",
};

/** Highest base stat value in the games — used to scale the stat bars. */
export const MAX_BASE_STAT = 255;

/** Highest national dex number covered (generations I–IX). */
export const NATIONAL_DEX_MAX = 1025;
