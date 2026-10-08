/**
 * La semana de ejemplo: un estudiante de ingeniería, del lun 12 al dom 18 oct 2026.
 * Ficticia por completo. Nunca uses aquí los casos reales del golden set del bot.
 *
 * Los números están puestos para que la negociación del capítulo 5 salga como en la spec F5:
 * con un tope de foco de 5 h, el miércoles tiene 3 h 30 planeadas, el jueves 2 h y el
 * viernes 4 h.
 */
import type { DemoState } from "./state";
import { at, DOM, JUE, LUN, MAR, MIE, type Minute, SAB, VIE } from "./time";
import type { Block, FixedBlock, Habit, HabitDay, Item } from "./types";

/** La demo arranca el martes antes del brief. */
export const DEMO_START: Minute = at(MAR, "06:50");

const ALL_DAYS = [LUN, MAR, MIE, JUE, VIE, SAB, DOM];

const fixed: FixedBlock[] = [
  {
    id: "f-ads",
    title: "ADS",
    area: "estudio",
    weekdays: [MAR, JUE],
    start: "08:00",
    end: "10:00",
  },
  {
    id: "f-sis",
    title: "Sistemas Digitales",
    area: "estudio",
    weekdays: [MAR, JUE],
    start: "11:00",
    end: "13:00",
  },
  {
    id: "f-redes",
    title: "Redes",
    area: "estudio",
    weekdays: [LUN, MIE, VIE],
    start: "09:00",
    end: "11:00",
  },
  {
    id: "f-calc",
    title: "Cálculo Multivariable",
    area: "estudio",
    weekdays: [LUN, MIE, VIE],
    start: "16:00",
    end: "18:00",
  },
  {
    id: "f-gym",
    title: "Entrenamiento",
    area: "personal",
    weekdays: [LUN, MAR, JUE],
    start: "20:00",
    end: "21:00",
  },
];

function item(partial: Partial<Item> & Pick<Item, "id" | "title" | "createdAt">): Item {
  return {
    kind: "task",
    context: null,
    area: "estudio",
    status: "active",
    dueDay: null,
    dueAt: null,
    estimateMin: null,
    deferCount: 0,
    projectId: null,
    doneAt: null,
    captured: true,
    source: null,
    ...partial,
  };
}

const items: Item[] = [
  item({
    id: "i1",
    title: "Resolver ejercicios del tema 4",
    context: "Cálculo Multivariable",
    dueDay: MAR,
    estimateMin: 45,
    createdAt: at(LUN, "17:40"),
  }),
  item({
    id: "i2",
    title: "Pagar el internet",
    area: "personal",
    dueDay: MAR,
    estimateMin: 10,
    createdAt: at(LUN, "13:20"),
  }),
  item({
    id: "i3",
    title: "Leer el capítulo 3 de Redes",
    context: "Redes",
    dueDay: MAR,
    deferCount: 1,
    createdAt: at(LUN - 4, "19:00"),
    captured: false,
  }),
  item({
    id: "i4",
    title: "Reporte de la práctica de Redes",
    context: "Redes",
    dueDay: LUN,
    deferCount: 3,
    createdAt: at(LUN - 6, "12:10"),
    captured: false,
  }),
  item({
    id: "i5",
    title: "Terminar documentación de ADS",
    context: "Proyecto ADS",
    dueDay: JUE,
    estimateMin: 90,
    projectId: "p-ads",
    createdAt: at(LUN - 2, "18:30"),
    captured: false,
  }),
  item({
    id: "i6",
    title: "Estudiar para el examen de Redes",
    context: "Redes",
    dueDay: VIE,
    estimateMin: 60,
    createdAt: at(LUN, "11:15"),
  }),
  item({
    id: "i7",
    title: "Repaso de Cálculo",
    context: "Cálculo Multivariable",
    dueDay: LUN + 7,
    estimateMin: 60,
    createdAt: at(LUN, "18:05"),
  }),
  item({
    id: "i8",
    title: "Preparar documentación",
    context: "Proyecto final de Sistemas",
    dueDay: VIE,
    estimateMin: 120,
    projectId: "p-sis",
    createdAt: at(LUN, "12:30"),
  }),
  item({
    id: "i9",
    title: "Práctica de subneteo",
    context: "Redes",
    dueDay: VIE,
    estimateMin: 120,
    createdAt: at(LUN, "11:20"),
  }),
  item({
    id: "i10",
    title: "Terminar el capítulo 2 de la tesis",
    context: "Proyecto de titulación",
    status: "inbox",
    projectId: "p-tesis",
    createdAt: at(LUN, "21:45"),
  }),
  item({
    id: "i11",
    kind: "idea",
    title: "App para dividir gastos con roomies",
    area: "emprendimiento",
    status: "inbox",
    createdAt: at(LUN, "22:10"),
  }),
  item({
    id: "i12",
    kind: "reminder",
    title: "Llamar al dentista",
    area: "personal",
    dueDay: VIE,
    dueAt: at(VIE, "10:00"),
    createdAt: at(LUN, "09:05"),
  }),
  item({
    id: "i13",
    title: "Ver el video de Docker que me pasaron",
    status: "inbox",
    projectId: "p-polaris",
    createdAt: at(LUN, "23:02"),
  }),
];

