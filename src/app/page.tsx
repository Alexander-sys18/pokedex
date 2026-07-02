import { Suspense } from "react";
import { PokedexHero } from "@/components/pokedex/hero";
import { PokedexExplorer } from "@/components/pokedex/pokedex-explorer";
import { PokedexSkeleton } from "@/components/pokedex/pokedex-skeleton";
import { getPokedex } from "@/lib/pokedex";
import { GENERATIONS, POKEMON_TYPES } from "@/lib/pokedex/constants";

// Re-rendered hourly so the server-computed "Pokémon of the day" follows the
// calendar (the index itself is a local file — regeneration is cheap).
export const revalidate = 3600;

/** Deterministic hash of the date → the same featured Pokémon all day. */
function pickIndexForToday(length: number): number {
  const now = new Date();
  const key = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

export default async function HomePage() {
  const pokedex = await getPokedex();
  const featured = pokedex.entries[pickIndexForToday(pokedex.entries.length)]!;

  return (
    <div className="flex flex-col gap-5">
      <PokedexHero
        featured={featured}
        facts={{
          pokemon: pokedex.entries.length,
          families: pokedex.familyCount,
          generations: GENERATIONS.length,
          types: POKEMON_TYPES.length,
        }}
      />

      {/* Suspense satisfies nuqs' use of useSearchParams and shows a skeleton
          on first paint / when landing on a shared, filtered URL. */}
      <Suspense fallback={<PokedexSkeleton />}>
        <PokedexExplorer entries={pokedex.entries} />
      </Suspense>
    </div>
  );
}
