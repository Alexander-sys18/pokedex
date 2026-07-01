/**
 * Module-level scroll memory for the list view.
 *
 * Living at module scope means the value survives client-side navigation
 * (list → detail → back) but is wiped on a full page reload — exactly the
 * behavior the brief asks for ("no need to persist across reloads").
 */
let listScrollY = 0;

export function saveListScroll(value: number): void {
  listScrollY = value;
}

export function getListScroll(): number {
  return listScrollY;
}
