"use client";

import { ArrowUpDown, Heart, Layers, RotateCcw, Sparkles, Tag } from "lucide-react";
import { Select, type SelectOption } from "@/components/ui/select";
import { typeColor } from "@/lib/pokedex/colors";
import {
  GENERATIONS,
  GENERATION_REGIONS,
  POKEMON_TYPES,
  TYPE_LABELS_ES,
  generationLabel,
} from "@/lib/pokedex/constants";
import { hasActiveFilters, type SortKey } from "@/lib/pokedex/search";
import type { GenerationNumber, PokemonTypeName } from "@/lib/pokedex/types";
import type { FilterState } from "@/lib/url-state";
import { cn } from "@/lib/utils";
import { FiltersSheet } from "./filters-sheet";
import { PhotoSearchButton } from "./photo-search-button";
import { SearchInput } from "./search-input";

const ALL = "all";

const typeOptions = (placeholder: string): SelectOption[] => [
  { value: ALL, label: placeholder },
  ...POKEMON_TYPES.map((type) => ({
    value: type,
    label: TYPE_LABELS_ES[type],
    swatch: typeColor(type),
  })),
];

const TYPE_OPTIONS = typeOptions("Cualquier tipo");
const TYPE2_OPTIONS = typeOptions("y también…");

const GENERATION_OPTIONS: SelectOption[] = [
  { value: ALL, label: "Todas las generaciones" },
  ...GENERATIONS.map((gen) => ({
    value: String(gen),
    label: `${generationLabel(gen)} · ${GENERATION_REGIONS[gen]}`,
  })),
];

const SORT_OPTIONS: SelectOption[] = [
  { value: "dex-asc", label: "Nº (menor → mayor)" },
  { value: "dex-desc", label: "Nº (mayor → menor)" },
  { value: "name-asc", label: "Nombre (A → Z)" },
  { value: "name-desc", label: "Nombre (Z → A)" },
];

interface FiltersBarProps {
  state: FilterState;
  /** Number of saved favorites, shown on the toggle. */
  favoritesCount: number;
  /** Live result count (feeds the mobile sheet's "see results" button). */
  resultsCount: number;
}

/** Favorites toggle, shared by the desktop row and the mobile row. */
function FavoritesToggle({
  favoritesOnly,
  favoritesCount,
  onToggle,
  className,
}: {
  favoritesOnly: boolean;
  favoritesCount: number;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={favoritesOnly}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        favoritesOnly
          ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
          : "border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground",
        className,
      )}
    >
      <Heart className={cn("size-3.5", favoritesOnly && "fill-rose-500")} />
      Favoritos
      {favoritesCount > 0 ? (
        <span className="rounded-full bg-rose-500/15 px-1.5 text-[0.7rem] font-semibold text-rose-500">
          {favoritesCount}
        </span>
      ) : null}
    </button>
  );
}

export function FiltersBar({ state, favoritesCount, resultsCount }: FiltersBarProps) {
  const { filters, favoritesOnly, setQuery, setType, setType2, setGeneration, setSort, setFavoritesOnly, reset } =
    state;
  const showReset = hasActiveFilters(filters) || favoritesOnly || filters.sort !== "dex-asc";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <SearchInput value={filters.query} onChange={setQuery} />
        <PhotoSearchButton onIdentified={setQuery} />
      </div>

      {/* Mobile: everything readable behind a "Filtros" bottom sheet. */}
      <div className="flex items-center gap-2 sm:hidden">
        <FiltersSheet state={state} resultsCount={resultsCount} className="flex-1" />
        <FavoritesToggle
          favoritesOnly={favoritesOnly}
          favoritesCount={favoritesCount}
          onToggle={() => setFavoritesOnly(!favoritesOnly)}
          className="flex-1"
        />
        {showReset ? (
          <button
            type="button"
            onClick={reset}
            aria-label="Limpiar filtros y búsqueda"
            title="Limpiar filtros y búsqueda"
            className="border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground focus-visible:ring-ring grid size-10 shrink-0 place-items-center rounded-xl border transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <RotateCcw className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Desktop: the full inline filter row. */}
      <div className="hidden flex-wrap items-center gap-2 sm:flex">
        <Select
          ariaLabel="Filtrar por tipo"
          icon={<Tag className="size-4" />}
          value={filters.type ?? ALL}
          onValueChange={(value) => setType(value === ALL ? null : (value as PokemonTypeName))}
          options={TYPE_OPTIONS}
        />
        <Select
          ariaLabel="Filtrar por un segundo tipo (dual)"
          icon={<Layers className="size-4" />}
          value={filters.type2 ?? ALL}
          onValueChange={(value) => setType2(value === ALL ? null : (value as PokemonTypeName))}
          options={TYPE2_OPTIONS}
        />
        <Select
          ariaLabel="Filtrar por generación"
          icon={<Sparkles className="size-4" />}
          value={filters.generation === null ? ALL : String(filters.generation)}
          onValueChange={(value) =>
            setGeneration(value === ALL ? null : (Number(value) as GenerationNumber))
          }
          options={GENERATION_OPTIONS}
        />
        <Select
          ariaLabel="Ordenar"
          icon={<ArrowUpDown className="size-4" />}
          value={filters.sort}
          onValueChange={(value) => setSort(value as SortKey)}
          options={SORT_OPTIONS}
        />

        <FavoritesToggle
          favoritesOnly={favoritesOnly}
          favoritesCount={favoritesCount}
          onToggle={() => setFavoritesOnly(!favoritesOnly)}
        />

        {showReset ? (
          <button
            type="button"
            onClick={reset}
            className="border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground focus-visible:ring-ring inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <RotateCcw className="size-3.5" />
            Limpiar
          </button>
        ) : null}
      </div>
    </div>
  );
}
