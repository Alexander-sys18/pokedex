"use client";

import { useSyncExternalStore } from "react";

/**
 * Teams store: MULTIPLE named teams of up to {@link MAX_TEAM} national-dex ids,
 * persisted to localStorage and synced across tabs. One team is "active" (the
 * one the /equipo page edits and analyzes). Same `useSyncExternalStore` pattern
 * as the favorites store (SSR snapshot is always empty to avoid hydration
 * mismatch). The legacy single-team key is migrated on first load.
 */
const STORAGE_KEY = "pokedex:teams";
const LEGACY_KEY = "pokedex:team";
export const MAX_TEAM = 6;
export const MAX_TEAMS = 12;
const MAX_NAME_LENGTH = 30;

export interface SavedTeam {
  id: string;
  name: string;
  members: number[];
}

interface TeamsState {
  teams: SavedTeam[];
  activeId: string;
}

let state: TeamsState = { teams: [], activeId: "" };
let membersSnapshot: number[] = [];
let teamsSnapshot: TeamsState = state;
const listeners = new Set<() => void>();
let initialized = false;

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function activeTeam(): SavedTeam {
  return state.teams.find((t) => t.id === state.activeId) ?? state.teams[0]!;
}

function sanitizeMembers(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();
  const out: number[] = [];
  for (const id of value) {
    if (typeof id !== "number" || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_TEAM) break;
  }
  return out;
}

function sanitizeName(value: unknown, fallback: string): string {
  const name = typeof value === "string" ? value.trim().slice(0, MAX_NAME_LENGTH) : "";
  return name || fallback;
}

function parseState(raw: string | null): TeamsState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { teams?: unknown; activeId?: unknown };
    if (!Array.isArray(parsed.teams)) return null;
    const teams: SavedTeam[] = parsed.teams
      .filter((t): t is Record<string, unknown> => typeof t === "object" && t !== null)
      .map((t, index) => ({
        id: typeof t.id === "string" && t.id ? t.id : newId(),
        name: sanitizeName(t.name, `Equipo ${index + 1}`),
        members: sanitizeMembers(t.members),
      }))
      .slice(0, MAX_TEAMS);
    if (teams.length === 0) return null;
    const activeId =
      typeof parsed.activeId === "string" && teams.some((t) => t.id === parsed.activeId)
        ? parsed.activeId
        : teams[0]!.id;
    return { teams, activeId };
  } catch {
    return null;
  }
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable — teams stay in memory for the session.
  }
}

function emit(): void {
  teamsSnapshot = state;
  membersSnapshot = activeTeam().members.slice();
  listeners.forEach((listener) => listener());
}

function ensureInitialized(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const stored = parseState(localStorage.getItem(STORAGE_KEY));
  if (stored) {
    state = stored;
  } else {
    // Migrate the legacy single team (or start fresh with one empty team).
    let legacy: number[] = [];
    try {
      legacy = sanitizeMembers(JSON.parse(localStorage.getItem(LEGACY_KEY) ?? "[]"));
    } catch {
      legacy = [];
    }
    const first: SavedTeam = { id: newId(), name: "Mi equipo", members: legacy };
    state = { teams: [first], activeId: first.id };
    persist();
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Ignore.
    }
  }

  teamsSnapshot = state;
  membersSnapshot = activeTeam().members.slice();

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    const next = parseState(event.newValue);
    if (next) {
      state = next;
      emit();
    }
  });
}

function updateActive(mutate: (members: number[]) => number[]): void {
  ensureInitialized();
  const current = activeTeam();
  const nextMembers = mutate(current.members);
  if (nextMembers === current.members) return;
  state = {
    ...state,
    teams: state.teams.map((t) => (t.id === current.id ? { ...t, members: nextMembers } : t)),
  };
  persist();
  emit();
}

/** Add a Pokémon to the ACTIVE team (no-op if full or already present). */
export function addToTeam(id: number): void {
  updateActive((members) =>
    members.includes(id) || members.length >= MAX_TEAM ? members : [...members, id],
  );
}

/** Remove a Pokémon from the ACTIVE team. */
export function removeFromTeam(id: number): void {
  updateActive((members) =>
    members.includes(id) ? members.filter((memberId) => memberId !== id) : members,
  );
}

/** Empty the ACTIVE team. */
export function clearTeam(): void {
  updateActive((members) => (members.length === 0 ? members : []));
}

/** Replace the ACTIVE team's members wholesale (e.g. applying an AI proposal). */
export function replaceTeamMembers(ids: number[]): void {
  updateActive(() => sanitizeMembers(ids));
}

/** Create a new team (optionally pre-filled), make it active, return its id. */
export function createTeam(name?: string, members: number[] = []): string | null {
  ensureInitialized();
  if (state.teams.length >= MAX_TEAMS) return null;
  const team: SavedTeam = {
    id: newId(),
    name: sanitizeName(name, `Equipo ${state.teams.length + 1}`),
    members: sanitizeMembers(members),
  };
  state = { teams: [...state.teams, team], activeId: team.id };
  persist();
  emit();
  return team.id;
}

/** Rename a team. */
export function renameTeam(id: string, name: string): void {
  ensureInitialized();
  const team = state.teams.find((t) => t.id === id);
  if (!team) return;
  const nextName = sanitizeName(name, team.name);
  if (nextName === team.name) return;
  state = {
    ...state,
    teams: state.teams.map((t) => (t.id === id ? { ...t, name: nextName } : t)),
  };
  persist();
  emit();
}

/** Delete a team (there is always at least one left). */
export function deleteTeam(id: string): void {
  ensureInitialized();
  if (!state.teams.some((t) => t.id === id)) return;
  let teams = state.teams.filter((t) => t.id !== id);
  if (teams.length === 0) {
    teams = [{ id: newId(), name: "Mi equipo", members: [] }];
  }
  const activeId = state.activeId === id ? teams[0]!.id : state.activeId;
  state = { teams, activeId };
  persist();
  emit();
}

/** Switch the active team. */
export function selectTeam(id: string): void {
  ensureInitialized();
  if (state.activeId === id || !state.teams.some((t) => t.id === id)) return;
  state = { ...state, activeId: id };
  persist();
  emit();
}

function subscribe(listener: () => void): () => void {
  ensureInitialized();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const EMPTY_MEMBERS: number[] = [];
const EMPTY_STATE: TeamsState = { teams: [], activeId: "" };

/** Reactive, ordered member ids of the ACTIVE team. Empty during SSR. */
export function useTeam(): number[] {
  return useSyncExternalStore(
    subscribe,
    () => membersSnapshot,
    () => EMPTY_MEMBERS,
  );
}

/** Reactive list of all saved teams + the active id. Empty during SSR. */
export function useTeams(): TeamsState {
  return useSyncExternalStore(
    subscribe,
    () => teamsSnapshot,
    () => EMPTY_STATE,
  );
}
