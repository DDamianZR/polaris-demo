import { describe, expect, it } from "vitest";
import { fixtureState } from "./fixture";
import { distributePlan, parseDuration, parsePlan } from "./plan";
import { PLAN_TEXT } from "./script";
import { at, dayFromIso, isWeekend, MAR } from "./time";

describe("formato Polaris de planes (F7)", () => {
  it("lee duraciones raras", () => {
    expect(parseDuration("2h")).toBe(120);
    expect(parseDuration("1h30")).toBe(90);
    expect(parseDuration("1h30m")).toBe(90);
    expect(parseDuration("90m")).toBe(90);
    expect(parseDuration("45 min")).toBe(45);
    expect(parseDuration("un rato")).toBeNull();
  });

  it("lee el plan del guion", () => {
    const parsed = parsePlan(PLAN_TEXT);
    if (!parsed.ok) throw new Error(parsed.error);
    expect(parsed.plan.name).toBe("Aprender FastAPI");
    expect(parsed.plan.goal).toBe("Conseguir mi primera chamba de backend");
    expect(parsed.plan.maxPerDayMin).toBe(60);
    expect(parsed.plan.steps).toHaveLength(8);
    expect(parsed.plan.steps.reduce((sum, st) => sum + st.minutes, 0)).toBe(15 * 60);
  });

  it("dice qué línea falló", () => {
    const parsed = parsePlan("# Plan: X\n- [2h] Paso uno\nesto no es un paso");
    expect(parsed).toMatchObject({ ok: false, line: 3 });
    expect(parsePlan("- [2h] sin encabezado")).toMatchObject({ ok: false, line: 1 });
    expect(parsePlan("# Plan: X\n- [mucho] Paso")).toMatchObject({ ok: false, line: 2 });
  });
});

describe("reparto del plan", () => {
  const parsed = parsePlan(PLAN_TEXT);
  if (!parsed.ok) throw new Error(parsed.error);
  const spec = parsed.plan;
  const now = at(MAR, "17:00");

  it("cabe, entre semana y sin pasar de 1 h por día", () => {
    const dist = distributePlan(fixtureState(), spec, now);
    expect(dist.fits).toBe(true);
    // 15 h a 1 h por día hábil desde el mié 14 oct: el día hábil 15 es el mar 3 nov.
    expect(dist.finishDay).toBe(dayFromIso("2026-11-03"));
    const perDay = new Map<number, number>();
    for (const a of dist.allocations) {
      expect(isWeekend(a.day)).toBe(false);
      perDay.set(a.day, (perDay.get(a.day) ?? 0) + (a.end - a.start));
    }
    expect(Math.max(...perDay.values())).toBeLessThanOrEqual(60);
  });

  it("respeta el orden de los pasos", () => {
    const dist = distributePlan(fixtureState(), spec, now);
    const order = dist.allocations.map((a) => a.stepIdx);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("si no llega a la fecha, dice cuánto falta", () => {
    const tight = { ...spec, deadlineDay: dayFromIso("2026-10-23") };
    const dist = distributePlan(fixtureState(), tight, now);
    expect(dist.fits).toBe(false);
    expect(dist.missingMin).toBe(15 * 60 - 8 * 60);
  });
});
