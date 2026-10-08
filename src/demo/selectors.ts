/** Vistas derivadas del estado para la UI. Puras, con `now` inyectado. */
import { fixedOn, plannedOn } from "./slots";
import type { DemoState } from "./state";
import { DAY, dayOf, type Minute, minuteOfDay } from "./time";
import type { HabitDay, Item } from "./types";

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

/** `raw`: sin parser, quedó tal cual en el inbox ("lo ordenamos después"). */
export type CaptureGroup = { source: string; at: Minute; items: Item[]; raw: boolean };

/** Lo último que escribiste y en qué se convirtió, agrupado por mensaje. */
export function recentCaptures(s: DemoState, limit = 4): CaptureGroup[] {
  const groups = new Map<string, CaptureGroup>();
  for (const item of s.items) {
    if (!item.source) continue;
    const key = `${item.createdAt}|${item.source}`;
    const group = groups.get(key) ?? {
      source: item.source,
      at: item.createdAt,
      items: [],
      raw: false,
    };
    group.items.push(item);
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    const [only] = group.items;
    group.raw =
      group.items.length === 1 &&
      only?.status === "inbox" &&
      only.kind === "task" &&
      only.area === null;
  }
  return [...groups.values()].sort((a, b) => b.at - a.at).slice(0, limit);
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
