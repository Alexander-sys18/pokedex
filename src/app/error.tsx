"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h2 className="text-foreground text-2xl font-bold">Algo ha ido mal</h2>
      <p className="text-muted-foreground max-w-md text-sm">
        No hemos podido cargar los datos de la Pokédex. Puede ser un problema temporal con la API.
        Inténtalo de nuevo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-foreground text-background inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
      >
        <RotateCcw className="size-4" />
        Reintentar
      </button>
    </div>
  );
}
