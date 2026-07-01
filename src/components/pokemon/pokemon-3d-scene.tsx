"use client";

import { Float, OrbitControls, Sparkles, useTexture } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo } from "react";
import { AdditiveBlending, CanvasTexture, SRGBColorSpace } from "three";

/** The Pokémon's artwork as a floating textured plane. */
function ArtworkPlane({ textureUrl, onReady }: { textureUrl: string; onReady?: () => void }) {
  const texture = useTexture(textureUrl, (loaded) => {
    // Configure color space at load time (mutating the hook's return is disallowed).
    const tex = Array.isArray(loaded) ? loaded[0] : loaded;
    if (tex) tex.colorSpace = SRGBColorSpace;
  });
  // useTexture suspends until loaded, so this fires once per loaded texture
  // (including when the URL changes, e.g. toggling shiny).
  useEffect(() => {
    onReady?.();
  }, [texture, onReady]);
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.9}>
      <mesh>
        <planeGeometry args={[2.9, 2.9]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
    </Float>
  );
}

/** Type-colored radial glow behind the artwork (canvas-generated texture). */
function Glow({ accent }: { accent: string }) {
  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2,
      );
      gradient.addColorStop(0, accent);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
    return new CanvasTexture(canvas);
  }, [accent]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, 0, -0.6]}>
      <planeGeometry args={[6, 6]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}

export default function Pokemon3DScene({
  textureUrl,
  accent,
  onReady,
}: {
  textureUrl: string;
  accent: string;
  onReady?: () => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.4], fov: 40 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "none" }}
    >
      <Glow accent={accent} />
      <Suspense fallback={null}>
        <ArtworkPlane textureUrl={textureUrl} onReady={onReady} />
      </Suspense>
      <Sparkles count={40} scale={[6, 6, 3]} size={3} speed={0.35} opacity={0.7} color={accent} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 2 - 0.5}
        maxPolarAngle={Math.PI / 2 + 0.5}
        minAzimuthAngle={-0.6}
        maxAzimuthAngle={0.6}
      />
    </Canvas>
  );
}
