"use client";

import { Heart } from "lucide-react";
import { useFavorite } from "@/lib/favorites";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  id: number;
  name: string;
  /** "chip" = small overlay for cards; "button" = labelled button for detail. */
  variant?: "chip" | "button";
  className?: string;
}

export function FavoriteButton({ id, name, variant = "chip", className }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorite(id);

  const label = isFavorite ? `Quitar ${name} de favoritos` : `Añadir ${name} a favoritos`;

  const handle = (event: React.MouseEvent) => {
    // Cards wrap this in a <Link>; never navigate when toggling.
    event.preventDefault();
    event.stopPropagation();
    toggle();
  };

  // Remounting the icon on toggle restarts the pop animation, confirming the
  // tap visually every time.
  const heartKey = isFavorite ? "fav" : "no-fav";

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handle}
        aria-pressed={isFavorite}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur transition-colors",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          "active:scale-95",
          isFavorite
            ? "border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500/15"
            : "border-border bg-surface/90 text-foreground hover:bg-surface-hover",
          className,
        )}
      >
        <Heart
          key={heartKey}
          className={cn("animate-heart-pop size-3.5", isFavorite && "fill-rose-500")}
        />
        {isFavorite ? "En favoritos" : "Favorito"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={isFavorite}
      aria-label={label}
      title={label}
      className={cn(
        // Always visible (touch screens have no hover) with a generous invisible
        // hit area (~48px via ::after) around the 36px visual circle.
        "relative grid size-9 place-items-center rounded-full border shadow-sm backdrop-blur-sm transition-all",
        "after:absolute after:-inset-1.5 after:rounded-full after:content-['']",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        "active:scale-90",
        isFavorite
          ? "border-rose-500/40 bg-rose-500/15 text-rose-500"
          : "border-border bg-surface/95 text-muted-foreground hover:border-rose-400/50 hover:text-rose-500",
        className,
      )}
    >
      <Heart
        key={heartKey}
        className={cn("animate-heart-pop size-[18px]", isFavorite && "fill-rose-500")}
      />
    </button>
  );
}
