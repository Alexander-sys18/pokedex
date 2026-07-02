"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Debounce (ms) before propagating the typed value upstream. */
  debounceMs?: number;
  className?: string;
}

/**
 * Live text search with a local, instantly-responsive input and a debounced
 * upstream `onChange` (default 300ms). Decoupling the keystroke from the
 * filter/URL write keeps typing snappy while the (cheap but non-trivial)
 * evolution-aware filter runs only once the user pauses. Stays in sync when
 * `value` changes externally (clear, reset, photo-search identify).
 */
export function SearchInput({ value, onChange, debounceMs = 300, className }: SearchInputProps) {
  const id = useId();
  const [text, setText] = useState(value);
  // Track the last external value in state (React's official "adjust state when
  // a prop changes" pattern) so a reset / photo-identify is adopted during
  // render without an effect.
  const [lastExternal, setLastExternal] = useState(value);
  if (lastExternal !== value) {
    setLastExternal(value);
    setText(value);
  }

  // Debounce the upstream propagation. Emitting only when `text` differs from
  // the parent `value` means an external change never echoes back, and the
  // cleanup cancels a pending emit whenever the user keeps typing or resets.
  useEffect(() => {
    if (text === value) return;
    const timer = setTimeout(() => onChange(text), debounceMs);
    return () => clearTimeout(timer);
  }, [text, value, onChange, debounceMs]);

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
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Busca un Pokémon… (también encuentra sus evoluciones)"
        aria-label="Buscar Pokémon por nombre"
        className={cn(
          "border-border bg-surface h-11 w-full rounded-xl border pr-10 pl-10 text-sm",
          "text-foreground placeholder:text-muted-foreground",
          "hover:bg-surface-hover transition-colors",
          "focus-visible:border-border-strong focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        )}
      />
      {text.length > 0 ? (
        <button
          type="button"
          onClick={() => {
            // Clear instantly: reset local text and propagate now (skip debounce).
            setText("");
            onChange("");
          }}
          aria-label="Borrar búsqueda"
          className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-1/2 right-2.5 grid size-6 -translate-y-1/2 place-items-center rounded-full transition-colors"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
