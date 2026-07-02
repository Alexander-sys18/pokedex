"use client";

import { WalletCards } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Lightbox } from "@/components/ui/lightbox";
import type { TcgCard } from "@/lib/tcg";

/**
 * Card thumbnail that always shows SOMETHING: the low-res scan loads straight
 * from the TCGdex CDN (unoptimized — it's already a small webp, and skipping
 * the image optimizer removes its only intermittent point of failure). If the
 * low-res asset itself fails, retry with the high-res scan; if that also
 * fails, render a named placeholder frame instead of a broken-image icon.
 */
function CardThumb({ card }: { card: TcgCard }) {
  const sources = [card.imageUrl, card.imageUrlHigh];
  const [index, setIndex] = useState(0);

  if (index >= sources.length) {
    return (
      <div className="border-border bg-muted/60 text-muted-foreground flex aspect-[63/88] flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-2 text-center">
        <WalletCards className="size-6" aria-hidden />
        <span className="text-[0.65rem] leading-tight font-medium">{card.name}</span>
      </div>
    );
  }

  return (
    <div className="bg-muted/40 relative aspect-[63/88] overflow-hidden rounded-lg shadow-[var(--shadow-card)] transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.03]">
      <Image
        src={sources[index]!}
        alt={`Carta ${card.name} (${card.id})`}
        fill
        sizes="160px"
        unoptimized
        onError={() => setIndex((prev) => prev + 1)}
        className="object-cover"
      />
    </div>
  );
}

/**
 * Horizontal gallery of real trading-card scans (Spanish, via TCGdex). Each
 * thumbnail opens the high-resolution scan in a full-screen viewer.
 */
export function TcgCards({ cards }: { cards: TcgCard[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {cards.map((card) => (
          <figure key={card.id} className="w-36 shrink-0 sm:w-40">
            <Lightbox
              src={card.imageUrlHigh}
              alt={`Carta ${card.name} (${card.id})`}
              caption={
                <>
                  <span className="font-medium text-white">{card.name}</span>{" "}
                  <span className="font-mono text-white/60">· {card.id}</span>
                </>
              }
              className="block w-full"
            >
              <CardThumb card={card} />
            </Lightbox>
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
        . Toca una carta para verla en grande.
      </p>
    </div>
  );
}
