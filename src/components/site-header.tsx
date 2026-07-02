"use client";

import { GitCompareArrows, Heart, LayoutGrid, Swords } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

function PokeballMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <circle cx="12" cy="12" r="10" className="fill-surface" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 12h6a4 4 0 0 1 8 0h6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.4" className="fill-background" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  isActive: (pathname: string) => boolean;
}

const NAV: NavItem[] = [
  { href: "/", label: "Pokédex", icon: LayoutGrid, isActive: (p) => p === "/" },
  {
    href: "/comparar",
    label: "Comparar",
    icon: GitCompareArrows,
    isActive: (p) => p.startsWith("/comparar"),
  },
  { href: "/equipo", label: "Equipo", icon: Swords, isActive: (p) => p.startsWith("/equipo") },
  { href: "/?fav=true", label: "Favoritos", icon: Heart, isActive: () => false },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="group focus-visible:ring-ring flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:outline-none"
        >
          <PokeballMark className="text-foreground size-7 transition-transform duration-500 group-hover:rotate-[360deg]" />
          <span className="text-foreground text-lg font-bold tracking-tight">Pokédex</span>
          <span className="bg-muted text-muted-foreground hidden rounded-full px-2 py-0.5 text-[0.65rem] font-medium md:inline">
            Gen I–IX
          </span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {NAV.map(({ href, label, icon: Icon, isActive }) => {
            const active = isActive(pathname);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-ring inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none sm:px-3",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
