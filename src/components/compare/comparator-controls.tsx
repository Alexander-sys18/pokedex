"use client";

import { Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PokemonPicker } from "@/components/pokedex/pokemon-picker";
import { pixelSprite } from "@/lib/pokedex/image";
import type { PokedexEntry } from "@/lib/pokedex/types";
import { formatDexNumber, prettifyName } from "@/lib/utils";

interface ComparatorControlsProps {
  entries: PokedexEntry[];
  aId: number | null;
  bId: number | null;
}

/**
 * Two Pokémon slots that drive the comparison through the URL (`?a=&b=`), so a
 * comparison is shareable and the server re-renders with real detail data on
 * every change. The selection is applied optimistically: the chosen Pokémon
 * appears in its slot immediately, with a spinner while the server loads the
 * comparison data.
 */
export function ComparatorControls({ entries, aId, bId }: ComparatorControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // What the user just picked, shown while the navigation is in flight.
  const [optimistic, setOptimistic] = useState<{ a: number | null; b: number | null } | null>(null);

  // Server-confirmed props changing means a navigation committed (ours or an
  // external one, e.g. the back button) — drop the optimistic pick so a stale
  // selection can never outlive the state it anticipated.
  const [lastConfirmed, setLastConfirmed] = useState({ aId, bId });
  if (lastConfirmed.aId !== aId || lastConfirmed.bId !== bId) {
    setLastConfirmed({ aId, bId });
    setOptimistic(null);
  }

  const navigate = (a: number | null, b: number | null) => {
    setOptimistic({ a, b });
    const params = new URLSearchParams();
    if (a) params.set("a", String(a));
    if (b) params.set("b", String(b));
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/comparar?${qs}` : "/comparar", { scroll: false });
    });
  };

  // While the transition is pending, trust the optimistic pick; afterwards the
  // server-confirmed props are the source of truth.
  const shownA = isPending && optimistic ? optimistic.a : aId;
  const shownB = isPending && optimistic ? optimistic.b : bId;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative grid gap-3 sm:grid-cols-2">
        <Slot
          entries={entries}
          selectedId={shownA}
          excludeId={shownB}
          label="Primer Pokémon"
          pending={isPending}
          onSelect={(id) => navigate(id, shownB)}
          onClear={() => navigate(null, shownB)}
        />
        <Slot
          entries={entries}
          selectedId={shownB}
          excludeId={shownA}
          label="Segundo Pokémon"
          pending={isPending}
          onSelect={(id) => navigate(shownA, id)}
          onClear={() => navigate(shownA, null)}
        />
      </div>

      {isPending ? (
        <p
          role="status"
          className="text-muted-foreground inline-flex items-center gap-2 text-xs font-medium"
        >
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Cargando comparación…
        </p>
      ) : null}
    </div>
  );
}

function Slot({
  entries,
  selectedId,
  excludeId,
  label,
  pending,
  onSelect,
  onClear,
}: {
  entries: PokedexEntry[];
  selectedId: number | null;
  excludeId: number | null;
  label: string;
  pending: boolean;
  onSelect: (id: number) => void;
  onClear: () => void;
}) {
  const selected = selectedId ? entries.find((entry) => entry.id === selectedId) : null;

  if (selected) {
    return (
      <div className="border-border bg-surface flex items-center gap-3 rounded-xl border px-3 py-2">
        <Image
          src={pixelSprite(selected.id)}
          alt=""
          width={40}
          height={40}
          unoptimized
          className="size-10 shrink-0 [image-rendering:pixelated]"
        />
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-semibold">
            {prettifyName(selected.name)}
          </p>
          <p className="text-muted-foreground font-mono text-xs">{formatDexNumber(selected.id)}</p>
        </div>
        {pending ? (
          <Loader2
            role="status"
            aria-label="Cargando…"
            className="text-muted-foreground size-4 shrink-0 animate-spin"
          />
        ) : (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Quitar ${prettifyName(selected.name)}`}
            className="text-muted-foreground hover:bg-muted hover:text-foreground grid size-8 shrink-0 place-items-center rounded-full transition-colors"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <PokemonPicker
      entries={entries}
      onSelect={onSelect}
      excludeIds={excludeId ? [excludeId] : []}
      placeholder={`${label}…`}
    />
  );
}
