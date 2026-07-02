"use client";

import { useEffect, useState } from "react";

/**
 * Startup splash: a Pokéball that draws itself in (stroke animation), then
 * fills with color — red gradient dome, white base, glass highlight — pops
 * and fades away, on every hard load of the app. It ships in the SSR markup
 * so it's visible before hydration (the CSS animation needs no JS);
 * client-side navigations never remount the layout, so it only plays on real
 * page loads. `prefers-reduced-motion` collapses all animations to their
 * final state, i.e. the splash is skipped entirely.
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
      <svg viewBox="0 0 100 100" className="size-28 sm:size-32" fill="none">
        <defs>
          <linearGradient id="splash-red" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f87171" />
            <stop offset="1" stopColor="#dc2626" />
          </linearGradient>
          <linearGradient id="splash-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#e2e8f0" />
          </linearGradient>
        </defs>

        {/* ---- Color fills: fade in once the line drawing completes ---- */}
        {/* White base (lower hemisphere) */}
        <path
          d="M8 50a42 42 0 0 0 84 0Z"
          fill="url(#splash-base)"
          data-fill
          style={{ animationDelay: "0.84s" }}
        />
        {/* Red dome (upper hemisphere) */}
        <path
          d="M8 50a42 42 0 0 1 84 0Z"
          fill="url(#splash-red)"
          data-fill
          style={{ animationDelay: "0.9s" }}
        />
        {/* Belt band */}
        <path
          d="M8 50h84"
          className="stroke-foreground"
          strokeWidth="7"
          data-fill
          style={{ animationDelay: "0.96s" }}
        />
        {/* Button face */}
        <circle
          cx="50"
          cy="50"
          r="15"
          fill="url(#splash-base)"
          data-fill
          style={{ animationDelay: "0.96s" }}
        />
        {/* Glass highlight on the dome */}
        {/* fillOpacity, not opacity: the fade-in animation owns `opacity`
            (fill-mode both would pin it to 1 and make the sheen solid). */}
        <ellipse
          cx="35"
          cy="27"
          rx="11"
          ry="5.5"
          fill="#ffffff"
          fillOpacity="0.4"
          transform="rotate(-18 35 27)"
          data-fill
          style={{ animationDelay: "1.02s" }}
        />

        {/* ---- Line drawing: strokes trace themselves in first ---- */}
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
        {/* The red sweeps in just before the fills complete the picture */}
        <path
          d="M8 47a42.5 42.5 0 0 1 84 0"
          stroke="#ef4444"
          strokeWidth="5"
          strokeLinecap="round"
          pathLength="1"
          data-draw
          style={{ animationDelay: "0.72s", animationDuration: "0.3s" }}
        />
        {/* Red core of the button, the final beat */}
        <circle
          cx="50"
          cy="50"
          r="6"
          fill="#ef4444"
          className="splash-dot"
          style={{ animationDelay: "1.05s" }}
        />
      </svg>
    </div>
  );
}
