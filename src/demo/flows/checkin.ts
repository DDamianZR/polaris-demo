/**
 * Check-in nocturno (F3): lo que no se cumplió recibe una decisión cada noche, en UN mensaje
 * tipo carrusel que se edita en su lugar. Con la regla de 3 desaparece "Recorrer".
 */
import {
  askDone,
  BTN,
  CHECKIN_EMPTY,
  checkinCard,
  checkinPick,
  checkinSummary,
  deferredToTomorrow,
  done,
} from "../../copy/es";
import { addMessage, type DemoState, findItem, findMessage, logDecision, schedule } from "../state";
import { dayOf, type Minute, weekday } from "../time";
import type { Button, Item, Message, Press } from "../types";

export const RULE_OF_THREE = 3;

/** Lo que vence hoy o antes y no se ha resuelto, del más viejo al más nuevo. */
export function checkinQueue(s: DemoState, day: number): Item[] {
  return s.items
    .filter(
      (i) => i.status === "active" && i.kind !== "idea" && i.dueDay !== null && i.dueDay <= day,
    )
    .sort((a, b) => (a.dueDay ?? 0) - (b.dueDay ?? 0) || a.createdAt - b.createdAt);
}

function cardButtons(item: Item): Button[][] {
  const second: Button[] = [
    { label: BTN.reschedule, press: { kind: "checkin", choice: "reschedule" } },
  ];
  if (item.deferCount < RULE_OF_THREE) {
    second.push({ label: BTN.defer, press: { kind: "checkin", choice: "defer" } });
  }
  second.push({ label: BTN.kill, press: { kind: "checkin", choice: "kill" } });
  return [
    [
      { label: BTN.yes, press: { kind: "checkin", choice: "done" } },
      { label: BTN.now, press: { kind: "checkin", choice: "now" } },
    ],
    second,
  ];
}

function render(s: DemoState) {
  const f = s.flows.checkin;
  if (!f) return;
  const message = findMessage(s, f.messageId);
  const item = findItem(s, f.queue[f.index] ?? null);
  if (!message || !item) return;
  message.text = checkinCard(f.index, f.queue.length, item, f.day);
  message.buttons = cardButtons(item);
}

export function startCheckin(s: DemoState, day: number, sentAt: Minute) {
  const queue = checkinQueue(s, day);
  if (!queue.length) {
    addMessage(s, "polaris", sentAt, CHECKIN_EMPTY);
    return;
  }
  const message = addMessage(s, "polaris", sentAt, "");
  s.flows.checkin = {
    day,
    queue: queue.map((i) => i.id),
    index: 0,
    messageId: message.id,
    picking: false,
    results: { done: 0, now: 0, rescheduled: 0, deferred: 0, killed: 0 },
  };
  render(s);
}

function advance(s: DemoState) {
  const f = s.flows.checkin;
  if (!f) return;
  f.index += 1;
  f.picking = false;
  if (f.index < f.queue.length) {
    render(s);
    return;
  }
  const message = findMessage(s, f.messageId);
  if (message) {
    message.text = checkinSummary(f.results);
    message.buttons = [];
  }
  s.flows.checkin = null;
}

function nextSaturday(day: number): number {
  const ahead = (5 - weekday(day) + 7) % 7;
  return day + (ahead === 0 ? 7 : ahead);
}

export function pressCheckin(s: DemoState, press: Press, now: Minute) {
  const f = s.flows.checkin;
  const item = f && findItem(s, f.queue[f.index] ?? null);
  if (!f || !item) return;

  if (press.kind === "checkin_date") {
    const target =
      press.target === "tomorrow"
        ? f.day + 1
        : press.target === "after"
          ? f.day + 2
          : nextSaturday(f.day);
    item.dueDay = target;
    f.results.rescheduled += 1;
    logDecision(s, now, "rescheduled", item.title, item.id);
    advance(s);
    return;
  }
  if (press.kind !== "checkin") return;

  switch (press.choice) {
    case "done":
      item.status = "done";
      item.doneAt = now;
      f.results.done += 1;
      logDecision(s, now, "done", item.title, item.id);
      break;
    case "now":
      // Sigue para hoy y en 45 min pregunta si ya quedó.
      f.results.now += 1;
      schedule(s, {
        id: `checkin_followup:${item.id}:${now}`,
        kind: "checkin_followup",
        dueAt: now + 45,
        expiresAt: null,
        ref: item.id,
        windowIdx: 0,
      });
      break;
    case "reschedule": {
      f.picking = true;
      const message = findMessage(s, f.messageId);
      if (message) {
        message.text = checkinPick(item.title);
        message.buttons = [
          [
            { label: BTN.tomorrow, press: { kind: "checkin_date", target: "tomorrow" } },
            { label: BTN.after, press: { kind: "checkin_date", target: "after" } },
            { label: BTN.saturday, press: { kind: "checkin_date", target: "saturday" } },
          ],
        ];
      }
      return;
    }
    case "defer":
      if (item.deferCount >= RULE_OF_THREE) return;
      item.dueDay = f.day + 1;
      item.deferCount += 1;
      f.results.deferred += 1;
      logDecision(s, now, "deferred", item.title, item.id);
      break;
    case "kill":
      item.status = "killed";
      f.results.killed += 1;
      logDecision(s, now, "killed", item.title, item.id);
      break;
  }
  advance(s);
}

export function onCheckinFollowup(s: DemoState, itemId: string, sentAt: Minute) {
  const item = findItem(s, itemId);
  if (item?.status !== "active") return;
  addMessage(s, "polaris", sentAt, askDone(item.title), [
    [
      { label: BTN.si, press: { kind: "checkin_followup", itemId, done: true } },
      { label: BTN.no, press: { kind: "checkin_followup", itemId, done: false } },
    ],
  ]);
}

export function pressCheckinFollowup(s: DemoState, press: Press, message: Message, now: Minute) {
  if (press.kind !== "checkin_followup") return;
  const item = findItem(s, press.itemId);
  message.buttons = [];
  if (item?.status !== "active") return;
  if (press.done) {
    item.status = "done";
    item.doneAt = now;
    logDecision(s, now, "done", item.title, item.id);
    message.text = done(item.title);
  } else {
    item.dueDay = dayOf(now) + 1;
    item.deferCount += 1;
    logDecision(s, now, "deferred", item.title, item.id);
    message.text = deferredToTomorrow(item.title);
  }
}
