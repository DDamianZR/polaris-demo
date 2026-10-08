/**
 * El motor de la demo: `step(state, action, now)` → estado nuevo.
 * Puro: nunca muta su entrada ni lee el reloj. Antes de cada acción procesa lo que ya venció,
 * igual que el tick del bot. El LLM no existe aquí: la salida del parser llega en `parsed`.
 */
import { handleSend } from "./flows/capture";
import { pressCheckin, pressCheckinFollowup } from "./flows/checkin";
import { pressHabit } from "./flows/habits";
import { onConfirm, onDecline } from "./flows/negotiation";
import { onPlanConfirm, onPlanDecline } from "./flows/planning";
import { pressReminder } from "./flows/reminders";
import { type DemoState, findMessage, samePress } from "./state";
import { outage, processDue, type SkipOutcomes, skipDays } from "./tick";
import type { Minute } from "./time";
import type { Message, Parsed, Press } from "./types";

export type Action =
  | { type: "tick" }
  | { type: "send"; text: string; parsed?: Parsed }
  | { type: "press"; press: Press; messageId?: string }
  | { type: "outage"; until: Minute }
  | { type: "skipDays"; until: Minute; outcomes: SkipOutcomes };

const hasButton = (message: Message, press: Press) =>
  message.buttons.some((row) => row.some((b) => samePress(b.press, press)));

/** Un botón solo vale mientras siga en su mensaje: los viejos ya no hacen nada. */
function findPressed(s: DemoState, press: Press, messageId?: string): Message | undefined {
  const message = messageId
    ? findMessage(s, messageId)
    : [...s.messages].reverse().find((m) => hasButton(m, press));
  return message && hasButton(message, press) ? message : undefined;
}

function handlePress(s: DemoState, press: Press, messageId: string | undefined, now: Minute) {
  const message = findPressed(s, press, messageId);
  if (!message) return;
  switch (press.kind) {
    case "checkin":
    case "checkin_date":
      pressCheckin(s, press, now);
      break;
    case "checkin_followup":
      pressCheckinFollowup(s, press, message, now);
      break;
    case "habit":
    case "habit_followup":
    case "habit_next":
      pressHabit(s, press, message, now);
      break;
    case "reminder":
      pressReminder(s, press, message, now);
      break;
    case "negotiation":
      if (press.choice === "confirm") onConfirm(s, now);
      else onDecline(s, now);
      break;
    case "plan":
      if (press.choice === "confirm") onPlanConfirm(s, now);
      else onPlanDecline(s, now);
      break;
  }
}

export function step(state: DemoState, action: Action, now: Minute): DemoState {
  const s = structuredClone(state);
  const t = Math.max(Math.floor(now), s.lastTickAt);
  processDue(s, t);
  switch (action.type) {
    case "tick":
      break;
    case "send":
      handleSend(s, action.text, action.parsed, t);
      break;
    case "press":
      handlePress(s, action.press, action.messageId, t);
      break;
    case "outage":
      outage(s, t, action.until);
      break;
    case "skipDays":
      skipDays(s, t, action.until, action.outcomes);
      break;
  }
  return s;
}
