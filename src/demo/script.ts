/**
 * "Un día con Polaris": 8 capítulos. Cada uno trae sugerencias (los chips que el visitante
 * puede tocar, con la salida del parser ya escrita) y sus pasos canónicos, que sirven para
 * reconstruir el estado de cualquier capítulo y para probar el día completo.
 */
import { type Action, step } from "./engine";
import { DEMO_START, fixtureState } from "./fixture";
import type { DemoState } from "./state";
import type { SkipOutcomes } from "./tick";
import { at, isoDate, JUE, MAR, MIE, type Minute, VIE } from "./time";
import type { Parsed, Press } from "./types";

export type Suggestion = { text: string; parsed?: Parsed };
export type ScriptStep = { at: Minute; action: Action };
export type ChapterKey =
  | "brief"
  | "capture"
  | "dump"
  | "habit"
  | "negotiation"
  | "plan"
  | "checkin"
  | "friday";
export type Chapter = {
  key: ChapterKey;
  start: Minute;
  suggestions: Suggestion[];
  steps: ScriptStep[];
};

const send = (t: Minute, text: string, parsed?: Parsed): ScriptStep => ({
  at: t,
  action: { type: "send", text, parsed },
});
const press = (t: Minute, p: Press): ScriptStep => ({ at: t, action: { type: "press", press: p } });
const tick = (t: Minute): ScriptStep => ({ at: t, action: { type: "tick" } });

const capture = (...items: Parsed["items"] & {}): Parsed => ({ intent: "capture", items });
const task = (
  title: string,
  area: NonNullable<Parsed["items"]>[number]["area"],
  dueDay: number | null = null,
) => ({
  kind: "task" as const,
  title,
  area,
  due_date: dueDay === null ? null : isoDate(dueDay),
  due_time: null,
  estimate_min: null,
});

// --- Sugerencias (lo que el visitante "dice") ---

const CAPTURE_MAIN: Suggestion = {
  text: "El jueves tengo que entregar sistemas y comprar cables para la práctica.",
  parsed: capture(
    task("Entregar Sistemas", "estudio", JUE),
    task("Comprar cables para la práctica", "estudio", JUE),
  ),
};

const DUMP_ITEMS: Suggestion[] = [
  {
    text: "Sacar copias del formato de servicio social",
    parsed: capture(task("Sacar copias del formato de servicio social", "estudio")),
  },
  {
    text: "Renovar la credencial de la biblioteca antes del viernes",
    parsed: capture(task("Renovar la credencial de la biblioteca", "estudio", VIE)),
  },
  {
    text: "Idea: tutorías de Cálculo para los de primer semestre",
    parsed: capture({
      ...task("Tutorías de Cálculo para primer semestre", "emprendimiento"),
      kind: "idea",
    }),
  },
  {
    text: "El domingo es el cumple de mi mamá, comprarle algo",
    parsed: capture(task("Regalo para el cumple de mi mamá", "personal", VIE + 2)),
  },
];

const THESIS = "Capítulo 2 de la tesis";
const DEADLINE = isoDate(VIE);

const NEGOTIATION: Suggestion[] = [
  {
    text: "Ábreme un espacio esta semana para terminar el capítulo 2 de la tesis",
    parsed: {
      intent: "block_request",
      block_request: {
        title: THESIS,
        minutes: null,
        same_day: true,
        splittable: true,
        deadline: DEADLINE,
      },
    },
  },
  {
    text: "Unas 4 h, no seguidas pero el mismo día",
    parsed: {
      intent: "block_request",
      block_request: {
        title: THESIS,
        minutes: 240,
        same_day: true,
        splittable: true,
        deadline: DEADLINE,
      },
    },
  },
  {
    text: "¿Y no lo puedes poner el miércoles?",
    parsed: { intent: "counter", counter: { preferred_days: ["mie"] } },
  },
  { text: "Va, no importa, quiero el miércoles", parsed: { intent: "confirm" } },
];

export const PLAN_TEXT = [
  "# Plan: Aprender FastAPI",
  "objetivo: Conseguir mi primera chamba de backend",
  "fecha_limite: 2026-11-06",
  "horas_por_dia_max: 1",
  "- [2h] Leer el tutorial oficial",
  "- [3h] CRUD con SQLite",
  "- [1h30] Pruebas con pytest",
  "- [2h] Autenticación con JWT",
  "- [2h30] Proyecto: API de tareas",
  "- [1h] Documentar con OpenAPI",
  "- [2h15] Desplegar en un servidor",
  "- [45m] Escribir el README",
].join("\n");

/** Lo que "pasó" el miércoles y el jueves, para el salto al viernes. */
export const MIDWEEK: SkipOutcomes = {
  done: [
    "documentacion de ads",
    "entregar sistemas",
    "comprar cables",
    "capitulo 3 de redes",
    "reporte de la practica",
    "capitulo 2 de la tesis",
    "examen de redes",
    "credencial de la biblioteca",
  ],
  habits: [
    { key: "comida-1", day: MIE, done: true },
    { key: "cara-noche", day: MIE, done: true },
    { key: "comida-1", day: JUE, done: true },
    { key: "cara-noche", day: JUE, done: false },
    { key: "comida-1", day: VIE, done: true },
  ],
};

