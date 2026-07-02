import { normalizeSearch } from "@/lib/utils";
import type { PokedexEntry } from "./types";

/**
 * Fuzzy name resolution for AI-proposed Pokémon: models occasionally misspell
 * names ("Gholisopod" → "Golisopod"), which exact/partial matching rejects.
 * A small edit-distance pass rescues those without ever inventing data — the
 * result is always a real entry from the index.
 */

/** Classic Levenshtein distance with an early-exit cap. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + cost);
      if (current[j]! < rowMin) rowMin = current[j]!;
    }
    if (rowMin > max) return max + 1; // Every path already exceeds the cap.
    previous = current;
  }
  return previous[b.length]!;
}

/**
 * Best fuzzy match for a (possibly misspelled) name against the index.
 * Tolerance scales with length: 1 edit for short names, 2 for longer ones —
 * tight enough that we never "correct" one Pokémon into a different one.
 */
export function fuzzyFindEntry(
  name: string,
  entries: readonly PokedexEntry[],
): PokedexEntry | null {
  const query = normalizeSearch(name);
  if (query.length < 4) return null;
  const max = query.length >= 8 ? 2 : 1;

  let best: PokedexEntry | null = null;
  let bestDistance = max + 1;
  for (const entry of entries) {
    const distance = editDistance(query, normalizeSearch(entry.name), max);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
      if (distance === 0) break;
    }
  }
  return bestDistance <= max ? best : null;
}
