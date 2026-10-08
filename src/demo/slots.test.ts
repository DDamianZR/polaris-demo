import { describe, expect, it } from "vitest";
import { fixtureState } from "./fixture";
import {
  type BlockRequest,
  bestOption,
  evaluateDay,
  freeSlots,
  place,
  plannedMinutes,
} from "./slots";
import { at, hhmm, JUE, MAR, MIE, VIE } from "./time";

const s = fixtureState();
const now = at(MAR, "13:00");
const thesis: BlockRequest = {
  title: "Capítulo 2 de la tesis",
  minutes: 240,
  splittable: true,
  deadlineDay: VIE,
};
const times = (slots: { start: number; end: number }[]) =>
  slots.map((i) => `${hhmm(i.start)}-${hhmm(i.end)}`);

describe("huecos y carga", () => {
  it("la semana de la fixture tiene la carga que pide la negociación", () => {
    expect(plannedMinutes(s, MIE)).toBe(210);
    expect(plannedMinutes(s, JUE)).toBe(120);
    expect(plannedMinutes(s, VIE)).toBe(240);
  });

  it("los huecos respetan clases, bloques y 10 min de colchón", () => {
    // 15:40-15:50 y 18:10-18:20 quedan fuera: miden menos de 30 min.
    expect(times(freeSlots(s, MIE))).toEqual([
      "08:00-08:50",
      "11:10-13:50",
      "19:40-20:50",
      "22:10-23:30",
    ]);
  });

  it("coloca en chunks de máximo 2 h, desde el hueco más temprano", () => {
    expect(times(place(s, JUE, 240, true) ?? [])).toEqual([
      "10:10-10:50",
      "13:10-15:10",
      "15:20-16:40",
    ]);
    expect(place(s, JUE, 400, false)).toBeNull();
  });
});

describe("búsqueda de espacio (F5)", () => {
  it("propone el jueves: solo hay que mover una cosa", () => {
    const option = bestOption(s, thesis, now);
    expect(option?.day).toBe(JUE);
    expect(option?.moves.map((m) => [m.title, m.toDay, hhmm(m.start)])).toEqual([
      ["Proyecto Polaris", MIE, "11:10"],
    ]);
    expect(option?.overloaded).toEqual([]);
  });

  it("el miércoles cabe moviendo 3 cosas, pero el jueves pasa del tope", () => {
    const option = evaluateDay(s, thesis, MIE, now);
    expect(option?.moves).toHaveLength(3);
    expect(option?.moves.every((m) => m.toDay === JUE)).toBe(true);
    expect(option?.overloaded).toEqual([JUE]);
    expect(option?.plannedAfter[JUE]).toBe(330);
    expect(times(option?.placement ?? [])).toEqual(["08:00-08:50", "11:10-13:10", "13:20-14:30"]);
  });

  it("no mueve un bloque después de su propia fecha límite", () => {
    const option = evaluateDay(s, thesis, MIE, now);
    const ads = option?.moves.find((m) => m.title === "Terminar documentación de ADS");
    expect(ads?.toDay).toBeLessThanOrEqual(JUE);
  });

  it("evaluar no toca el estado", () => {
    const before = JSON.stringify(s);
    evaluateDay(s, thesis, MIE, now);
    bestOption(s, thesis, now);
    expect(JSON.stringify(s)).toBe(before);
  });
});
