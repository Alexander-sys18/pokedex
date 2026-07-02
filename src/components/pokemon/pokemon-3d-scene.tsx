"use client";

import { Float, OrbitControls, Sparkles, useGLTF, useTexture } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Component, type ReactNode, Suspense, useEffect, useMemo, useState } from "react";
import { AdditiveBlending, Box3, CanvasTexture, SRGBColorSpace, Vector3 } from "three";

/**
 * Real 3D model (.glb from the Pokémon 3D API assets, Draco-compressed).
 * Normalized so every Pokémon — from Joltik to Wailord — fills the stage the
 * same way: centered and scaled to a fixed height.
 */
function PokemonModel({ url, onReady }: { url: string; onReady?: () => void }) {
  const { scene } = useGLTF(url, true);

  // IMPORTANT: never mutate the cached scene (useGLTF shares one instance per
  // URL). Setting `position` on the <primitive> itself made a remount (shiny
  // toggle, revisiting the page) measure an already-shifted scene, so the
  // model appeared off-center. The centering offset lives on a wrapper group
  // instead, keeping the Box3 measurement stable across mounts.
  const { scale, center } = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    return { scale: 2.7 / maxDimension, center: box.getCenter(new Vector3()) };
  }, [scene]);

  // useGLTF suspends until loaded — this fires once per loaded model.
  useEffect(() => {
    onReady?.();
  }, [scene, onReady]);

  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.35}>
      <group scale={scale}>
        <group position={[-center.x, -center.y, -center.z]}>
          <primitive object={scene} />
        </group>
      </group>
    </Float>
  );
}

/** The Pokémon's artwork as a floating textured plane (fallback mode). */
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
    // Gentle float: the 2.8-unit plane stays well inside the ≈3.2-unit visible
    // height, so the artwork never clips against the canvas edge.
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.5}>
      <mesh>
        <planeGeometry args={[2.8, 2.8]} />
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
    // The glow must fade out INSIDE the camera frustum (visible height at
    // z=-0.6 is ≈3.6 world units): a larger plane spills past the edges and
    // tints the whole square canvas, which reads as an ugly colored box
    // around the artwork instead of an ambient halo.
    <mesh position={[0, 0, -0.6]}>
      <planeGeometry args={[3.3, 3.3]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}

/**
 * If the GLB is missing (coverage is ~97% of the dex, not total) or fails to
 * parse, fall back to the floating artwork plane instead of killing the scene.
 */
class ModelBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onFail?: () => void },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    this.props.onFail?.();
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function Pokemon3DScene({
  textureUrl,
  modelUrl,
  accent,
  onReady,
  onModeChange,
}: {
  textureUrl: string;
  /** Real .glb model URL; when it fails, the artwork plane takes over. */
  modelUrl?: string;
  accent: string;
  onReady?: () => void;
  /** Reports whether the real model or the flat artwork ended up on stage. */
  onModeChange?: (mode: "model" | "plane") => void;
}) {
  const [modelFailed, setModelFailed] = useState(false);

  // A new URL (e.g. the shiny toggle) deserves a fresh attempt at the model
  // (React's "adjust state when a prop changes" render-time pattern).
  const [lastModelUrl, setLastModelUrl] = useState(modelUrl);
  if (lastModelUrl !== modelUrl) {
    setLastModelUrl(modelUrl);
    setModelFailed(false);
  }

  const usingModel = Boolean(modelUrl) && !modelFailed;

  useEffect(() => {
    onModeChange?.(usingModel ? "model" : "plane");
  }, [usingModel, onModeChange]);

  const fallbackPlane = <ArtworkPlane textureUrl={textureUrl} onReady={onReady} />;

  return (
    <Canvas
      camera={{ position: [0, 0, 4.4], fov: 40 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "none" }}
    >
      {/* GLB materials are PBR — they need light (the flat plane doesn't care). */}
      <ambientLight intensity={1.15} />
      <directionalLight position={[3, 4, 5]} intensity={1.5} />
      <directionalLight position={[-3, 2, -4]} intensity={0.5} />

      <Glow accent={accent} />
      <Suspense fallback={null}>
        {usingModel && modelUrl ? (
          <ModelBoundary
            key={modelUrl}
            fallback={fallbackPlane}
            onFail={() => setModelFailed(true)}
          >
            <PokemonModel url={modelUrl} onReady={onReady} />
          </ModelBoundary>
        ) : (
          fallbackPlane
        )}
      </Suspense>
      {/* Kept inside the visible frustum so no sparkle pops in/out at the
          square canvas edge. */}
      <Sparkles count={36} scale={[4, 4, 2]} size={3} speed={0.35} opacity={0.7} color={accent} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 2 - 0.6}
        maxPolarAngle={Math.PI / 2 + 0.6}
        // The real model can spin all the way around; the flat artwork only
        // tilts (looking at a plane edge-on gives the trick away).
        {...(usingModel ? {} : { minAzimuthAngle: -0.6, maxAzimuthAngle: 0.6 })}
      />
    </Canvas>
  );
}
