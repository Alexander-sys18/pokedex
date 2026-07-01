import { Suspense } from "react";
import { PokedexExplorer } from "@/components/pokedex/pokedex-explorer";
import { PokedexSkeleton } from "@/components/pokedex/pokedex-skeleton";
import { getPokedex } from "@/lib/pokedex";
import { GENERATIONS, POKEMON_TYPES } from "@/lib/pokedex/constants";

export default async function HomePage() {
  const pokedex = await getPokedex();

  const facts = [
    `${pokedex.entries.length} Pokémon`,
    `${pokedex.familyCount} familias evolutivas`,
    `${GENERATIONS.length} generaciones`,
    `${POKEMON_TYPES.length} tipos`,
  ];

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-3">
        <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
          Explora la Pokédex
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
          Busca por nombre —incluyendo su cadena evolutiva—, filtra por tipo y generación, hazle una
          foto a un Pokémon para identificarlo o pregúntale lo que quieras al asistente.
        </p>
        <div className="flex flex-wrap gap-2">
          {facts.map((fact) => (
            <span
              key={fact}
              className="border-border bg-surface text-muted-foreground rounded-full border px-3 py-1 text-xs font-medium"
            >
              {fact}
            </span>
          ))}
        </div>
      </section>

      {/* Suspense satisfies nuqs' use of useSearchParams and shows a skeleton
          on first paint / when landing on a shared, filtered URL. */}
      <Suspense fallback={<PokedexSkeleton />}>
        <PokedexExplorer entries={pokedex.entries} />
      </Suspense>
    </div>
  );
}
