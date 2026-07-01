import { TYPE_LABELS_ES } from "@/lib/pokedex/constants";
import { readableTextColor, typeColor } from "@/lib/pokedex/colors";
import type { PokemonTypeName } from "@/lib/pokedex/types";
import { cn } from "@/lib/utils";

interface TypeBadgeProps {
  type: PokemonTypeName;
  size?: "sm" | "md";
  className?: string;
}

/** A filled, brand-colored pill for a single Pokémon type. */
export function TypeBadge({ type, size = "sm", className }: TypeBadgeProps) {
  const background = typeColor(type);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold tracking-wide",
        size === "sm" ? "px-2.5 py-0.5 text-[0.7rem]" : "px-3.5 py-1 text-sm",
        className,
      )}
      style={{ backgroundColor: background, color: readableTextColor(background) }}
    >
      {TYPE_LABELS_ES[type]}
    </span>
  );
}
