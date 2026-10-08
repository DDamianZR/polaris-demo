/**
 * Hábitos con lazo cerrado (F4): avisa → pregunta si lo hiciste → si no, lo recorre a la
 * siguiente ventana, con su propia etiqueta, o lo deja para mañana.
 */
import {
  BTN,
  HABIT_DONE,
  HABIT_SKIPPED,
  HABIT_SNOOZED,
  habitMoved,
  habitMoveTo,
  habitPing,
} from "../../copy/es";
import { addMessage, cancelEvents, type DemoState, findMessage, schedule } from "../state";
import { at, dayOf, type Minute, weekday } from "../time";
import type { DemoEvent, Habit, HabitDay, Message, Press } from "../types";

const pingId = (key: string, day: number, idx: number) => `habit_ping:${key}:${day}:w${idx}`;

function habitDay(s: DemoState, key: string, day: number): HabitDay | undefined {
  return s.habitDays.find((h) => h.key === key && h.day === day);
}

function habit(s: DemoState, key: string): Habit | undefined {
  return s.habits.find((h) => h.key === key);
}

function windowEnd(h: Habit, day: number, idx: number): Minute {
  return at(day, h.windows[idx]?.end ?? "23:59");
}

export function materializeHabits(s: DemoState, day: number) {
  for (const h of s.habits) {
    if (!h.weekdays.includes(weekday(day))) continue;
    if (!habitDay(s, h.key, day)) {
      s.habitDays.push({
        key: h.key,
        day,
        windowIdx: 0,
        status: "pending",
        at: null,
        messageId: null,
      });
    }
    const first = h.windows[0];
    if (!first || at(day, first.start) < s.lastTickAt) continue;
    schedule(s, {
      id: pingId(h.key, day, 0),
      kind: "habit_ping",
      dueAt: at(day, first.start),
      expiresAt: windowEnd(h, day, 0),
      ref: h.key,
      windowIdx: 0,
    });
  }
}

function closeButtons(s: DemoState, hd: HabitDay) {
  const message = hd.messageId ? findMessage(s, hd.messageId) : undefined;
  if (message) message.buttons = [];
}

export function onPing(s: DemoState, ev: DemoEvent, sentAt: Minute) {
  const day = dayOf(ev.dueAt);
  const h = habit(s, ev.ref ?? "");
  const hd = h && habitDay(s, h.key, day);
  if (!h || !hd || hd.status !== "pending") return;
  const label = h.windows[ev.windowIdx]?.label ?? h.name;
  closeButtons(s, hd);
  hd.windowIdx = ev.windowIdx;
  const message = addMessage(s, "polaris", sentAt, habitPing(h.emoji, label), [
    [
      { label: BTN.yes, press: { kind: "habit", key: h.key, day, choice: "done" } },
      { label: BTN.snooze, press: { kind: "habit", key: h.key, day, choice: "snooze" } },
      { label: BTN.todayNo, press: { kind: "habit", key: h.key, day, choice: "skip" } },
    ],
  ]);
  hd.messageId = message.id;
  schedule(s, {
    id: `habit_followup:${h.key}:${day}:w${ev.windowIdx}:${sentAt}`,
    kind: "habit_followup",
    dueAt: Math.min(sentAt + h.followupMin, windowEnd(h, day, ev.windowIdx)),
    expiresAt: windowEnd(h, day, ev.windowIdx),
    ref: h.key,
    windowIdx: ev.windowIdx,
  });
}

export function onFollowup(s: DemoState, ev: DemoEvent, sentAt: Minute) {
  const day = dayOf(ev.dueAt);
  const h = habit(s, ev.ref ?? "");
  const hd = h && habitDay(s, h.key, day);
  if (!h || !hd || hd.status !== "pending" || hd.windowIdx !== ev.windowIdx) return;
  closeButtons(s, hd);
  const ask = h.windows[ev.windowIdx]?.ask ?? `¿Ya quedó ${h.name.toLowerCase()}?`;
  const message = addMessage(s, "polaris", sentAt, ask, [
    [
      { label: BTN.si, press: { kind: "habit_followup", key: h.key, day, done: true } },
      { label: BTN.no, press: { kind: "habit_followup", key: h.key, day, done: false } },
    ],
  ]);
  hd.messageId = message.id;
}

/** Un día sin respuesta, con su última ventana cerrada, queda como no hecho. Sin insistir. */
export function expireHabits(s: DemoState, now: Minute) {
  for (const hd of s.habitDays) {
    const h = habit(s, hd.key);
    if (!h || hd.status !== "pending") continue;
    if (now >= windowEnd(h, hd.day, h.windows.length - 1)) {
      hd.status = "missed";
      closeButtons(s, hd);
    }
  }
}

