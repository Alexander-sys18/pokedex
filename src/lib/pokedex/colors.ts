import { TYPE_COLORS } from "./constants";
import type { PokemonTypeName } from "./types";

export function typeColor(type: PokemonTypeName): string {
  return TYPE_COLORS[type];
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

/** Relative luminance (WCAG) of a hex color, 0 (black) → 1 (white). */
function luminance(hex: string): number {
  const channels = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Pick black or white text so it stays legible on the given background. */
export function readableTextColor(hex: string): string {
  return luminance(hex) > 0.55 ? "#141414" : "#ffffff";
}

/** Append an alpha channel to a 6-digit hex color → "rgb(r g b / a)". */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

/** The dominant (first) type of a Pokémon — drives its accent color. */
export function primaryTypeColor(types: PokemonTypeName[]): string {
  return typeColor(types[0] ?? "normal");
}
