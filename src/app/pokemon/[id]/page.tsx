import { ChevronLeft, ChevronRight, Ruler, Sparkles, Weight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/pokemon/back-button";
import { EvolutionChain } from "@/components/pokemon/evolution-chain";
import { PokemonArtwork } from "@/components/pokemon/pokemon-artwork";
import { StatBars } from "@/components/pokemon/stat-bars";
import { TypeBadge } from "@/components/pokemon/type-badge";
import { primaryTypeColor } from "@/lib/pokedex/colors";
import { GENERATION_REGIONS, NATIONAL_DEX_MAX, generationLabel } from "@/lib/pokedex/constants";
import { getPokemonDetail } from "@/lib/pokedex/detail";
import { cn, formatDexNumber, prettifyName } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

function parseId(raw: string): number | null {
  // Only a canonical integer string is a valid id — reject "1e3", "0x10",
  // "25.0", " 25 ", leading zeros, etc. so each Pokémon has a single URL.
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return id <= NATIONAL_DEX_MAX ? id : null;
}

const numberFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const parsed = parseId((await params).id);
  if (!parsed) return { title: "Pokémon no encontrado" };
  // Deduped with the page render via React cache() — a single PokéAPI fetch.
  const detail = await getPokemonDetail(parsed);
  if (!detail) return { title: "Pokémon no encontrado" };
  return {
    title: `${prettifyName(detail.name)} ${formatDexNumber(detail.id)}`,
    description: detail.description ?? undefined,
  };
}

export default async function PokemonDetailPage({ params }: PageProps) {
  const parsed = parseId((await params).id);
  if (!parsed) notFound();

  const detail = await getPokemonDetail(parsed);
  if (!detail) notFound();

  const accent = primaryTypeColor(detail.types);
  const region = GENERATION_REGIONS[detail.generation];
  const hasPrev = detail.id > 1;
  const hasNext = detail.id < NATIONAL_DEX_MAX;

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center justify-between">
        <BackButton />
        <div className="flex items-center gap-1">
          <DexNavLink id={detail.id - 1} enabled={hasPrev} direction="prev" />
          <DexNavLink id={detail.id + 1} enabled={hasNext} direction="next" />
        </div>
      </nav>

      {/* Hero */}
      <section
        className="detail-hero border-border relative overflow-hidden rounded-3xl border p-6 sm:p-8"
        style={{ ["--type" as string]: accent }}
      >
        <div className="grid gap-6 md:grid-cols-[minmax(0,300px)_1fr] md:items-center">
          <div className="relative mx-auto aspect-square w-full max-w-[300px]">
            <div className="type-aura absolute inset-0 rounded-full" aria-hidden />
            <PokemonArtwork
              id={detail.id}
              alt={prettifyName(detail.name)}
              sizes="(max-width: 768px) 70vw, 300px"
              priority
              className="drop-shadow-xl"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-muted-foreground font-mono text-sm">
                {formatDexNumber(detail.id)}
              </span>
              <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
                {generationLabel(detail.generation)} · {region}
              </span>
            </div>

            <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
              {prettifyName(detail.name)}
            </h1>

            <div className="flex flex-wrap gap-2">
              {detail.types.map((type) => (
                <TypeBadge key={type} type={type} size="md" />
              ))}
            </div>

            {detail.description ? (
              <p className="text-muted-foreground max-w-xl leading-relaxed">{detail.description}</p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Estadísticas base">
          <StatBars stats={detail.stats} total={detail.statTotal} accent={accent} />
        </Panel>

        <Panel title="Ficha">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <MetaTile
                icon={<Ruler className="size-4" />}
                label="Altura"
                value={`${numberFormat.format(detail.heightMeters)} m`}
              />
              <MetaTile
                icon={<Weight className="size-4" />}
                label="Peso"
                value={`${numberFormat.format(detail.weightKilograms)} kg`}
              />
            </div>
            <div>
              <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-sm font-medium">
                <Sparkles className="size-4" />
                Habilidades
              </p>
              <div className="flex flex-wrap gap-2">
                {detail.abilities.map((ability) => (
                  <span
                    key={ability}
                    className="border-border bg-surface text-foreground rounded-lg border px-2.5 py-1 text-sm"
                  >
                    {prettifyName(ability)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Evoluciones">
        {detail.evolutionRoot ? (
          <EvolutionChain root={detail.evolutionRoot} currentId={detail.id} accent={accent} />
        ) : (
          <p className="text-muted-foreground text-sm">Sin datos de evolución.</p>
        )}
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border bg-surface rounded-2xl border p-5 sm:p-6">
      <h2 className="text-foreground mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function MetaTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border-border bg-background/40 rounded-xl border p-3">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {icon}
        {label}
      </p>
      <p className="text-foreground mt-1 font-semibold">{value}</p>
    </div>
  );
}

function DexNavLink({
  id,
  enabled,
  direction,
}: {
  id: number;
  enabled: boolean;
  direction: "prev" | "next";
}) {
  const label = direction === "prev" ? "Pokémon anterior" : "Pokémon siguiente";
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  if (!enabled) {
    return (
      <span
        aria-hidden
        className="text-muted-foreground/40 grid size-9 place-items-center rounded-lg"
      >
        <Icon className="size-5" />
      </span>
    );
  }

  return (
    <Link
      href={`/pokemon/${id}`}
      aria-label={label}
      className={cn(
        "border-border bg-surface text-muted-foreground grid size-9 place-items-center rounded-lg border transition-colors",
        "hover:bg-surface-hover hover:text-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
      )}
    >
      <Icon className="size-5" />
    </Link>
  );
}