function block(
  id: string,
  title: string,
  day: number,
  start: string,
  end: string,
  itemId: string | null,
): Block {
  return { id, title, itemId, start: at(day, start), end: at(day, end), status: "planned" };
}

const blocks: Block[] = [
  block("b1", "Resolver ejercicios del tema 4", MAR, "18:30", "19:15", "i1"),
  block("b2", "Proyecto Polaris", MAR, "22:00", "23:00", null),
  block("b3", "Terminar documentación de ADS", MIE, "14:00", "15:30", "i5"),
  block("b4", "Estudiar para el examen de Redes", MIE, "18:30", "19:30", "i6"),
  block("b5", "Proyecto Polaris", MIE, "21:00", "22:00", null),
  block("b6", "Proyecto Polaris", JUE, "17:00", "18:00", null),
  block("b7", "Repaso de Cálculo", JUE, "18:30", "19:30", "i7"),
  block("b8", "Preparar documentación", VIE, "11:30", "13:30", "i8"),
  block("b9", "Práctica de subneteo", VIE, "13:40", "15:40", "i9"),
];

const habits: Habit[] = [
  {
    key: "comida-1",
    name: "Primera comida",
    emoji: "🍳",
    weekdays: ALL_DAYS,
    followupMin: 45,
    windows: [
      { label: "desayuno", ask: "¿Ya desayunaste?", start: "08:00", end: "11:00" },
      { label: "almuerzo", ask: "¿Ya almorzaste?", start: "11:00", end: "14:00" },
      { label: "comida", ask: "¿Ya comiste?", start: "14:00", end: "17:00" },
    ],
  },
  {
    key: "cara-noche",
    name: "Lavarte la cara",
    emoji: "🧼",
    weekdays: ALL_DAYS,
    followupMin: 30,
    windows: [
      { label: "lavarte la cara", ask: "¿Ya te lavaste la cara?", start: "22:00", end: "23:59" },
    ],
  },
];

const habitDays: HabitDay[] = [
  {
    key: "comida-1",
    day: LUN,
    windowIdx: 0,
    status: "done",
    at: at(LUN, "08:40"),
    messageId: null,
  },
  {
    key: "cara-noche",
    day: LUN,
    windowIdx: 0,
    status: "done",
    at: at(LUN, "22:15"),
    messageId: null,
  },
];

export function fixtureState(): DemoState {
  return structuredClone({
    seq: 100,
    lastTickAt: DEMO_START,
    settings: {
      briefTime: "07:00",
      checkinTime: "21:30",
      focusStart: "08:00",
      sleep: "23:30",
      focusMaxMin: 300,
      minChunkMin: 30,
      maxChunkMin: 120,
      bufferMin: 10,
    },
    items,
    fixed,
    blocks,
    habits,
    habitDays,
    goals: [
      { id: "g-grad", title: "Graduarme" },
      { id: "g-chamba", title: "Conseguir mi primera chamba de backend" },
    ],
    projects: [
      { id: "p-tesis", goalId: "g-grad", title: "Proyecto de titulación" },
      { id: "p-sis", goalId: "g-grad", title: "Proyecto final de Sistemas" },
      { id: "p-ads", goalId: "g-grad", title: "Proyecto ADS" },
      { id: "p-polaris", goalId: "g-chamba", title: "Proyecto Polaris" },
    ],
    events: {
      "reminder:i12": {
        id: "reminder:i12",
        kind: "reminder",
        dueAt: at(VIE, "10:00"),
        expiresAt: at(VIE, "12:00"),
        status: "pending",
        ref: "i12",
        windowIdx: 0,
      },
    },
    messages: [],
    flows: { dump: null, checkin: null, negotiation: null, plan: null },
    decisions: [],
  } satisfies DemoState);
}
