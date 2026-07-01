import { z } from "zod";

/**
 * Zod schemas for the subset of PokéAPI responses we consume. Unknown keys are
 * stripped, so these act as a typed, resilient boundary: if the API shape drifts
 * in a field we rely on, parsing fails loudly instead of leaking `undefined`.
 */

export const namedResourceSchema = z.object({
  name: z.string(),
  url: z.string(),
});
export type NamedResource = z.infer<typeof namedResourceSchema>;

/** `/generation/{id}` — used to map species → generation. */
export const generationSchema = z.object({
  id: z.number(),
  pokemon_species: z.array(namedResourceSchema),
});

/** `/type/{name}` — used to map pokemon → types. */
export const typeSchema = z.object({
  pokemon: z.array(
    z.object({
      slot: z.number(),
      pokemon: namedResourceSchema,
    }),
  ),
});

/**
 * `/evolution-chain?limit=…` — the paginated list of chains. Unlike most list
 * endpoints these results carry only a `url` (no `name`).
 */
export const evolutionChainListSchema = z.object({
  count: z.number(),
  results: z.array(z.object({ url: z.string() })),
});

/** A recursive node in an evolution chain. */
export interface ChainLink {
  species: NamedResource;
  evolves_to: ChainLink[];
}
export const chainLinkSchema: z.ZodType<ChainLink> = z.lazy(() =>
  z.object({
    species: namedResourceSchema,
    evolves_to: z.array(chainLinkSchema),
  }),
);

/** `/evolution-chain/{id}`. */
export const evolutionChainSchema = z.object({
  id: z.number(),
  chain: chainLinkSchema,
});

/** `/pokemon/{name}` — detail view (types, stats, physique, abilities). */
export const pokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  height: z.number(),
  weight: z.number(),
  types: z.array(
    z.object({
      slot: z.number(),
      type: namedResourceSchema,
    }),
  ),
  stats: z.array(
    z.object({
      base_stat: z.number(),
      stat: namedResourceSchema,
    }),
  ),
  abilities: z.array(
    z.object({
      ability: namedResourceSchema,
      is_hidden: z.boolean(),
    }),
  ),
  species: namedResourceSchema,
});

/** `/pokemon-species/{name}` — generation, evolution chain link, flavor text. */
export const pokemonSpeciesSchema = z.object({
  id: z.number(),
  name: z.string(),
  generation: namedResourceSchema,
  evolution_chain: z.object({ url: z.string() }).nullable(),
  flavor_text_entries: z.array(
    z.object({
      flavor_text: z.string(),
      language: namedResourceSchema,
    }),
  ),
});
