export default function PokemonDetailLoading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="flex items-center justify-between">
        <div className="bg-muted h-5 w-40 animate-pulse rounded" />
        <div className="flex gap-1.5">
          <div className="bg-muted h-9 w-24 animate-pulse rounded-lg" />
          <div className="bg-muted h-9 w-24 animate-pulse rounded-lg" />
        </div>
      </div>

      {/* Hero */}
      <section className="border-border rounded-3xl border p-6 sm:p-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,300px)_1fr] md:items-center">
          <div className="bg-muted mx-auto aspect-square w-full max-w-[300px] animate-pulse rounded-full" />
          <div className="flex flex-col gap-4">
            <div className="bg-muted h-4 w-56 animate-pulse rounded" />
            <div className="bg-muted h-12 w-64 animate-pulse rounded-lg" />
            <div className="flex gap-2">
              <div className="bg-muted h-7 w-20 animate-pulse rounded-full" />
              <div className="bg-muted h-7 w-20 animate-pulse rounded-full" />
            </div>
            <div className="bg-muted h-14 w-full max-w-xl animate-pulse rounded" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-muted h-16 animate-pulse rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats + matchups */}
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <div className="border-border bg-muted/40 h-80 animate-pulse rounded-2xl border" />
        <div className="border-border bg-muted/40 h-80 animate-pulse rounded-2xl border" />
      </div>

      {/* Training / breeding / traits */}
      <div className="grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border-border bg-muted/40 h-56 animate-pulse rounded-2xl border"
          />
        ))}
      </div>

      {/* Encounters + curiosities + evolutions */}
      <div className="border-border bg-muted/40 h-44 animate-pulse rounded-2xl border" />
      <div className="border-border bg-muted/40 h-52 animate-pulse rounded-2xl border" />
      <div className="border-border bg-muted/40 h-48 animate-pulse rounded-2xl border" />
    </div>
  );
}
