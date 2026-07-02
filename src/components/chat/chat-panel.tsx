"use client";

import { RefreshCw, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useChat, type ChatMessage } from "@/lib/chat/use-chat";
import { cn } from "@/lib/utils";
import { ChatMarkdown } from "./chat-markdown";

const SUGGESTIONS = [
  "Compara Charizard y Blastoise",
  "¿Cómo evoluciona Eevee?",
  "Trucos para capturar legendarios",
  "¿Con qué venzo a un tipo dragón?",
];

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const { messages, status, error, send, reset } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = () => {
    const value = input;
    setInput("");
    void send(value);
  };

  return (
    <div
      role="dialog"
      aria-label="Asistente de la Pokédex"
      className={cn(
        "fixed right-4 bottom-4 z-50 flex flex-col sm:right-6 sm:bottom-6",
        "h-[min(34rem,calc(100dvh-2rem))] w-[min(26rem,calc(100vw-2rem))]",
        "border-border bg-popover overflow-hidden rounded-2xl border shadow-[var(--shadow-card-hover)]",
      )}
    >
      <header className="border-border bg-popover flex items-center gap-2 border-b px-4 py-3">
        <Sparkles className="text-foreground size-4" />
        <span className="text-foreground text-sm font-semibold">Pregúntale a la Pokédex</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={reset}
            aria-label="Reiniciar conversación"
            title="Reiniciar"
            className="text-muted-foreground hover:bg-muted hover:text-foreground grid size-8 place-items-center rounded-lg transition-colors"
          >
            <RefreshCw className="size-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar asistente"
            className="text-muted-foreground hover:bg-muted hover:text-foreground grid size-8 place-items-center rounded-lg transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Pregúntame lo que quieras sobre Pokémon: datos, comparativas, evoluciones, trucos o
              estrategia.
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="border-border text-foreground hover:bg-muted rounded-xl border px-3 py-2 text-left text-sm transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <ChatBubble key={m.id} message={m} streaming={status === "streaming"} />
          ))
        )}

        {error ? (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
        ) : null}
      </div>

      <div className="border-border bg-popover border-t p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Escribe tu pregunta…"
            aria-label="Escribe tu pregunta"
            className="border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-border-strong focus-visible:ring-ring max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-xl border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={status === "streaming" || input.trim().length === 0}
            aria-label="Enviar"
            className="bg-foreground text-background grid size-10 shrink-0 place-items-center rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message, streaming }: { message: ChatMessage; streaming: boolean }) {
  const isUser = message.role === "user";
  const isPending = !isUser && message.content.length === 0 && streaming;

  return (
    <div className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "rounded-2xl px-3 py-2 text-sm",
          isUser
            ? "bg-foreground text-background max-w-[85%] whitespace-pre-wrap"
            : "border-border bg-background/50 text-foreground w-full max-w-full border",
        )}
      >
        {isPending ? (
          <TypingDots />
        ) : isUser ? (
          message.content
        ) : (
          <ChatMarkdown content={message.content} />
        )}
      </div>

      {message.pokemon && message.pokemon.length > 0 ? (
        <div className="flex max-w-[85%] flex-wrap gap-1.5">
          {message.pokemon.map((p) => (
            <Link
              key={p.id}
              href={`/pokemon/${p.id}`}
              className="border-border bg-background/50 text-foreground hover:bg-muted rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
            >
              {p.name}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="Escribiendo">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="bg-muted-foreground size-1.5 animate-bounce rounded-full"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
