import { describe, expect, it } from "vitest";
import { playAll, replayTo } from "./script";
import { decisionsByDay, habitRows, weekMetric } from "./selectors";
import { at, JUE, MAR, MIE, VIE } from "./time";

describe("History", () => {
  const s = playAll();

  it("las decisiones van por día, lo más reciente arriba", () => {
    const days = decisionsByDay(s);
    expect(days.map((d) => d.day)).toEqual([VIE, JUE, MIE, MAR]);
    expect(days[0]?.entries[0]).toMatchObject({ kind: "done", title: "Llamar al dentista" });
    // Lo que se hizo "mientras tanto" queda en su día, no en el momento del salto.
    const thursday = days.find((d) => d.day === JUE)?.entries.map((e) => e.title) ?? [];
    expect(thursday).toContain("Terminar documentación de ADS");
    const tuesday = days[1]?.entries ?? [];
    for (let i = 1; i < tuesday.length; i++) {
      expect(tuesday[i - 1]?.at ?? 0).toBeGreaterThanOrEqual(tuesday[i]?.at ?? 0);
    }
  });

  it("el check-in del martes deja sus cuatro decisiones", () => {
    const tuesday = decisionsByDay(s).find((d) => d.day === MAR)?.entries ?? [];
    const night = tuesday.filter((d) => d.at >= at(MAR, "21:30") && d.at < at(MAR, "22:00"));
    expect(night.map((d) => d.kind).sort()).toEqual(["deferred", "done", "done", "rescheduled"]);
  });

  it("cada hábito trae su semana de lunes a domingo", () => {
    const rows = habitRows(s, at(VIE, "15:00"));
    expect(rows.map((r) => r.name)).toEqual(["Primera comida", "Lavarte la cara"]);
    for (const row of rows) expect(row.marks).toHaveLength(7);
  });

  it("al empezar el día no hay decisiones y la métrica ya cuenta lo del lunes", () => {
    const start = replayTo(0);
    expect(decisionsByDay(start)).toEqual([]);
    expect(weekMetric(start).said).toBe(weekMetric(start).kept);
  });
});
