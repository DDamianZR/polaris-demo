import { describe, expect, it } from "vitest";
import { IDEA, MARKS, row, SENTENCE, segments } from "./capture";

describe("Primero captura", () => {
  it("usa la frase y la salida del parser del capítulo 2", () => {
    expect(SENTENCE?.text).toBe(
      "El jueves tengo que entregar sistemas y comprar cables para la práctica.",
    );
    expect(SENTENCE?.parsed?.items?.map(row)).toEqual([
      { title: "Entregar Sistemas", dated: true, meta: ["Tarea", "jue 15 oct", "Estudio"] },
      {
        title: "Comprar cables para la práctica",
        dated: true,
        meta: ["Tarea", "jue 15 oct", "Estudio"],
      },
    ]);
  });

  it("marca cada frase y no pierde ni una letra", () => {
    const text = SENTENCE?.text ?? "";
    const parts = segments(text, MARKS);
    expect(parts.map((p) => p.text).join("")).toBe(text);
    expect(parts.filter((p) => p.role).map((p) => p.text)).toEqual(MARKS.map((m) => m.phrase));
  });

  it("la idea sin fecha va al Inbox, sin preguntas", () => {
    expect(IDEA?.parsed?.items?.map(row)).toEqual([
      {
        title: "Tutorías de Cálculo para primer semestre",
        dated: false,
        meta: ["Idea", "Sin fecha", "Al Inbox"],
      },
    ]);
  });
});
