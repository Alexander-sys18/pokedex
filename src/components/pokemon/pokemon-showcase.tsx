"use client";

import { Loader2, Maximize2, PlayCircle, Rotate3d, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, type ReactNode, useEffect, useState } from "react";
import { Lightbox } from "@/components/ui/lightbox";
import { animatedSprite, officialArtwork, pokemonModel3D, shinyArtwork } from "@/lib/pokedex/image";
import { cn } from "@/lib/utils";
import { CryButton } from "./cry-button";
import { FavoriteButton } from "./favorite-button";
import { PokemonArtwork } from "./pokemon-artwork";

// three.js (and the .glb model) only load if the user actually presses "3D".
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
 * The official artwork is the default view (SSR, fast paint + SEO — it's the
 * Pokémon's visual identity). The real rotating 3D model is OPT-IN via the
 * "3D" button, so neither three.js nor the .glb download unless requested;
 * the button only appears on clients with WebGL and without reduced-motion.
 * Also: shiny toggle, animated battle-sprite mode, full-screen viewer, cry.
 */
export function PokemonShowcase({ id, accent, alt, cry }: PokemonShowcaseProps) {
  const [canEnhance, setCanEnhance] = useState(false);
  const [want3D, setWant3D] = useState(false);
  const [ready, setReady] = useState(false);
  // "model" = real .glb on stage (full 360° rotation); "plane" = flat artwork.
  const [sceneMode, setSceneMode] = useState<"model" | "plane">("plane");
  const [shiny, setShiny] = useState(false);
  const [animated, setAnimated] = useState(false);
  // Some ids have no Showdown GIF — fall back to the static/3D view.
  const [animatedFailed, setAnimatedFailed] = useState(false);
  // Mount the shiny <Image> lazily (first toggle) but keep BOTH variants
  // mounted afterwards: remounting would blank the card while the art reloads.
  const [shinyTouched, setShinyTouched] = useState(false);

  useEffect(() => {
    // Defer to the next frame so the static image paints first, and so the
    // capability check runs outside the synchronous effect body.
    const frame = requestAnimationFrame(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced && hasWebGL()) setCanEnhance(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const textureUrl = shiny ? shinyArtwork(id) : officialArtwork(id);
  const showAnimated = animated && !animatedFailed;
  // The static/3D layers are hidden (not unmounted) under the animated view so
  // toggling back is instant and the 3D scene keeps its state.
  const showStatic = !showAnimated;
  const scene3DActive = want3D && canEnhance;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative mx-auto aspect-square w-full max-w-[300px]"
        style={{ ["--type" as string]: accent }}
      >
        <div className="type-aura absolute inset-0 rounded-full" aria-hidden />

        {showAnimated ? (
          <div className="animate-fade-in absolute inset-0 grid place-items-center">
            {/* Showdown GIFs are tiny (~60–100px) — upscale them to fill the
                stage; pixelated rendering keeps the retro look crisp. */}
            <Image
              src={animatedSprite(id, shiny)}
              alt={`${alt} (sprite animado)`}
              width={300}
              height={300}
              unoptimized
              onError={() => setAnimatedFailed(true)}
              className="h-[64%] w-[64%] object-contain [image-rendering:pixelated] drop-shadow-xl"
            />
          </div>
        ) : null}

        <div className={cn(showStatic ? "contents" : "hidden")}>
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              scene3DActive && ready ? "opacity-0" : "opacity-100",
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

          {scene3DActive ? (
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-700",
                ready ? "opacity-100" : "opacity-0",
              )}
            >
              {/* Keyed by variant + toggle so a failed load only disables the
                  CURRENT attempt — re-pressing "3D" or toggling shiny remounts
                  the boundary and retries. */}
              <SceneBoundary
                key={`${shiny ? "shiny" : "normal"}-${want3D}`}
                onError={() => {
                  setReady(false);
                  setWant3D(false);
                }}
              >
                <Pokemon3DScene
                  textureUrl={textureUrl}
                  modelUrl={pokemonModel3D(id, shiny)}
                  accent={accent}
                  onReady={() => setReady(true)}
                  onModeChange={setSceneMode}
                />
              </SceneBoundary>
            </div>
          ) : null}
        </div>
      </div>

      <div className="z-10 flex flex-wrap items-center justify-center gap-2">
        <FavoriteButton id={id} name={alt} variant="button" />

        {canEnhance ? (
          <button
            type="button"
            onClick={() => {
              setReady(false);
              setWant3D((v) => !v);
            }}
            aria-pressed={want3D}
            title={want3D ? "Volver al arte oficial" : "Ver el modelo 3D real (giratorio)"}
            className={cn(
              "border-border bg-surface/90 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur",
              "hover:bg-surface-hover focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none",
              want3D ? "text-sky-500" : "text-foreground",
            )}
            style={want3D ? { borderColor: accent } : undefined}
          >
            <Rotate3d className="size-3.5" />
            {want3D ? "3D ✓" : "3D"}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => {
            // Show the static art while the new variant (texture/model) loads.
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

        {!animatedFailed ? (
          <button
            type="button"
            onClick={() => setAnimated((v) => !v)}
            aria-pressed={animated}
            title={animated ? "Ver render en alta resolución" : "Ver sprite animado"}
            className={cn(
              "border-border bg-surface/90 text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur",
              "hover:bg-surface-hover focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none",
            )}
            style={animated ? { borderColor: accent } : undefined}
          >
            <PlayCircle className="size-3.5" />
            {animated ? "Animado ✓" : "Animado"}
          </button>
        ) : null}

        <Lightbox
          src={textureUrl}
          alt={alt}
          caption={<span className="font-medium text-white">{alt}</span>}
          className="border-border bg-surface/90 hover:bg-surface-hover focus-visible:ring-ring text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="inline-flex items-center gap-1.5">
            <Maximize2 className="size-3.5" />
            Ampliar
          </span>
        </Lightbox>

        {cry ? <CryButton src={cry.latest ?? cry.legacy} fallback={cry.legacy} /> : null}
      </div>

      {/* Feedback for the 3D mode: loading first, then the 360° hint. */}
      {scene3DActive && showStatic ? (
        ready ? (
          sceneMode === "model" ? (
            <p className="text-muted-foreground animate-fade-in text-xs">
              Modelo 3D real — arrástralo para girarlo 360°
            </p>
          ) : null
        ) : (
          <p
            role="status"
            className="text-muted-foreground inline-flex items-center gap-1.5 text-xs"
          >
            <Loader2 className="size-3 animate-spin" aria-hidden />
            Cargando modelo 3D…
          </p>
        )
      ) : null}
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
