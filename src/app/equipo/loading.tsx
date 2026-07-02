/** Route-level skeleton shown while the team builder page loads. */
export default function TeamLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Cargando constructor de equipo"
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <section className="flex flex-col gap-2">
        <div className="bg-muted h-9 w-72 animate-pulse rounded-lg" />
        <div className="bg-muted h-4 w-full max-w-xl animate-pulse rounded" />
      </section>

      {/* Picker */}
      <div className="bg-muted h-11 w-full max-w-md animate-pulse rounded-xl" />

      {/* Six team slots */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-border bg-surface rounded-2xl border p-3">
            <div className="bg-muted mx-auto size-20 animate-pulse rounded-full" />
            <div className="bg-muted mx-auto mt-3 h-4 w-16 animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Analysis panels */}
      <div className="grid gap-5 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="border-border bg-surface rounded-2xl border p-5 sm:p-6">
            <div className="bg-muted mb-4 h-6 w-48 animate-pulse rounded" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="bg-muted h-6 w-16 animate-pulse rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
