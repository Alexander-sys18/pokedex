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

/** `/pokemon/{name}` — detail view (types, stats, physique, abilities, cries…). */
export const pokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  height: z.number(),
  weight: z.number(),
  base_experience: z.number().nullable(),
  types: z.array(
    z.object({
      slot: z.number(),
      type: namedResourceSchema,
    }),
  ),
  stats: z.array(
    z.object({
      base_stat: z.number(),
      effort: z.number(),
      stat: namedResourceSchema,
    }),
  ),
  abilities: z.array(
    z.object({
      ability: namedResourceSchema,
      is_hidden: z.boolean(),
    }),
  ),
  held_items: z.array(z.object({ item: namedResourceSchema })).optional(),
  cries: z
    .object({
      latest: z.string().nullable(),
      legacy: z.string().nullable(),
    })
    .optional(),
  species: namedResourceSchema,
});

/** `/pokemon/{id}/encounters` — wild encounter locations per game version. */
export const encountersSchema = z.array(
  z.object({
    location_area: namedResourceSchema,
    version_details: z.array(
      z.object({
        version: namedResourceSchema,
        max_chance: z.number(),
      }),
    ),
  }),
);

/**
 * `/pokemon-species/{name}` — generation, evolution chain, flavor texts,
 * category, breeding data, capture data, lore flags, forms and localized names.
 */
export const pokemonSpeciesSchema = z.object({
  id: z.number(),
  name: z.string(),
  generation: namedResourceSchema,
  evolution_chain: z.object({ url: z.string() }).nullable(),
  flavor_text_entries: z.array(
    z.object({
      flavor_text: z.string(),
      language: namedResourceSchema,
      version: namedResourceSchema.nullable().optional(),
    }),
  ),
  genera: z.array(z.object({ genus: z.string(), language: namedResourceSchema })).optional(),
  names: z.array(z.object({ name: z.string(), language: namedResourceSchema })).optional(),
  capture_rate: z.number().nullable().optional(),
  base_happiness: z.number().nullable().optional(),
  growth_rate: namedResourceSchema.nullable().optional(),
  egg_groups: z.array(namedResourceSchema).optional(),
  gender_rate: z.number().nullable().optional(),
  hatch_counter: z.number().nullable().optional(),
  is_legendary: z.boolean().optional(),
  is_mythical: z.boolean().optional(),
  is_baby: z.boolean().optional(),
  habitat: namedResourceSchema.nullable().optional(),
  color: namedResourceSchema.nullable().optional(),
  shape: namedResourceSchema.nullable().optional(),
  varieties: z
    .array(z.object({ is_default: z.boolean(), pokemon: namedResourceSchema }))
    .optional(),
});
