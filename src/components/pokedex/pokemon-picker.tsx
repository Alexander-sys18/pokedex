"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import { type KeyboardEvent, useId, useMemo, useState } from "react";
import { pixelSprite } from "@/lib/pokedex/image";
import type { PokedexEntry } from "@/lib/pokedex/types";
import { cn, formatDexNumber, normalizeSearch, prettifyName } from "@/lib/utils";

interface PokemonPickerProps {
  entries: PokedexEntry[];
  onSelect: (id: number) => void;
  placeholder?: string;
  /** Ids to hide from the results (e.g. the other side of a comparison). */
  excludeIds?: number[];
  className?: string;
}

const MAX_RESULTS = 50;

/**
 * Searchable combobox over the full Pokédex index (ARIA combobox + listbox with
 * `aria-activedescendant`). Fully keyboard-operable: ArrowUp/Down move the
 * highlight, Enter selects, Escape closes — while focus stays on the input.
 * Pointer users select with `onMouseDown` (fires before the input's blur closes
 * the list). Filtering is client-side on the pre-normalized name.
 */
export function PokemonPicker({
  entries,
  onSelect,
  placeholder = "Busca un Pokémon…",
  excludeIds = [],
  className,
}: PokemonPickerProps) {
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);

  const results = useMemo(() => {
    const normalized = normalizeSearch(query);
    const base = entries.filter((entry) => !excluded.has(entry.id));
    const list = normalized
      ? base.filter((entry) => normalizeSearch(entry.name).includes(normalized))
      : base;
    return list.slice(0, MAX_RESULTS);
  }, [query, entries, excluded]);

  const isOpen = open && results.length > 0;
  const active = Math.min(activeIndex, results.length - 1);
  const optionId = (index: number) => `${listboxId}-opt-${index}`;

  const scrollActiveIntoView = (index: number) => {
    if (typeof document === "undefined") return;
    document.getElementById(optionId(index))?.scrollIntoView({ block: "nearest" });
  };

  const select = (id: number) => {
    onSelect(id);
    setQuery("");
    setOpen(false);
    setActiveIndex(0);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        setOpen(true);
        return;
      }
      const next = Math.min(active + 1, results.length - 1);
      setActiveIndex(next);
      scrollActiveIntoView(next);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = Math.max(active - 1, 0);
      setActiveIndex(next);
      scrollActiveIntoView(next);
    } else if (event.key === "Enter") {
      if (!isOpen) return;
      event.preventDefault();
      const entry = results[active];
      if (entry) select(entry.id);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
          aria-hidden
        />
        <input
          type="text"
          inputMode="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={isOpen ? optionId(active) : undefined}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          className={cn(
            "border-border bg-surface h-11 w-full rounded-xl border pr-3 pl-10 text-sm",
            "text-foreground placeholder:text-muted-foreground",
            "hover:bg-surface-hover transition-colors",
            "focus-visible:border-border-strong focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          )}
        />
      </div>

      {isOpen ? (
        <ul
          id={listboxId}
          role="listbox"
          className="border-border bg-popover animate-fade-in absolute z-30 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border p-1 shadow-[var(--shadow-card-hover)]"
        >
          {results.map((entry, index) => (
            <li
              key={entry.id}
              id={optionId(index)}
              role="option"
              aria-selected={index === active}
              // Fire before blur so the click isn't swallowed by the list closing.
              onMouseDown={(event) => {
                event.preventDefault();
                select(entry.id);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                index === active ? "bg-surface-hover" : "hover:bg-surface-hover",
              )}
            >
              <Image
                src={pixelSprite(entry.id)}
                alt=""
                width={32}
                height={32}
                unoptimized
                className="size-8 shrink-0 [image-rendering:pixelated]"
              />
              <span className="text-foreground flex-1 truncate text-sm font-medium">
                {prettifyName(entry.name)}
              </span>
              <span className="text-muted-foreground font-mono text-xs">
                {formatDexNumber(entry.id)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
