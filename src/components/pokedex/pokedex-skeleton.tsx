/** Loading placeholder that mirrors the filters bar + card grid layout. */
export function PokedexSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      <div className="flex flex-col gap-3">
        <div className="bg-muted h-11 w-full animate-pulse rounded-xl" />
        {/* Mobile: "Filtros" + "Favoritos" halves; desktop: the select row. */}
        <div className="flex gap-2 sm:hidden">
          <div className="bg-muted h-10 flex-1 animate-pulse rounded-xl" />
          <div className="bg-muted h-10 flex-1 animate-pulse rounded-xl" />
        </div>
        <div className="hidden flex-wrap gap-2 sm:flex">
          <div className="bg-muted h-10 w-40 animate-pulse rounded-xl" />
          <div className="bg-muted h-10 w-52 animate-pulse rounded-xl" />
          <div className="bg-muted h-10 w-44 animate-pulse rounded-xl" />
        </div>
      </div>

      <div className="bg-muted h-4 w-32 animate-pulse rounded" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 18 }).map((_, index) => (
          <div
            key={index}
            className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-3"
          >
            <div className="flex justify-between">
              <div className="bg-muted h-3 w-10 animate-pulse rounded" />
              <div className="bg-muted h-3 w-8 animate-pulse rounded" />
            </div>
            <div className="bg-muted mx-auto aspect-square w-full max-w-[140px] animate-pulse rounded-full" />
            <div className="bg-muted mx-auto h-4 w-20 animate-pulse rounded" />
            <div className="bg-muted mx-auto h-5 w-16 animate-pulse rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
