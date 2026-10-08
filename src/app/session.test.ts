import { describe, expect, it } from "vitest";
import { CHAPTERS } from "../demo/script";
import { at, MAR, VIE } from "../demo/time";
import {
  chapterIndex,
  initialSession,
  pendingAuto,
  reduceSession,
  type Session,
  type SessionAction,
  visibleSuggestions,
} from "./session";

const run = (s: Session, ...actions: SessionAction[]) => actions.reduce(reduceSession, s);

describe("sesión de la demo", () => {
  it("arranca en pausa, en el primer capítulo y sin mensajes", () => {
    const s = initialSession();
    expect(s.playing).toBe(false);
    expect(chapterIndex(s)).toBe(0);
    expect(s.demo.messages).toHaveLength(0);
  });

  it("«Siguiente momento» salta a lo próximo que pasa: el brief de las 7", () => {
    const s = run(initialSession(), { type: "next" });
    expect(s.now).toBe(at(MAR, "07:00"));
    expect(s.demo.messages.at(-1)?.text).toMatch(/^Buenos días/);
  });

  it("si el día corre solo, se detiene al empezar cada capítulo", () => {
    const s = run(initialSession(), { type: "play" }, { type: "advance", to: at(MAR, "09:00") });
    expect(s.now).toBe(CHAPTERS[1]?.start);
    expect(s.playing).toBe(false);
  });

  it("se detiene cuando llega algo que pide respuesta", () => {
    let s = run(initialSession(), { type: "goTo", index: 3 }, { type: "play" });
    s = run(s, { type: "advance", to: at(MAR, "08:00") });
    expect(s.playing).toBe(false);
    expect(s.demo.messages.at(-1)?.text).toBe("🍳 Desayuno");
  });

  it("las sugerencias usadas desaparecen y se ven de 3 en 3", () => {
    let s = run(initialSession(), { type: "goTo", index: 1 });
    const [first] = visibleSuggestions(s);
    expect(visibleSuggestions(s)).toHaveLength(3);
    s = run(s, {
      type: "act",
      action: { type: "send", text: first?.text ?? "", parsed: first?.parsed },
    });
    expect(visibleSuggestions(s).map((sg) => sg.text)).not.toContain(first?.text);
    expect(visibleSuggestions(s)).toHaveLength(3);
  });

  it("saltar de capítulo deja todo lo anterior como ya visto", () => {
    const s = run(initialSession(), { type: "goTo", index: 4 });
    expect(s.baseline).toBe(s.demo.messages.length);
    expect(s.replayKey).toBe(1);
  });

  it("en el viernes, la demo salta días y apaga Polaris por su cuenta", () => {
    let s = run(initialSession(), { type: "goTo", index: 7 });
    expect(pendingAuto(s)?.action.type).toBe("skipDays");
    s = run(s, { type: "next" });
    expect(s.now).toBe(at(VIE, "09:12"));
    expect(pendingAuto(s)?.action.type).toBe("outage");
    s = run(s, { type: "next" });
    expect(s.now).toBe(at(VIE, "14:40"));
    expect(s.demo.messages.at(-1)?.text).toMatch(/^Estuve fuera de 09:12 a 14:40/);
    expect(pendingAuto(s)).toBeNull();
  });
});
