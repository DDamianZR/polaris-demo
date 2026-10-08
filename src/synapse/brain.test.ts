import { describe, expect, it } from "vitest";
import {
  ambientParticles,
  brainParticles,
  HUBS,
  insideBrain,
  neuronPosition,
  PALETTE,
} from "./brain";

describe("cerebro de partículas", () => {
  it("es determinista: la misma semilla da la misma constelación", () => {
    expect(brainParticles(200)).toEqual(brainParticles(200));
    expect(brainParticles(50, 1)).not.toEqual(brainParticles(50, 2));
  });

  it("las partículas del cerebro caen adentro y las del polvo afuera", () => {
    const inside = brainParticles(600);
    const dust = ambientParticles(120);
    expect(inside).toHaveLength(600);
    expect(inside.every((p) => insideBrain(p.x, p.y))).toBe(true);
    expect(dust.every((p) => !insideBrain(p.x, p.y))).toBe(true);
    expect(inside.every((p) => p.color >= 0 && p.color < PALETTE.length)).toBe(true);
  });

  it("cada zona de área está dentro del cerebro", () => {
    for (const hub of Object.values(HUBS)) expect(insideBrain(hub.x, hub.y)).toBe(true);
  });

  it("una neurona siempre cae adentro y en el mismo lugar", () => {
    for (const id of ["i1", "i42", "i107", "i999"]) {
      for (const loose of [true, false]) {
        const a = neuronPosition(id, HUBS.estudio, loose);
        expect(insideBrain(a.x, a.y)).toBe(true);
        expect(neuronPosition(id, HUBS.estudio, loose)).toEqual(a);
      }
    }
  });

  it("las conectadas quedan cerca de su zona", () => {
    const p = neuronPosition("i5", HUBS.personal, false);
    expect(Math.hypot(p.x - HUBS.personal.x, p.y - HUBS.personal.y)).toBeLessThan(0.13);
  });
});
