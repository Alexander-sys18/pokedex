/** Route-level skeleton shown while the comparison data loads on the server. */
export default function CompareLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Cargando comparador"
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <section className="flex flex-col gap-2">
        <div className="bg-muted h-9 w-56 animate-pulse rounded-lg" />
        <div className="bg-muted h-4 w-full max-w-xl animate-pulse rounded" />
      </section>

      {/* Slot pickers */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="bg-muted h-14 animate-pulse rounded-xl" />
        <div className="bg-muted h-14 animate-pulse rounded-xl" />
      </div>

      {/* Pokémon headers */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="border-border flex flex-col items-center gap-3 rounded-2xl border p-4"
          >
            <div className="bg-muted size-32 animate-pulse rounded-full" />
            <div className="bg-muted h-5 w-24 animate-pulse rounded" />
            <div className="bg-muted h-4 w-16 animate-pulse rounded-full" />
          </div>
        ))}
      </div>

      {/* Verdict + stats panels */}
      <div className="border-border bg-surface rounded-2xl border p-5 sm:p-6">
        <div className="bg-muted mb-4 h-6 w-32 animate-pulse rounded" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-muted h-24 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
      <div className="border-border bg-surface rounded-2xl border p-5 sm:p-6">
        <div className="bg-muted mb-4 h-6 w-44 animate-pulse rounded" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted h-3 animate-pulse rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
