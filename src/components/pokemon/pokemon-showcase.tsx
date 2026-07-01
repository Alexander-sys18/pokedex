"use client";

import { Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { Component, type ReactNode, useEffect, useState } from "react";
import { officialArtwork, shinyArtwork } from "@/lib/pokedex/image";
import { cn } from "@/lib/utils";
import { CryButton } from "./cry-button";
import { PokemonArtwork } from "./pokemon-artwork";

// three.js only loads on the detail route, and only once we decide to enhance.
const Pokemon3DScene = dynamic(() => import("./pokemon-3d-scene"), { ssr: false });

/** If the WebGL scene ever throws, fall back silently to the static artwork. */
class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    this.props.onError();
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

interface PokemonShowcaseProps {
  id: number;
  accent: string;
  alt: string;
  /** Cry audio URLs (optional — hides the button when absent). */
  cry?: { latest: string | null; legacy: string | null };
}

/**
 * Progressive enhancement: the static artwork renders on the server (fast paint
 * + SEO), then upgrades to an interactive 3D scene on capable clients. Falls
 * back to the static image when motion is reduced or WebGL is unavailable.
 * Includes a shiny toggle and the Pokémon's cry.
 */
export function PokemonShowcase({ id, accent, alt, cry }: PokemonShowcaseProps) {
  const [enhance, setEnhance] = useState(false);
  const [ready, setReady] = useState(false);
  const [shiny, setShiny] = useState(false);
  // Mount the shiny <Image> lazily (first toggle) but keep BOTH variants
  // mounted afterwards: remounting would blank the card while the art reloads.
  const [shinyTouched, setShinyTouched] = useState(false);

  useEffect(() => {
    // Defer to the next frame so the static image paints first, and so the
    // capability check runs outside the synchronous effect body.
    const frame = requestAnimationFrame(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced && hasWebGL()) setEnhance(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const textureUrl = shiny ? shinyArtwork(id) : officialArtwork(id);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative mx-auto aspect-square w-full max-w-[300px]"
        style={{ ["--type" as string]: accent }}
      >
        <div className="type-aura absolute inset-0 rounded-full" aria-hidden />

        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            ready ? "opacity-0" : "opacity-100",
          )}
        >
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              shiny ? "opacity-0" : "opacity-100",
            )}
          >
            <PokemonArtwork
              id={id}
              alt={alt}
              sizes="(max-width: 768px) 70vw, 300px"
              priority
              className="drop-shadow-xl"
            />
          </div>
          {shinyTouched ? (
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-300",
                shiny ? "opacity-100" : "opacity-0",
              )}
            >
              <PokemonArtwork
                id={id}
                alt={alt}
                sizes="(max-width: 768px) 70vw, 300px"
                variant="shiny"
                className="drop-shadow-xl"
              />
            </div>
          ) : null}
        </div>

        {enhance ? (
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              ready ? "opacity-100" : "opacity-0",
            )}
          >
            {/* Keyed by variant so a failed texture load (e.g. one transient
                network error) only disables the CURRENT variant — toggling
                remounts the boundary and the scene recovers. */}
            <SceneBoundary key={shiny ? "shiny" : "normal"} onError={() => setReady(false)}>
              <Pokemon3DScene
                textureUrl={textureUrl}
                accent={accent}
                onReady={() => setReady(true)}
              />
            </SceneBoundary>
          </div>
        ) : null}
      </div>

      <div className="z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            // Show the static art while the new 3D texture loads.
            setShinyTouched(true);
            setReady(false);
            setShiny((v) => !v);
          }}
          aria-pressed={shiny}
          title={shiny ? "Ver color normal" : "Ver forma shiny (variocolor)"}
          className={cn(
            "border-border bg-surface/90 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur",
            "hover:bg-surface-hover focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none",
            shiny ? "text-amber-500" : "text-foreground",
          )}
          style={shiny ? { borderColor: accent } : undefined}
        >
          <Sparkles className="size-3.5" />
          {shiny ? "Shiny ✓" : "Shiny"}
        </button>
        {cry ? <CryButton src={cry.latest ?? cry.legacy} fallback={cry.legacy} /> : null}
      </div>
    </div>
  );
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
