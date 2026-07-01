import "server-only";
import { cache } from "react";
import {
  generationNumberFromName,
  idFromUrl,
  NonRetryableHttpError,
  pokeFetch,
} from "@/lib/pokeapi/client";
import {
  evolutionChainSchema,
  pokemonSchema,
  pokemonSpeciesSchema,
  type ChainLink,
} from "@/lib/pokeapi/schemas";
import { POKEMON_TYPES, STAT_ORDER } from "./constants";
import type { EvolutionNode, PokemonDetail, PokemonTypeName, StatValue } from "./types";

const REVALIDATE = Number(process.env.POKEAPI_REVALIDATE_SECONDS ?? 86_400);
const KNOWN_TYPES = new Set<string>(POKEMON_TYPES);

function toEvolutionNode(link: ChainLink): EvolutionNode {
  return {
    id: idFromUrl(link.species.url),
    name: link.species.name,
    children: link.evolves_to.map(toEvolutionNode),
  };
}

function collectFamilyIds(node: EvolutionNode, out: number[]): void {
  out.push(node.id);
  node.children.forEach((child) => collectFamilyIds(child, out));
}

/** Pick a localized Pokédex description (Spanish preferred, English fallback). */
function pickDescription(
  entries: { flavor_text: string; language: { name: string } }[],
): string | null {
  const preferred =
    entries.find((e) => e.language.name === "es") ?? entries.find((e) => e.language.name === "en");
  if (!preferred) return null;
  // Flavor text is littered with control chars (\n, \f, soft hyphens).
  return preferred.flavor_text.replace(/\s+/g, " ").trim();
}

function orderStats(stats: { base_stat: number; stat: { name: string } }[]): StatValue[] {
  const byName = new Map(stats.map((s) => [s.stat.name, s.base_stat]));
  return STAT_ORDER.map((name) => ({ name, base: byName.get(name) ?? 0 }));
}

/**
 * Fetch everything the detail page needs, live from PokéAPI (ISR-cached).
 * Returns `null` for an unknown id so the page can render a 404.
 *
 * Wrapped in React `cache()` so `generateMetadata` and the page component share
 * a single fetch per request instead of hitting PokéAPI twice.
 */
export const getPokemonDetail = cache(async (id: number): Promise<PokemonDetail | null> => {
  try {
    const [pokemon, species] = await Promise.all([
      pokeFetch(`/pokemon/${id}`, pokemonSchema, { revalidate: REVALIDATE }),
      pokeFetch(`/pokemon-species/${id}`, pokemonSpeciesSchema, { revalidate: REVALIDATE }),
    ]);

    let evolutionRoot: EvolutionNode | null = null;
    if (species.evolution_chain) {
      const chain = await pokeFetch(species.evolution_chain.url, evolutionChainSchema, {
        revalidate: REVALIDATE,
      });
      evolutionRoot = toEvolutionNode(chain.chain);
    }

    const familyIds: number[] = [];
    if (evolutionRoot) collectFamilyIds(evolutionRoot, familyIds);

    const types = pokemon.types
      .sort((a, b) => a.slot - b.slot)
      .map((t) => t.type.name)
      .filter((name): name is PokemonTypeName => KNOWN_TYPES.has(name));

    const stats = orderStats(pokemon.stats);

    return {
      id: pokemon.id,
      // Species slug is cleaner than the default-form slug (e.g. "deoxys" not
      // "deoxys-normal"); it still resolves for the title and search.
      name: species.name,
      generation: generationNumberFromName(species.generation.name),
      types,
      stats,
      statTotal: stats.reduce((sum, s) => sum + s.base, 0),
      heightMeters: pokemon.height / 10,
      weightKilograms: pokemon.weight / 10,
      abilities: pokemon.abilities.map((a) => a.ability.name),
      description: pickDescription(species.flavor_text_entries),
      evolutionRoot,
      familyIds,
    };
  } catch (error) {
    if (error instanceof NonRetryableHttpError && error.status === 404) {
      return null;
    }
    throw error;
  }
});
