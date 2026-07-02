"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Favorites store: a set of national-dex ids persisted to localStorage and kept
 * in sync across tabs. Exposed through `useSyncExternalStore`, so it hydrates
 * without mismatch (the server snapshot is always empty) and every subscribed
 * component updates instantly when a favorite is toggled anywhere.
 */
const STORAGE_KEY = "pokedex:favorites";

let favorites: ReadonlySet<number> = new Set();
let snapshot: number[] = [];
const listeners = new Set<() => void>();
let initialized = false;

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
    // Storage unavailable (private mode / quota) — favorites stay in memory.
  }
}

function emit(): void {
  snapshot = [...favorites].sort((a, b) => a - b);
  listeners.forEach((listener) => listener());
}

function ensureInitialized(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const ids = JSON.parse(raw) as unknown;
      if (Array.isArray(ids)) {
        favorites = new Set(ids.filter((id): id is number => typeof id === "number"));
      }
    }
  } catch {
    // Ignore malformed storage.
  }
  snapshot = [...favorites].sort((a, b) => a - b);
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    try {
      const ids = event.newValue ? (JSON.parse(event.newValue) as unknown) : [];
      favorites = new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === "number") : []);
    } catch {
      favorites = new Set();
    }
    emit();
  });
}

export function toggleFavorite(id: number): void {
  ensureInitialized();
  const next = new Set(favorites);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  favorites = next;
  persist();
  emit();
}

function subscribe(listener: () => void): () => void {
  ensureInitialized();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Reactive list of favorite ids (sorted). Empty during SSR / first render. */
export function useFavoriteIds(): number[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );
}

const EMPTY: number[] = [];

/**
 * Reactive membership + toggler for a single id. Subscribes to a boolean
 * snapshot for just this id, so toggling one favorite re-renders only the
 * buttons whose membership actually changed — not every card in the grid.
 */
export function useFavorite(id: number): { isFavorite: boolean; toggle: () => void } {
  const isFavorite = useSyncExternalStore(
    subscribe,
    () => favorites.has(id),
    () => false,
  );
  const toggle = useCallback(() => toggleFavorite(id), [id]);
  return { isFavorite, toggle };
}
