import { describe, expect, it } from "vitest";
import { formatDexNumber, normalizeSearch, prettifyName } from "./utils";

describe("normalizeSearch", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeSearch("Mr. Mime")).toBe("mrmime");
    expect(normalizeSearch("farfetch'd")).toBe("farfetchd");
  });

  it("removes accents", () => {
    expect(normalizeSearch("Pokémon")).toBe("pokemon");
    expect(normalizeSearch("Flabébé")).toBe("flabebe");
  });

  it("collapses whitespace-only input to an empty string", () => {
    expect(normalizeSearch("   ")).toBe("");
  });
});

describe("prettifyName", () => {
  it("title-cases hyphenated slugs", () => {
    expect(prettifyName("mr-mime")).toBe("Mr Mime");
    expect(prettifyName("pikachu")).toBe("Pikachu");
    expect(prettifyName("ho-oh")).toBe("Ho Oh");
  });
});

describe("formatDexNumber", () => {
  it("zero-pads to four digits", () => {
    expect(formatDexNumber(1)).toBe("#0001");
    expect(formatDexNumber(25)).toBe("#0025");
    expect(formatDexNumber(1025)).toBe("#1025");
  });
});
