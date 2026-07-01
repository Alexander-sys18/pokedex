export default function PokemonDetailLoading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="bg-muted h-5 w-40 animate-pulse rounded" />

      <section className="border-border rounded-3xl border p-6 sm:p-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,300px)_1fr] md:items-center">
          <div className="bg-muted mx-auto aspect-square w-full max-w-[300px] animate-pulse rounded-full" />
          <div className="flex flex-col gap-4">
            <div className="bg-muted h-4 w-40 animate-pulse rounded" />
            <div className="bg-muted h-12 w-64 animate-pulse rounded-lg" />
            <div className="flex gap-2">
              <div className="bg-muted h-7 w-20 animate-pulse rounded-full" />
              <div className="bg-muted h-7 w-20 animate-pulse rounded-full" />
            </div>
            <div className="bg-muted h-16 w-full max-w-xl animate-pulse rounded" />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="border-border bg-muted/40 h-72 animate-pulse rounded-2xl border" />
        <div className="border-border bg-muted/40 h-72 animate-pulse rounded-2xl border" />
      </div>
      <div className="border-border bg-muted/40 h-48 animate-pulse rounded-2xl border" />
    </div>
  );
}
