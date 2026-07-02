"use client";

import { GitCompareArrows, Heart, LayoutGrid, Swords } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Tab {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  isActive: (pathname: string, favoritesOnly: boolean) => boolean;
}

const TABS: Tab[] = [
  { href: "/", label: "Pokédex", icon: LayoutGrid, isActive: (p, fav) => p === "/" && !fav },
  {
    href: "/comparar",
    label: "Comparar",
    icon: GitCompareArrows,
    isActive: (p) => p.startsWith("/comparar"),
  },
  { href: "/equipo", label: "Equipo", icon: Swords, isActive: (p) => p.startsWith("/equipo") },
  {
    href: "/?fav=true",
    label: "Favoritos",
    icon: Heart,
    isActive: (p, fav) => p === "/" && fav,
  },
];

/**
 * Bottom navigation for phones (hidden from sm up): thumb-reachable tabs with
 * labels and a clear active state, iOS safe-area aware. The top header keeps
 * only the brand + theme toggle on mobile.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const favoritesOnly = useSearchParams().get("fav") === "true";

  return (
    <nav
      aria-label="Navegación principal"
      className="border-border bg-background/90 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
    >
      <div className="grid h-16 grid-cols-4">
        {TABS.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname, favoritesOnly);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[0.65rem] font-medium transition-colors",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-12 place-items-center rounded-full transition-colors",
                  active && "bg-red-500/15 text-red-500",
                )}
              >
                <Icon className="size-[18px]" />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
