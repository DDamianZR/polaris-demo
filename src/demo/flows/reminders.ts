/** Recordatorios con hora (F3): llegan con [✅ Listo] [⏰ 30 min]. */
import { BTN, done, reminder } from "../../copy/es";
import { addMessage, type DemoState, findItem, logDecision, schedule } from "../state";
import type { Minute } from "../time";
import type { Button, Item, Message, Press } from "../types";

export function reminderRow(item: Item, withTitle = false): Button[] {
  return [
    {
      label: withTitle ? `✅ ${item.title}` : BTN.listo,
      press: { kind: "reminder", itemId: item.id, choice: "done" },
    },
    { label: BTN.snooze, press: { kind: "reminder", itemId: item.id, choice: "snooze" } },
  ];
}

export function sendReminder(s: DemoState, itemId: string | null, sentAt: Minute) {
  const item = findItem(s, itemId);
  if (item?.status !== "active") return;
  addMessage(s, "polaris", sentAt, reminder(item.title), [reminderRow(item)]);
}

export function pressReminder(s: DemoState, press: Press, message: Message, now: Minute) {
  if (press.kind !== "reminder") return;
  const item = findItem(s, press.itemId);
  // Solo se quita la fila de este recordatorio: el catch-up puede traer varios.
  message.buttons = message.buttons.filter(
    (row) => !row.some((b) => b.press.kind === "reminder" && b.press.itemId === press.itemId),
  );
  if (item?.status !== "active") return;
  const isOwnMessage = message.text === reminder(item.title);
  if (press.choice === "done") {
    item.status = "done";
    item.doneAt = now;
    logDecision(s, now, "done", item.title, item.id);
    message.text = isOwnMessage ? done(item.title) : `${message.text}\n${done(item.title)}`;
  } else {
    schedule(s, {
      id: `reminder:${item.id}:z${now}`,
      kind: "reminder",
      dueAt: now + 30,
      expiresAt: now + 150,
      ref: item.id,
      windowIdx: 0,
    });
    message.text = `${message.text}\n⏰ En 30 min.`;
  }
}
