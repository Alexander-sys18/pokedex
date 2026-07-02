"use client";

import { ChevronLeft, ChevronRight, WalletCards, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TcgCard } from "@/lib/tcg";
import { cn } from "@/lib/utils";

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

/** Minimum horizontal swipe (px) to count as a navigation gesture. */
const SWIPE_THRESHOLD = 48;

/**
 * Full-screen card viewer with gallery navigation: on-screen arrows, ←/→ on
 * the keyboard and horizontal swipe on touch screens. Same modal manners as
 * the Lightbox (portal, Escape/backdrop/✕ close, body scroll lock, focus
 * trap, focus restore).
 */
function CardGallery({
  cards,
  index,
  onNavigate,
  onClose,
}: {
  cards: TcgCard[];
  index: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}) {
  const card = cards[index]!;
  const hasPrev = index > 0;
  const hasNext = index < cards.length - 1;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  // Swipe state: start point of a single-finger gesture, or null once a
  // second finger (pinch) or a cancel invalidates it.
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const goPrev = () => {
    if (hasPrev) onNavigate(index - 1);
  };
  const goNext = () => {
    if (hasNext) onNavigate(index + 1);
  };

  // Modal manners, once per open: focus in, lock scroll, restore on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Keyboard: Escape closes, arrows page, Tab stays trapped inside.
  // (Re-registered per index — trivially cheap, and keeps values fresh.)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        if (hasPrev) onNavigate(index - 1);
        return;
      }
      if (event.key === "ArrowRight") {
        if (hasNext) onNavigate(index + 1);
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, hasPrev, hasNext, onClose, onNavigate]);

  // aria-disabled (not `disabled`): the buttons stay focusable at the ends,
  // so keyboard focus never drops to <body> when an arrow "turns off" while
  // focused, and the Tab trap keeps working at both boundaries.
  const arrowClass = (enabled: boolean) =>
    cn(
      "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full",
      "bg-white/10 text-white transition-colors",
      "focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none",
      enabled ? "hover:bg-white/20" : "cursor-default opacity-30",
    );

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Carta ${card.name} (${index + 1} de ${cards.length})`}
      onClick={onClose}
      onTouchStart={(event) => {
        // A second finger means pinch-zoom, not a swipe — drop the gesture.
        if (event.touches.length > 1) {
          touchStart.current = null;
          return;
        }
        const touch = event.touches[0];
        touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
      }}
      onTouchCancel={() => {
        touchStart.current = null;
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        touchStart.current = null;
        // Ignore if invalidated, if other fingers are still down, or if the
        // movement is more vertical than horizontal (pan/scroll, not a swipe).
        if (!start || event.touches.length > 0) return;
        const end = event.changedTouches[0];
        if (!end) return;
        const deltaX = end.clientX - start.x;
        const deltaY = end.clientY - start.y;
        if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) return;
        if (deltaX < 0) goNext();
        else goPrev();
      }}
      className="animate-fade-in fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-black/85 p-4 backdrop-blur-md sm:p-8"
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
      >
        <X className="size-5" />
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          goPrev();
        }}
        aria-disabled={!hasPrev}
        aria-label="Carta anterior"
        className={cn(arrowClass(hasPrev), "left-2 sm:left-6")}
      >
        <ChevronLeft className="size-6" />
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          goNext();
        }}
        aria-disabled={!hasNext}
        aria-label="Carta siguiente"
        className={cn(arrowClass(hasNext), "right-2 sm:right-6")}
      >
        <ChevronRight className="size-6" />
      </button>

      {/* Remount on card change so the zoom-in confirms the page turn. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={card.id}
        src={card.imageUrlHigh}
        alt={`Carta ${card.name} (${card.id})`}
        onClick={(event) => event.stopPropagation()}
        className="animate-zoom-in max-h-[78vh] max-w-[88vw] rounded-xl object-contain shadow-2xl sm:max-h-[82vh]"
      />

      {/* role="status": paging announces "Pikachu · cel25-5, 3 / 10". */}
      <div
        role="status"
        onClick={(event) => event.stopPropagation()}
        className="flex max-w-[92vw] flex-col items-center gap-0.5 text-center"
      >
        <p className="text-sm text-white/80">
          <span className="font-medium text-white">{card.name}</span>{" "}
          <span className="font-mono text-white/60">· {card.id}</span>
        </p>
        <p className="font-mono text-xs text-white/50">
          {index + 1} / {cards.length}
        </p>
      </div>

      {/* Warm the neighbours' scans so arrow/swipe feels instant. */}
      <div className="hidden" aria-hidden>
        {hasPrev ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cards[index - 1]!.imageUrlHigh} alt="" />
        ) : null}
        {hasNext ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cards[index + 1]!.imageUrlHigh} alt="" />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Horizontal gallery of real trading-card scans (Spanish, via TCGdex). Each
 * thumbnail opens the full-screen viewer, which pages through the whole set.
 */
export function TcgCards({ cards }: { cards: TcgCard[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {cards.map((card, index) => (
          <figure key={card.id} className="w-36 shrink-0 sm:w-40">
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`Ampliar: carta ${card.name} (${card.id})`}
              className="focus-visible:ring-ring block w-full cursor-zoom-in rounded-lg focus-visible:ring-2 focus-visible:outline-none"
            >
              <CardThumb card={card} />
            </button>
            {/* The catalog id lives in the viewer + aria-label; raw ids under
                every thumbnail read like debug output. */}
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
        . Toca una carta para verla en grande y desliza (o usa ←/→) para pasar entre cartas.
      </p>

      {openIndex !== null ? (
        <CardGallery
          cards={cards}
          index={openIndex}
          onNavigate={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </div>
  );
}
