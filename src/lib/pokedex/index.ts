import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Pokedex } from "./types";

const DATA_PATH = join(process.cwd(), "src", "data", "pokedex.generated.json");

let cache: Promise<Pokedex> | null = null;

/**
 * Load the prebuilt Pokédex index (generated from PokéAPI by
 * `scripts/build-pokedex.ts`). Read once per server process — the data is
 * immutable for the lifetime of the deployment.
 */
export function getPokedex(): Promise<Pokedex> {
  cache ??= load();
  return cache;
}

async function load(): Promise<Pokedex> {
  let raw: string;
  try {
    raw = await readFile(DATA_PATH, "utf8");
  } catch {
    throw new Error(
      `Pokédex index not found at ${DATA_PATH}.\n` +
        "Run `pnpm pokedex:build` to generate it (this normally happens " +
        "automatically via the predev/prebuild hooks).",
    );
  }
  const pokedex = JSON.parse(raw) as Pokedex;
  if (!Array.isArray(pokedex.entries) || pokedex.entries.length === 0) {
    throw new Error("Pokédex index is empty or malformed — rebuild with `pnpm pokedex:build`.");
  }
  return pokedex;
}
