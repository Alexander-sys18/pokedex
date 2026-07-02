/**
 * Module-level scroll memory for the list view.
 *
 * Living at module scope means the value survives client-side navigation
 * (list → detail → back) but is wiped on a full page reload — exactly the
 * behavior the brief asks for ("no need to persist across reloads").
 *
 * The position is saved together with the list URL's query string: restoring
 * only when they match means back-navigation gets its exact scroll back,
 * while a FRESH navigation to "/" (header logo, mobile tab) — which clears
 * the filters and therefore shows different content — starts at the top
 * instead of jumping to a stale offset.
 */
let listScrollY = 0;
let savedSearch = "";

function currentSearch(): string {
  return typeof window === "undefined" ? "" : window.location.search;
}

export function saveListScroll(value: number): void {
  listScrollY = value;
  savedSearch = currentSearch();
}

export function getListScroll(): number {
  return currentSearch() === savedSearch ? listScrollY : 0;
}
