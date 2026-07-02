"use client";

import { Loader2 } from "lucide-react";
import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

interface LinkPendingProps {
  /** "overlay" dims the parent (needs a positioned ancestor); "inline" is a bare spinner. */
  mode?: "overlay" | "inline";
  className?: string;
}

/**
 * Loading feedback for `<Link>` navigations. Must render *inside* a Link:
 * `useLinkStatus` reports the pending state of the enclosing link, so the user
 * always sees that their tap is doing something. The `.nav-pending` CSS delays
 * the fade-in ~150ms so prefetched/instant navigations never flash a spinner.
 */
export function LinkPending({ mode = "overlay", className }: LinkPendingProps) {
  const { pending } = useLinkStatus();
  if (!pending) return null;

  if (mode === "inline") {
    return (
      <Loader2
        role="status"
        aria-label="Cargando…"
        className={cn("nav-pending size-4 animate-spin", className)}
      />
    );
  }

  return (
    <span
      role="status"
      aria-label="Cargando…"
      className={cn(
        "nav-pending bg-background/55 pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-[inherit] backdrop-blur-[1.5px]",
        className,
      )}
    >
      <Loader2 className="text-foreground size-6 animate-spin" />
    </span>
  );
}
