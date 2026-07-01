"use client";

import { Search, X } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** Live text search. Filters as the user types; includes evolution families. */
export function SearchInput({ value, onChange, className }: SearchInputProps) {
  const id = useId();

  return (
    <div className={cn("relative flex-1", className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
        aria-hidden
      />
      <input
        id={id}
        type="text"
        inputMode="search"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Busca un Pokémon… (también encuentra sus evoluciones)"
        aria-label="Buscar Pokémon por nombre"
        className={cn(
          "border-border bg-surface h-11 w-full rounded-xl border pr-10 pl-10 text-sm",
          "text-foreground placeholder:text-muted-foreground",
          "hover:bg-surface-hover transition-colors",
          "focus-visible:border-border-strong focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        )}
      />
      {value.length > 0 ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Borrar búsqueda"
          className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-1/2 right-2.5 grid size-6 -translate-y-1/2 place-items-center rounded-full transition-colors"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
