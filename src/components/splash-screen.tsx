"use client";

import { useEffect, useState } from "react";

/**
 * Startup splash: a Pokéball that draws itself in (stroke animation), gets its
 * red flash of color, pops and fades away — on every hard load of the app.
 * It ships in the SSR markup so it's visible before hydration (the CSS
 * animation needs no JS); client-side navigations never remount the layout,
 * so it only plays on real page loads. `prefers-reduced-motion` collapses all
 * animations to their final state, i.e. the splash is skipped entirely.
 */
export function SplashScreen() {
  const [gone, setGone] = useState(false);

  // The exit is pure CSS; this just removes the node from the DOM afterwards.
  useEffect(() => {
    const timer = setTimeout(() => setGone(true), 1750);
    return () => clearTimeout(timer);
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden
      className="splash bg-background pointer-events-none fixed inset-0 z-[200] grid place-items-center"
    >
      <svg viewBox="0 0 100 100" className="size-24 sm:size-28" fill="none">
        {/* Outer shell */}
        <circle
          cx="50"
          cy="50"
          r="44"
          className="stroke-foreground"
          strokeWidth="5"
          strokeLinecap="round"
          pathLength="1"
          data-draw
          style={{ animationDelay: "0.05s", animationDuration: "0.6s" }}
        />
        {/* Belt */}
        <path
          d="M6 50h29"
          className="stroke-foreground"
          strokeWidth="5"
          strokeLinecap="round"
          pathLength="1"
          data-draw
          style={{ animationDelay: "0.5s", animationDuration: "0.22s" }}
        />
        <path
          d="M65 50h29"
          className="stroke-foreground"
          strokeWidth="5"
          strokeLinecap="round"
          pathLength="1"
          data-draw
          style={{ animationDelay: "0.5s", animationDuration: "0.22s" }}
        />
        {/* Button ring */}
        <circle
          cx="50"
          cy="50"
          r="15"
          className="stroke-foreground"
          strokeWidth="5"
          pathLength="1"
          data-draw
          style={{ animationDelay: "0.62s", animationDuration: "0.3s" }}
        />
        {/* The red comes in last: upper hemisphere + button core */}
        <path
          d="M8 47a42.5 42.5 0 0 1 84 0"
          stroke="#ef4444"
          strokeWidth="5"
          strokeLinecap="round"
          pathLength="1"
          data-draw
          style={{ animationDelay: "0.78s", animationDuration: "0.35s" }}
        />
        <circle
          cx="50"
          cy="50"
          r="6.5"
          fill="#ef4444"
          className="splash-dot"
          style={{ animationDelay: "0.95s" }}
        />
      </svg>
    </div>
  );
}
