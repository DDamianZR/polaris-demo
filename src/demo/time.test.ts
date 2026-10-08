import { describe, expect, it } from "vitest";
import {
  at,
  DOM,
  dayFromIso,
  dayOf,
  duration,
  hhmm,
  isoDate,
  JUE,
  LUN,
  MAR,
  nextWeekday,
  shortDate,
  weekday,
} from "./time";

describe("tiempo de la demo", () => {
  it("el día 0 es el lunes 12 de octubre de 2026", () => {
    expect(shortDate(LUN)).toBe("lun 12 oct");
    expect(isoDate(JUE)).toBe("2026-10-15");
    expect(shortDate(DOM + 15)).toBe("lun 2 nov");
  });

  it("ida y vuelta entre fecha ISO y día", () => {
    expect(dayFromIso("2026-10-15")).toBe(JUE);
    expect(dayFromIso("2026-11-06")).toBe(25);
    expect(dayFromIso(isoDate(40))).toBe(40);
  });

  it("instantes, horas y días de la semana", () => {
    const t = at(MAR, "18:30");
    expect(dayOf(t)).toBe(MAR);
    expect(hhmm(t)).toBe("18:30");
    expect(weekday(MAR + 7)).toBe(MAR);
  });

  it("siguiente día con nombre, desde mañana", () => {
    expect(nextWeekday("mie", MAR + 1)).toBe(MAR + 1);
    expect(nextWeekday("mar", MAR + 1)).toBe(MAR + 7);
    expect(nextWeekday("xyz", MAR)).toBeNull();
  });

  it("duraciones como las escribe el bot", () => {
    expect(duration(45)).toBe("45 min");
    expect(duration(240)).toBe("4 h");
    expect(duration(330)).toBe("5 h 30");
  });
});
