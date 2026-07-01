import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts (last one wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Normalize a string for accent- and punctuation-insensitive search.
 * "Nidoran", "Mr. Mime" and "farfetch'd" all collapse to comparable tokens.
 */
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "") // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // keep only alphanumerics
}

/** Turn an API slug ("mr-mime") into a display name ("Mr Mime"). */
export function prettifyName(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Format a national dex id as a zero-padded label ("#0025"). */
export function formatDexNumber(id: number): string {
  return `#${id.toString().padStart(4, "0")}`;
}
