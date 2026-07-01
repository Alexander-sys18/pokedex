"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

/** Build the visible page window: 1 … p-1 p p+1 … last. */
function pageItems(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const wanted = new Set([1, 2, page - 1, page, page + 1, pageCount - 1, pageCount]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);

  const items: (number | "gap")[] = [];
  let previous = 0;
  for (const n of pages) {
    if (n - previous > 1) items.push("gap");
    items.push(n);
    previous = n;
  }
  return items;
}

/** Instant client-side pagination controls (the data is already in memory). */
export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
        className="border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground focus-visible:ring-ring disabled:hover:bg-surface grid size-9 place-items-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>

      {pageItems(page, pageCount).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="text-muted-foreground px-1 text-sm" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-label={`Página ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "h-9 min-w-9 rounded-lg border px-2 text-sm font-medium transition-colors",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              item === page
                ? "bg-foreground text-background border-transparent"
                : "border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground",
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Página siguiente"
        className="border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground focus-visible:ring-ring disabled:hover:bg-surface grid size-9 place-items-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
