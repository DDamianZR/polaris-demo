import type { Minute } from "./time";

export type Area = "estudio" | "trabajo" | "emprendimiento" | "proyectos" | "personal";
export const AREAS: Area[] = ["estudio", "trabajo", "emprendimiento", "proyectos", "personal"];

export type ItemKind = "task" | "reminder" | "idea";
export type ItemStatus = "inbox" | "active" | "done" | "killed";

export type Item = {
  id: string;
  kind: ItemKind;
  title: string;
  /** Materia o proyecto, para la metadata de la UI ("Cálculo Multivariable"). */
  context: string | null;
  area: Area | null;
  status: ItemStatus;
  dueDay: number | null;
  /** Solo si hubo hora (recordatorios). */
  dueAt: Minute | null;
  estimateMin: number | null;
  deferCount: number;
  projectId: string | null;
  createdAt: Minute;
  doneAt: Minute | null;
  /** Salió de un mensaje esta semana: cuenta para "de lo que dijiste, ¿cuánto sigue?". */
  captured: boolean;
};

/** Horario fijo recurrente (clases, entrenamiento): eventos que ocurren. */
export type FixedBlock = {
  id: string;
  title: string;
  area: Area | null;
  /** 0 = lunes … 6 = domingo. */
  weekdays: number[];
  start: string;
  end: string;
};

/** Bloque planeado para trabajar en algo. Estos sí se pueden mover. */
export type Block = {
  id: string;
  title: string;
  itemId: string | null;
  start: Minute;
  end: Minute;
  status: "planned" | "done" | "cancelled";
};

/** `label` titula el ping y el botón ("Pásalo a almuerzo"); `ask` es el seguimiento. */
export type HabitWindow = { label: string; ask: string; start: string; end: string };

export type Habit = {
  key: string;
  name: string;
  emoji: string;
  weekdays: number[];
  followupMin: number;
  windows: HabitWindow[];
};

export type HabitDay = {
  key: string;
  day: number;
  windowIdx: number;
  status: "pending" | "done" | "skipped" | "missed";
  at: Minute | null;
  /** Último mensaje con botones de este hábito (ping o seguimiento). */
  messageId: string | null;
};

export type Goal = { id: string; title: string };
export type Project = { id: string; goalId: string; title: string };

/** Lo que trae cada botón: el equivalente demo del `callback_data` del bot. */
export type Press =
  | { kind: "checkin"; choice: "done" | "now" | "reschedule" | "defer" | "kill" }
  | { kind: "checkin_date"; target: "tomorrow" | "after" | "saturday" }
  | { kind: "checkin_followup"; itemId: string; done: boolean }
  | { kind: "habit"; key: string; day: number; choice: "done" | "snooze" | "skip" }
  | { kind: "habit_followup"; key: string; day: number; done: boolean }
  | { kind: "habit_next"; key: string; day: number; move: boolean }
  | { kind: "reminder"; itemId: string; choice: "done" | "snooze" }
  | { kind: "negotiation"; choice: "confirm" | "decline" }
  | { kind: "plan"; choice: "confirm" | "decline" };

export type Button = { label: string; press: Press };

export type Message = {
  id: string;
  from: "user" | "polaris" | "system";
  at: Minute;
  text: string;
  buttons: Button[][];
  reaction: string | null;
  /** El ✓ inmediato que después se editó con el ack completo. */
  editedFrom: string | null;
};

export type EventKind =
  | "brief"
  | "checkin"
  | "habit_ping"
  | "habit_followup"
  | "reminder"
  | "checkin_followup";

/** Fila de la cola. El id es la `dedupe_key`: materializar dos veces no duplica. */
export type DemoEvent = {
  id: string;
  kind: EventKind;
  dueAt: Minute;
  expiresAt: Minute | null;
  status: "pending" | "sent" | "missed" | "cancelled";
  ref: string | null;
  windowIdx: number;
};

/** Salida del parser, plana como el schema del bot. En la demo viene escrita en el guion. */
export type ParsedItem = {
  kind: ItemKind;
  title: string;
  area: Area | null;
  due_date: string | null;
  due_time: string | null;
  estimate_min: number | null;
};

export type Parsed = {
  intent: "capture" | "query" | "update" | "other" | "block_request" | "counter" | "confirm";
  items?: ParsedItem[];
  query?: { scope: "today" | "item"; item_hint: string | null };
  update?: { action: "done" | "kill" | "reschedule"; item_hint: string; new_date: string | null };
  block_request?: {
    title: string;
    minutes: number | null;
    same_day: boolean;
    splittable: boolean;
    deadline: string | null;
  };
  counter?: { preferred_days: string[] };
};

export type Decision = {
  at: Minute;
  itemId: string | null;
  title: string;
  kind: "done" | "rescheduled" | "deferred" | "killed" | "moved" | "planned";
};

export type Settings = {
  briefTime: string;
  checkinTime: string;
  focusStart: string;
  sleep: string;
  focusMaxMin: number;
  minChunkMin: number;
  maxChunkMin: number;
  bufferMin: number;
};
