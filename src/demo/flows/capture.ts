/**
 * Mensajes entrantes (F1–F2): comandos, volcado, captura con ack en dos tiempos, consultas y
 * cambios. Primero se captura; después se organiza. La captura nunca falla.
 */
import {
  ACK,
  brief,
  captureAck,
  DUMP_ALREADY,
  DUMP_NONE,
  DUMP_START,
  done,
  dumpSummary,
  INBOX_EMPTY,
  inboxList,
  itemStatus,
  killed,
  notFound,
  OTHER_SHORT,
  rescheduled,
  UNKNOWN_COMMAND,
} from "../../copy/es";
import { isPlanText } from "../plan";
import { fixedOn } from "../slots";
import {
  addMessage,
  type DemoState,
  findByHint,
  logDecision,
  nextId,
  normalize,
  schedule,
} from "../state";
import { at, dayFromIso, dayOf, type Minute } from "../time";
import { AREAS, type Area, type Item, type Parsed, type ParsedItem } from "../types";
import { onBlockRequest, onConfirm, onCounter, onDecline, onMinutes } from "./negotiation";
import { onPlan, onPlanConfirm } from "./planning";

const GREETINGS = new Set(["hola", "holi", "buenas", "gracias", "ok", "oki", "sale", "jaja", "👍"]);
const INBOX_MAX = 15;

export function createItem(
  s: DemoState,
  p: ParsedItem,
  now: Minute,
  source: string | null = null,
): Item {
  const dueDay = p.due_date ? dayFromIso(p.due_date) : null;
  const dueAt = dueDay !== null && p.due_time ? at(dueDay, p.due_time) : null;
  // Como `validate` del bot: un recordatorio sin hora es una tarea.
  const kind = p.kind === "reminder" && dueAt === null ? "task" : p.kind;
  const item: Item = {
    id: nextId(s, "i"),
    kind,
    title: p.title,
    context: null,
    area: p.area,
    status: dueDay !== null ? "active" : "inbox",
    dueDay,
    dueAt,
    estimateMin: p.estimate_min,
    deferCount: 0,
    projectId: null,
    createdAt: now,
    doneAt: null,
    captured: true,
    source,
  };
  s.items.push(item);
  if (dueAt !== null) {
    schedule(s, {
      id: `reminder:${item.id}`,
      kind: "reminder",
      dueAt,
      expiresAt: dueAt + 120,
      ref: item.id,
      windowIdx: 0,
    });
  }
  return item;
}

/** Sin parser (no hay LLM en la demo), el texto libre cae al inbox tal cual. */
function rawItem(s: DemoState, text: string, now: Minute): Item {
  const title = text.replace(/\s+/g, " ").trim();
  return createItem(
    s,
    {
      kind: "task",
      title: title.length > 80 ? `${title.slice(0, 79)}…` : title,
      area: null,
      due_date: null,
      due_time: null,
      estimate_min: null,
    },
    now,
    text,
  );
}

/** Lo que trae un mensaje: los items del parser o, sin parser, el texto tal cual. */
function captureAll(s: DemoState, text: string, parsed: Parsed | undefined, now: Minute): Item[] {
  return parsed?.intent === "capture" && parsed.items?.length
    ? parsed.items.map((p) => createItem(s, p, now, text))
    : [rawItem(s, text, now)];
}

/** "+ Capturar" de la UI: guarda sin pasar por el chat. Primero captura, después organizamos. */
export function captureSilently(
  s: DemoState,
  text: string,
  parsed: Parsed | undefined,
  now: Minute,
) {
  if (text.trim()) captureAll(s, text.trim(), parsed, now);
}

export function briefFor(s: DemoState, day: number, greeting: boolean): string {
  const live = s.items.filter((i) => i.status === "active" && i.kind !== "idea");
  const byDue = (a: Item, b: Item) =>
    (a.dueDay ?? 0) - (b.dueDay ?? 0) || a.createdAt - b.createdAt;
  return brief({
    day,
    greeting,
    fixed: fixedOn(s, day),
    today: live.filter((i) => i.dueDay !== null && i.dueDay <= day).sort(byDue),
    upcoming: live
      .filter(
        (i) => i.kind === "task" && i.dueDay !== null && i.dueDay > day && i.dueDay <= day + 3,
      )
      .sort(byDue),
    inboxCount: s.items.filter((i) => i.status === "inbox").length,
  });
}

function command(s: DemoState, text: string, now: Minute) {
  const name = text.split(/\s/)[0]?.toLowerCase();
  if (name === "/volcado") {
    if (s.flows.dump) addMessage(s, "polaris", now, DUMP_ALREADY);
    else {
      s.flows.dump = { itemIds: [] };
      addMessage(s, "polaris", now, DUMP_START);
    }
  } else if (name === "/listo") {
    const dump = s.flows.dump;
    if (!dump) {
      addMessage(s, "polaris", now, DUMP_NONE);
      return;
    }
    const items = dump.itemIds
      .map((id) => s.items.find((i) => i.id === id))
      .filter((i): i is Item => i !== undefined);
    const groups: [Area | null, Item[]][] = [...AREAS, null]
      .map((area): [Area | null, Item[]] => [area, items.filter((i) => i.area === area)])
      .filter(([, group]) => group.length > 0);
    addMessage(s, "polaris", now, dumpSummary(groups));
    s.flows.dump = null;
  } else if (name === "/inbox") {
    const inbox = s.items
      .filter((i) => i.status === "inbox")
      .sort((a, b) => a.createdAt - b.createdAt);
    addMessage(
      s,
      "polaris",
      now,
      inbox.length
        ? inboxList(inbox.slice(0, INBOX_MAX), Math.max(0, inbox.length - INBOX_MAX))
        : INBOX_EMPTY,
    );
  } else if (name === "/hoy") {
    addMessage(s, "polaris", now, briefFor(s, dayOf(now), false));
  } else {
    addMessage(s, "polaris", now, UNKNOWN_COMMAND);
  }
}

