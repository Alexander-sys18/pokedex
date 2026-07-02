"use client";

import { Loader2, RefreshCw, Send, Volume2, VolumeX, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useChat, type ChatMessage } from "@/lib/chat/use-chat";
import { toSpeakableText, useSpeech } from "@/lib/chat/use-speech";
import { professorOakSprite } from "@/lib/pokedex/image";
import { cn } from "@/lib/utils";
import { ChatMarkdown } from "./chat-markdown";
import { OakAvatar } from "./oak-avatar";

const SUGGESTIONS = [
  "Compara Charizard y Blastoise",
  "¿Cómo evoluciona Eevee?",
  "Trucos para capturar legendarios",
  "¿Con qué venzo a un tipo dragón?",
];

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const { messages, status, error, send, reset } = useChat();
  const speech = useSpeech();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  // Ids already voiced (or consumed while voice was off) — never re-read them.
  // Seeded with whatever replies already exist on mount, so a restored
  // conversation is never read back unprompted.
  const spokenRef = useRef<Set<string> | null>(null);
  if (spokenRef.current === null) {
    spokenRef.current = new Set(
      messages.filter((m) => m.role === "assistant" && m.content).map((m) => m.id),
    );
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // Read each reply aloud once it finishes streaming (only while voice is on;
  // replies completed with voice off are marked as consumed, not read later).
  useEffect(() => {
    if (status !== "idle") return;
    const last = [...messages].reverse().find((m) => m.role === "assistant" && m.content);
    if (!last || spokenRef.current?.has(last.id)) return;
    spokenRef.current?.add(last.id);
    if (speech.enabled) speech.speak(last.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, messages, speech.enabled]);

  const submit = () => {
    const value = input;
    setInput("");
    speech.stop();
    void send(value);
  };

  const ask = (text: string) => {
    speech.stop();
    void send(text);
  };

  const talking = status === "streaming" || speech.speaking;

  return (
    <div
      role="dialog"
      aria-label="Profesor Oak — asistente de la Pokédex"
      className={cn(
        // Mobile: near-fullscreen bottom sheet (iOS safe-area aware);
        // desktop: floating panel in the corner.
        "fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-50 flex flex-col",
        "h-[min(38rem,calc(100dvh-4.5rem))] sm:h-[min(34rem,calc(100dvh-2rem))]",
        "sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[min(26rem,calc(100vw-2rem))]",
        "border-border bg-popover overflow-hidden rounded-2xl border shadow-[var(--shadow-card-hover)]",
      )}
    >
      <header className="border-border bg-popover flex items-center gap-2.5 border-b px-3.5 py-2.5">
        <OakAvatar size={36} talking={talking} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-foreground text-sm font-semibold">Profesor Oak</p>
          <p className="text-muted-foreground text-[0.7rem]" aria-live="polite" aria-atomic="true">
            {status === "streaming"
              ? "Investigando…"
              : speech.speaking
                ? "Hablando…"
                : "Investigador Pokémon · Pueblo Paleta"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {speech.supported ? (
            <button
              type="button"
              onClick={() => speech.setEnabled(!speech.enabled)}
              aria-pressed={speech.enabled}
              aria-label={speech.enabled ? "Desactivar la voz" : "Activar la voz"}
              title={speech.enabled ? "Desactivar la voz del Profesor" : "Activar la voz del Profesor"}
              className={cn(
                "grid size-8 place-items-center rounded-lg transition-colors",
                speech.enabled
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {speech.enabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              speech.stop();
              spokenRef.current?.clear();
              reset();
            }}
            aria-label="Reiniciar conversación"
            title="Reiniciar"
            className="text-muted-foreground hover:bg-muted hover:text-foreground grid size-8 place-items-center rounded-lg transition-colors"
          >
            <RefreshCw className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              speech.stop();
              onClose();
            }}
            aria-label="Cerrar asistente"
            className="text-muted-foreground hover:bg-muted hover:text-foreground grid size-8 place-items-center rounded-lg transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-3">
            {/* Oak greets you in person, RPG-style. */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <div className="oak-float relative size-24">
                <div
                  className="type-aura absolute inset-0 rounded-full"
                  style={{ ["--type" as string]: "#3b82f6" }}
                  aria-hidden
                />
                <Image
                  src={professorOakSprite()}
                  alt="Profesor Oak"
                  fill
                  unoptimized
                  className="object-contain [image-rendering:pixelated] drop-shadow-md"
                />
              </div>
            </div>
            <div className="border-border bg-background/50 relative rounded-xl border p-3">
              <p className="text-foreground text-sm leading-relaxed">
                ¡Hola! Soy el <span className="font-semibold">Profesor Oak</span>. Pregúntame lo
                que quieras sobre Pokémon: datos, comparativas, evoluciones, debilidades, trucos o
                estrategia.
                {speech.supported ? (
                  <span className="text-muted-foreground">
                    {" "}
                    Activa el altavoz de arriba y te responderé con mi voz.
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="border-border text-foreground hover:bg-muted rounded-xl border px-3 py-2 text-left text-sm transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <ChatBubble
              key={m.id}
              message={m}
              streaming={status === "streaming"}
              onSpeak={
                speech.supported && m.role === "assistant" && m.content
                  ? () => speech.speak(m.content)
                  : undefined
              }
            />
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
            placeholder="Pregúntale al Profesor Oak…"
            aria-label="Pregúntale al Profesor Oak"
            className="border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-border-strong focus-visible:ring-ring max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-xl border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={status === "streaming" || input.trim().length === 0}
            aria-label={status === "streaming" ? "Respondiendo…" : "Enviar"}
            aria-busy={status === "streaming"}
            className="bg-foreground text-background grid size-10 shrink-0 place-items-center rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {status === "streaming" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  streaming,
  onSpeak,
}: {
  message: ChatMessage;
  streaming: boolean;
  onSpeak?: () => void;
}) {
  const isUser = message.role === "user";
  const isPending = !isUser && message.content.length === 0 && streaming;

  return (
    <div className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
      <div className={cn("flex w-full items-end gap-2", isUser && "justify-end")}>
        {!isUser ? <OakAvatar size={28} talking={isPending} className="mb-0.5" /> : null}
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm",
            isUser
              ? "bg-foreground text-background max-w-[85%] whitespace-pre-wrap"
              : "border-border bg-background/50 text-foreground min-w-0 flex-1 border",
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
      </div>

      {!isUser && (onSpeak || (message.pokemon && message.pokemon.length > 0)) ? (
        <div className="flex w-full flex-wrap items-center gap-1.5 pl-9">
          {message.pokemon?.map((p) => (
            <Link
              key={p.id}
              href={`/pokemon/${p.id}`}
              className="border-border bg-background/50 text-foreground hover:bg-muted inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-medium transition-colors"
            >
              {p.name}
            </Link>
          ))}
          {onSpeak && toSpeakableText(message.content) ? (
            <button
              type="button"
              onClick={onSpeak}
              aria-label="Escuchar esta respuesta"
              title="Escuchar esta respuesta"
              className="text-muted-foreground hover:bg-muted hover:text-foreground grid size-6 place-items-center rounded-full transition-colors"
            >
              <Volume2 className="size-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TypingDots() {
  return (
    <span
      className="inline-flex items-center gap-1.5 py-1"
      role="status"
      aria-label="El Profesor Oak está investigando"
    >
      <span className="text-muted-foreground text-xs">El Profesor investiga</span>
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
