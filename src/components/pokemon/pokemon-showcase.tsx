"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode, useEffect, useState } from "react";
import { PokemonArtwork } from "./pokemon-artwork";
import { cn } from "@/lib/utils";

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

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

interface PokemonShowcaseProps {
  id: number;
  accent: string;
  alt: string;
}

/**
 * Progressive enhancement: the static artwork renders on the server (fast paint
 * + SEO), then upgrades to an interactive 3D scene on capable clients. Falls
 * back to the static image when motion is reduced or WebGL is unavailable.
 */
export function PokemonShowcase({ id, accent, alt }: PokemonShowcaseProps) {
  const [enhance, setEnhance] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Defer to the next frame so the static image paints first, and so the
    // capability check runs outside the synchronous effect body.
    const frame = requestAnimationFrame(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced && hasWebGL()) setEnhance(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
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
        <PokemonArtwork
          id={id}
          alt={alt}
          sizes="(max-width: 768px) 70vw, 300px"
          priority
          className="drop-shadow-xl"
        />
      </div>

      {enhance ? (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            ready ? "opacity-100" : "opacity-0",
          )}
        >
          <SceneBoundary
            onError={() => {
              setReady(false);
              setEnhance(false);
            }}
          >
            <Pokemon3DScene id={id} accent={accent} onReady={() => setReady(true)} />
          </SceneBoundary>
        </div>
      ) : null}
    </div>
  );
}
