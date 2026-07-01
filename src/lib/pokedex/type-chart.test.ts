import { describe, expect, it } from "vitest";
import { defensiveEffectiveness, defensiveGroups } from "./type-chart";

describe("defensiveEffectiveness", () => {
  it("computes Charizard (fire/flying) matchups", () => {
    const eff = defensiveEffectiveness(["fire", "flying"]);
    expect(eff.get("rock")).toBe(4); // 2 × 2
    expect(eff.get("water")).toBe(2);
    expect(eff.get("electric")).toBe(2);
    expect(eff.get("ground")).toBe(0); // flying immunity
    expect(eff.get("grass")).toBe(0.25); // 0.5 × 0.5
    expect(eff.get("bug")).toBe(0.25);
    expect(eff.get("fighting")).toBe(0.5);
    expect(eff.get("normal")).toBe(1);
  });

  it("computes Pikachu (electric) matchups", () => {
    const eff = defensiveEffectiveness(["electric"]);
    expect(eff.get("ground")).toBe(2);
    expect(eff.get("flying")).toBe(0.5);
    expect(eff.get("steel")).toBe(0.5);
    expect(eff.get("electric")).toBe(0.5);
    expect(eff.get("water")).toBe(1);
  });

  it("computes Eevee (normal) matchups", () => {
    const eff = defensiveEffectiveness(["normal"]);
    expect(eff.get("fighting")).toBe(2);
    expect(eff.get("ghost")).toBe(0);
    expect(eff.get("fire")).toBe(1);
  });
});

describe("defensiveGroups", () => {
  it("groups Charizard's matchups into the right buckets", () => {
    const groups = defensiveGroups(["fire", "flying"]);
    expect(groups.x4).toEqual(["rock"]);
    expect(groups.x2.sort()).toEqual(["electric", "water"]);
    expect(groups.zero).toEqual(["ground"]);
    expect(groups.quarter.sort()).toEqual(["bug", "grass"]);
    expect(groups.half.sort()).toEqual(["fairy", "fighting", "fire", "steel"]);
  });

  it("leaves neutral matchups out of every bucket", () => {
    const groups = defensiveGroups(["normal"]);
    const bucketed = [
      ...groups.x4,
      ...groups.x2,
      ...groups.half,
      ...groups.quarter,
      ...groups.zero,
    ];
    expect(bucketed.sort()).toEqual(["fighting", "ghost"]);
  });
});
