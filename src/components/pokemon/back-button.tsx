"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Returns to the list. Uses history.back() so the previous scroll position and
 * filter state are restored; falls back to the home route on a direct visit.
 */
export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <ArrowLeft className="size-4" />
      Volver
    </button>
  );
}
