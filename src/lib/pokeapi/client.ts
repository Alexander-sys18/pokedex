import type { ZodType } from "zod";
import type { GenerationNumber } from "@/lib/pokedex/types";

export const POKEAPI_BASE_URL =
  process.env.POKEAPI_BASE_URL?.replace(/\/$/, "") ?? "https://pokeapi.co/api/v2";

/** Extract the trailing numeric id from a PokéAPI resource URL. */
export function idFromUrl(url: string): number {
  const match = /\/(\d+)\/?$/.exec(url);
  if (!match) {
    throw new Error(`Could not extract id from PokéAPI url: ${url}`);
  }
  return Number(match[1]);
}

const ROMAN_TO_NUMBER: Record<string, GenerationNumber> = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
  viii: 8,
  ix: 9,
};

/** "generation-iii" → 3. */
export function generationNumberFromName(name: string): GenerationNumber {
  const roman = name.replace("generation-", "");
  const value = ROMAN_TO_NUMBER[roman];
  if (!value) {
    throw new Error(`Unknown generation name: ${name}`);
  }
  return value;
}

export interface PokeFetchOptions {
  /** ISR revalidation window in seconds (ignored outside the Next runtime). */
  revalidate?: number;
  /** Max attempts on transient failures (network / 5xx / 429). */
  retries?: number;
  signal?: AbortSignal;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch + validate a PokéAPI resource. Retries transient failures with
 * exponential backoff and validates the payload against a Zod schema so callers
 * receive fully-typed, trusted data.
 */
export async function pokeFetch<T>(
  path: string,
  schema: ZodType<T>,
  options: PokeFetchOptions = {},
): Promise<T> {
  const { revalidate, retries = 3, signal } = options;
  const url = path.startsWith("http") ? path : `${POKEAPI_BASE_URL}${path}`;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        signal,
        headers: { Accept: "application/json" },
        ...(revalidate !== undefined ? { next: { revalidate } } : {}),
      });

      if (!response.ok) {
        // 5xx and 429 are worth retrying; 4xx (e.g. 404) are not.
        if (response.status >= 500 || response.status === 429) {
          throw new Error(`Retryable HTTP ${response.status} for ${url}`);
        }
        throw new NonRetryableHttpError(response.status, url);
      }

      const json: unknown = await response.json();
      return schema.parse(json);
    } catch (error) {
      if (error instanceof NonRetryableHttpError) throw error;
      // A caller-initiated abort must stop the chain immediately, not be retried.
      if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) {
        throw error;
      }
      lastError = error;
      if (attempt < retries) {
        await sleep(250 * 2 ** attempt); // 250ms, 500ms, 1s…
      }
    }
  }

  throw new Error(
    `PokéAPI request failed after ${retries + 1} attempts: ${url}\n${String(lastError)}`,
  );
}

export class NonRetryableHttpError extends Error {
  constructor(
    public readonly status: number,
    url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = "NonRetryableHttpError";
  }
}
