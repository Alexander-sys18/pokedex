import { ChevronLeft, ChevronRight, Crosshair, Scale, Swords, Trophy } from "lucide-react";
import Link from "next/link";
import { PokemonArtwork } from "@/components/pokemon/pokemon-artwork";
import { TypeBadge } from "@/components/pokemon/type-badge";
import { TypeEffectiveness } from "@/components/pokemon/type-effectiveness";
import { LinkPending } from "@/components/ui/link-pending";
import { primaryTypeColor } from "@/lib/pokedex/colors";
import { MAX_BASE_STAT, STAT_LABELS_ES, STAT_ORDER, TYPE_LABELS_ES } from "@/lib/pokedex/constants";
import { defensiveEffectiveness } from "@/lib/pokedex/type-chart";
import type { PokemonDetail, PokemonTypeName } from "@/lib/pokedex/types";
import { cn, formatDexNumber, prettifyName } from "@/lib/utils";

const numberFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

/* Win/lose/tie palette — the user-facing convention across the whole page:
   green = wins that row, red = loses it, gray = tied. */
const WIN_BAR = "#10b981"; // --color-success
const LOSE_BAR = "#ef4444"; // --color-brand (semantic red)
const TIE_BAR = "#94a3b8"; // slate-400
const WIN_TEXT = "text-emerald-600 dark:text-emerald-400";
const LOSE_TEXT = "text-red-600 dark:text-red-400";

function statValue(detail: PokemonDetail, name: string): number {
  return detail.stats.find((stat) => stat.name === name)?.base ?? 0;
}

/**
 * Best damage multiplier the attacker lands on the defender using its own
 * types (STAB). Picking the max means an immunity (×0) only "wins" when every
 * one of the attacker's types is nullified — and showing "×0" in that case is
 * exactly the right verdict: it can't touch the defender with STAB at all.
 */
function bestOffense(
  attacker: PokemonDetail,
  defender: PokemonDetail,
): { multiplier: number; type: PokemonTypeName } {
  const effectiveness = defensiveEffectiveness(defender.types);
  let best = -1;
  let bestType = attacker.types[0]!;
  for (const type of attacker.types) {
    const multiplier = effectiveness.get(type) ?? 1;
    if (multiplier > best) {
      best = multiplier;
      bestType = type;
    }
  }
  return { multiplier: best, type: bestType };
}

function formatMultiplier(value: number): string {
  if (value === 0.25) return "×¼";
  if (value === 0.5) return "×½";
  return `×${value}`;
}

/**
 * Side-by-side comparison of two Pokémon. Every row declares its winner in
 * color (green wins / red loses / gray tie), a verdict panel sums up stat
 * duels, totals and type advantage, and the numeric deltas are spelled out.
 * Pure server render — all data comes from the two details.
 */
