/**
 * La sesión de la demo: el estado del motor más el reloj simulado y el capítulo en curso.
 * Reducer puro, como el motor. El componente solo decide cuándo despachar.
 */
import { chapterAt, nextMoment } from "../demo/clock";
import { type Action, step } from "../demo/engine";
import { CHAPTERS, replayTo, type ScriptStep, type Suggestion } from "../demo/script";
import type { DemoState } from "../demo/state";

/** Minutos simulados por segundo real cuando el día corre solo. */
export const PLAY_SPEED = 10;
/** Cuántas sugerencias se ven a la vez. */
const VISIBLE_SUGGESTIONS = 3;

export type Session = {
  demo: DemoState;
  /** Reloj simulado, en minutos (con fracción mientras corre). */
  now: number;
  playing: boolean;
  /** Cambia al saltar de capítulo: lo que ya estaba en pantalla no se anima. */
  replayKey: number;
  /** Mensajes que ya existían al saltar; los siguientes son nuevos. */
  baseline: number;
  /** Igual, para los items (también se agregan siempre al final). */
  itemBaseline: number;
  /** Items que trajo la última acción: la UI los lleva a la vista para que se vea dónde cayeron. */
  fresh: string[];
  /** Textos de las sugerencias ya usadas en el capítulo en curso. */
  used: string[];
  /** Pasos automáticos del capítulo en curso que ya corrieron. */
  autoDone: number;
};

export type SessionAction =
  | { type: "act"; action: Action }
  | { type: "advance"; to: number }
  /** Pasó tiempo real con el día corriendo. */
  | { type: "elapse"; ms: number }
  | { type: "next" }
  | { type: "goTo"; index: number }
  | { type: "play" }
  | { type: "pause" };

function fromChapter(index: number, replayKey: number): Session {
  const demo = replayTo(index);
  return {
    demo,
    now: CHAPTERS[index]?.start ?? demo.lastTickAt,
    playing: false,
    replayKey,
    baseline: demo.messages.length,
    itemBaseline: demo.items.length,
    fresh: [],
    used: [],
    autoDone: 0,
  };
}

export function initialSession(): Session {
  return fromChapter(0, 0);
}

/** ¿Llegó algo que pide una respuesta? Entonces el día se detiene a esperarte. */
function needsAttention(before: DemoState, after: DemoState): boolean {
  return after.messages
    .slice(before.messages.length)
    .some((m) => m.from === "polaris" && m.buttons.length > 0);
}

function created(before: DemoState, after: DemoState): string[] {
  return after.items.slice(before.items.length).map((i) => i.id);
}

function advanceTo(s: Session, to: number): Session {
  let target = Math.max(to, s.now);
  let playing = s.playing;
  const nextStart = CHAPTERS.map((c) => c.start).find((t) => t > s.now);
  const enteringChapter = nextStart !== undefined && target >= nextStart;
  if (enteringChapter) {
    // Cada capítulo empieza en pausa, para leer de qué se trata.
    target = nextStart;
    playing = false;
  }
  const minute = Math.floor(target);
  const demo = minute > s.demo.lastTickAt ? step(s.demo, { type: "tick" }, minute) : s.demo;
  if (needsAttention(s.demo, demo)) playing = false;
  return {
    ...s,
    demo,
    fresh: created(s.demo, demo),
    now: target,
    playing,
    used: enteringChapter ? [] : s.used,
    autoDone: enteringChapter ? 0 : s.autoDone,
  };
}

export function chapterIndex(s: Session): number {
  return chapterAt(Math.floor(s.now), CHAPTERS);
}

/** El siguiente paso que hace la demo sola en este capítulo (saltar días, apagar Polaris). */
export function pendingAuto(s: Session): ScriptStep | null {
  const autos = CHAPTERS[chapterIndex(s)]?.steps.filter((st) => st.auto) ?? [];
  return autos[s.autoDone] ?? null;
}

export function visibleSuggestions(s: Session): Suggestion[] {
  const chapter = CHAPTERS[chapterIndex(s)];
  return (chapter?.suggestions ?? [])
    .filter((sg) => !s.used.includes(sg.text))
    .slice(0, VISIBLE_SUGGESTIONS);
}

export function reduceSession(s: Session, a: SessionAction): Session {
  switch (a.type) {
    case "act": {
      const demo = step(s.demo, a.action, Math.floor(s.now));
      const typed = a.action.type === "send" || a.action.type === "capture";
      return {
        ...s,
        demo,
        fresh: created(s.demo, demo),
        playing: needsAttention(s.demo, demo) ? false : s.playing,
        used: typed && "text" in a.action ? [...s.used, a.action.text] : s.used,
      };
    }
    case "advance":
      return advanceTo(s, a.to);
    case "elapse":
      return s.playing ? advanceTo(s, s.now + (a.ms / 1000) * PLAY_SPEED) : s;
    case "next": {
      const auto = pendingAuto(s);
      if (auto) {
        const demo = step(s.demo, auto.action, auto.at);
        return {
          ...s,
          demo,
          fresh: created(s.demo, demo),
          now: demo.lastTickAt,
          playing: false,
          autoDone: s.autoDone + 1,
        };
      }
      const t = nextMoment(s.demo, Math.floor(s.now), CHAPTERS);
      return t === null ? s : { ...advanceTo(s, t), playing: false };
    }
    case "goTo":
      return fromChapter(a.index, s.replayKey + 1);
    case "play":
      return { ...s, playing: true };
    case "pause":
      return { ...s, playing: false };
  }
}

/** ¿Este item llegó durante la sesión (no venía de saltar de capítulo)? */
export function isNewItem(s: Session, id: string): boolean {
  return s.demo.items.findIndex((i) => i.id === id) >= s.itemBaseline;
}
