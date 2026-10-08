/** Vistas derivadas del estado para la UI. Puras, con `now` inyectado. */
import { fixedOn, plannedOn } from "./slots";
import { type DemoState, normalize } from "./state";
import { DAY, dayOf, type Minute, minuteOfDay } from "./time";
import type { Decision, HabitDay, Item } from "./types";

export type AgendaEntry = {
  id: string;
  kind: "event" | "block";
  title: string;
  context: string | null;
  start: Minute;
  end: Minute;
};

export function agendaOf(s: DemoState, day: number): AgendaEntry[] {
  const events = fixedOn(s, day).map(
    (f): AgendaEntry => ({
      id: f.id,
      kind: "event",
      title: f.title,
      context: null,
      start: f.start,
      end: f.end,
    }),
  );
  const blocks = plannedOn(s, day).map(
    (b): AgendaEntry => ({
      id: b.id,
      kind: "block",
      title: b.title,
      context: s.items.find((i) => i.id === b.itemId)?.context ?? null,
      start: b.start,
      end: b.end,
    }),
  );
  return [...events, ...blocks].sort((a, b) => a.start - b.start);
}

export function greeting(now: Minute): string {
  const hour = Math.floor(minuteOfDay(now) / 60);
  if (hour >= 5 && hour < 12) return "Buenos días.";
  if (hour >= 12 && hour < 19) return "Buenas tardes.";
  return "Buenas noches.";
}

const byDue = (a: Item, b: Item) =>
  (a.dueDay ?? 0) - (b.dueDay ?? 0) || (a.dueAt ?? 0) - (b.dueAt ?? 0) || a.createdAt - b.createdAt;

/** Today: ¿qué está pasando ahora? Ahora, después, lo de hoy y lo que viene. */
export function todayView(s: DemoState, now: Minute) {
  const day = dayOf(now);
  const agenda = agendaOf(s, day);
  const live = s.items.filter((i) => i.status === "active" && i.kind !== "idea");
  const pendingToday = live.filter((i) => i.dueDay !== null && i.dueDay <= day).sort(byDue);
  return {
    day,
    greeting: greeting(now),
    current: agenda.find((a) => a.start <= now && now < a.end) ?? null,
    next: agenda.filter((a) => a.start > now).slice(0, 3),
    pendingToday,
    upcoming: live
      .filter((i) => i.dueDay !== null && i.dueDay > day && i.dueDay <= day + 3)
      .sort(byDue),
    counts: {
      pending: pendingToday.length,
      habits: s.habitDays.filter((h) => h.day === day && h.status === "pending").length,
      events: agenda.filter((a) => a.kind === "event" && a.end > now).length,
    },
  };
}

/** Una entrada del Inbox: lo que escribiste (si salió de un mensaje) y en qué se convirtió. */
export type StreamEntry = { key: string; at: Minute; source: string | null; items: Item[] };

/**
 * El Inbox como un solo flujo, lo más nuevo arriba: las capturas con lo que hizo Polaris, más
 * lo que sigue sin fecha. Cada pendiente aparece una sola vez.
 */
export function inboxStream(s: DemoState): StreamEntry[] {
  const entries = new Map<string, StreamEntry & { order: number }>();
  s.items.forEach((item, order) => {
    if (item.status === "killed") return;
    if (!item.source && item.status !== "inbox") return;
    const key = item.source ? `${item.createdAt}|${item.source}` : item.id;
    const entry = entries.get(key) ?? {
      key,
      at: item.createdAt,
      source: item.source,
      items: [],
      order,
    };
    entry.items.push(item);
    entries.set(key, entry);
  });
  // En el mismo minuto (un volcado rápido), lo último que llegó va arriba.
  return [...entries.values()]
    .sort((a, b) => b.at - a.at || b.order - a.order)
    .map(({ order: _, ...entry }) => entry);
}

const plain = (text: string) => normalize(text).replace(/\s+/g, " ");

/** Citar lo que escribiste solo aporta si Polaris lo convirtió en algo distinto. */
export function showsSource(entry: StreamEntry): boolean {
  const [only] = entry.items;
  if (entry.source === null) return false;
  return !(entry.items.length === 1 && only && plain(only.title) === plain(entry.source));
}

export function inboxItems(s: DemoState): Item[] {
  return s.items.filter((i) => i.status === "inbox").sort((a, b) => b.createdAt - a.createdAt);
}

/** "De lo que dijiste esta semana, ¿cuánto sigue existiendo en algún lado?" (PLAN del bot). */
export function weekMetric(s: DemoState, weekStartDay = 0) {
  const from = weekStartDay * DAY;
  const said = s.items.filter(
    (i) => i.captured && i.createdAt >= from && i.createdAt < from + 7 * DAY,
  );
  // Matar algo es una decisión, no una pérdida: también sigue en algún lado.
  const kept = said.filter((i) => ["inbox", "active", "done", "killed"].includes(i.status));
  return { said: said.length, kept: kept.length };
}

export type HabitMark = HabitDay["status"] | "future" | "off";

/** L M M J V S D de un hábito: hecho, no hecho, saltado, pendiente o por venir. */
export function habitWeek(s: DemoState, key: string, now: Minute, weekStartDay = 0): HabitMark[] {
  const today = dayOf(now);
  return Array.from({ length: 7 }, (_, i) => {
    const day = weekStartDay + i;
    const hd = s.habitDays.find((h) => h.key === key && h.day === day);
    if (day > today) return "future";
    return hd?.status ?? "off";
  });
}

export type Neuron = {
  id: string;
  title: string;
  area: Item["area"];
  /** Suelta: sin fecha, en el inbox. Conectada: ya tiene lugar. Hecha: ya quedó. */
  state: "suelta" | "conectada" | "hecha";
};

/** Cada pendiente vivo es una neurona del mapa de ideas. Matar algo lo saca del mapa. */
export function ideaNeurons(s: DemoState): {
  neurons: Neuron[];
  counts: { ideas: number; conectadas: number; sueltas: number };
} {
  const neurons = s.items
    .filter((i) => i.status !== "killed")
    .map(
      (i): Neuron => ({
        id: i.id,
        title: i.title,
        area: i.area,
        state: i.status === "inbox" ? "suelta" : i.status === "done" ? "hecha" : "conectada",
      }),
    );
  const sueltas = neurons.filter((n) => n.state === "suelta").length;
  return {
    neurons,
    counts: { ideas: neurons.length, conectadas: neurons.length - sueltas, sueltas },
  };
}

/** `id`: posición en el registro, estable para usarla como key. */
export type DecisionEntry = Decision & { id: number };
export type DecisionDay = { day: number; entries: DecisionEntry[] };

/** Lo que decidiste, por día: lo más reciente arriba, como un diario. */
export function decisionsByDay(s: DemoState): DecisionDay[] {
  const days = new Map<number, { entry: Decision; order: number }[]>();
  s.decisions.forEach((entry, order) => {
    const day = dayOf(entry.at);
    days.set(day, [...(days.get(day) ?? []), { entry, order }]);
  });
  return [...days.entries()]
    .sort(([a], [b]) => b - a)
    .map(([day, list]) => ({
      day,
      entries: list
        .sort((a, b) => b.entry.at - a.entry.at || b.order - a.order)
        .map((x) => ({ ...x.entry, id: x.order })),
    }));
}

/** Cada hábito con su semana de lunes a domingo. */
export function habitRows(s: DemoState, now: Minute) {
  return s.habits.map((h) => ({ key: h.key, name: h.name, marks: habitWeek(s, h.key, now) }));
}
