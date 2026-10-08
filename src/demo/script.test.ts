import { describe, expect, it } from "vitest";
import { chapterAt, nextMoment } from "./clock";
import { step } from "./engine";
import { CHAPTERS, playAll, replayTo } from "./script";
import { habitWeek, todayView, weekMetric } from "./selectors";
import { at, MAR, MIE, VIE } from "./time";

describe("el guion", () => {
  it("los capítulos van en orden y cada paso cae dentro de su capítulo", () => {
    CHAPTERS.forEach((chapter, i) => {
      const end = CHAPTERS[i + 1]?.start ?? Number.POSITIVE_INFINITY;
      for (const st of chapter.steps) {
        expect(st.at).toBeGreaterThanOrEqual(chapter.start);
        expect(st.at).toBeLessThan(end);
      }
    });
  });

  it("reconstruir un capítulo da siempre el mismo estado", () => {
    CHAPTERS.forEach((chapter, i) => {
      const a = replayTo(i);
      expect(a.lastTickAt).toBe(chapter.start);
      expect(JSON.stringify(replayTo(i))).toBe(JSON.stringify(a));
    });
  });

  it("cada sugerencia, tocada al empezar su capítulo, obtiene respuesta", () => {
    CHAPTERS.forEach((chapter, i) => {
      for (const suggestion of chapter.suggestions) {
        const before = replayTo(i);
        const after = step(
          before,
          { type: "send", text: suggestion.text, parsed: suggestion.parsed },
          chapter.start,
        );
        const reply = after.messages.slice(before.messages.length);
        const answered = reply.some((m) => m.from === "polaris") || reply[0]?.reaction === "👍";
        expect(answered, suggestion.text).toBe(true);
      }
    });
  });
});

describe("el día completo", () => {
  const s = playAll();

  it("ningún texto del chat lleva guiones largos", () => {
    for (const m of s.messages) {
      expect(m.text).not.toMatch(/[—–]/);
      for (const b of m.buttons.flat()) expect(b.label).not.toMatch(/[—–]/);
    }
  });

  it("de lo que dijiste esta semana, todo sigue en algún lado", () => {
    expect(weekMetric(s)).toEqual({ said: 16, kept: 16 });
  });

  it("la semana de hábitos se lee de lunes a domingo", () => {
    expect(habitWeek(s, "comida-1", at(VIE, "15:00"))).toEqual([
      "done",
      "done",
      "done",
      "done",
      "done",
      "future",
      "future",
    ]);
    expect(habitWeek(s, "cara-noche", at(VIE, "15:00")).slice(0, 4)).toEqual([
      "done",
      "done",
      "done",
      "missed",
    ]);
  });

  it("la negociación movió 3 bloques y el check-in decidió 4 pendientes", () => {
    expect(s.decisions.filter((d) => d.kind === "moved")).toHaveLength(3);
    expect(
      s.decisions.filter((d) => d.at >= at(MAR, "21:30") && d.at < at(MAR, "22:00")),
    ).toHaveLength(4);
  });
});

describe("Today", () => {
  it("a las 18:30 del martes: Cálculo ahora, después Entrenamiento y Proyecto Polaris", () => {
    const now = at(MAR, "18:30");
    const view = todayView(step(replayTo(5), { type: "tick" }, now), now);
    expect(view.greeting).toBe("Buenas tardes.");
    expect(view.current).toMatchObject({
      title: "Resolver ejercicios del tema 4",
      context: "Cálculo Multivariable",
    });
    expect(view.next.map((a) => a.title)).toEqual(["Entrenamiento", "Proyecto Polaris"]);
  });
});

describe("reloj", () => {
  it("lo siguiente al arrancar es el brief de las 7", () => {
    expect(nextMoment(replayTo(0), CHAPTERS[0]?.start ?? 0, CHAPTERS)).toBe(at(MAR, "07:00"));
  });

  it("sabe en qué capítulo va", () => {
    expect(chapterAt(at(MAR, "07:00"), CHAPTERS)).toBe(0);
    expect(chapterAt(at(MAR, "13:01"), CHAPTERS)).toBe(4);
    expect(chapterAt(at(MIE, "10:00"), CHAPTERS)).toBe(7);
  });
});
