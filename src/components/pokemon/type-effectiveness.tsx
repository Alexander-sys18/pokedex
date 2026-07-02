import { TypeBadge } from "@/components/pokemon/type-badge";
import { TYPE_LABELS_ES } from "@/lib/pokedex/constants";
import { defensiveGroups, offensiveCoverage } from "@/lib/pokedex/type-chart";
import type { PokemonTypeName } from "@/lib/pokedex/types";

interface Row {
  key: string;
  badge: string;
  label: string;
  /** Plain-language meaning of the multiplier. */
  explain: string;
  tone: string;
  items: PokemonTypeName[];
}

/**
 * Defensive type matchups computed from the embedded Gen VI+ chart (zero extra
 * requests). Beyond listing the types, it spells out what every multiplier
 * *means* — how damage stacks for dual types and why ×4 or ×0 happen — so the
 * panel teaches, not just labels.
 */
export function TypeEffectiveness({
  types,
  showOffense = false,
}: {
  types: PokemonTypeName[];
  /** Also list which types ITS OWN attacks hit super-effectively (detail page). */
  showOffense?: boolean;
}) {
  const groups = defensiveGroups(types);
  const dual = types.length > 1;
  const offense = showOffense
    ? [...offensiveCoverage(types)].filter(([, mult]) => mult >= 2).map(([type]) => type)
    : [];

  const rows: Row[] = [
    {
      key: "x4",
      badge: "×4",
      label: "Muy débil",
      explain: "recibe el cuádruple de daño — sus dos tipos son débiles al mismo ataque",
      tone: "text-red-500",
      items: groups.x4,
    },
    {
      key: "x2",
      badge: "×2",
      label: "Débil",
      explain: "recibe el doble de daño de estos tipos de ataque",
      tone: "text-orange-500",
      items: groups.x2,
    },
    {
      key: "half",
      badge: "×½",
      label: "Resistente",
      explain: "recibe la mitad de daño — encaja bien estos ataques",
      tone: "text-emerald-600",
      items: groups.half,
    },
    {
      key: "quarter",
      badge: "×¼",
      label: "Muy resistente",
      explain: "recibe una cuarta parte del daño — sus dos tipos lo resisten",
      tone: "text-emerald-500",
      items: groups.quarter,
    },
    {
      key: "zero",
      badge: "×0",
      label: "Inmune",
      explain: "no recibe ningún daño — el ataque no le afecta",
      tone: "text-sky-500",
      items: groups.zero,
    },
  ];

  const visible = rows.filter((row) => row.items.length > 0);
  const typeNames = types.map((t) => TYPE_LABELS_ES[t]).join(" / ");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm leading-relaxed">
        Daño que recibe un <span className="text-foreground font-medium">{typeNames}</span> según el
        tipo del ataque.
        {dual ? (
          <>
            {" "}
            Al ser de dos tipos, los multiplicadores se{" "}
            <span className="text-foreground font-medium">multiplican entre sí</span>: por eso
            aparecen los ×4 y ×¼.
          </>
        ) : null}
      </p>

      <div className="flex flex-col gap-3.5">
        {visible.map((row, rowIndex) => (
          <div
            key={row.key}
            className="animate-fade-rise flex flex-col gap-1.5"
            style={{ animationDelay: `${rowIndex * 70}ms` }}
          >
            <div className="flex items-baseline gap-2">
              <span
                className={`inline-flex min-w-9 justify-center rounded-md bg-current/10 px-1.5 py-0.5 font-mono text-xs font-bold ${row.tone}`}
              >
                {row.badge}
              </span>
              <span className="text-foreground text-sm font-semibold">{row.label}</span>
              <span className="text-muted-foreground text-xs">{row.explain}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pl-11">
              {row.items.map((type) => (
                <TypeBadge key={type} type={type} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {offense.length > 0 ? (
        <div className="border-border/60 border-t pt-3">
          <div className="flex items-baseline gap-2">
            <span className="inline-flex min-w-9 justify-center rounded-md bg-current/10 px-1.5 py-0.5 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ⚔
            </span>
            <span className="text-foreground text-sm font-semibold">Ofensiva</span>
            <span className="text-muted-foreground text-xs">
              con sus propios tipos golpea súper efectivo (×2) a
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5 pl-11">
            {offense.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="border-border/60 text-muted-foreground mt-auto border-t pt-3 text-xs leading-relaxed">
        La escala de daño va de ×0 (inmune) a ×4 (doblemente débil), pasando por ×¼, ×½, ×1 (neutro,
        no listado) y ×2. Cálculo con la tabla de tipos oficial de la 6.ª generación en adelante.
      </div>
    </div>
  );
}
