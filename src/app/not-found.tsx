import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-muted-foreground font-mono text-6xl font-bold">404</p>
      <h2 className="text-foreground text-2xl font-bold">Ese Pokémon se ha escapado</h2>
      <p className="text-muted-foreground max-w-md text-sm">
        No hemos encontrado lo que buscabas. Vuelve a la Pokédex para seguir explorando.
      </p>
      <Link
        href="/"
        className="bg-foreground text-background inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
      >
        <ArrowLeft className="size-4" />
        Volver a la Pokédex
      </Link>
    </div>
  );
}
