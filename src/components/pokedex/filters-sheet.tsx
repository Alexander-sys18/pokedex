"use client";

import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { typeColor } from "@/lib/pokedex/colors";
import {
  GENERATIONS,
  GENERATION_REGIONS,
  POKEMON_TYPES,
  TYPE_LABELS_ES,
  generationLabel,
} from "@/lib/pokedex/constants";
import type { SortKey } from "@/lib/pokedex/search";
import type { GenerationNumber, PokemonTypeName } from "@/lib/pokedex/types";
import type { FilterState } from "@/lib/url-state";
import { cn } from "@/lib/utils";

const SORT_CHOICES: { value: SortKey; label: string }[] = [
  { value: "dex-asc", label: "Nº menor → mayor" },
  { value: "dex-desc", label: "Nº mayor → menor" },
  { value: "name-asc", label: "Nombre A → Z" },
  { value: "name-desc", label: "Nombre Z → A" },
];

interface FiltersSheetProps {
  state: FilterState;
  /** Live result count, shown on the primary "see results" button. */
  resultsCount: number;
  /** Classes for the trigger button (layout is decided by the parent). */
  className?: string;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
      {children}
    </h3>
  );
}

/** A tappable type chip, tinted with the type color when selected. */
function TypeChip({
  type,
  active,
  onToggle,
}: {
  type: PokemonTypeName;
  active: boolean;
  onToggle: () => void;
}) {
  const color = typeColor(type);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      style={
        active
          ? {
              backgroundColor: `color-mix(in oklab, ${color} 24%, transparent)`,
              borderColor: `color-mix(in oklab, ${color} 60%, transparent)`,
            }
          : undefined
      }
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs transition-colors",
        active
          ? "text-foreground font-semibold"
          : "border-border bg-surface text-muted-foreground hover:text-foreground font-medium",
      )}
    >
      <span
        className="size-2.5 rounded-full ring-1 ring-black/10"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {TYPE_LABELS_ES[type]}
    </button>
  );
}

/** Generic "option pill" for generation / sort choices. */
function OptionChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg border px-2 text-xs transition-colors",
        active
          ? "border-blue-500/50 bg-blue-500/15 font-semibold text-blue-600 dark:text-blue-300"
          : "border-border bg-surface text-muted-foreground hover:text-foreground font-medium",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Mobile-first filters: a "Filtros" trigger that opens a bottom sheet with
 * big, readable chips for type / second type / generation / sort. Filters
 * apply live (they write to the URL via nuqs), so the footer button simply
 * shows the live result count and closes. Modal manners match the Lightbox:
 * portal to <body>, Escape/backdrop close, body scroll lock, focus trap.
 */
export function FiltersSheet({ state, resultsCount, className }: FiltersSheetProps) {
  const { filters, setType, setType2, setGeneration, setSort } = state;
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  const activeCount =
    (filters.type ? 1 : 0) +
    (filters.type2 ? 1 : 0) +
    (filters.generation !== null ? 1 : 0) +
    (filters.sort !== "dex-asc" ? 1 : 0);

  const clearSheetFilters = () => {
    setType(null);
    setType2(null);
    setGeneration(null);
    setSort("dex-asc");
  };

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition-colors",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          activeCount > 0
            ? "border-blue-500/40 bg-blue-500/10 font-semibold text-blue-600 dark:text-blue-300"
            : "border-border bg-surface text-foreground hover:bg-surface-hover",
          className,
        )}
      >
        <SlidersHorizontal className="size-4" />
        Filtros
        {activeCount > 0 ? (
          <span className="rounded-full bg-blue-500 px-1.5 text-[0.7rem] font-semibold text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[90]">
              <button
                type="button"
                aria-label="Cerrar filtros"
                onClick={close}
                tabIndex={-1}
                className="animate-fade-in absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
              />

              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label="Filtros de la Pokédex"
                className="animate-sheet-up border-border bg-background absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-3xl border-t shadow-2xl"
              >
                {/* Grab handle + header */}
                <div className="border-border flex items-center justify-between border-b px-4 pt-3 pb-3">
                  <div
                    className="bg-border absolute top-1.5 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full"
                    aria-hidden
                  />
                  <h2 className="text-foreground text-base font-semibold">Filtros</h2>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={close}
                    aria-label="Cerrar"
                    className="text-muted-foreground hover:bg-muted hover:text-foreground grid size-8 place-items-center rounded-full transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-5 overflow-y-auto px-4 py-4">
                  <section className="flex flex-col gap-2">
                    <SectionTitle>Tipo</SectionTitle>
                    <div className="grid grid-cols-3 gap-1.5">
                      {POKEMON_TYPES.map((type) => (
                        <TypeChip
                          key={type}
                          type={type}
                          active={filters.type === type}
                          onToggle={() => setType(filters.type === type ? null : type)}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="flex flex-col gap-2">
                    <SectionTitle>Segundo tipo (doble tipo)</SectionTitle>
                    <div className="grid grid-cols-3 gap-1.5">
                      {POKEMON_TYPES.map((type) => (
                        <TypeChip
                          key={type}
                          type={type}
                          active={filters.type2 === type}
                          onToggle={() => setType2(filters.type2 === type ? null : type)}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="flex flex-col gap-2">
                    <SectionTitle>Generación</SectionTitle>
                    <div className="grid grid-cols-2 gap-1.5">
                      <OptionChip
                        active={filters.generation === null}
                        onClick={() => setGeneration(null)}
                      >
                        Todas
                      </OptionChip>
                      {GENERATIONS.map((gen) => (
                        <OptionChip
                          key={gen}
                          active={filters.generation === gen}
                          onClick={() =>
                            setGeneration(
                              filters.generation === gen ? null : (gen as GenerationNumber),
                            )
                          }
                        >
                          {generationLabel(gen)} · {GENERATION_REGIONS[gen]}
                        </OptionChip>
                      ))}
                    </div>
                  </section>

                  <section className="flex flex-col gap-2">
                    <SectionTitle>Ordenar por</SectionTitle>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SORT_CHOICES.map((choice) => (
                        <OptionChip
                          key={choice.value}
                          active={filters.sort === choice.value}
                          onClick={() => setSort(choice.value)}
                        >
                          {choice.label}
                        </OptionChip>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Footer: live result count — filters already applied. */}
                <div className="border-border flex items-center gap-2 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <button
                    type="button"
                    onClick={clearSheetFilters}
                    disabled={activeCount === 0}
                    className="border-border bg-surface text-muted-foreground hover:text-foreground inline-flex h-11 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition-colors disabled:opacity-40"
                  >
                    <RotateCcw className="size-4" />
                    Quitar
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-4 text-sm font-semibold text-white shadow-md shadow-red-500/25 transition-opacity [text-shadow:0_1px_2px_rgb(0_0_0/0.35)] hover:opacity-90"
                  >
                    Ver {resultsCount} Pokémon
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
