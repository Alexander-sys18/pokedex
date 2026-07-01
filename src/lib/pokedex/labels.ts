import { prettifyName } from "@/lib/utils";

/**
 * Spanish display labels for PokéAPI slugs (games, egg groups, growth rates,
 * habitats, colors, shapes). Static, tiny, and shared by server + client.
 */

/** Main-series versions in chronological order (insertion order matters). */
export const VERSION_LABELS_ES: Record<string, string> = {
  red: "Rojo",
  blue: "Azul",
  yellow: "Amarillo",
  gold: "Oro",
  silver: "Plata",
  crystal: "Cristal",
  ruby: "Rubí",
  sapphire: "Zafiro",
  emerald: "Esmeralda",
  firered: "Rojo Fuego",
  leafgreen: "Verde Hoja",
  diamond: "Diamante",
  pearl: "Perla",
  platinum: "Platino",
  heartgold: "HeartGold",
  soulsilver: "SoulSilver",
  black: "Negro",
  white: "Blanco",
  "black-2": "Negro 2",
  "white-2": "Blanco 2",
  x: "X",
  y: "Y",
  "omega-ruby": "Rubí Omega",
  "alpha-sapphire": "Zafiro Alfa",
  sun: "Sol",
  moon: "Luna",
  "ultra-sun": "Ultrasol",
  "ultra-moon": "Ultraluna",
  "lets-go-pikachu": "Let's Go, Pikachu!",
  "lets-go-eevee": "Let's Go, Eevee!",
  sword: "Espada",
  shield: "Escudo",
  "brilliant-diamond": "Diamante Brillante",
  "shining-pearl": "Perla Reluciente",
  "legends-arceus": "Leyendas: Arceus",
  scarlet: "Escarlata",
  violet: "Púrpura",
};

/** Chronological order of the versions above (index = age). */
export const VERSION_ORDER: readonly string[] = Object.keys(VERSION_LABELS_ES);

export function versionLabel(name: string): string {
  return VERSION_LABELS_ES[name] ?? prettifyName(name);
}

/**
 * Location-area slugs come in English from the API ("kanto-route-2-south…").
 * We prettify them and localize only the unambiguous generic word "Route" —
 * the rest are in-game proper nouns.
 */
export function locationLabel(slug: string): string {
  return prettifyName(slug.replace(/-area$/, "")).replace(/\bRoute\b/g, "Ruta");
}

export const EGG_GROUP_LABELS_ES: Record<string, string> = {
  monster: "Monstruo",
  water1: "Agua 1",
  water2: "Agua 2",
  water3: "Agua 3",
  bug: "Bicho",
  flying: "Volador",
  ground: "Campo",
  fairy: "Hada",
  plant: "Planta",
  humanshape: "Humanoide",
  mineral: "Mineral",
  indeterminate: "Amorfo",
  ditto: "Ditto",
  dragon: "Dragón",
  "no-eggs": "Desconocido",
};

export function eggGroupLabel(name: string): string {
  return EGG_GROUP_LABELS_ES[name] ?? prettifyName(name);
}

export const GROWTH_RATE_LABELS_ES: Record<string, string> = {
  slow: "Lento",
  medium: "Medio",
  fast: "Rápido",
  "medium-slow": "Medio-lento",
  "slow-then-very-fast": "Errático",
  "fast-then-very-slow": "Fluctuante",
};

export function growthRateLabel(name: string): string {
  return GROWTH_RATE_LABELS_ES[name] ?? prettifyName(name);
}

export const HABITAT_LABELS_ES: Record<string, string> = {
  cave: "Cueva",
  forest: "Bosque",
  grassland: "Pradera",
  mountain: "Montaña",
  rare: "Raro",
  "rough-terrain": "Terreno agreste",
  sea: "Mar",
  urban: "Urbano",
  "waters-edge": "Ribera",
};

export function habitatLabel(name: string): string {
  return HABITAT_LABELS_ES[name] ?? prettifyName(name);
}

export const COLOR_LABELS_ES: Record<string, string> = {
  black: "Negro",
  blue: "Azul",
  brown: "Marrón",
  gray: "Gris",
  green: "Verde",
  pink: "Rosa",
  purple: "Morado",
  red: "Rojo",
  white: "Blanco",
  yellow: "Amarillo",
};

export function colorLabel(name: string): string {
  return COLOR_LABELS_ES[name] ?? prettifyName(name);
}

export const SHAPE_LABELS_ES: Record<string, string> = {
  ball: "Esférico",
  squiggle: "Serpentino",
  fish: "Pez",
  arms: "Cabeza y brazos",
  blob: "Amorfo",
  upright: "Bípedo con cola",
  legs: "Cabeza y piernas",
  quadruped: "Cuadrúpedo",
  wings: "Alado",
  tentacles: "Tentáculos",
  heads: "Múltiples cuerpos",
  humanoid: "Humanoide",
  "bug-wings": "Insecto alado",
  armor: "Acorazado",
};

export function shapeLabel(name: string): string {
  return SHAPE_LABELS_ES[name] ?? prettifyName(name);
}
