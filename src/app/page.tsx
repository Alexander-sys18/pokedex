import { Suspense } from "react";
import { PokedexExplorer } from "@/components/pokedex/pokedex-explorer";
import { PokedexSkeleton } from "@/components/pokedex/pokedex-skeleton";
import { getPokedex } from "@/lib/pokedex";

export default async function HomePage() {
  const pokedex = await getPokedex();

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-2">
        <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
          Explora la Pokédex
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
          Busca entre {pokedex.entries.length} Pokémon por nombre —incluyendo su cadena evolutiva— y
          filtra por tipo y generación.
        </p>
      </section>

      {/* Suspense satisfies nuqs' use of useSearchParams and shows a skeleton
          on first paint / when landing on a shared, filtered URL. */}
      <Suspense fallback={<PokedexSkeleton />}>
        <PokedexExplorer entries={pokedex.entries} />
      </Suspense>
    </div>
  );
}
