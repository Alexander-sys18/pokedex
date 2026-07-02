"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// Each mode lights up with its own sky: sunny amber day, deep-blue starry
// night; "auto" stays neutral.
const OPTIONS = [
  {
    value: "light",
    label: "Modo día",
    Icon: Sun,
    activeClass:
      "bg-gradient-to-br from-amber-300 to-orange-400 text-amber-950 shadow-sm shadow-amber-500/40",
  },
  {
    value: "system",
    label: "Tema del sistema",
    Icon: Monitor,
    activeClass: "bg-foreground text-background",
  },
  {
    value: "dark",
    label: "Modo noche",
    Icon: Moon,
    activeClass:
      "bg-gradient-to-br from-blue-600 to-blue-950 text-amber-200 shadow-sm shadow-blue-500/40",
  },
] as const;

/**
 * Segmented light / system / dark switch.
 *
 * `theme` is `undefined` during SSR and on the first client render, so every
 * option renders inactive on both sides — no hydration mismatch. next-themes
 * then resolves the value in an effect and the active option lights up.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Cambiar tema"
      className="border-border bg-surface inline-flex items-center gap-0.5 rounded-full border p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon, activeClass }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "grid size-8 place-items-center rounded-full transition-all",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              active ? activeClass : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
