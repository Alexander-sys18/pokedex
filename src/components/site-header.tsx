"use client";

import { GitCompareArrows, Heart, LayoutGrid, Swords } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

function PokeballMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <defs>
        <linearGradient id="pokemark-red" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f87171" />
          <stop offset="1" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      {/* White base + red gradient dome */}
      <path d="M2 12a10 10 0 0 0 20 0Z" fill="#f8fafc" />
      <path d="M2 12a10 10 0 0 1 20 0Z" fill="url(#pokemark-red)" />
      {/* Glass highlight */}
      <ellipse cx="8.6" cy="6.4" rx="2.6" ry="1.3" fill="#fff" opacity="0.45" transform="rotate(-20 8.6 6.4)" />
      {/* Belt + button (red core = brand signature) */}
      <path d="M2 12h20" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.4" fill="#f8fafc" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.3" fill="#ef4444" />
      {/* Outline */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
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
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
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

        {/* On phones the bottom tab bar takes over navigation. */}
        <nav className="hidden items-center gap-1 sm:flex">
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
