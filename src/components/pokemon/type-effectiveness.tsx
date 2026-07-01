import { TypeBadge } from "@/components/pokemon/type-badge";
import { defensiveGroups } from "@/lib/pokedex/type-chart";
import type { PokemonTypeName } from "@/lib/pokedex/types";

/** Weaknesses / resistances / immunities computed from the embedded type chart. */
export function TypeEffectiveness({ types }: { types: PokemonTypeName[] }) {
  const groups = defensiveGroups(types);

  const rows: { label: string; badge: string; tone: string; items: PokemonTypeName[] }[] = [
    { label: "Muy débil contra", badge: "×4", tone: "text-red-500", items: groups.x4 },
    { label: "Débil contra", badge: "×2", tone: "text-orange-500", items: groups.x2 },
    { label: "Resistente a", badge: "×½", tone: "text-emerald-600", items: groups.half },
    { label: "Muy resistente a", badge: "×¼", tone: "text-emerald-500", items: groups.quarter },
    { label: "Inmune a", badge: "×0", tone: "text-sky-500", items: groups.zero },
  ];

  const visible = rows.filter((row) => row.items.length > 0);

  return (
    <div className="flex flex-col gap-4">
      {visible.map((row) => (
        <div key={row.badge} className="flex flex-col gap-1.5">
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <span className={`font-mono text-xs font-bold ${row.tone}`}>{row.badge}</span>
            {row.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {row.items.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </div>
      ))}
      <p className="text-muted-foreground mt-auto text-xs">
        Multiplicadores de daño recibido según el tipo del ataque (tabla Gen VI+).
      </p>
    </div>
  );
}
