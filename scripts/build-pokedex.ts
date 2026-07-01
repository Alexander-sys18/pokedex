/**
 * Build the Pokédex index consumed by the home page.
 *
 * Strategy (kept deliberately cheap — ~580 requests, once, cached to disk):
 *   • 9  `/generation/{n}`      → species id → { name, generation }
 *   • 18 `/type/{name}`         → species id → ordered types (mapped by id, so
 *                                  special default forms like Deoxys resolve)
 *   • ~549 `/evolution-chain`   → species id → family id (drives evo-aware search)
 *
 * Run with `--force` to rebuild even if the cache is fresh.
 * The output (`src/data/pokedex.generated.json`) is git-ignored and rebuilt via
 * the `predev` / `prebuild` hooks and inside the Docker image.
 */
import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { idFromUrl, pokeFetch, POKEAPI_BASE_URL } from "../src/lib/pokeapi/client";
import {
  evolutionChainListSchema,
  evolutionChainSchema,
  generationSchema,
  typeSchema,
  type ChainLink,
} from "../src/lib/pokeapi/schemas";
import { GENERATIONS, POKEMON_TYPES } from "../src/lib/pokedex/constants";
import type {
  GenerationNumber,
  Pokedex,
  PokedexEntry,
  PokemonTypeName,
} from "../src/lib/pokedex/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "src", "data", "pokedex.generated.json");
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const CONCURRENCY = 24;

/** Map an async fn over items with a bounded number of concurrent workers. */
async function pMap<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Collect every species id reachable from an evolution-chain node. */
function collectSpeciesIds(node: ChainLink, out: number[]): void {
  out.push(idFromUrl(node.species.url));
  for (const child of node.evolves_to) {
    collectSpeciesIds(child, out);
  }
}

async function isCacheFresh(): Promise<boolean> {
  try {
    const info = await stat(OUTPUT_PATH);
    return Date.now() - info.mtimeMs < CACHE_MAX_AGE_MS;
  } catch {
    return false;
  }
}

async function buildPokedex(): Promise<Pokedex> {
  // 1) Generations → species id → { name, generation }.
  console.log("· Fetching generations…");
  const genResponses = await pMap(GENERATIONS as GenerationNumber[], CONCURRENCY, (gen) =>
    pokeFetch(`/generation/${gen}`, generationSchema),
  );
  const speciesMeta = new Map<number, { name: string; generation: GenerationNumber }>();
  genResponses.forEach((res, index) => {
    const generation = GENERATIONS[index]!;
    for (const species of res.pokemon_species) {
      speciesMeta.set(idFromUrl(species.url), { name: species.name, generation });
    }
  });
  console.log(`  → ${speciesMeta.size} species`);

  // 2) Types → species id → ordered type names (mapped by id).
  console.log("· Fetching types…");
  const typeResponses = await pMap([...POKEMON_TYPES], CONCURRENCY, async (typeName) => ({
    typeName,
    data: await pokeFetch(`/type/${typeName}`, typeSchema),
  }));
  const typesById = new Map<number, { slot: number; type: PokemonTypeName }[]>();
  for (const { typeName, data } of typeResponses) {
    for (const entry of data.pokemon) {
      const id = idFromUrl(entry.pokemon.url);
      if (!speciesMeta.has(id)) continue; // skip alternate forms (id > 1025)
      const list = typesById.get(id) ?? [];
      list.push({ slot: entry.slot, type: typeName });
      typesById.set(id, list);
    }
  }

  // 3) Evolution chains → species id → family id.
  console.log("· Fetching evolution chains…");
  const chainList = await pokeFetch(
    "/evolution-chain?limit=100000&offset=0",
    evolutionChainListSchema,
  );
  const chains = await pMap(chainList.results, CONCURRENCY, (resource) =>
    pokeFetch(resource.url, evolutionChainSchema),
  );
  const familyById = new Map<number, number>();
  for (const chain of chains) {
    const ids: number[] = [];
    collectSpeciesIds(chain.chain, ids);
    for (const speciesId of ids) {
      familyById.set(speciesId, chain.id);
    }
  }
  console.log(`  → ${chains.length} families`);

  // 4) Assemble entries.
  let missingTypes = 0;
  let fallbackFamilies = 0;
  const entries: PokedexEntry[] = [];
  for (const [id, meta] of speciesMeta) {
    const types = (typesById.get(id) ?? []).sort((a, b) => a.slot - b.slot).map((t) => t.type);
    if (types.length === 0) missingTypes++;

    let familyId = familyById.get(id);
    if (familyId === undefined) {
      familyId = 1_000_000 + id; // synthetic singleton family, collision-free
      fallbackFamilies++;
    }

    entries.push({ id, name: meta.name, generation: meta.generation, types, familyId });
  }
  entries.sort((a, b) => a.id - b.id);

  if (missingTypes > 0) console.warn(`  ! ${missingTypes} species without types`);
  if (fallbackFamilies > 0) console.warn(`  ! ${fallbackFamilies} species without a chain`);

  const familyCount = new Set(entries.map((e) => e.familyId)).size;
  return { generatedAt: new Date().toISOString(), familyCount, entries };
}

async function main() {
  const force = process.argv.includes("--force");
  if (!force && (await isCacheFresh())) {
    console.log("✓ Pokédex cache is fresh — skipping (use --force to rebuild).");
    return;
  }

  console.log(`Building Pokédex index from ${POKEAPI_BASE_URL}…`);
  const start = Date.now();
  const pokedex = await buildPokedex();

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(pokedex), "utf8");

  const seconds = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `✓ Wrote ${pokedex.entries.length} Pokémon (${pokedex.familyCount} families) in ${seconds}s → ${OUTPUT_PATH}`,
  );
}

main().catch((error) => {
  console.error("✗ Failed to build Pokédex index:\n", error);
  process.exit(1);
});
