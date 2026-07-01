import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

function PokeballMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        className="fill-surface"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M2 12h6a4 4 0 0 1 8 0h6" stroke="currentColor" strokeWidth="1.6" />
      <circle
        cx="12"
        cy="12"
        r="2.4"
        className="fill-background"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group focus-visible:ring-ring flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:outline-none"
        >
          <PokeballMark className="size-7 text-[#ef4444] transition-transform duration-500 group-hover:rotate-[360deg]" />
          <span className="text-foreground text-lg font-bold tracking-tight">Pokédex</span>
          <span className="bg-muted text-muted-foreground hidden rounded-full px-2 py-0.5 text-[0.65rem] font-medium sm:inline">
            Gen I–IX
          </span>
        </Link>

        <ThemeToggle />
      </div>
    </header>
  );
}
