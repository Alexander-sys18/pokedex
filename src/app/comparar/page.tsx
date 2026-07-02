import { GitCompareArrows, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ComparatorControls } from "@/components/compare/comparator-controls";
import { ComparisonView } from "@/components/compare/comparison-view";
import { LinkPending } from "@/components/ui/link-pending";
import { getPokedex } from "@/lib/pokedex";
import { NATIONAL_DEX_MAX } from "@/lib/pokedex/constants";
import { getPokemonDetail } from "@/lib/pokedex/detail";

export const metadata: Metadata = {
  title: "Comparador",
  description:
    "Compara dos Pokémon lado a lado: estadísticas base, tipos, debilidades y atributos.",
};

interface PageProps {
  searchParams: Promise<{ a?: string; b?: string }>;
}

/** Classic matchups to fill the empty state with one-tap comparisons. */
const PRESET_MATCHUPS = [
  { label: "Charizard vs Blastoise", href: "/comparar?a=6&b=9" },
  { label: "Pikachu vs Eevee", href: "/comparar?a=25&b=133" },
  { label: "Mewtwo vs Mew", href: "/comparar?a=150&b=151" },
  { label: "Gengar vs Alakazam", href: "/comparar?a=94&b=65" },
  { label: "Rayquaza vs Groudon", href: "/comparar?a=384&b=383" },
];

function parseId(raw: string | undefined): number | null {
  if (!raw || !/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return id <= NATIONAL_DEX_MAX ? id : null;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { a, b } = await searchParams;
  const aId = parseId(a);
  const bId = parseId(b);

  const [pokedex, aDetail, bDetail] = await Promise.all([
    getPokedex(),
    aId ? getPokemonDetail(aId) : Promise.resolve(null),
    bId ? getPokemonDetail(bId) : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <section
        className="hero-panel border-border relative overflow-hidden rounded-3xl border p-4 sm:p-6"
        style={{ ["--type" as string]: "#6366f1" }}
      >
        <h1 className="text-foreground flex items-center gap-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
          <GitCompareArrows className="size-7" />
          Comparador
        </h1>
        <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm sm:text-base">
          Elige dos Pokémon y compáralos lado a lado: veredicto, estadísticas en verde/rojo,
          atributos y debilidades por tipo. El enlace es compartible.
        </p>
      </section>

      <ComparatorControls entries={pokedex.entries} aId={aDetail?.id ?? null} bId={bDetail?.id ?? null} />

      {aDetail && bDetail ? (
        <ComparisonView a={aDetail} b={bDetail} />
      ) : (
        <div className="border-border text-muted-foreground flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-4 py-12 text-center">
          <GitCompareArrows className="size-8 opacity-60" />
          <p className="text-sm">
            {aDetail || bDetail
              ? "Elige un segundo Pokémon para ver la comparación."
              : "Elige dos Pokémon para empezar a comparar."}
          </p>
          <div className="flex flex-col items-center gap-2">
            <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
              <Sparkles className="size-3.5" aria-hidden />
              O prueba un duelo clásico:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {PRESET_MATCHUPS.map((preset) => (
                <Link
                  key={preset.href}
                  href={preset.href}
                  className="border-border bg-surface text-foreground hover:bg-surface-hover focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {preset.label}
                  <LinkPending mode="inline" className="size-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
