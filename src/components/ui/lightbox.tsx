"use client";

import { X } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface LightboxProps {
  /** High-resolution image shown when expanded. */
  src: string;
  alt: string;
  /** Optional caption under the expanded image. */
  caption?: ReactNode;
  /** The trigger content (usually a thumbnail). Rendered inside a button. */
  children: ReactNode;
  /** Classes for the trigger button. */
  className?: string;
  ariaLabel?: string;
}

/**
 * Accessible image viewer: the trigger opens a full-screen modal with the
 * high-res image. Closes on Escape, backdrop click or the ✕ button, locks body
 * scroll while open, and portals to <body> so it escapes any clipping/stacking
 * context. Manages focus like a modal dialog: moves focus in on open, traps Tab
 * inside the overlay, and restores focus to the trigger on close.
 */
export function Lightbox({ src, alt, caption, children, className, ariaLabel }: LightboxProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    // Remember what was focused (the trigger) so we can restore it on close.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;
      // Trap focus within the overlay.
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])',
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      // Return focus to the element that opened the viewer.
      previouslyFocused?.focus?.();
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabel ?? `Ampliar: ${alt}`}
        className={cn("cursor-zoom-in", className)}
      >
        {children}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={alt}
              onClick={close}
              className="animate-fade-in fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black/85 p-4 backdrop-blur-md sm:p-8"
            >
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                aria-label="Cerrar"
                className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
              >
                <X className="size-5" />
              </button>

              {/* Intrinsic sizing on an unknown aspect ratio — next/image `fill`
                  would need a fixed frame, so a plain <img> is the right call. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                onClick={(event) => event.stopPropagation()}
                className="animate-zoom-in max-h-[85vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
              />

              {caption ? (
                <div
                  onClick={(event) => event.stopPropagation()}
                  className="max-w-[92vw] text-center text-sm text-white/80"
                >
                  {caption}
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
