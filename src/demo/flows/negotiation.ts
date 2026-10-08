/**
 * Negociación de bloques (F5), el diálogo de secretaria: pides espacio, Polaris propone con
 * números, contrapropones, te advierte UNA vez si te sobrecargas, obedece y confirma.
 * Nada se escribe en `blocks` hasta confirmar.
 */
import {
  BTN,
  NEG_DECLINED,
  NEG_HOW_LONG,
  NEG_NO_ROOM,
  NEG_NOTHING_OPEN,
  negConfirmed,
  negProposal,
  negWarning,
} from "../../copy/es";
import {
  applyOption,
  type BlockRequest,
  bestOption,
  evaluateDay,
  fixedOn,
  type Option,
  plannedMinutes,
  plannedOn,
} from "../slots";
import {
  addMessage,
  type DemoState,
  findByHint,
  findItem,
  findMessage,
  logDecision,
  type NegotiationFlow,
} from "../state";
import { dayFromIso, dayOf, duration, hhmm, type Minute, nextWeekday } from "../time";
import type { Button, Parsed } from "../types";

const decisionButtons = (confirm: string): Button[][] => [
  [
    { label: confirm, press: { kind: "negotiation", choice: "confirm" } },
    { label: BTN.noThanks, press: { kind: "negotiation", choice: "decline" } },
  ],
];

function request(f: NegotiationFlow): BlockRequest {
  return {
    title: f.title,
    minutes: f.minutes ?? 0,
    splittable: f.splittable,
    deadlineDay: f.deadlineDay,
  };
}

function closeButtons(s: DemoState, f: NegotiationFlow) {
  const message = f.messageId ? findMessage(s, f.messageId) : undefined;
  if (message) message.buttons = [];
}

function say(
  s: DemoState,
  f: NegotiationFlow,
  now: Minute,
  text: string,
  buttons: Button[][] = [],
) {
  closeButtons(s, f);
  const message = addMessage(s, "polaris", now, text, buttons);
  f.messageId = buttons.length ? message.id : null;
}

/** Viernes de esta semana (o el de la siguiente si ya pasó): "esta semana" sin más. */
function endOfWeek(now: Minute): number {
  return nextWeekday("vie", dayOf(now) + 1) ?? dayOf(now) + 3;
}

function offer(s: DemoState, f: NegotiationFlow, option: Option, now: Minute) {
  f.option = option;
  f.stage = "proposal";
  const overloaded = option.overloaded.find((d) => d !== f.warnedFor);
  if (overloaded !== undefined) {
    f.warnedFor = overloaded;
    say(
      s,
      f,
      now,
      negWarning(overloaded, dayOf(now), option.plannedAfter[overloaded] ?? 0),
      decisionButtons(BTN.vaAsi),
    );
    return;
  }
  const text = negProposal({
    day: option.day,
    today: dayOf(now),
    freeMin: s.settings.focusMaxMin - plannedMinutes(s, option.day),
    minutes: f.minutes ?? 0,
    moves: option.moves.map((m) => ({ title: m.title, toDay: m.toDay, start: m.start })),
  });
  say(s, f, now, text, decisionButtons(BTN.va));
}

function propose(s: DemoState, f: NegotiationFlow, now: Minute) {
  const option = bestOption(s, request(f), now);
  if (!option) {
    say(s, f, now, NEG_NO_ROOM);
    s.flows.negotiation = null;
    return;
  }
  offer(s, f, option, now);
}

export function onBlockRequest(
  s: DemoState,
  br: NonNullable<Parsed["block_request"]>,
  now: Minute,
) {
  const open = s.flows.negotiation;
  // "Unas 4 h, no seguidas": contesta la única pregunta permitida.
  if (open && open.stage === "minutes" && br.minutes !== null) {
    onMinutes(s, br.minutes, br.splittable, now);
    return;
  }
  const [match] = findByHint(s, br.title).filter((i) => i.status !== "done");
  const f: NegotiationFlow = {
    stage: br.minutes === null ? "minutes" : "proposal",
    title: br.title,
    itemId: match?.id ?? null,
    minutes: br.minutes,
    sameDay: br.same_day,
    splittable: br.splittable,
    deadlineDay: br.deadline ? dayFromIso(br.deadline) : endOfWeek(now),
    option: null,
    warnedFor: null,
    messageId: null,
  };
  s.flows.negotiation = f;
  if (f.minutes === null) {
    say(s, f, now, NEG_HOW_LONG);
    return;
  }
  propose(s, f, now);
}

export function onMinutes(s: DemoState, minutes: number, splittable: boolean, now: Minute) {
  const f = s.flows.negotiation;
  if (!f) return;
  f.minutes = minutes;
  f.splittable = splittable;
  propose(s, f, now);
}

export function onCounter(s: DemoState, preferredDays: string[], now: Minute) {
  const f = s.flows.negotiation;
  if (!f || f.minutes === null) {
    addMessage(s, "polaris", now, NEG_NOTHING_OPEN);
    return;
  }
  for (const key of preferredDays) {
    const day = nextWeekday(key, dayOf(now) + 1);
    if (day === null) continue;
    const option = evaluateDay(
      s,
      { ...request(f), deadlineDay: Math.max(f.deadlineDay, day) },
      day,
      now,
    );
    if (option) {
      offer(s, f, option, now);
      return;
    }
  }
  say(s, f, now, NEG_NO_ROOM);
}

function agenda(s: DemoState, day: number, requestBlocks: Set<string>): string[] {
  const rows = [
    ...fixedOn(s, day).map((f) => ({ start: f.start, line: `${hhmm(f.start)} ${f.title}` })),
    ...plannedOn(s, day).map((b) => ({
      start: b.start,
      line: `${hhmm(b.start)} ${b.title}${requestBlocks.has(b.id) ? ` (${duration(b.end - b.start)})` : ""}`,
    })),
  ];
  return rows.sort((a, b) => a.start - b.start).map((r) => r.line);
}

export function onConfirm(s: DemoState, now: Minute): boolean {
  const f = s.flows.negotiation;
  if (!f?.option) return false;
  const option = f.option;
  const created = applyOption(s, option, f.title, f.itemId);
  const item = findItem(s, f.itemId);
  if (item) {
    item.status = "active";
    item.dueDay = option.day;
    item.estimateMin = f.minutes;
  }
  for (const move of option.moves) logDecision(s, now, "moved", move.title, null);
  logDecision(s, now, "planned", f.title, f.itemId);
  const text = negConfirmed(
    option.day,
    dayOf(now),
    agenda(s, option.day, new Set(created.map((b) => b.id))),
    option.moves.length,
  );
  say(s, f, now, text);
  s.flows.negotiation = null;
  return true;
}

export function onDecline(s: DemoState, now: Minute): boolean {
  const f = s.flows.negotiation;
  if (!f) return false;
  say(s, f, now, NEG_DECLINED);
  s.flows.negotiation = null;
  return true;
}
