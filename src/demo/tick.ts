/**
 * El tick (cada 60 s en el bot): materializa los eventos del día por `dedupe_key`, manda lo
 * que ya venció y es la única fuente de mensajes proactivos. También la caída y su catch-up.
 */
import { catchup, missedReminder, skipSummary } from "../copy/es";
import { briefFor } from "./flows/capture";
import { onCheckinFollowup, startCheckin } from "./flows/checkin";
import { expireHabits, materializeHabits, onFollowup, onPing, reroutePing } from "./flows/habits";
import { reminderRow, sendReminder } from "./flows/reminders";
import { addMessage, type DemoState, findByHint, findItem, logDecision, schedule } from "./state";
import { at, dayOf, type Minute } from "./time";
import type { Button, DemoEvent } from "./types";

export type SkipOutcomes = {
  /** Pistas de título de lo que se hizo mientras tanto. */
  done: string[];
  habits: { key: string; day: number; done: boolean }[];
};

export function materialize(s: DemoState, day: number) {
  const { briefTime, checkinTime } = s.settings;
  if (at(day, briefTime) >= s.lastTickAt) {
    schedule(s, {
      id: `brief:${day}`,
      kind: "brief",
      dueAt: at(day, briefTime),
      expiresAt: at(day, "12:00"),
      ref: null,
      windowIdx: 0,
    });
  }
  if (at(day, checkinTime) >= s.lastTickAt) {
    schedule(s, {
      id: `checkin:${day}`,
      kind: "checkin",
      dueAt: at(day, checkinTime),
      expiresAt: at(day + 1, "05:00"),
      ref: null,
      windowIdx: 0,
    });
  }
  materializeHabits(s, day);
}

function handle(s: DemoState, ev: DemoEvent, sentAt: Minute) {
  switch (ev.kind) {
    case "brief":
      addMessage(s, "polaris", sentAt, briefFor(s, dayOf(ev.dueAt), true));
      break;
    case "checkin":
      startCheckin(s, dayOf(ev.dueAt), sentAt);
      break;
    case "habit_ping":
      onPing(s, ev, sentAt);
      break;
    case "habit_followup":
      onFollowup(s, ev, sentAt);
      break;
    case "reminder":
      sendReminder(s, ev.ref, sentAt);
      break;
    case "checkin_followup":
      onCheckinFollowup(s, ev.ref ?? "", sentAt);
      break;
  }
}

function duePending(s: DemoState, until: Minute): DemoEvent[] {
  return Object.values(s.events)
    .filter((e) => e.status === "pending" && e.dueAt <= until)
    .sort((a, b) => a.dueAt - b.dueAt || a.id.localeCompare(b.id));
}

/** Procesa todo lo que venció hasta `now`, en orden. Correrlo dos veces no duplica nada. */
export function processDue(s: DemoState, now: Minute) {
  if (now < s.lastTickAt) return;
  for (let d = dayOf(s.lastTickAt); d <= dayOf(now) + 1; d++) materialize(s, d);
  for (;;) {
    const [next] = duePending(s, now);
    if (!next) break;
    next.status = "sent";
    // Puntual en el uso normal; tarde (al volver) solo después de una caída.
    handle(s, next, Math.max(next.dueAt, s.lastTickAt));
  }
  expireHabits(s, now);
  s.lastTickAt = now;
}

/**
 * La laptop se apaga de `from` a `until`. Al volver: lo que caducó en el hueco se marca
 * perdido y va en UN solo mensaje; lo que todavía vale se manda al volver, sin ráfaga.
 */
export function outage(s: DemoState, from: Minute, until: Minute) {
  for (let d = dayOf(from); d <= dayOf(until) + 1; d++) materialize(s, d);
  const missed: { title: string; when: Minute; itemId: string }[] = [];
  for (const ev of duePending(s, until)) {
    if (ev.expiresAt === null || ev.expiresAt > until) continue;
    ev.status = "missed";
    if (ev.kind === "reminder") {
      const item = findItem(s, ev.ref);
      if (item?.status === "active")
        missed.push({ title: item.title, when: ev.dueAt, itemId: item.id });
    } else if (ev.kind === "habit_ping") {
      // Los pings vencidos se recorren a la ventana vigente en vez de mandarse atrasados.
      reroutePing(s, ev, until);
    }
  }
  const buttons: Button[][] = missed.flatMap((m) => {
    const item = findItem(s, m.itemId);
    return item ? [reminderRow(item, missed.length > 1)] : [];
  });
  addMessage(
    s,
    "polaris",
    until,
    catchup(
      from,
      until,
      missed.map((m) => missedReminder(m.title, m.when)),
    ),
    buttons,
  );
  s.lastTickAt = until;
  processDue(s, until);
}

/**
 * Solo demo: salta días sin ráfaga de mensajes y aplica lo que "pasó" mientras tanto.
 * El chat lo dice con un aviso del sistema, para que no parezca que Polaris calló.
 */
export function skipDays(s: DemoState, from: Minute, until: Minute, outcomes: SkipOutcomes) {
  for (let d = dayOf(from); d <= dayOf(until) + 1; d++) materialize(s, d);
  for (const ev of duePending(s, until)) ev.status = "cancelled";
  s.flows = { dump: null, checkin: null, negotiation: null, plan: null };
  for (const message of s.messages) message.buttons = [];
  for (const block of s.blocks) {
    if (block.status === "planned" && block.end <= until) block.status = "done";
  }

  // Lo hecho mientras tanto queda en el día en que pasó (el de su fecha, dentro del salto),
  // no en el momento de llegar: así History no lo cuenta como hecho hoy.
  const firstSkipped = dayOf(from) + 1;
  const lastSkipped = Math.max(firstSkipped, dayOf(until) - 1);
  let doneCount = 0;
  for (const hint of outcomes.done) {
    const [item] = findByHint(s, hint).filter((i) => i.status === "active" || i.status === "inbox");
    if (!item) continue;
    const day = Math.min(lastSkipped, Math.max(firstSkipped, item.dueDay ?? firstSkipped));
    const doneAt = at(day, "19:00") + doneCount;
    item.status = "done";
    item.doneAt = doneAt;
    logDecision(s, doneAt, "done", item.title, item.id);
    doneCount += 1;
  }
  s.decisions.sort((a, b) => a.at - b.at);
  for (const o of outcomes.habits) {
    const hd = s.habitDays.find((h) => h.key === o.key && h.day === o.day);
    if (!hd) continue;
    hd.status = o.done ? "done" : "missed";
    hd.at = o.done ? at(o.day, "12:00") : null;
  }
  expireHabits(s, until);

  const skipped = s.habitDays.filter((h) => h.day > dayOf(from) && h.day < dayOf(until));
  addMessage(
    s,
    "system",
    until,
    skipSummary(
      dayOf(until),
      doneCount,
      skipped.filter((h) => h.status === "done").length,
      skipped.length,
    ),
  );
  s.lastTickAt = until;
}