export const CHAPTERS: Chapter[] = [
  {
    key: "brief",
    start: DEMO_START,
    suggestions: [],
    steps: [tick(at(MAR, "07:00"))],
  },
  {
    key: "capture",
    start: at(MAR, "07:15"),
    suggestions: [
      CAPTURE_MAIN,
      {
        text: "Mañana a las 8 llévate el cargador",
        parsed: capture({
          kind: "reminder",
          title: "Llevar el cargador",
          area: "personal",
          due_date: isoDate(MIE),
          due_time: "08:00",
          estimate_min: null,
        }),
      },
      {
        text: "¿Ya entregué lo de ADS?",
        parsed: { intent: "query", query: { scope: "item", item_hint: "ADS" } },
      },
      {
        text: "¿Qué tengo hoy?",
        parsed: { intent: "query", query: { scope: "today", item_hint: null } },
      },
    ],
    steps: [send(at(MAR, "07:20"), CAPTURE_MAIN.text, CAPTURE_MAIN.parsed)],
  },
  {
    key: "dump",
    start: at(MAR, "07:30"),
    suggestions: [{ text: "/volcado" }, ...DUMP_ITEMS, { text: "/listo" }],
    steps: [
      send(at(MAR, "07:32"), "/volcado"),
      ...DUMP_ITEMS.map((d, i) => send(at(MAR, "07:33") + i, d.text, d.parsed)),
      send(at(MAR, "07:37"), "/listo"),
    ],
  },
  {
    key: "habit",
    start: at(MAR, "07:55"),
    suggestions: [],
    steps: [
      tick(at(MAR, "08:00")),
      tick(at(MAR, "08:45")),
      press(at(MAR, "08:47"), { kind: "habit_followup", key: "comida-1", day: MAR, done: false }),
      press(at(MAR, "08:48"), { kind: "habit_next", key: "comida-1", day: MAR, move: true }),
      tick(at(MAR, "11:00")),
      press(at(MAR, "11:05"), { kind: "habit", key: "comida-1", day: MAR, choice: "done" }),
    ],
  },
  {
    key: "negotiation",
    start: at(MAR, "12:55"),
    suggestions: NEGOTIATION,
    steps: NEGOTIATION.map((n, i) => send(at(MAR, "13:00") + i, n.text, n.parsed)),
  },
  {
    key: "plan",
    start: at(MAR, "16:55"),
    suggestions: [{ text: PLAN_TEXT }],
    steps: [
      send(at(MAR, "17:00"), PLAN_TEXT),
      press(at(MAR, "17:01"), { kind: "plan", choice: "confirm" }),
    ],
  },
  {
    key: "checkin",
    start: at(MAR, "21:25"),
    suggestions: [],
    steps: [
      tick(at(MAR, "21:30")),
      press(at(MAR, "21:31"), { kind: "checkin", choice: "reschedule" }),
      press(at(MAR, "21:31"), { kind: "checkin_date", target: "tomorrow" }),
      press(at(MAR, "21:32"), { kind: "checkin", choice: "defer" }),
      press(at(MAR, "21:33"), { kind: "checkin", choice: "done" }),
      press(at(MAR, "21:34"), { kind: "checkin", choice: "done" }),
      tick(at(MAR, "22:00")),
      press(at(MAR, "22:20"), { kind: "habit", key: "cara-noche", day: MAR, choice: "done" }),
    ],
  },
  {
    key: "friday",
    start: at(MAR, "22:25"),
    suggestions: [],
    steps: [
      {
        at: at(MAR, "22:30"),
        action: { type: "skipDays", until: at(VIE, "09:12"), outcomes: MIDWEEK },
      },
      { at: at(VIE, "09:12"), action: { type: "outage", until: at(VIE, "14:40") } },
      press(at(VIE, "14:42"), { kind: "reminder", itemId: "i12", choice: "done" }),
    ],
  },
];

export function runSteps(state: DemoState, steps: ScriptStep[]): DemoState {
  return steps.reduce((s, st) => step(s, st.action, st.at), state);
}

/** Estado al empezar el capítulo `index`: los anteriores, jugados como en el guion. */
export function replayTo(index: number): DemoState {
  let s = fixtureState();
  for (const chapter of CHAPTERS.slice(0, index)) s = runSteps(s, chapter.steps);
  const chapter = CHAPTERS[index];
  return chapter ? step(s, { type: "tick" }, chapter.start) : s;
}

/** El día completo, de punta a punta. */
export function playAll(): DemoState {
  return CHAPTERS.reduce((s, chapter) => runSteps(s, chapter.steps), fixtureState());
}
