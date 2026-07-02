import {
  Award,
  Baby,
  ChevronLeft,
  ChevronRight,
  Crown,
  Egg,
  MapPin,
  Ruler,
  Sparkles,
  Weight,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OakAvatar } from "@/components/chat/oak-avatar";
import { BackButton } from "@/components/pokemon/back-button";
import { EvolutionChain } from "@/components/pokemon/evolution-chain";
import { LinkPending } from "@/components/ui/link-pending";
import { PokemonArtwork } from "@/components/pokemon/pokemon-artwork";
import { PokemonShowcase } from "@/components/pokemon/pokemon-showcase";
import { StatBars } from "@/components/pokemon/stat-bars";
import { StatRadar } from "@/components/pokemon/stat-radar";
import { TcgCards } from "@/components/pokemon/tcg-cards";
import { TypeBadge } from "@/components/pokemon/type-badge";
import { TypeEffectiveness } from "@/components/pokemon/type-effectiveness";
import { getPokedex } from "@/lib/pokedex";
import { primaryTypeColor } from "@/lib/pokedex/colors";
import {
  GENERATION_REGIONS,
  NATIONAL_DEX_MAX,
  STAT_LABELS_ES,
  generationLabel,
} from "@/lib/pokedex/constants";
import { getPokemonDetail } from "@/lib/pokedex/detail";
import { officialArtwork, pixelSprite } from "@/lib/pokedex/image";
import { professorNotes } from "@/lib/pokedex/oak-notes";
import {
  colorLabel,
  eggGroupLabel,
  growthRateLabel,
  habitatLabel,
  locationLabel,
  shapeLabel,
  versionLabel,
} from "@/lib/pokedex/labels";
import type { PokemonDetail } from "@/lib/pokedex/types";
import { getTcgCards } from "@/lib/tcg";
import { cn, formatDexNumber, prettifyName } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Full-page ISR: the rendered HTML is cached per id and revalidated daily, so
 * repeat visits are served statically (no PokéAPI on the request path). The
 * most-clicked pages (Kanto starters + Pikachu) are prerendered at build time;
 * the rest generate on first visit.
 */
export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 25].map((id) => ({ id: String(id) }));
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
  // notFound() here (before the page shell streams) yields a REAL 404 status
  // for /pokemon/abc or /pokemon/9999, not a soft-404 with HTTP 200.
  if (!parsed) notFound();
  // Deduped with the page render via React cache() — a single PokéAPI fetch.
  const detail = await getPokemonDetail(parsed);
  if (!detail) notFound();
  const title = `${prettifyName(detail.name)} ${formatDexNumber(detail.id)}`;
  const description = detail.description ?? undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      // Official artwork as the share card — each Pokémon previews itself.
      images: [{ url: officialArtwork(detail.id), width: 475, height: 475 }],
    },
  };
}

