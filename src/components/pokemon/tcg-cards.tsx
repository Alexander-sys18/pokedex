import Image from "next/image";
import type { TcgCard } from "@/lib/tcg";

/**
 * Horizontal gallery of real trading-card scans (Spanish, via TCGdex).
 * Server-rendered; the parent hides the whole panel when there are no cards.
 */
export function TcgCards({ cards }: { cards: TcgCard[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {cards.map((card) => (
          <figure key={card.id} className="w-36 shrink-0 sm:w-40">
            <div className="relative aspect-[63/88] overflow-hidden rounded-lg shadow-[var(--shadow-card)] transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.03]">
              <Image
                src={card.imageUrl}
                alt={`Carta ${card.name} (${card.id})`}
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
            <figcaption className="text-muted-foreground mt-1.5 truncate text-center font-mono text-[0.65rem]">
              {card.id}
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        Escaneos reales de cartas del Juego de Cartas Coleccionables (en español), vía{" "}
        <a
          href="https://tcgdex.dev"
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline-offset-4 hover:underline"
        >
          TCGdex
        </a>
        .
      </p>
    </div>
  );
}
