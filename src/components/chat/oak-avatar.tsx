"use client";

import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { professorOakSprite } from "@/lib/pokedex/image";
import { cn } from "@/lib/utils";

interface OakAvatarProps {
  /** Rendered size in px (square). */
  size?: number;
  /** Animate while Oak is "talking" (streaming a reply or speaking aloud). */
  talking?: boolean;
  className?: string;
}

/**
 * Professor Oak's face in a framed circle, cropped from the official trainer
 * sprite (pixel art — rendered pixelated so it stays crisp at any scale).
 * Falls back to a sparkle icon if the sprite can't load.
 */
export function OakAvatar({ size = 36, talking = false, className }: OakAvatarProps) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      aria-hidden
      className={cn(
        "border-border relative grid shrink-0 place-items-center overflow-hidden rounded-full border",
        "bg-gradient-to-b from-amber-500/15 via-transparent to-emerald-500/15",
        talking && "oak-talking",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {failed ? (
        <Sparkles className="text-muted-foreground size-1/2" />
      ) : (
        <Image
          src={professorOakSprite()}
          alt=""
          width={size}
          height={size}
          unoptimized
          onError={() => setFailed(true)}
          // Zoom towards the head of the full-body 80×80 sprite.
          className="scale-[1.9] translate-y-[30%] object-contain [image-rendering:pixelated]"
        />
      )}
    </span>
  );
}
