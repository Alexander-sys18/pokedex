"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

/** Conversation survives reloads (per tab); capped to what the API accepts. */
const STORAGE_KEY = "pokedex:oak-chat";
const MAX_STORED_MESSAGES = 24;

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function loadStoredMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (
      parsed
        .filter(
          (m): m is ChatMessage =>
            typeof m === "object" &&
            m !== null &&
            typeof (m as ChatMessage).id === "string" &&
            ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
            typeof (m as ChatMessage).content === "string",
        )
        // A reload mid-stream can leave an empty assistant stub — drop it.
        .filter((m) => m.content.length > 0)
        .slice(-MAX_STORED_MESSAGES)
    );
  } catch {
    return [];
  }
}

/**
 * Client state + streaming for the Pokédex assistant. Sends the conversation to
 * /api/chat and reads the NDJSON event stream, appending assistant text live.
 */
export function useChat() {
  // Restored from sessionStorage, so the conversation survives a page reload
  // (the panel is client-only — this initializer never runs during SSR).
  const [messages, setMessages] = useState<ChatMessage[]>(loadStoredMessages);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Persist after every change (streaming included — content only grows).
  useEffect(() => {
    try {
      if (messages.length === 0) {
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
      }
    } catch {
      // Storage unavailable — the chat just won't survive a reload.
    }
  }, [messages]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setStatus("idle");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore.
    }
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

      // Build the request payload from prior turns + this user message. The
      // API accepts at most 24 messages and the first must be from the user —
      // trim old turns (and any leading assistant left by the cut) accordingly.
      setMessages((prev) => {
        const payload = [...prev, userMessage]
          .map(({ role, content }) => ({ role, content }))
          .slice(-MAX_STORED_MESSAGES);
        while (payload.length > 0 && payload[0]!.role === "assistant") payload.shift();
        void streamResponse(payload, assistantId);
        return [...prev, userMessage, { id: assistantId, role: "assistant", content: "" }];
      });
    },
    [status, streamResponse],
  );

  return { messages, status, error, send, reset };
}
