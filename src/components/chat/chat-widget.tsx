"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { OakAvatar } from "./oak-avatar";

// The panel (with the Markdown renderer) is heavy-ish: load it only when the
// user actually opens the chat — pages stay light.
const ChatPanel = dynamic(() => import("./chat-panel").then((m) => m.ChatPanel), { ssr: false });

export function ChatWidget() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

  // Only show the assistant when the server has an API key configured.
  useEffect(() => {
    let active = true;
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d: { enabled?: boolean }) => active && setEnabled(Boolean(d.enabled)))
      .catch(() => active && setEnabled(false));
    return () => {
      active = false;
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Hablar con el Profesor Oak"
          className={cn(
            // Mobile clears the tab bar (h-16 + safe area); desktop keeps the corner.
            "fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 inline-flex items-center gap-2.5 rounded-full py-2 pr-4 pl-2 sm:right-6 sm:bottom-6",
            "bg-foreground text-background shadow-lg transition-transform hover:scale-105",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          )}
        >
          <OakAvatar size={32} className="border-background/30 bg-background/15" />
          <span className="flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold">Profesor Oak</span>
            <span className="text-background/70 text-[0.65rem] font-medium">
              Pregúntame lo que quieras
            </span>
          </span>
        </button>
      ) : (
        <ChatPanel onClose={() => setOpen(false)} />
      )}
    </>
  );
}
