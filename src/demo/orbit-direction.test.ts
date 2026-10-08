import { describe, expect, it } from "vitest";
import { CHAPTERS, replayTo } from "./script";
import { directionTree, orbitNodes, weekLoad } from "./selectors";
import { dayFromIso, JUE } from "./time";

const NEGOTIATION = CHAPTERS.findIndex((c) => c.key === "negotiation");
const PLAN = CHAPTERS.findIndex((c) => c.key === "plan");
const CHECKIN = CHAPTERS.findIndex((c) => c.key === "checkin");

describe("Orbit", () => {
  it("la tesis está en la orilla y, al negociarla, se acerca al centro", () => {
    const before = replayTo(NEGOTIATION);
    const after = replayTo(PLAN);
    const ring = (s: typeof before) =>
      orbitNodes(s, s.lastTickAt).find((n) => n.item.id === "i10")?.ring;
    expect(ring(before)).toBe(3);
    expect(ring(after)).toBe(1);
  });

  it("lo atrasado va en el anillo de hoy y se marca", () => {
    const s = replayTo(0);
    const report = orbitNodes(s, s.lastTickAt).find((n) => n.item.id === "i4");
    expect(report).toMatchObject({ ring: 0, overdue: true });
  });

  it("lo hecho y lo descartado salen de la órbita", () => {
    const s = replayTo(CHECKIN + 1);
    const ids = orbitNodes(s, s.lastTickAt).map((n) => n.item.id);
    expect(ids).not.toContain("i2");
  });
});

describe("Tu semana", () => {
  it("antes de negociar nadie pasa del tope; después, el jueves sí", () => {
    const load = (index: number) => {
      const s = replayTo(index);
      return weekLoad(s, s.lastTickAt);
    };
    expect(load(NEGOTIATION).some((d) => d.overloaded)).toBe(false);
    const after = load(PLAN);
    expect(after.filter((d) => d.overloaded).map((d) => d.day)).toEqual([JUE]);
    expect(after).toHaveLength(5);
  });
});

describe("Direction", () => {
  it("cada objetivo con sus proyectos y lo siguiente de cada uno", () => {
    const s = replayTo(NEGOTIATION);
    const graduarme = directionTree(s, s.lastTickAt).find((g) => g.title === "Graduarme");
    const tesis = graduarme?.projects.find((p) => p.title === "Proyecto de titulación");
    expect(tesis?.next?.title).toBe("Terminar el capítulo 2 de la tesis");
  });

  it("el plan aterrizado aparece con su primer paso y su fecha de término", () => {
    const s = replayTo(CHECKIN);
    const chamba = directionTree(s, s.lastTickAt).find((g) => g.id === "g-chamba");
    const fastapi = chamba?.projects.find((p) => p.title === "Aprender FastAPI");
    expect(fastapi?.next?.title).toBe("Leer el tutorial oficial");
    expect(fastapi?.total).toBe(8);
    expect(fastapi?.finishDay).toBe(dayFromIso("2026-11-04"));
  });
});
