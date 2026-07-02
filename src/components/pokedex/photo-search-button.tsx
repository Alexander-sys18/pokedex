"use client";

import { Camera, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const [result, setResult] = useState<Result | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        aria-label="Buscar por foto"
        title="Buscar por foto"
        className={cn(
          "border-border bg-surface text-foreground inline-flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium",
          "hover:bg-surface-hover focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none",
          "disabled:opacity-60",
        )}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
        <span className="hidden sm:inline">{loading ? "Identificando…" : "Foto"}</span>
      </button>

      {result ? (
        <div className="border-border bg-popover absolute top-full right-0 z-30 mt-2 w-64 rounded-xl border p-3 shadow-[var(--shadow-card-hover)]">
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
