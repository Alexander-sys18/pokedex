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

/** Animated battle sprite (Pokémon Showdown GIF). Not available for every id. */
export function animatedSprite(id: number, shiny = false): string {
  return `${SPRITES_BASE}/other/showdown/${shiny ? "shiny/" : ""}${id}.gif`;
}

/** Official Professor Oak trainer sprite (80×80 pixel art, Showdown CDN). */
export function professorOakSprite(): string {
  return "https://play.pokemonshowdown.com/sprites/trainers/oak.png";
}

/**
 * Real 3D model (.glb, Draco-compressed) from the community Pokémon 3D API
 * asset set, served through the jsDelivr CDN. Coverage is broad (~97% of the
 * dex) but not total — always pair with a fallback for missing ids.
 * https://github.com/Pokemon-3D-api/assets
 */
export function pokemonModel3D(id: number, shiny = false): string {
  const variant = shiny ? "shiny" : "regular";
  return `https://cdn.jsdelivr.net/gh/Pokemon-3D-api/assets@main/models/opt/${variant}/${id}.glb`;
}
