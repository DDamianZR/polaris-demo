import type { Distribution, PlanSpec } from "./plan";
import type { Option } from "./slots";
import type { Minute } from "./time";
import type {
  Block,
  Button,
  Decision,
  DemoEvent,
  FixedBlock,
  Goal,
  Habit,
  HabitDay,
  Item,
  Message,
  Press,
  Project,
  Settings,
} from "./types";

export type CheckinFlow = {
  day: number;
  queue: string[];
  index: number;
  messageId: string;
  /** Esperando que elija fecha para reagendar el item actual. */
  picking: boolean;
  results: { done: number; now: number; rescheduled: number; deferred: number; killed: number };
};

export type NegotiationFlow = {
  stage: "minutes" | "proposal";
  title: string;
  itemId: string | null;
  minutes: number | null;
  sameDay: boolean;
  splittable: boolean;
  deadlineDay: number;
  option: Option | null;
  /** Día ya advertido: la advertencia de sobrecarga se da UNA vez; si insistes, obedece. */
  warnedFor: number | null;
  /** Último mensaje con botones de la negociación. */
  messageId: string | null;
};

export type PlanFlow = { spec: PlanSpec; distribution: Distribution; messageId: string };

export type Flows = {
  dump: { itemIds: string[] } | null;
  checkin: CheckinFlow | null;
  negotiation: NegotiationFlow | null;
  plan: PlanFlow | null;
};

export type DemoState = {
  seq: number;
  lastTickAt: Minute;
  settings: Settings;
  items: Item[];
  fixed: FixedBlock[];
  blocks: Block[];
  habits: Habit[];
  habitDays: HabitDay[];
  goals: Goal[];
  projects: Project[];
  events: Record<string, DemoEvent>;
  messages: Message[];
  flows: Flows;
  decisions: Decision[];
};

export function nextId(s: DemoState, prefix: string): string {
  s.seq += 1;
  return `${prefix}${s.seq}`;
}

export function addMessage(
  s: DemoState,
  from: Message["from"],
  at: Minute,
  text: string,
  buttons: Button[][] = [],
): Message {
  const message: Message = {
    id: nextId(s, "m"),
    from,
    at,
    text,
    buttons,
    reaction: null,
    editedFrom: null,
  };
  s.messages.push(message);
  return message;
}

export function findMessage(s: DemoState, id: string): Message | undefined {
  return s.messages.find((m) => m.id === id);
}

export function findItem(s: DemoState, id: string | null): Item | undefined {
  return id ? s.items.find((i) => i.id === id) : undefined;
}

export function logDecision(
  s: DemoState,
  at: Minute,
  kind: Decision["kind"],
  title: string,
  itemId: string | null,
) {
  s.decisions.push({ at, kind, title, itemId });
}

export function samePress(a: Press, b: Press): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Minúsculas y sin acentos, para buscar por pista como el fuzzy del bot. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Items vivos cuyo título contiene la pista (sin acentos ni mayúsculas). */
export function findByHint(s: DemoState, hint: string): Item[] {
  const needle = normalize(hint);
  return s.items.filter(
    (i) =>
      (i.status === "active" || i.status === "inbox" || i.status === "done") &&
      normalize(`${i.title} ${i.context ?? ""}`).includes(needle),
  );
}

export function cancelEvents(s: DemoState, prefix: string) {
  for (const event of Object.values(s.events)) {
    if (event.id.startsWith(prefix) && event.status === "pending") event.status = "cancelled";
  }
}

export function schedule(s: DemoState, event: Omit<DemoEvent, "status">) {
  // INSERT OR IGNORE por dedupe_key: idempotente.
  if (!s.events[event.id]) s.events[event.id] = { ...event, status: "pending" };
}
