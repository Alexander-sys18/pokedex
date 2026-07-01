"use client";

import { useCallback, useRef, useState } from "react";

export interface ChatPokemon {
  id: number;
  name: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pokemon?: ChatPokemon[];
}

type Status = "idle" | "streaming";

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

/**
 * Client state + streaming for the Pokédex assistant. Sends the conversation to
 * /api/chat and reads the NDJSON event stream, appending assistant text live.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setStatus("idle");
  }, []);

  const streamResponse = useCallback(
    async (payload: { role: string; content: string }[], assistantId: string) => {
      setStatus("streaming");
      const controller = new AbortController();
      abortRef.current = controller;

      const patch = (fn: (m: ChatMessage) => ChatMessage) =>
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? fn(m) : m)));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payload }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setError(data?.error ?? "No se pudo contactar con el asistente.");
          patch((m) => ({ ...m, content: m.content || "…" }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as
              | { type: "text"; text: string }
              | { type: "pokemon"; items: ChatPokemon[] }
              | { type: "done" }
              | { type: "error"; message: string };

            if (event.type === "text") {
              patch((m) => ({ ...m, content: m.content + event.text }));
            } else if (event.type === "pokemon") {
              patch((m) => ({ ...m, pokemon: event.items }));
            } else if (event.type === "error") {
              setError(event.message);
            }
          }
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError("Se interrumpió la respuesta.");
        }
      } finally {
        setStatus("idle");
        abortRef.current = null;
      }
    },
    [],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || status === "streaming") return;

      setError(null);
      const userMessage: ChatMessage = { id: newId(), role: "user", content: trimmed };
      const assistantId = newId();

      // Build the request payload from prior turns + this user message.
      setMessages((prev) => {
        const payload = [...prev, userMessage].map(({ role, content }) => ({ role, content }));
        void streamResponse(payload, assistantId);
        return [...prev, userMessage, { id: assistantId, role: "assistant", content: "" }];
      });
    },
    [status, streamResponse],
  );

  return { messages, status, error, send, reset };
}
