import "server-only";
import { cache } from "react";
import { z } from "zod";
import { prettifyName } from "@/lib/utils";

/**
 * Trading-card data from TCGdex (https://tcgdex.dev) — free, no API key, and
 * localized card scans in Spanish. Purely an enrichment: any failure or empty
 * result simply hides the section.
 */

const TCGDEX_BASE = "https://api.tcgdex.net/v2/es/cards";
const REVALIDATE = Number(process.env.POKEAPI_REVALIDATE_SECONDS ?? 86_400);
const MAX_CARDS = 10;

const cardListSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    // Base asset URL (append /low.webp or /high.webp). Missing on a few cards.
    image: z.string().optional(),
  }),
);

export interface TcgCard {
  id: string;
  name: string;
  /** Ready-to-render card scan URL (webp, low-res thumbnail). */
  imageUrl: string;
  /** High-resolution scan (webp) for the full-screen viewer. */
  imageUrlHigh: string;
}

async function queryCards(name: string): Promise<TcgCard[]> {
  const url =
    `${TCGDEX_BASE}?name=${encodeURIComponent(name)}` +
    `&pagination:page=1&pagination:itemsPerPage=${MAX_CARDS}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: REVALIDATE },
  });
  if (!response.ok) return [];
  const cards = cardListSchema.parse(await response.json());
  return cards
    .filter((card): card is typeof card & { image: string } => Boolean(card.image))
    .map((card) => ({
      id: card.id,
      name: card.name,
      imageUrl: `${card.image}/low.webp`,
      imageUrlHigh: `${card.image}/high.webp`,
    }));
}

/**
 * Fetch up to {@link MAX_CARDS} Spanish card scans for a Pokémon. The TCGdex
 * name filter is a case-insensitive "contains", so multi-word slugs
 * ("mr-mime") retry with their longest word when the full name misses.
 * Wrapped in React cache() so repeated calls within one render are deduped.
 */
export const getTcgCards = cache(async (pokemonSlug: string): Promise<TcgCard[]> => {
  try {
    const pretty = prettifyName(pokemonSlug);
    const cards = await queryCards(pretty);
    if (cards.length > 0 || !pokemonSlug.includes("-")) return cards;

    const longestWord = pokemonSlug.split("-").sort((a, b) => b.length - a.length)[0]!;
    return await queryCards(longestWord);
  } catch {
    return [];
  }
});