function settle(s: DemoState, hd: HabitDay, status: HabitDay["status"], now: Minute) {
  hd.status = status;
  hd.at = now;
  cancelEvents(s, `habit_ping:${hd.key}:${hd.day}`);
  cancelEvents(s, `habit_followup:${hd.key}:${hd.day}`);
}

function append(message: Message, line: string) {
  message.text = `${message.text}\n${line}`;
  message.buttons = [];
}

/** Agenda el ping de la ventana `idx` (al empezar la ventana, o ya si ya empezó). */
function pingWindow(
  s: DemoState,
  h: Habit,
  hd: HabitDay,
  idx: number,
  now: Minute,
  tag = "",
): Minute | null {
  const w = h.windows[idx];
  if (!w) return null;
  hd.windowIdx = idx;
  const dueAt = Math.max(at(hd.day, w.start), now);
  schedule(s, {
    id: `${pingId(h.key, hd.day, idx)}${tag}`,
    kind: "habit_ping",
    dueAt,
    expiresAt: windowEnd(h, hd.day, idx),
    ref: h.key,
    windowIdx: idx,
  });
  return dueAt;
}

/** Tras una caída: el ping que venció en el hueco pasa a la ventana vigente, si la hay. */
export function reroutePing(s: DemoState, ev: DemoEvent, now: Minute) {
  const day = dayOf(ev.dueAt);
  const h = habit(s, ev.ref ?? "");
  const hd = h && habitDay(s, h.key, day);
  if (!h || !hd || hd.status !== "pending") return;
  const current = h.windows.findIndex((w) => now >= at(day, w.start) && now < at(day, w.end));
  if (current > ev.windowIdx) pingWindow(s, h, hd, current, now, ":r");
}

export function pressHabit(s: DemoState, press: Press, message: Message, now: Minute) {
  if (press.kind !== "habit" && press.kind !== "habit_followup" && press.kind !== "habit_next") {
    return;
  }
  const h = habit(s, press.key);
  const hd = h && habitDay(s, press.key, press.day);
  if (!h || !hd || hd.status !== "pending") {
    message.buttons = [];
    return;
  }
  const next = h.windows[hd.windowIdx + 1];

  if (press.kind === "habit" && press.choice === "done") {
    settle(s, hd, "done", now);
    append(message, HABIT_DONE);
  } else if (press.kind === "habit" && press.choice === "skip") {
    settle(s, hd, "skipped", now);
    append(message, HABIT_SKIPPED);
  } else if (press.kind === "habit" && press.choice === "snooze") {
    cancelEvents(s, `habit_followup:${hd.key}:${hd.day}`);
    if (now + 30 < windowEnd(h, hd.day, hd.windowIdx)) {
      schedule(s, {
        id: `${pingId(h.key, hd.day, hd.windowIdx)}:z${now}`,
        kind: "habit_ping",
        dueAt: now + 30,
        expiresAt: windowEnd(h, hd.day, hd.windowIdx),
        ref: h.key,
        windowIdx: hd.windowIdx,
      });
      append(message, HABIT_SNOOZED);
    } else if (next) {
      // La ventana ya se acaba: el snooze salta a la siguiente, con su etiqueta.
      const when = pingWindow(s, h, hd, hd.windowIdx + 1, now) ?? now;
      append(message, habitMoved(when, next.label));
    } else {
      settle(s, hd, "missed", now);
      append(message, HABIT_SKIPPED);
    }
  } else if (press.kind === "habit_followup" && press.done) {
    settle(s, hd, "done", now);
    append(message, HABIT_DONE);
  } else if (press.kind === "habit_followup") {
    if (next) {
      message.buttons = [
        [
          {
            label: habitMoveTo(next.label),
            press: { kind: "habit_next", key: h.key, day: hd.day, move: true },
          },
          {
            label: BTN.skipToday,
            press: { kind: "habit_next", key: h.key, day: hd.day, move: false },
          },
        ],
      ];
    } else {
      settle(s, hd, "missed", now);
      append(message, HABIT_SKIPPED);
    }
  } else if (press.kind === "habit_next" && press.move && next) {
    const when = pingWindow(s, h, hd, hd.windowIdx + 1, now) ?? now;
    append(message, habitMoved(when, next.label));
  } else {
    settle(s, hd, "skipped", now);
    append(message, HABIT_SKIPPED);
  }
}
