const SPRITES_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

/** High-resolution official artwork (475×475). Used on cards and detail. */
export function officialArtwork(id: number): string {
  return `${SPRITES_BASE}/other/official-artwork/${id}.png`;
}

/** Shiny variant of the official artwork. */
export function shinyArtwork(id: number): string {
  return `${SPRITES_BASE}/other/official-artwork/shiny/${id}.png`;
}

/** Pokémon HOME render (512×512). Slightly softer look, good fallback. */
export function homeArtwork(id: number): string {
  return `${SPRITES_BASE}/other/home/${id}.png`;
}

/** Low-res pixel sprite (96×96) — final fallback if artwork is missing. */
export function pixelSprite(id: number): string {
  return `${SPRITES_BASE}/${id}.png`;
}
