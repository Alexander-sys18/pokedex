"use client";

import { useCallback, useRef } from "react";

/** Max rotation (degrees) applied at the card edges. */
const MAX_TILT = 9;

/**
 * Pointer-driven 3D tilt + holographic sheen, as a **callback ref**. Attaches
 * native pointer listeners and writes CSS variables straight on the element (no
 * React re-render per move), so it stays smooth even inside a virtualized grid.
 * Honors `prefers-reduced-motion`.
 */
export function useTilt<T extends HTMLElement>() {
  const cleanupRef = useRef<(() => void) | null>(null);

  return useCallback((node: T | null) => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const onEnter = () => node.style.setProperty("--ty", "-4px");
    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width; // 0 → 1
      const py = (event.clientY - rect.top) / rect.height; // 0 → 1
      node.style.setProperty("--ry", `${(px - 0.5) * 2 * MAX_TILT}deg`);
      node.style.setProperty("--rx", `${(0.5 - py) * 2 * MAX_TILT}deg`);
      node.style.setProperty("--mx", `${px * 100}%`);
      node.style.setProperty("--my", `${py * 100}%`);
      node.style.setProperty("--sheen", "1");
    };
    const onLeave = () => {
      node.style.setProperty("--rx", "0deg");
      node.style.setProperty("--ry", "0deg");
      node.style.setProperty("--ty", "0px");
      node.style.setProperty("--sheen", "0");
    };

    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    cleanupRef.current = () => {
      node.removeEventListener("pointerenter", onEnter);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, []);
}
