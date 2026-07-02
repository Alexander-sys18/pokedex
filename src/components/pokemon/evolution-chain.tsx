"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { PokemonArtwork } from "@/components/pokemon/pokemon-artwork";
import { LinkPending } from "@/components/ui/link-pending";
import type { EvolutionNode } from "@/lib/pokedex/types";
import { cn, formatDexNumber, prettifyName } from "@/lib/utils";

interface EvolutionChainProps {
  root: EvolutionNode;
  currentId: number;
  accent: string;
}

/** Left-to-right evolution tree. Branches (e.g. Eevee) stack vertically. */
export function EvolutionChain({ root, currentId, accent }: EvolutionChainProps) {
  if (root.children.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3">
        <EvolutionNodeChip node={root} currentId={currentId} accent={accent} />
        <p className="text-muted-foreground text-sm">Este Pokémon no evoluciona.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex w-max min-w-full items-center justify-center gap-2 sm:gap-4">
        <EvolutionBranch node={root} currentId={currentId} accent={accent} />
      </div>
    </div>
  );
}

function EvolutionBranch({
  node,
  currentId,
  accent,
}: {
  node: EvolutionNode;
  currentId: number;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <EvolutionNodeChip node={node} currentId={currentId} accent={accent} />
      {node.children.length > 0 ? (
        <div className="flex flex-col gap-3">
          {node.children.map((child) => (
            <div key={child.id} className="flex items-center gap-2 sm:gap-4">
              {/* Each branch gets its own arrow + evolution method (how the
                  child evolves from THIS node: level, stone, friendship…). */}
              <div className="flex w-20 shrink-0 flex-col items-center gap-0.5 sm:w-24">
                <ChevronRight className="text-muted-foreground size-5" aria-hidden />
                {child.method ? (
                  <span className="text-muted-foreground text-center text-[0.62rem] leading-tight">
                    {child.method}
                  </span>
                ) : null}
              </div>
              <EvolutionBranch node={child} currentId={currentId} accent={accent} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EvolutionNodeChip({
  node,
  currentId,
  accent,
}: {
  node: EvolutionNode;
  currentId: number;
  accent: string;
}) {
  const isCurrent = node.id === currentId;

  return (
    <Link
      href={`/pokemon/${node.id}`}
      aria-label={`${prettifyName(node.name)}${isCurrent ? " (actual)" : ""}`}
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        "group relative flex w-24 shrink-0 flex-col items-center gap-1 rounded-2xl border p-2 transition-all",
        "hover:bg-surface-hover focus-visible:ring-ring hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none",
        isCurrent ? "bg-surface-hover" : "border-border bg-surface",
      )}
      style={isCurrent ? { borderColor: accent, boxShadow: `0 0 0 1px ${accent}` } : undefined}
    >
      {isCurrent ? (
        <span
          className="absolute -top-2 rounded-full px-2 py-0.5 text-[0.6rem] font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          Actual
        </span>
      ) : null}
      <div className="relative aspect-square w-full" style={{ ["--type" as string]: accent }}>
        <div className="type-aura absolute inset-0 rounded-full" aria-hidden />
        <PokemonArtwork
          id={node.id}
          alt={prettifyName(node.name)}
          sizes="96px"
          className="transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <span className="text-muted-foreground font-mono text-[0.6rem]">
        {formatDexNumber(node.id)}
      </span>
      <span className="text-foreground text-center text-xs font-semibold">
        {prettifyName(node.name)}
      </span>
      <LinkPending />
    </Link>
  );
}
