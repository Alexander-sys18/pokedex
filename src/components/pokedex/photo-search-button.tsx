"use client";

import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PhotoSearchButtonProps {
  onIdentified: (name: string) => void;
}

type Result =
  | { kind: "match"; id: number; name: string }
  | { kind: "none" }
  | { kind: "error"; message: string };

/** Downscale + re-encode to keep the upload small and vision cheap. */
async function toCompressedDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxEdge = 512;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas no disponible");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}

export function PhotoSearchButton({ onIdentified }: PhotoSearchButtonProps) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  // Two inputs: with `capture` the phone jumps straight to the camera; without
  // it, to the gallery/file picker. The menu lets the user choose either.
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/vision")
      .then((r) => r.json())
      .then((d: { enabled?: boolean }) => active && setEnabled(Boolean(d.enabled)))
      .catch(() => active && setEnabled(false));
    return () => {
      active = false;
    };
  }, []);

  if (!enabled) return null;

  const handleFile = async (file: File) => {
    setResult(null);
    setLoading(true);
    try {
      const image = await toCompressedDataUrl(file);
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setResult({ kind: "error", message: data?.error ?? "No se pudo analizar la imagen." });
        return;
      }
      const data = (await res.json()) as { match: { id: number; name: string } | null };
      if (data.match) {
        onIdentified(data.match.name);
        setResult({ kind: "match", id: data.match.id, name: data.match.name });
      } else {
        setResult({ kind: "none" });
      }
    } catch {
      setResult({ kind: "error", message: "No se pudo procesar la foto." });
    } finally {
      setLoading(false);
    }
  };

  const onFileChosen = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  };

  return (
    <div className="relative">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChosen}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChosen}
      />
      <button
        type="button"
        onClick={() => {
          // Retrying after a result: the stale popover must not cover the menu.
          setResult(null);
          setMenuOpen((open) => !open);
        }}
        disabled={loading}
        aria-busy={loading}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Buscar por foto"
        title="Buscar por foto"
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold",
          "border-brand/40 bg-brand/10 text-brand-deep dark:text-red-300",
          "hover:bg-brand/20 focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none",
          "disabled:opacity-60",
        )}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
        <span>{loading ? "Identificando…" : "Foto"}</span>
      </button>

      {menuOpen ? (
        <>
          {/* Invisible backdrop: a tap anywhere else closes the menu. */}
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
            tabIndex={-1}
          />
          <div
            role="menu"
            aria-label="Buscar Pokémon por foto"
            className="border-border bg-popover absolute top-full right-0 z-30 mt-2 w-56 rounded-xl border p-1.5 shadow-[var(--shadow-card-hover)]"
          >
            <p className="text-muted-foreground px-2.5 pt-1.5 pb-1 text-xs font-medium">
              Identificar un Pokémon con IA
            </p>
            <p className="text-muted-foreground/80 px-2.5 pb-2 text-[0.7rem] leading-snug">
              La foto se envía a la API de Claude solo para identificarla; no se almacena.
            </p>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                cameraRef.current?.click();
              }}
              className="text-foreground hover:bg-muted flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm font-medium transition-colors"
            >
              <Camera className="text-brand size-4" />
              Hacer una foto
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                galleryRef.current?.click();
              }}
              className="text-foreground hover:bg-muted flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm font-medium transition-colors"
            >
              <ImagePlus className="text-brand size-4" />
              Subir de la galería
            </button>
          </div>
        </>
      ) : null}

      {result ? (
        // role="status": the async identification verdict gets announced.
        <div
          role="status"
          className="border-border bg-popover absolute top-full right-0 z-30 mt-2 w-64 rounded-xl border p-3 shadow-[var(--shadow-card-hover)]"
        >
          <button
            type="button"
            onClick={() => setResult(null)}
            aria-label="Cerrar"
            className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-2 right-2 grid size-6 place-items-center rounded-md"
          >
            <X className="size-3.5" />
          </button>
          {result.kind === "match" ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                📷 Parece <span className="text-foreground font-semibold">{result.name}</span>
              </p>
              <Link
                href={`/pokemon/${result.id}`}
                className="bg-foreground text-background inline-flex rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90"
              >
                Ver ficha
              </Link>
            </div>
          ) : result.kind === "none" ? (
            <p className="text-muted-foreground pr-4 text-sm">
              No he reconocido ningún Pokémon en la foto. Prueba con otra imagen.
            </p>
          ) : (
            <p className="pr-4 text-sm text-red-500">{result.message}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
