"use client";

import { Loader2, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { NATIONAL_DEX_MAX } from "@/lib/pokedex/constants";
import { cn } from "@/lib/utils";

/** Jumps to a random Pokémon's page, with pending feedback while it loads. */
export function SurpriseButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const surprise = () => {
    const id = 1 + Math.floor(Math.random() * NATIONAL_DEX_MAX);
    startTransition(() => router.push(`/pokemon/${id}`));
  };

  return (
    <button
      type="button"
      onClick={surprise}
      disabled={isPending}
      aria-busy={isPending}
      className={cn(
        "border-border bg-surface/80 text-foreground hover:bg-surface-hover focus-visible:ring-ring inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-70",
        className,
      )}
    >
      {isPending ? (
        <Loader2 className="size-4 shrink-0 animate-spin" />
      ) : (
        <Shuffle className="size-4 shrink-0" />
      )}
      {isPending ? "Buscando…" : "Sorpréndeme"}
    </button>
  );
}
