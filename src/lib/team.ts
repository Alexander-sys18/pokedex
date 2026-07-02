"use client";

import { useSyncExternalStore } from "react";

/**
 * Team store: an ordered list of up to {@link MAX_TEAM} national-dex ids,
 * persisted to localStorage and synced across tabs. Same `useSyncExternalStore`
 * pattern as the favorites store (SSR snapshot is always empty to avoid
 * hydration mismatch).
 */
const STORAGE_KEY = "pokedex:team";
export const MAX_TEAM = 6;

let team: number[] = [];
let snapshot: number[] = [];
const listeners = new Set<() => void>();
let initialized = false;

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
  } catch {
    // Storage unavailable — team stays in memory for the session.
  }
}

function emit(): void {
  snapshot = team.slice();
  listeners.forEach((listener) => listener());
}

function parse(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const ids = JSON.parse(raw) as unknown;
    if (!Array.isArray(ids)) return [];
    return ids.filter((id): id is number => typeof id === "number").slice(0, MAX_TEAM);
  } catch {
    return [];
  }
}

function ensureInitialized(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  team = parse(localStorage.getItem(STORAGE_KEY));
  snapshot = team.slice();
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    team = parse(event.newValue);
    emit();
  });
}

/** Add a Pokémon to the team (no-op if full or already present). */
export function addToTeam(id: number): void {
  ensureInitialized();
  if (team.includes(id) || team.length >= MAX_TEAM) return;
  team = [...team, id];
  persist();
  emit();
}

/** Remove a Pokémon from the team. */
export function removeFromTeam(id: number): void {
  ensureInitialized();
  if (!team.includes(id)) return;
  team = team.filter((memberId) => memberId !== id);
  persist();
  emit();
}

/** Empty the team. */
export function clearTeam(): void {
  ensureInitialized();
  if (team.length === 0) return;
  team = [];
  persist();
  emit();
}

function subscribe(listener: () => void): () => void {
  ensureInitialized();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const EMPTY: number[] = [];

/** Reactive, ordered list of the team's ids. Empty during SSR / first render. */
export function useTeam(): number[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );
}