export default async function PokemonDetailPage({ params }: PageProps) {
  const parsed = parseId((await params).id);
  if (!parsed) notFound();

  const [detail, pokedex] = await Promise.all([getPokemonDetail(parsed), getPokedex()]);
  if (!detail) notFound();

  const accent = primaryTypeColor(detail.types);
  const region = GENERATION_REGIONS[detail.generation];
  const prevEntry = pokedex.entries.find((e) => e.id === detail.id - 1) ?? null;
  const nextEntry = pokedex.entries.find((e) => e.id === detail.id + 1) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <nav className="flex items-center justify-between gap-3">
        <BackButton />
        <div className="flex items-center gap-1.5">
          <DexNavLink entry={prevEntry} direction="prev" />
          <DexNavLink entry={nextEntry} direction="next" />
        </div>
      </nav>

      {/* Hero */}
      <section
        className="detail-hero border-border relative overflow-hidden rounded-3xl border p-4 sm:p-8"
        style={{ ["--type" as string]: accent }}
      >
        {/* Its own artwork, blown up and blurred, as an ambient backdrop. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -bottom-28 size-80 opacity-25 blur-2xl saturate-150 sm:size-[26rem]"
        >
          <PokemonArtwork id={detail.id} alt="" sizes="416px" />
        </div>

        {detail.japaneseName ? (
          <span
            aria-hidden
            className="text-foreground pointer-events-none absolute -top-3 right-2 text-7xl font-black tracking-tighter opacity-[0.06] select-none sm:text-8xl"
          >
            {detail.japaneseName}
          </span>
        ) : null}

        <div className="relative grid gap-6 md:grid-cols-[minmax(0,300px)_1fr] md:items-center">
          <PokemonShowcase
            id={detail.id}
            accent={accent}
            alt={prettifyName(detail.name)}
            cry={detail.cries}
          />

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-mono text-sm">
                {formatDexNumber(detail.id)}
              </span>
              <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
                {generationLabel(detail.generation)} · {region}
              </span>
              {detail.genus ? (
                <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
                  {detail.genus}
                </span>
              ) : null}
              {detail.isLegendary ? (
                <LoreBadge icon={<Crown className="size-3" />} label="Legendario" tone="amber" />
              ) : null}
              {detail.isMythical ? (
                <LoreBadge icon={<Award className="size-3" />} label="Singular" tone="blue" />
              ) : null}
              {detail.isBaby ? (
                <LoreBadge icon={<Baby className="size-3" />} label="Bebé" tone="pink" />
              ) : null}
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

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
              <MetaTile
                icon={<Sparkles className="size-4" />}
                label="Exp. base"
                value={detail.baseExperience !== null ? String(detail.baseExperience) : "—"}
              />
              <MetaTile
                icon={<Egg className="size-4" />}
                label="Ratio de captura"
                value={detail.captureRate !== null ? `${detail.captureRate}/255` : "—"}
              />
            </div>
          </div>
        </div>
      </section>

      {/* The Professor's field notes — lively prose composed from real data. */}
      <section className="border-border bg-surface rounded-2xl border p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <OakAvatar size={40} className="mt-0.5" />
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Notas del Profesor Oak
            </p>
            <p className="text-foreground mt-1 text-sm leading-relaxed">{professorNotes(detail)}</p>
          </div>
        </div>
      </section>

      {/* Stats + type matchups */}
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <Panel title="Estadísticas base">
          <div className="grid items-center gap-6 xl:grid-cols-[1fr_auto]">
            <StatBars stats={detail.stats} total={detail.statTotal} accent={accent} />
            {/* The hexagonal radar deserves every screen — stacked and
                centered on mobile, beside the bars on wide viewports. */}
            <div className="mx-auto w-full max-w-[220px] xl:mx-0 xl:w-[240px] xl:max-w-none">
              <StatRadar stats={detail.stats} accent={accent} />
            </div>
          </div>
        </Panel>

        <Panel title="Debilidades y resistencias">
          <TypeEffectiveness types={detail.types} showOffense />
        </Panel>
      </div>

      {/* Training / breeding / traits */}
      <div className="grid gap-5 md:grid-cols-3">
        <Panel title="Entrenamiento">
          <div className="flex flex-col gap-4">
            {detail.captureRate !== null ? (
              <MiniMeter
                label="Ratio de captura"
                value={detail.captureRate}
                max={255}
                display={`${detail.captureRate}/255`}
                accent={accent}
              />
            ) : null}
            {detail.baseHappiness !== null ? (
              <MiniMeter
                label="Felicidad base"
                value={detail.baseHappiness}
                max={255}
                display={`${detail.baseHappiness}/255`}
                accent={accent}
              />
            ) : null}
            {detail.growthRate ? (
              <InfoRow label="Crecimiento" value={growthRateLabel(detail.growthRate)} />
            ) : null}
            {detail.baseExperience !== null ? (
              <InfoRow label="Experiencia base" value={`${detail.baseExperience} pts`} />
            ) : null}
            {detail.evYield.length > 0 ? (
              <div>
                <p className="text-muted-foreground mb-1.5 text-sm">Puntos de esfuerzo (EV)</p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.evYield.map((ev) => (
                    <span
                      key={ev.name}
                      className="border-border bg-background/40 text-foreground rounded-lg border px-2 py-0.5 text-xs font-medium"
                    >
                      +{ev.value} {STAT_LABELS_ES[ev.name] ?? prettifyName(ev.name)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel title="Cría">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-muted-foreground mb-1.5 text-sm">Grupos huevo</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.eggGroups.length > 0 ? (
                  detail.eggGroups.map((group) => (
                    <span
                      key={group}
                      className="border-border bg-background/40 text-foreground rounded-lg border px-2 py-0.5 text-xs font-medium"
                    >
                      {eggGroupLabel(group)}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </div>
            </div>
            {detail.hatchCounter !== null ? (
              <InfoRow
                label="Eclosión"
                value={`${detail.hatchCounter} ciclos (≈${(detail.hatchCounter * 255).toLocaleString("es-ES")} pasos)`}
              />
            ) : null}
            <GenderBar rate={detail.genderRate} />
          </div>
        </Panel>

        <Panel title="Rasgos">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-muted-foreground mb-1.5 text-sm">Habilidades</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.abilities.map((ability) => (
                  <span
                    key={ability.name}
                    className={cn(
                      "border-border bg-background/40 text-foreground rounded-lg border px-2 py-0.5 text-xs font-medium",
                      ability.hidden && "border-dashed",
                    )}
                  >
                    {ability.name}
                    {ability.hidden ? (
                      <span className="text-muted-foreground"> · oculta</span>
                    ) : null}
                  </span>
                ))}
              </div>
            </div>
            {detail.habitat ? (
              <InfoRow label="Hábitat" value={habitatLabel(detail.habitat)} />
            ) : null}
            {detail.color ? <InfoRow label="Color" value={colorLabel(detail.color)} /> : null}
            {detail.shape ? <InfoRow label="Silueta" value={shapeLabel(detail.shape)} /> : null}
            {detail.heldItems.length > 0 ? (
              <InfoRow label="Objetos salvajes" value={detail.heldItems.slice(0, 4).join(", ")} />
            ) : null}
          </div>
        </Panel>
      </div>

      {/* Where to find it */}
      <Panel title="Dónde encontrarlo">
        <Encounters detail={detail} />
      </Panel>

      {/* Extra Pokédex entries */}
      {detail.flavorEntries.length > 0 ? (
        <Panel title="Curiosidades de la Pokédex">
          <div className="grid gap-3 sm:grid-cols-2">
            {detail.flavorEntries.map((entry, index) => (
              <figure
                key={index}
                className="border-border bg-background/40 flex flex-col rounded-xl border p-4"
              >
                <blockquote className="text-foreground text-sm leading-relaxed">
                  «{entry.text}»
                </blockquote>
                {entry.version ? (
                  <figcaption className="text-muted-foreground mt-2 text-xs">
                    — Pokémon {versionLabel(entry.version)}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </Panel>
      ) : null}

      {/* Evolutions */}
      <Panel title="Evoluciones">
        {detail.evolutionRoot ? (
          <EvolutionChain root={detail.evolutionRoot} currentId={detail.id} accent={accent} />
        ) : (
          <p className="text-muted-foreground text-sm">Sin datos de evolución.</p>
        )}
      </Panel>

      {/* Trading cards — streamed via Suspense so TCGdex never blocks the page. */}
      <Suspense fallback={<CardsSkeleton />}>
        <CardsSection name={detail.name} />
      </Suspense>

      {/* Alternative forms */}
      {detail.varieties.length > 0 ? (
        <Panel title="Otras formas">
          <div className="flex flex-wrap gap-3">
            {detail.varieties.slice(0, 8).map((variety) => (
              <div
                key={variety.id}
                className="border-border bg-background/40 flex w-28 flex-col items-center gap-1.5 rounded-2xl border p-3"
              >
                <div className="relative aspect-square w-full">
                  <PokemonArtwork id={variety.id} alt={variety.name} sizes="112px" />
                </div>
                <span className="text-foreground text-center text-xs font-medium">
                  {variety.name}
                </span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            Megaevoluciones, formas regionales y otras variantes de este Pokémon.
          </p>
        </Panel>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- helpers */

/** Async section streamed after the main content; hides itself if no cards. */
async function CardsSection({ name }: { name: string }) {
  const cards = await getTcgCards(name);
  if (cards.length === 0) return null;
  return (
    <Panel title="Cartas del JCC">
      <TcgCards cards={cards} />
    </Panel>
  );
}

function CardsSkeleton() {
  return (
    <section className="border-border bg-surface rounded-2xl border p-5 sm:p-6" aria-hidden>
      <div className="bg-muted mb-4 h-6 w-36 animate-pulse rounded" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-muted aspect-[63/88] w-36 shrink-0 animate-pulse rounded-lg" />
        ))}
      </div>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border bg-surface rounded-2xl border p-4 sm:p-6">
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-right font-medium">{value}</span>
    </div>
  );
}

function MiniMeter({
  label,
  value,
  max,
  display,
  accent,
}: {
  label: string;
  value: number;
  max: number;
  display: string;
  accent: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-mono text-xs font-semibold">{display}</span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          className="animate-meter h-full rounded-full"
          style={{
            ["--fill" as string]: `${Math.min(100, (value / max) * 100)}%`,
            backgroundColor: accent,
          }}
        />
      </div>
    </div>
  );
}

function GenderBar({ rate }: { rate: number | null }) {
  if (rate === null) return null;
  if (rate === -1) {
    return <InfoRow label="Género" value="Sin género" />;
  }
  const female = (rate / 8) * 100;
  const male = 100 - female;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">Género</span>
        <span className="text-foreground text-xs font-medium">
          <span className="text-sky-500">♂ {formatPercentLocal(male)}</span>
          {" · "}
          <span className="text-pink-500">♀ {formatPercentLocal(female)}</span>
        </span>
      </div>
      <div className="bg-muted flex h-2 overflow-hidden rounded-full">
        <div className="h-full bg-sky-500" style={{ width: `${male}%` }} />
        <div className="h-full bg-pink-500" style={{ width: `${female}%` }} />
      </div>
    </div>
  );
}

function formatPercentLocal(value: number): string {
  // Same es-ES locale as height/weight — "87,5%", not "87.5%".
  return `${numberFormat.format(value)}%`;
}

function LoreBadge({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "amber" | "blue" | "pink";
}) {
  const tones = {
    amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    blue: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    pink: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
      )}
    >
      {icon}
      {label}
    </span>
  );
}

const MAX_VERSIONS_SHOWN = 8;
const MAX_LOCATIONS_PER_VERSION = 6;

function Encounters({ detail }: { detail: PokemonDetail }) {
  if (detail.encounters.length === 0) {
    return (
      <div className="flex items-start gap-3">
        <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
        <p className="text-muted-foreground text-sm leading-relaxed">
          La PokéAPI no registra localizaciones salvajes para este Pokémon. Lo habitual en estos
          casos: se consigue <span className="text-foreground font-medium">evolucionando</span> a un
          miembro de su familia, por{" "}
          <span className="text-foreground font-medium">intercambio</span> o en{" "}
          <span className="text-foreground font-medium">eventos</span> — aunque en los juegos más
          recientes (p. ej. Escarlata/Púrpura) puede deberse a que aún no hay datos de encuentros.
        </p>
      </div>
    );
  }

  const shown = detail.encounters.slice(0, MAX_VERSIONS_SHOWN);
  const hiddenCount = detail.encounters.length - shown.length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">
        Localizaciones en estado salvaje, de los juegos más recientes a los más antiguos.
      </p>
      {shown.map(({ version, locations }) => (
        <div key={version} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <span className="border-border bg-background/40 text-foreground w-fit shrink-0 rounded-lg border px-2 py-0.5 text-xs font-semibold sm:w-40">
            {versionLabel(version)}
          </span>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {locations.slice(0, MAX_LOCATIONS_PER_VERSION).map(locationLabel).join(" · ")}
            {locations.length > MAX_LOCATIONS_PER_VERSION
              ? ` · +${locations.length - MAX_LOCATIONS_PER_VERSION} más`
              : ""}
          </p>
        </div>
      ))}
      {hiddenCount > 0 ? (
        <p className="text-muted-foreground text-xs">
          También aparece en {hiddenCount}{" "}
          {hiddenCount === 1 ? "juego anterior" : "juegos anteriores"}.
        </p>
      ) : null}
    </div>
  );
}

function DexNavLink({
  entry,
  direction,
}: {
  entry: { id: number; name: string } | null;
  direction: "prev" | "next";
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  if (!entry) {
    return (
      <span
        aria-hidden
        className="text-muted-foreground/40 grid size-9 place-items-center rounded-lg"
      >
        <Icon className="size-5" />
      </span>
    );
  }

  const label = `${direction === "prev" ? "Anterior" : "Siguiente"}: ${prettifyName(entry.name)}`;

  return (
    <Link
      href={`/pokemon/${entry.id}`}
      aria-label={label}
      title={label}
      className={cn(
        "border-border bg-surface text-muted-foreground flex h-9 items-center gap-1.5 rounded-lg border px-2 transition-colors",
        "hover:bg-surface-hover hover:text-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
      )}
    >
      {direction === "prev" ? <Icon className="size-5" /> : null}
      <Image
        src={pixelSprite(entry.id)}
        alt=""
        width={28}
        height={28}
        unoptimized
        className="size-6 [image-rendering:pixelated] sm:size-7"
      />
      <span className="max-w-14 truncate text-xs font-medium sm:max-w-24">
        {prettifyName(entry.name)}
      </span>
      {direction === "next" ? <Icon className="size-5" /> : null}
      <LinkPending mode="inline" />
    </Link>
  );
}
