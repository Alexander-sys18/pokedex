"use client";

import { Check, Loader2, Save, Wand2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { OakAvatar } from "@/components/chat/oak-avatar";
import { pixelSprite } from "@/lib/pokedex/image";
import type { PokedexEntry } from "@/lib/pokedex/types";
import { createTeam, replaceTeamMembers, useTeam, useTeams } from "@/lib/team";
import { cn, prettifyName } from "@/lib/utils";

const EXAMPLES = [
  "El mejor equipo equilibrado posible",
  "Un equipo alrededor de Charizard",
  "Solo Pokémon de Kanto, estilo clásico",
  "Un equipo defensivo difícil de tumbar",
];

interface Proposal {
  name: string;
  explanation: string;
  members: { id: number; name: string; reason: string }[];
  unresolved: string[];
}

/**
 * "Ask the Professor for a team": free-text wish → AI proposal (validated
 * server-side against the real index) → apply to the active team or save as a
 * new one. Hidden entirely when the server has no API key.
 */
export function OakTeamAssistant({ entries }: { entries: PokedexEntry[] }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<"replace" | "new" | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const teamIds = useTeam();
  const { activeId } = useTeams();

  // The "Aplicado ✓" feedback belongs to the team it was applied to — switching
  // teams re-arms the buttons (render-time adjust-state-on-prop-change pattern).
  const [lastActiveId, setLastActiveId] = useState(activeId);
  if (lastActiveId !== activeId) {
    setLastActiveId(activeId);
    setApplied(null);
  }

  // Abort any in-flight proposal request when the panel unmounts.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);
  const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);
  const currentNames = useMemo(
    () =>
      teamIds
        .map((id) => byId.get(id))
        .filter((e): e is PokedexEntry => Boolean(e))
        .map((e) => prettifyName(e.name)),
    [teamIds, byId],
  );

  // Only show the panel when the server has an API key configured.
  useEffect(() => {
    let active = true;
    fetch("/api/team")
      .then((r) => r.json())
      .then((d: { enabled?: boolean }) => active && setEnabled(Boolean(d.enabled)))
      .catch(() => active && setEnabled(false));
    return () => {
      active = false;
    };
  }, []);

  if (!enabled) return null;

  const ask = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setProposal(null);
    setApplied(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, team: currentNames }),
        signal: controller.signal,
      });
      const data = (await res.json()) as Proposal & { error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "No se pudo generar el equipo. Inténtalo de nuevo.");
        return;
      }
      setProposal(data);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError("No se pudo contactar con el Profesor. Inténtalo de nuevo.");
      }
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  };

  const ids = proposal?.members.map((m) => m.id) ?? [];

  return (
    <section className="border-border bg-surface rounded-2xl border p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <OakAvatar size={40} talking={loading} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-semibold">
            Arma tu equipo con el Profesor Oak
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Descríbeme qué quieres: un Pokémon concreto como estrella, un estilo de juego, una
            región… o pídeme directamente el mejor equipo.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void ask(prompt);
                }
              }}
              rows={2}
              maxLength={500}
              placeholder="P. ej. «Quiero un equipo ofensivo con Gengar de estrella»"
              aria-label="Describe el equipo que quieres"
              className="border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-border-strong focus-visible:ring-ring min-h-[3.5rem] flex-1 resize-none rounded-xl border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={() => void ask(prompt)}
              disabled={loading || prompt.trim().length < 4}
              aria-busy={loading}
              className="bg-foreground text-background inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              {loading ? "Pensando…" : "Proponer equipo"}
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setPrompt(example);
                  void ask(example);
                }}
                disabled={loading}
                className="border-border text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-7 items-center rounded-full border px-2.5 text-xs transition-colors disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>

          {loading ? (
            <p
              role="status"
              className="text-muted-foreground mt-3 inline-flex items-center gap-2 text-xs"
            >
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              El Profesor está estudiando combinaciones de tipos…
            </p>
          ) : null}

          {error ? (
            <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
          ) : null}

          {proposal ? (
            <div className="border-border bg-background/40 mt-3 rounded-xl border p-3">
              <p className="text-foreground text-sm font-semibold">«{proposal.name}»</p>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                {proposal.explanation}
              </p>

              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {proposal.members.map((member) => (
                  <li key={member.id} className="flex items-start gap-2">
                    <Image
                      src={pixelSprite(member.id)}
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      className="size-10 shrink-0 [image-rendering:pixelated]"
                    />
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-semibold">{member.name}</p>
                      <p className="text-muted-foreground text-xs leading-snug">{member.reason}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {proposal.unresolved.length > 0 ? (
                <p className="text-muted-foreground mt-2 text-xs">
                  No encontré en la Pokédex: {proposal.unresolved.join(", ")}.
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={applied === "replace"}
                  onClick={() => {
                    replaceTeamMembers(ids);
                    setApplied("replace");
                  }}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium transition-colors",
                    applied === "replace"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-foreground text-background hover:opacity-90",
                  )}
                >
                  {applied === "replace" ? <Check className="size-4" /> : null}
                  {applied === "replace" ? "Aplicado al equipo actual" : "Aplicar al equipo actual"}
                </button>
                <button
                  type="button"
                  disabled={applied === "new"}
                  onClick={() => {
                    createTeam(proposal.name, ids);
                    setApplied("new");
                  }}
                  className={cn(
                    "border-border inline-flex h-9 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition-colors",
                    applied === "new"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-surface text-foreground hover:bg-surface-hover",
                  )}
                >
                  {applied === "new" ? <Check className="size-4" /> : <Save className="size-4" />}
                  {applied === "new" ? "Guardado como equipo nuevo" : "Guardar como equipo nuevo"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
