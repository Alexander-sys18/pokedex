"use client";

import { Plus, ShieldAlert, ShieldCheck, Swords, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { PokemonArtwork } from "@/components/pokemon/pokemon-artwork";
import { TypeBadge } from "@/components/pokemon/type-badge";
import { PokemonPicker } from "@/components/pokedex/pokemon-picker";
import { primaryTypeColor } from "@/lib/pokedex/colors";
import { POKEMON_TYPES, TYPE_LABELS_ES } from "@/lib/pokedex/constants";
import { defensiveEffectiveness, offensiveCoverage } from "@/lib/pokedex/type-chart";
import type { PokedexEntry, PokemonTypeName } from "@/lib/pokedex/types";
import { addToTeam, clearTeam, MAX_TEAM, removeFromTeam, useTeam } from "@/lib/team";
import { cn, prettifyName } from "@/lib/utils";

interface TeamBuilderProps {
  entries: PokedexEntry[];
}

interface TypeTally {
  type: PokemonTypeName;
  weak: number;
  resist: number;
}

export function TeamBuilder({ entries }: TeamBuilderProps) {
  const teamIds = useTeam();

  const byId = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries]);
  const members = useMemo(
    () => teamIds.map((id) => byId.get(id)).filter((entry): entry is PokedexEntry => Boolean(entry)),
    [teamIds, byId],
  );

  const analysis = useMemo(() => {
    // Per attacking type: how many members are weak (≥2×) / resist (<1×).
    const tallies: TypeTally[] = POKEMON_TYPES.map((type) => ({ type, weak: 0, resist: 0 }));
    const tallyByType = new Map(tallies.map((t) => [t.type, t]));

    for (const member of members) {
      const eff = defensiveEffectiveness(member.types);
      for (const type of POKEMON_TYPES) {
        const multiplier = eff.get(type) ?? 1;
        const tally = tallyByType.get(type)!;
        if (multiplier >= 2) tally.weak += 1;
        else if (multiplier < 1) tally.resist += 1;
      }
    }

    // Offensive coverage from the union of the team's own types (proxy for STAB).
    const attackTypes = [...new Set(members.flatMap((member) => member.types))];
    const coverage = offensiveCoverage(attackTypes);
    const covered = POKEMON_TYPES.filter((type) => (coverage.get(type) ?? 0) >= 2);
    const gaps = POKEMON_TYPES.filter((type) => (coverage.get(type) ?? 0) < 2);

    const weaknesses = tallies
      .filter((t) => t.weak > 0)
      .sort((a, b) => b.weak - a.weak || a.type.localeCompare(b.type));
    const resistances = tallies
      .filter((t) => t.resist > 0)
      .sort((a, b) => b.resist - a.resist || a.type.localeCompare(b.type));

    return { weaknesses, resistances, covered, gaps };
  }, [members]);

  const slots = Array.from({ length: MAX_TEAM }, (_, index) => members[index] ?? null);
  const excludeIds = teamIds;

  return (
    <div className="flex flex-col gap-6">
      {/* Team slots */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {slots.map((member, index) =>
          member ? (
            <TeamSlot key={member.id} member={member} />
          ) : (
            <EmptySlot key={`empty-${index}`} index={index} />
          ),
        )}
      </div>

      {/* Add + clear */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {members.length < MAX_TEAM ? (
          <div className="w-full sm:max-w-sm">
            <PokemonPicker
              entries={entries}
              onSelect={addToTeam}
              excludeIds={excludeIds}
              placeholder="Añadir Pokémon al equipo…"
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Equipo completo ({MAX_TEAM}/6).</p>
        )}
        {members.length > 0 ? (
          <button
            type="button"
            onClick={clearTeam}
            className="border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition-colors"
          >
            <Trash2 className="size-4" />
            Vaciar equipo
          </button>
        ) : null}
      </div>

      {members.length === 0 ? (
        <div className="border-border text-muted-foreground flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <Swords className="size-8 opacity-60" />
          <p className="max-w-md text-sm">
            Añade hasta seis Pokémon y verás el análisis de tipos del equipo: debilidades
            compartidas, resistencias y cobertura ofensiva. El equipo se guarda en tu navegador.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Shared weaknesses */}
          <AnalysisPanel
            title="Debilidades compartidas"
            icon={<ShieldAlert className="size-4 text-red-500" />}
            hint="Tipos de ataque a los que varios miembros son débiles. 3 o más es una alerta."
          >
            {analysis.weaknesses.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {analysis.weaknesses.map(({ type, weak }) => (
                  <li key={type} className="flex items-center justify-between gap-2">
                    <TypeBadge type={type} />
                    <span
                      className={cn(
                        "font-mono text-xs font-semibold",
                        weak >= 3 ? "text-red-500" : "text-muted-foreground",
                      )}
                    >
                      {weak}/{members.length}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">Sin debilidades compartidas. 🎉</p>
            )}
          </AnalysisPanel>

          {/* Resistances */}
          <AnalysisPanel
            title="Resistencias del equipo"
            icon={<ShieldCheck className="size-4 text-emerald-500" />}
            hint="Tipos de ataque que varios miembros encajan bien (reciben menos daño)."
          >
            {analysis.resistances.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {analysis.resistances.slice(0, 8).map(({ type, resist }) => (
                  <li key={type} className="flex items-center justify-between gap-2">
                    <TypeBadge type={type} />
                    <span className="text-muted-foreground font-mono text-xs font-semibold">
                      {resist}/{members.length}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">El equipo no resiste ningún tipo.</p>
            )}
          </AnalysisPanel>

          {/* Offensive coverage */}
          <AnalysisPanel
            title="Cobertura ofensiva"
            icon={<Swords className="size-4 text-sky-500" />}
            hint="Tipos contra los que el equipo pega super efectivo (según sus tipos STAB)."
          >
            <p className="text-foreground mb-2 text-sm">
              <span className="font-bold">{analysis.covered.length}</span>
              <span className="text-muted-foreground"> / {POKEMON_TYPES.length} tipos cubiertos</span>
            </p>
            {analysis.gaps.length > 0 ? (
              <div>
                <p className="text-muted-foreground mb-1.5 text-xs">Huecos (sin super efectivo):</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.gaps.map((type) => (
                    <span
                      key={type}
                      className="border-border text-muted-foreground rounded-full border px-2 py-0.5 text-[0.7rem] font-medium"
                    >
                      {TYPE_LABELS_ES[type]}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-emerald-500">¡Cobertura total! Ningún tipo se te resiste.</p>
            )}
          </AnalysisPanel>
        </div>
      )}
    </div>
  );
}

function TeamSlot({ member }: { member: PokedexEntry }) {
  const accent = primaryTypeColor(member.types);
  return (
    <div
      className="border-border bg-surface group relative flex flex-col items-center gap-1.5 rounded-2xl border p-3"
      style={{ ["--type" as string]: accent }}
    >
      <button
        type="button"
        onClick={() => removeFromTeam(member.id)}
        aria-label={`Quitar ${prettifyName(member.name)}`}
        className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-1.5 right-1.5 z-10 grid size-7 place-items-center rounded-full transition-colors"
      >
        <X className="size-4" />
      </button>
      <Link href={`/pokemon/${member.id}`} className="flex flex-col items-center gap-1.5">
        <div className="relative aspect-square w-full max-w-[104px]">
          <div className="type-aura absolute inset-0 rounded-full" aria-hidden />
          <PokemonArtwork
            id={member.id}
            alt={prettifyName(member.name)}
            sizes="104px"
            className="drop-shadow-md transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <span className="text-foreground text-center text-sm font-semibold">
          {prettifyName(member.name)}
        </span>
      </Link>
      <div className="flex flex-wrap justify-center gap-1">
        {member.types.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>
    </div>
  );
}

function EmptySlot({ index }: { index: number }) {
  return (
    <div className="border-border text-muted-foreground/50 flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed">
      <Plus className="size-6" />
      <span className="text-xs font-medium">Hueco {index + 1}</span>
    </div>
  );
}

function AnalysisPanel({
  title,
  icon,
  hint,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-foreground text-base font-semibold">{title}</h2>
      </div>
      {children}
      <p className="text-muted-foreground mt-auto pt-1 text-xs leading-relaxed">{hint}</p>
    </section>
  );
}
