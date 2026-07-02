import { ArrowRight, GitCompareArrows, Layers, LayoutGrid, Network, Star, Swords, Tag } from "lucide-react";
import Link from "next/link";
import { PokemonArtwork } from "@/components/pokemon/pokemon-artwork";
import { TypeBadge } from "@/components/pokemon/type-badge";
import { LinkPending } from "@/components/ui/link-pending";
import { primaryTypeColor } from "@/lib/pokedex/colors";
import { generationLabel } from "@/lib/pokedex/constants";
import type { PokedexEntry } from "@/lib/pokedex/types";
import { formatDexNumber, prettifyName } from "@/lib/utils";
import { SurpriseButton } from "./surprise-button";

interface HeroFacts {
  pokemon: number;
  families: number;
  generations: number;
  types: number;
}

interface PokedexHeroProps {
  /** Pokémon of the day (picked server-side, changes with ISR revalidation). */
  featured: PokedexEntry;
  facts: HeroFacts;
}

/** Oversized decorative pokéball, used as a hero watermark. */
function PokeballWatermark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="0.8" />
      <path d="M2 12h6a4 4 0 0 1 8 0h6" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

/**
 * Home hero: title + facts + CTAs on the left, the daily featured Pokémon as
 * the visual anchor on the right. The panel is tinted with the featured
 * Pokémon's primary type (`--type` feeds .hero-panel), so it changes each day.
 */
export function PokedexHero({ featured, facts }: PokedexHeroProps) {
  const color = primaryTypeColor(featured.types);

  // Each fact gets its own color from the Pokémon palette (red/blue/amber/green).
  const factChips = [
    {
      icon: LayoutGrid,
      label: `${facts.pokemon} Pokémon`,
      tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
    },
    {
      icon: Network,
      label: `${facts.families} familias evolutivas`,
      tone: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
    },
    {
      icon: Layers,
      label: `${facts.generations} generaciones`,
      tone: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
    },
    {
      icon: Tag,
      label: `${facts.types} tipos`,
      tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    },
  ];

  return (
    <section
      className="hero-panel border-border relative overflow-hidden rounded-3xl border"
      style={{ ["--type" as string]: color }}
    >
      <PokeballWatermark className="text-foreground pointer-events-none absolute -right-14 -bottom-20 size-64 rotate-12 opacity-[0.05] sm:size-80" />

      <div className="relative grid gap-5 p-4 sm:p-6 md:grid-cols-[1fr_auto] md:items-center md:gap-10 md:p-8">
        <div className="flex max-w-2xl flex-col gap-4">
          <span className="border-border bg-surface/70 text-muted-foreground w-fit rounded-full border px-3 py-1 text-xs font-medium backdrop-blur">
            Pokédex Nacional · Generaciones I–IX
          </span>

          <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Explora la Pokédex
          </h1>

          <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
            Busca por nombre —incluyendo su cadena evolutiva—, filtra por tipo y generación, hazle
            una foto a un Pokémon para identificarlo o pregúntale lo que quieras al asistente.
          </p>

          <div className="flex flex-wrap gap-2">
            {factChips.map(({ icon: Icon, label, tone }) => (
              <span
                key={label}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur ${tone}`}
              >
                <Icon className="size-3.5" aria-hidden />
                {label}
              </span>
            ))}
          </div>

          {/* Mobile: aligned grid (primary full-width, secondaries as equal
              halves). From sm: the usual inline row. */}
          <div className="mt-1 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Link
              href="/comparar"
              className="focus-visible:ring-ring col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-4 text-sm font-medium text-white shadow-md shadow-red-500/25 transition-opacity [text-shadow:0_1px_2px_rgb(0_0_0/0.35)] hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
            >
              <GitCompareArrows className="size-4" />
              Comparar Pokémon
              <LinkPending mode="inline" className="text-white" />
            </Link>
            <Link
              href="/equipo"
              className="border-border bg-surface/80 text-foreground hover:bg-surface-hover focus-visible:ring-ring inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none sm:gap-2 sm:px-4 sm:text-sm"
            >
              <Swords className="size-4 shrink-0" />
              {/* Short label in the narrow half-width cell on phones. */}
              <span className="sm:hidden">Mi equipo</span>
              <span className="hidden sm:inline">Armar mi equipo</span>
              <LinkPending mode="inline" />
            </Link>
            <SurpriseButton className="justify-center gap-1.5 px-2.5 text-xs whitespace-nowrap sm:gap-2 sm:px-4 sm:text-sm" />
          </div>
        </div>

        {/* Pokémon of the day — no box: the artwork itself is the visual
            anchor, floating over its circular type-colored aura. */}
        <Link
          href={`/pokemon/${featured.id}`}
          className="group focus-visible:ring-ring relative mx-auto flex w-full max-w-72 flex-col items-center gap-1.5 rounded-3xl text-center focus-visible:ring-2 focus-visible:outline-none md:mx-0 md:w-72"
        >
          <span className="border-border bg-surface/70 text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur">
            <Star className="size-3.5 text-amber-500" aria-hidden />
            Pokémon del día
          </span>

          <div className="oak-float relative aspect-square w-full max-w-52 sm:max-w-56">
            <div className="type-aura absolute inset-2 rounded-full" aria-hidden />
            <PokemonArtwork
              id={featured.id}
              alt=""
              sizes="224px"
              priority
              className="drop-shadow-xl transition-transform duration-300 ease-out group-hover:scale-110"
            />
          </div>

          <span className="text-muted-foreground font-mono text-xs">
            {formatDexNumber(featured.id)} · {generationLabel(featured.generation)}
          </span>
          <span className="text-foreground text-2xl font-bold tracking-tight">
            {prettifyName(featured.name)}
          </span>
          <span className="flex flex-wrap justify-center gap-1.5">
            {featured.types.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </span>

          <span className="text-muted-foreground group-hover:text-foreground mt-1 inline-flex items-center gap-1 text-xs font-medium transition-colors">
            Ver ficha
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>

          <LinkPending />
        </Link>
      </div>
    </section>
  );
}
