import { PokedexSkeleton } from "@/components/pokedex/pokedex-skeleton";

export default function HomeLoading() {
  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-2">
        <div className="bg-muted h-9 w-64 animate-pulse rounded-lg" />
        <div className="bg-muted h-5 w-full max-w-xl animate-pulse rounded" />
      </section>
      <PokedexSkeleton />
    </div>
  );
}
