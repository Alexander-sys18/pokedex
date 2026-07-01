"use client";

import { ArrowUpDown, RotateCcw, Sparkles, Tag } from "lucide-react";
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
import { PhotoSearchButton } from "./photo-search-button";
import { SearchInput } from "./search-input";

const ALL = "all";

const TYPE_OPTIONS: SelectOption[] = [
  { value: ALL, label: "Todos los tipos" },
  ...POKEMON_TYPES.map((type) => ({
    value: type,
    label: TYPE_LABELS_ES[type],
    swatch: typeColor(type),
  })),
];

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
}

export function FiltersBar({ state }: FiltersBarProps) {
  const { filters, setQuery, setType, setGeneration, setSort, reset } = state;
  const showReset = hasActiveFilters(filters) || filters.sort !== "dex-asc";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <SearchInput value={filters.query} onChange={setQuery} />
        <PhotoSearchButton onIdentified={setQuery} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          ariaLabel="Filtrar por tipo"
          icon={<Tag className="size-4" />}
          value={filters.type ?? ALL}
          onValueChange={(value) => setType(value === ALL ? null : (value as PokemonTypeName))}
          options={TYPE_OPTIONS}
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