export function ComparisonView({ a, b }: { a: PokemonDetail; b: PokemonDetail }) {
  const accentA = primaryTypeColor(a.types);
  const accentB = primaryTypeColor(b.types);
  const nameA = prettifyName(a.name);
  const nameB = prettifyName(b.name);

  // Per-stat duels.
  const duels = STAT_ORDER.map((statName) => {
    const va = statValue(a, statName);
    const vb = statValue(b, statName);
    return { statName, va, vb };
  });
  const statsWonA = duels.filter((d) => d.va > d.vb).length;
  const statsWonB = duels.filter((d) => d.vb > d.va).length;
  const statTies = duels.length - statsWonA - statsWonB;

  // Type matchup between the two (best STAB multiplier in each direction).
  const offenseAB = bestOffense(a, b);
  const offenseBA = bestOffense(b, a);

  // Overall forecast: stat duels + base total + type advantage, one point each.
  let scoreA = 0;
  let scoreB = 0;
  if (statsWonA > statsWonB) scoreA += 1;
  else if (statsWonB > statsWonA) scoreB += 1;
  if (a.statTotal > b.statTotal) scoreA += 1;
  else if (b.statTotal > a.statTotal) scoreB += 1;
  if (offenseAB.multiplier > offenseBA.multiplier) scoreA += 1;
  else if (offenseBA.multiplier > offenseAB.multiplier) scoreB += 1;
  const favorite = scoreA > scoreB ? nameA : scoreB > scoreA ? nameB : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Headers */}
      <div className="relative grid grid-cols-2 gap-3">
        <PokemonHeader detail={a} accent={accentA} />
        <PokemonHeader detail={b} accent={accentB} />
        <span
          aria-hidden
          className="border-border bg-popover text-muted-foreground absolute top-1/2 left-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-[0.65rem] font-black shadow-[var(--shadow-card)] sm:size-10 sm:text-xs"
        >
          VS
        </span>
      </div>

      {/* Verdict */}
      <section className="border-border bg-surface rounded-2xl border p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-foreground text-lg font-semibold">Veredicto</h2>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
              favorite
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Trophy className="size-3.5" aria-hidden />
            {favorite ? `Favorito: ${favorite}` : "Empate técnico"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <VerdictTile
            icon={<Swords className="size-4" aria-hidden />}
            label="Duelos de stats"
            detail={statTies > 0 ? `${statTies} en empate` : "sin empates"}
          >
            <p className="font-mono text-2xl font-bold tabular-nums">
              <span className={duelTone(statsWonA, statsWonB)}>{statsWonA}</span>
              <span className="text-muted-foreground mx-1.5 text-base font-medium">–</span>
              <span className={duelTone(statsWonB, statsWonA)}>{statsWonB}</span>
            </p>
          </VerdictTile>

          <VerdictTile
            icon={<Scale className="size-4" aria-hidden />}
            label="Total de stats base"
            detail={
              a.statTotal === b.statTotal
                ? "empate exacto"
                : `${a.statTotal > b.statTotal ? nameA : nameB} +${Math.abs(a.statTotal - b.statTotal)}`
            }
          >
            <p className="font-mono text-2xl font-bold tabular-nums">
              <span className={duelTone(a.statTotal, b.statTotal)}>{a.statTotal}</span>
              <span className="text-muted-foreground mx-1.5 text-base font-medium">–</span>
              <span className={duelTone(b.statTotal, a.statTotal)}>{b.statTotal}</span>
            </p>
          </VerdictTile>

          <VerdictTile
            icon={<Crosshair className="size-4" aria-hidden />}
            label="Ventaja de tipos"
            detail="mejor ataque con sus propios tipos"
          >
            <div className="flex flex-col gap-1 text-sm">
              <TypeAdvantageLine
                attacker={nameA}
                offense={offenseAB}
                wins={offenseAB.multiplier > offenseBA.multiplier}
                loses={offenseAB.multiplier < offenseBA.multiplier}
              />
              <TypeAdvantageLine
                attacker={nameB}
                offense={offenseBA}
                wins={offenseBA.multiplier > offenseAB.multiplier}
                loses={offenseBA.multiplier < offenseAB.multiplier}
              />
            </div>
          </VerdictTile>
        </div>
      </section>

      {/* Stats — facing bars, winner in green / loser in red */}
      <section className="border-border bg-surface rounded-2xl border p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-foreground text-lg font-semibold">Estadísticas base</h2>
          <p className="text-muted-foreground text-xs">
            <span className={cn("font-semibold", WIN_TEXT)}>Verde</span> gana el duelo ·{" "}
            <span className={cn("font-semibold", LOSE_TEXT)}>rojo</span> lo pierde · gris empate
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          {duels.map(({ statName, va, vb }, index) => (
            <div
              key={statName}
              className="grid grid-cols-[2rem_1fr_4.75rem_1fr_2rem] items-center gap-1.5 sm:grid-cols-[2.5rem_1fr_6.5rem_1fr_2.5rem] sm:gap-2"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span
                className={cn(
                  "text-right font-mono text-sm tabular-nums",
                  duelTone(va, vb),
                  va > vb && "font-bold",
                )}
              >
                {va}
              </span>
              <div className="flex justify-end">
                <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
                  <div
                    className="animate-meter ml-auto h-full rounded-full"
                    style={{
                      ["--fill" as string]: `${Math.min(100, (va / MAX_BASE_STAT) * 100)}%`,
                      backgroundColor: barColor(va, vb),
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-muted-foreground text-center text-xs font-medium">
                  {STAT_LABELS_ES[statName] ?? statName}
                </span>
                <DeltaBadge va={va} vb={vb} />
              </div>
              <div className="flex justify-start">
                <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
                  <div
                    className="animate-meter h-full rounded-full"
                    style={{
                      ["--fill" as string]: `${Math.min(100, (vb / MAX_BASE_STAT) * 100)}%`,
                      backgroundColor: barColor(vb, va),
                    }}
                  />
                </div>
              </div>
              <span
                className={cn(
                  "font-mono text-sm tabular-nums",
                  duelTone(vb, va),
                  vb > va && "font-bold",
                )}
              >
                {vb}
              </span>
            </div>
          ))}

          {/* Totals */}
          <div className="border-border mt-1 grid grid-cols-[1fr_4.75rem_1fr] items-center gap-1.5 border-t pt-3 sm:grid-cols-[1fr_6.5rem_1fr] sm:gap-2">
            <span
              className={cn(
                "text-right font-mono text-base font-bold tabular-nums",
                duelTone(a.statTotal, b.statTotal),
              )}
            >
              {a.statTotal}
            </span>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-muted-foreground text-center text-xs font-semibold">Total</span>
              <DeltaBadge va={a.statTotal} vb={b.statTotal} />
            </div>
            <span
              className={cn(
                "font-mono text-base font-bold tabular-nums",
                duelTone(b.statTotal, a.statTotal),
              )}
            >
              {b.statTotal}
            </span>
          </div>
        </div>
      </section>

      {/* Key attributes */}
      <section className="border-border bg-surface rounded-2xl border p-4 sm:p-6">
        <h2 className="text-foreground mb-4 text-lg font-semibold">Atributos</h2>
        <div className="divide-border flex flex-col divide-y">
          <AttrRow
            label="Altura"
            a={`${numberFormat.format(a.heightMeters)} m`}
            b={`${numberFormat.format(b.heightMeters)} m`}
            delta={attrDelta(a.heightMeters, b.heightMeters, "m")}
          />
          <AttrRow
            label="Peso"
            a={`${numberFormat.format(a.weightKilograms)} kg`}
            b={`${numberFormat.format(b.weightKilograms)} kg`}
            delta={attrDelta(a.weightKilograms, b.weightKilograms, "kg")}
          />
          <AttrRow
            label="Exp. base"
            a={a.baseExperience !== null ? String(a.baseExperience) : "—"}
            b={b.baseExperience !== null ? String(b.baseExperience) : "—"}
            delta={
              a.baseExperience !== null && b.baseExperience !== null
                ? attrDelta(a.baseExperience, b.baseExperience, "pts")
                : null
            }
          />
          <AttrRow
            label="Ratio captura"
            a={a.captureRate !== null ? `${a.captureRate}/255` : "—"}
            b={b.captureRate !== null ? `${b.captureRate}/255` : "—"}
            delta={
              a.captureRate !== null && b.captureRate !== null
                ? attrDelta(a.captureRate, b.captureRate, "")
                : null
            }
          />
        </div>
      </section>

      {/* Defensive matchups */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="border-border bg-surface rounded-2xl border p-4 sm:p-6">
          <h3 className="text-foreground mb-3 text-base font-semibold">{nameA} · debilidades</h3>
          <TypeEffectiveness types={a.types} />
        </section>
        <section className="border-border bg-surface rounded-2xl border p-4 sm:p-6">
          <h3 className="text-foreground mb-3 text-base font-semibold">{nameB} · debilidades</h3>
          <TypeEffectiveness types={b.types} />
        </section>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- helpers */

/** Green when `own` beats `other`, red when it loses, muted on a tie. */
function duelTone(own: number, other: number): string {
  if (own > other) return WIN_TEXT;
  if (own < other) return LOSE_TEXT;
  return "text-muted-foreground";
}

function barColor(own: number, other: number): string {
  if (own > other) return WIN_BAR;
  if (own < other) return LOSE_BAR;
  return TIE_BAR;
}

/** Signed difference pointing at the winner: "◀ +12" (A) or "+12 ▶" (B). */
function DeltaBadge({ va, vb }: { va: number; vb: number }) {
  if (va === vb) {
    return <span className="text-muted-foreground font-mono text-[0.65rem]">=</span>;
  }
  const diff = Math.abs(va - vb);
  const aWins = va > vb;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-[0.65rem] font-semibold tabular-nums",
        WIN_TEXT,
      )}
    >
      {aWins ? <ChevronLeft className="size-3" aria-hidden /> : null}+{diff}
      {!aWins ? <ChevronRight className="size-3" aria-hidden /> : null}
    </span>
  );
}

function VerdictTile({
  icon,
  label,
  detail,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border bg-background/40 flex flex-col gap-1.5 rounded-xl border p-4">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        {icon}
        {label}
      </p>
      {children}
      <p className="text-muted-foreground text-xs">{detail}</p>
    </div>
  );
}

function TypeAdvantageLine({
  attacker,
  offense,
  wins,
  loses,
}: {
  attacker: string;
  offense: { multiplier: number; type: PokemonTypeName };
  wins: boolean;
  loses: boolean;
}) {
  return (
    <p className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground truncate text-xs">{attacker}</span>
      <span
        className={cn(
          "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-xs font-bold",
          wins && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
          loses && "bg-red-500/15 text-red-600 dark:text-red-400",
          !wins && !loses && "bg-muted text-muted-foreground",
        )}
        title={`Su mejor ataque es de tipo ${TYPE_LABELS_ES[offense.type]}`}
      >
        {formatMultiplier(offense.multiplier)} {TYPE_LABELS_ES[offense.type]}
      </span>
    </p>
  );
}

function attrDelta(va: number, vb: number, unit: string): string | null {
  if (va === vb) return null;
  const diff = Math.abs(va - vb);
  return `Δ ${numberFormat.format(diff)}${unit ? ` ${unit}` : ""}`;
}

function PokemonHeader({ detail, accent }: { detail: PokemonDetail; accent: string }) {
  return (
    <Link
      href={`/pokemon/${detail.id}`}
      className="detail-hero border-border hover:border-border-strong group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border p-4 text-center transition-colors"
      style={{ ["--type" as string]: accent }}
    >
      <div className="relative aspect-square w-full max-w-[140px]">
        <div className="type-aura absolute inset-0 rounded-full" aria-hidden />
        <PokemonArtwork
          id={detail.id}
          alt={prettifyName(detail.name)}
          sizes="140px"
          className="drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <span className="text-muted-foreground font-mono text-xs">{formatDexNumber(detail.id)}</span>
      <span className="text-foreground text-lg font-bold tracking-tight">
        {prettifyName(detail.name)}
      </span>
      <div className="flex flex-wrap justify-center gap-1.5">
        {detail.types.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>
      <LinkPending />
    </Link>
  );
}

function AttrRow({
  label,
  a,
  b,
  delta,
}: {
  label: string;
  a: string;
  b: string;
  delta: string | null;
}) {
  return (
    <div className="grid grid-cols-[1fr_7rem_1fr] items-center gap-2 py-2.5 text-sm">
      <span className="text-foreground text-right font-medium tabular-nums">{a}</span>
      <span className="text-muted-foreground flex flex-col items-center text-center text-xs">
        {label}
        {delta ? <span className="font-mono text-[0.65rem] tabular-nums">{delta}</span> : null}
      </span>
      <span className="text-foreground font-medium tabular-nums">{b}</span>
    </div>
  );
}
