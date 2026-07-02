import { describe, expect, it } from "vitest";
import type { EvolutionDetail } from "@/lib/pokeapi/schemas";
import { evolutionMethodLabel, prettifyVariety } from "./detail";

/**
 * The evolution-method label is the gnarliest formatting logic of the detail
 * pipeline (many optional PokéAPI fields combine into one Spanish phrase), so
 * it gets tested where the risk actually is.
 */
describe("evolutionMethodLabel", () => {
  it("returns null without details (base forms)", () => {
    expect(evolutionMethodLabel(undefined)).toBeNull();
    expect(evolutionMethodLabel([])).toBeNull();
  });

  it("formats a plain level-up with its level", () => {
    const details: EvolutionDetail[] = [{ trigger: { name: "level-up" }, min_level: 16 }];
    expect(evolutionMethodLabel(details)).toBe("Nivel 16");
  });

  it("defaults to 'Subir de nivel' when level-up has no conditions", () => {
    expect(evolutionMethodLabel([{ trigger: { name: "level-up" } }])).toBe("Subir de nivel");
  });

  it("combines level-up conditions in order (friendship + night)", () => {
    const details: EvolutionDetail[] = [
      { trigger: { name: "level-up" }, min_happiness: 160, time_of_day: "night" },
    ];
    expect(evolutionMethodLabel(details)).toBe("Amistad alta, de noche");
  });

  it("localizes evolution stones (use-item)", () => {
    const details: EvolutionDetail[] = [
      { trigger: { name: "use-item" }, item: { name: "water-stone" } },
    ];
    expect(evolutionMethodLabel(details)).toBe("Piedra Agua");
  });

  it("covers the trade family: plain, with item and species-for-species", () => {
    expect(evolutionMethodLabel([{ trigger: { name: "trade" } }])).toBe("Intercambio");
    expect(
      evolutionMethodLabel([{ trigger: { name: "trade" }, trade_species: { name: "shelmet" } }]),
    ).toBe("Intercambio por Shelmet");
  });

  it("maps the special triggers (Shedinja, Sirfetch'd)", () => {
    expect(evolutionMethodLabel([{ trigger: { name: "shed" } }])).toBe(
      "Nivel 20 (hueco en el equipo)",
    );
    expect(evolutionMethodLabel([{ trigger: { name: "three-critical-hits" } }])).toBe(
      "3 críticos en un combate",
    );
  });

  it("stays honest and generic for unknown triggers", () => {
    expect(evolutionMethodLabel([{ trigger: { name: "tower-of-darkness" } }])).toBe(
      "Método especial",
    );
  });
});

describe("prettifyVariety", () => {
  it("fixes the Spanish/typographic special cases", () => {
    expect(prettifyVariety("eevee-gmax")).toBe("Eevee Gigamax");
    expect(prettifyVariety("pikachu-phd")).toBe("Pikachu PhD");
  });

  it("leaves regular variety slugs to the generic prettifier", () => {
    expect(prettifyVariety("deoxys-attack")).toBe("Deoxys Attack");
  });
});