function update(s: DemoState, u: NonNullable<Parsed["update"]>, now: Minute) {
  const [item] = findByHint(s, u.item_hint).filter(
    (i) => i.status === "active" || i.status === "inbox",
  );
  if (!item) {
    addMessage(s, "polaris", now, notFound(u.item_hint));
    return;
  }
  if (u.action === "done") {
    item.status = "done";
    item.doneAt = now;
    logDecision(s, now, "done", item.title, item.id);
    addMessage(s, "polaris", now, done(item.title));
  } else if (u.action === "kill") {
    item.status = "killed";
    logDecision(s, now, "killed", item.title, item.id);
    addMessage(s, "polaris", now, killed(item.title));
  } else if (u.new_date) {
    item.dueDay = dayFromIso(u.new_date);
    item.status = "active";
    logDecision(s, now, "rescheduled", item.title, item.id);
    addMessage(s, "polaris", now, rescheduled(item.title, item.dueDay));
  }
}

/** Minutos dichos con número: "4 h", "unas 2 horas", "90 min". Código, no LLM. */
export function extractMinutes(text: string): number | null {
  const t = normalize(text);
  const hours = /(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hora|horas)\b/.exec(t);
  if (hours) return Math.round(Number((hours[1] ?? "0").replace(",", ".")) * 60);
  const mins = /(\d+)\s*(?:m|min|mins|minutos)\b/.exec(t);
  return mins ? Number(mins[1]) : null;
}

const AFFIRMATIVE = /^(va|si|sale|dale|ok|confirmo|de acuerdo|perfecto)\b/;

export function handleSend(s: DemoState, text: string, parsed: Parsed | undefined, now: Minute) {
  const userMessage = addMessage(s, "user", now, text);
  const trimmed = text.trim();

  if (trimmed.startsWith("/")) {
    command(s, trimmed, now);
    return;
  }
  if (isPlanText(trimmed)) {
    onPlan(s, trimmed, now);
    return;
  }
  if (s.flows.dump) {
    // En volcado no se contesta: se guarda y se pone 👍.
    const created = captureAll(s, trimmed, parsed, now);
    s.flows.dump.itemIds.push(...created.map((i) => i.id));
    userMessage.reaction = "👍";
    return;
  }

  const intent = parsed?.intent;
  if (intent === "capture" && parsed?.items?.length) {
    const created = captureAll(s, trimmed, parsed, now);
    const ack = addMessage(s, "polaris", now, captureAck(created));
    ack.editedFrom = ACK;
  } else if (intent === "query" && parsed?.query) {
    const { scope, item_hint } = parsed.query;
    if (scope === "today" || !item_hint) {
      addMessage(s, "polaris", now, briefFor(s, dayOf(now), false));
    } else {
      const [item] = findByHint(s, item_hint);
      addMessage(s, "polaris", now, item ? itemStatus(item) : notFound(item_hint));
    }
  } else if (intent === "update" && parsed?.update) {
    update(s, parsed.update, now);
  } else if (intent === "block_request" && parsed?.block_request) {
    onBlockRequest(s, parsed.block_request, now);
  } else if (intent === "counter" && parsed?.counter) {
    onCounter(s, parsed.counter.preferred_days, now);
  } else if (intent === "confirm") {
    if (!onConfirm(s, now) && !onPlanConfirm(s, now)) addMessage(s, "polaris", now, OTHER_SHORT);
  } else if (intent === "other" || GREETINGS.has(normalize(trimmed))) {
    addMessage(s, "polaris", now, OTHER_SHORT);
  } else {
    freeText(s, trimmed, now);
  }
}

/** Texto libre sin parser: lo poco que el código sí puede leer solo, y si no, al inbox. */
function freeText(s: DemoState, text: string, now: Minute) {
  const t = normalize(text);
  const negotiation = s.flows.negotiation;
  const minutes = extractMinutes(t);
  if (negotiation?.stage === "minutes" && minutes !== null) {
    onMinutes(s, minutes, /seguid|partid|separad|rato/.test(t), now);
    return;
  }
  if (negotiation?.option && AFFIRMATIVE.test(t)) {
    onConfirm(s, now);
    return;
  }
  if (negotiation && /^(no|nel|mejor no)\b/.test(t)) {
    onDecline(s, now);
    return;
  }
  if (s.flows.plan && AFFIRMATIVE.test(t)) {
    onPlanConfirm(s, now);
    return;
  }
  const item = rawItem(s, text, now);
  const ack = addMessage(s, "polaris", now, captureAck([item]));
  ack.editedFrom = ACK;
}
