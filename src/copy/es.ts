/**
 * Todos los textos de la demo: español informal mexicano, cortos y tranquilos.
 * Los del chat están copiados (no importados) de `src/polaris/render/es.py` del bot y de sus
 * specs F2–F7, para que la demo suene igual que el Polaris real. Sin guiones largos.
 */
import { DAY_LONG, duration, hhmm, type Minute, shortDate, weekday } from "../demo/time";
import type { Item } from "../demo/types";

// --- Chat: captura (F1) ---

export const ACK = "✓";
export const OTHER_SHORT = "👌";
export const UNKNOWN_COMMAND = "Ese comando no lo tengo. Mira el menú de /";

export function itemLine(item: Item, showArea = true): string {
  const parts = [(item.kind === "reminder" ? "⏰ " : "") + item.title];
  if (item.dueDay !== null) {
    parts.push(shortDate(item.dueDay) + (item.dueAt !== null ? ` ${hhmm(item.dueAt)}` : ""));
  }
  if (item.status === "inbox") parts.push("inbox");
  if (item.area && showArea) parts.push(item.area);
  return parts.join(" · ");
}

export function captureAck(items: Item[]): string {
  const [first] = items;
  if (items.length === 1 && first) {
    return first.status === "inbox" ? `✓ Al inbox: ${first.title}` : `✓ ${itemLine(first)}`;
  }
  return [
    `✓ ${items.length} pendientes:`,
    ...items.map((item, n) => `${n + 1}. ${itemLine(item)}`),
  ].join("\n");
}

export const done = (title: string) => `✓ Hecho: ${title}`;
export const killed = (title: string) => `✓ Descartado: ${title}`;
export const rescheduled = (title: string, day: number) => `✓ ${title} → ${shortDate(day)}`;
export const notFound = (hint: string) => `No encontré nada como «${hint}».`;

// --- Chat: volcado e inbox (F1) ---

export const DUMP_START =
  "📥 Modo volcado. Mándame todo, también reenviados; te pongo 👍 y al final /listo.";
export const DUMP_ALREADY = "Ya estás en volcado. Cuando acabes: /listo";
export const DUMP_NONE = "No estás en volcado. Empieza con /volcado";
export const DUMP_EMPTY = "📥 Volcado vacío: no me mandaste nada.";

export function dumpSummary(groups: [string | null, Item[]][]): string {
  const total = groups.reduce((sum, [, group]) => sum + group.length, 0);
  if (!total) return DUMP_EMPTY;
  const lines = [`📥 Volcado: ${total} cosa${total === 1 ? "" : "s"}`];
  let n = 0;
  for (const [area, group] of groups) {
    // Como el bot: el área va en negritas (<b>, el único formato que entiende el chat).
    lines.push(`<b>${area ?? "sin área"}</b>`);
    for (const item of group) {
      n += 1;
      lines.push(`${n}. ${itemLine(item, false)}`);
    }
  }
  lines.push("Corrige respondiendo: «el 3 es para el viernes», «borra el 4».");
  return lines.join("\n");
}

export const INBOX_EMPTY = "Inbox vacío. 🙌";

export function inboxList(items: Item[], hidden: number): string {
  const lines = [`📥 Inbox (${items.length + hidden})`];
  items.forEach((item, n) => {
    const idea = item.kind === "idea" ? "💡 " : "";
    lines.push(`${n + 1}. ${idea}${item.title}${item.area ? ` · ${item.area}` : ""}`);
  });
  if (hidden) lines.push(`+${hidden} más`);
  return lines.join("\n");
}

// --- Chat: brief y consultas (F2) ---

export const BRIEF_MAX_LINES = 12;

export function brief(opts: {
  day: number;
  greeting: boolean;
  fixed: { start: Minute; title: string }[];
  today: Item[];
  upcoming: Item[];
  inboxCount: number;
}): string {
  const lines: string[] = [];
  if (opts.greeting) lines.push(`Buenos días. Hoy es ${shortDate(opts.day)}.`);
  if (opts.fixed.length) {
    lines.push(`<b>Fijo</b> ${opts.fixed.map((f) => `${hhmm(f.start)} ${f.title}`).join(" · ")}`);
  }
  const body: string[] = [];
  if (opts.today.length) body.push("<b>Para hoy</b>", ...opts.today.map((i) => `• ${i.title}`));
  if (opts.upcoming.length) {
    body.push(
      "<b>Lo que viene</b>",
      ...opts.upcoming.map((i) => `• ${i.title} · ${shortDate(i.dueDay ?? opts.day)}`),
    );
  }
  if (!opts.today.length && !opts.upcoming.length) body.push("No tienes nada urgente.");
  const tail = opts.inboxCount ? [`Inbox: ${opts.inboxCount}`] : [];
  const room = BRIEF_MAX_LINES - lines.length - tail.length;
  if (body.length > room) {
    const hidden = body.length - (room - 1);
    body.splice(room - 1, body.length, `+${hidden} más → /hoy`);
  }
  return [...lines, ...body, ...tail].join("\n");
}

export function itemStatus(item: Item): string {
  if (item.status === "done") {
    const when = item.doneAt !== null ? ` el ${shortDate(Math.floor(item.doneAt / 1440))}` : "";
    return `Sí, «${item.title}» quedó${when}.`;
  }
  if (item.status === "killed") return `«${item.title}» lo descartaste.`;
  const due = item.dueDay !== null ? `, para el ${shortDate(item.dueDay)}` : ", sin fecha";
  return `${item.title}: pendiente${due}.`;
}

// --- Chat: check-in, recordatorios y catch-up (F3) ---

export const CHECKIN_EMPTY = "Hoy no quedó nada pendiente. Todo en orden.";
export const RULE_OF_THREE = "Ya se recorrió 3 veces. Fecha dura o se va.";

function dueRelative(dueDay: number, today: number): string {
  if (dueDay === today) return "vencía hoy";
  if (dueDay === today - 1) return "vencía ayer";
  return `vencía el ${shortDate(dueDay).split(" ")[0]}`;
}

export function checkinCard(index: number, total: number, item: Item, today: number): string {
  const head = `${index + 1}/${total} · ${item.title} (${dueRelative(item.dueDay ?? today, today)})`;
  return item.deferCount >= 3 ? `${head}\n${RULE_OF_THREE}` : head;
}

export const checkinPick = (title: string) => `¿Para cuándo «${title}»?`;

export function checkinSummary(r: {
  done: number;
  now: number;
  rescheduled: number;
  deferred: number;
  killed: number;
}): string {
  const parts = [
    r.done && `${r.done} hecha${r.done === 1 ? "" : "s"}`,
    r.now && `${r.now} para ahorita`,
    r.rescheduled && `${r.rescheduled} reagendada${r.rescheduled === 1 ? "" : "s"}`,
    r.deferred && `${r.deferred} recorrida${r.deferred === 1 ? "" : "s"}`,
    r.killed && `${r.killed} muerta${r.killed === 1 ? "" : "s"}`,
  ].filter(Boolean);
  return `Listo: ${parts.join(", ")}.\nHoy basta con esto.`;
}

export const askDone = (title: string) => `¿Ya quedó «${title}»?`;
export const deferredToTomorrow = (title: string) => `Va, «${title}» pasa a mañana.`;
export const reminder = (title: string) => `⏰ ${title}`;

export function catchup(from: Minute, to: Minute, missed: string[]): string {
  const head = `Estuve fuera de ${hhmm(from)} a ${hhmm(to)}.`;
  return missed.length ? [`${head} Se pasó:`, ...missed].join("\n") : `${head} No se pasó nada.`;
}

export const missedReminder = (title: string, when: Minute) => `⏰ ${title} (${hhmm(when)})`;

// --- Chat: hábitos (F4) ---

export const habitPing = (emoji: string, label: string) => `${emoji} ${capitalize(label)}`;
export const habitMoveTo = (label: string) => `⏭ Pásalo a ${label}`;
export const HABIT_DONE = "✓ Listo.";
export const HABIT_SKIPPED = "Va, hoy no.";
export const HABIT_SNOOZED = "⏰ En 30 min.";
export const habitMoved = (start: Minute, label: string) =>
  `Va. Te vuelvo a avisar a las ${hhmm(start)} (${label}).`;

// --- Chat: negociación (F5) ---

export const NEG_HOW_LONG = "Va, ¿cuánto tiempo?";
export const NEG_NO_ROOM = "Esta semana no hay espacio para eso, ni moviendo cosas.";
export const NEG_DECLINED = "Va, no muevo nada.";
export const NEG_NOTHING_OPEN = "No tengo nada pendiente de confirmar.";

/** "el jueves" esta semana; "el lun 19 oct" si es más adelante. */
export function dayName(day: number, today: number): string {
  return day - today < 7 && day > today ? `el ${DAY_LONG[weekday(day)]}` : `el ${shortDate(day)}`;
}

export function negProposal(opts: {
  day: number;
  today: number;
  freeMin: number;
  minutes: number;
  moves: { title: string; toDay: number; start: Minute }[];
}): string {
  const day = capitalize(dayName(opts.day, opts.today));
  if (!opts.moves.length) return `${day} te caben las ${duration(opts.minutes)} sin mover nada.`;
  // dayName empieza con "el ": "al miércoles", "al lun 19 oct".
  const moved = opts.moves
    .map((m) => `«${m.title}» al ${dayName(m.toDay, opts.today).slice(3)} a las ${hhmm(m.start)}`)
    .join(" y ");
  return `${day} tienes ${duration(Math.max(0, opts.freeMin))} libres. Para que quepan ${duration(opts.minutes)}, muevo ${moved}.`;
}

export function negWarning(day: number, today: number, plannedMin: number): string {
  return `Se puede, pero ${dayName(day, today)} te quedaría muy cargado: ${duration(plannedMin)} de foco.`;
}

export function negConfirmed(day: number, today: number, agenda: string[], moved: number): string {
  const lines = [`Confirmado. Tu ${dayName(day, today).slice(3)} queda así:`, ...agenda];
  if (moved) lines.push(`Moví ${moved} cosa${moved === 1 ? "" : "s"} para hacerle espacio.`);
  return lines.join("\n");
}

// --- Chat: planes (F7) ---

export function planSummary(opts: {
  name: string;
  steps: number;
  totalMin: number;
  maxPerDayMin: number;
  fits: boolean;
  finishDay: number | null;
  deadlineDay: number | null;
  missingMin: number;
}): string {
  const head = `📘 ${opts.name}: ${opts.steps} pasos, ${duration(opts.totalMin)}.`;
  if (!opts.fits) {
    const limit = opts.deadlineDay !== null ? ` al ${shortDate(opts.deadlineDay)}` : "";
    return `${head}\nCon tu carga actual no llega${limit}: faltan ${duration(opts.missingMin)}.`;
  }
  const finish = opts.finishDay !== null ? ` lo terminas el ${shortDate(opts.finishDay)}` : "";
  const spare =
    opts.finishDay !== null && opts.deadlineDay !== null && opts.deadlineDay > opts.finishDay
      ? `, ${opts.deadlineDay - opts.finishDay} días antes del límite`
      : "";
  return `${head}\nCabe: a ${duration(opts.maxPerDayMin)} por día entre semana${finish}${spare}.`;
}

export const planConfirmed = (day: number, step: string) =>
  `Listo, ya está en tu calendario. Empiezas el ${shortDate(day)} con «${step}».`;
export const PLAN_DECLINED = "Va, lo dejo para después.";
export const planError = (line: number, error: string) =>
  `No pude leer el plan, línea ${line}. ${error}`;

// --- Chat: salto de días (solo demo) ---

export function skipSummary(day: number, doneCount: number, habitsDone: number, habits: number) {
  return `Saltamos al ${shortDate(day)}. Mientras tanto cerraste ${doneCount} pendientes y ${habitsDone} de ${habits} hábitos.`;
}

// --- UI de Polaris y de la demo (docs/ux.md: humano, corto, tranquilo) ---

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "Hoy", "Mañana", "Jueves", o la fecha corta si está lejos. */
export function relativeDay(day: number, today: number): string {
  if (day === today) return "Hoy";
  if (day === today + 1) return "Mañana";
  if (day === today - 1) return "Ayer";
  if (day > today && day - today < 7) return capitalize(DAY_LONG[weekday(day)] ?? "");
  return shortDate(day);
}

/** "mar 13 oct, 07:35" para el reloj de la demo. */
export const clockLabel = (t: Minute) => `${shortDate(Math.floor(t / 1440))}, ${hhmm(t)}`;

export const UI = {
  demoLabel: "Demo con datos de ejemplo",
  chat: {
    emptyTitle: "Todavía no hay mensajes.",
    emptyHint: (time: string) => `El primero llega a las ${time}, sin que lo pidas.`,
    title: "Polaris",
    caption: "Así se ve en tu Telegram",
    placeholder: "Escribe un mensaje",
    send: "Enviar",
    edited: "editado",
    log: "Conversación con Polaris",
    suggestions: "Prueba con",
  },
  controls: {
    goAt: (time: string) => `Ir a las ${time}`,
    goAtDay: (day: string, time: string) => `Ir al ${day}, ${time}`,
    clock: "Hora de la demo",
    section: "Controles de la demo",
    play: "Reproducir el día",
    pause: "Pausar",
    chapters: "Capítulos",
    goTo: (n: number, title: string) => `Ir al capítulo ${n}: ${title}`,
    position: (n: number, total: number) => `${n}/${total}`,
    skipDays: "Saltar al viernes",
    outage: "Apagar Polaris 5 horas",
  },
  nav: {
    label: "Secciones de Polaris",
    chat: "Chat",
    today: "Today",
    inbox: "Inbox",
    orbit: "Orbit",
    direction: "Direction",
    history: "History",
  },
  today: {
    onTrack: "Tu día está bajo control.",
    calm: "No tienes nada urgente.",
    now: "Ahora",
    after: "Después",
    inProgress: (left: string) => `En curso · ${left}`,
    freeUntil: (time: string) => `Libre hasta las ${time}.`,
    freeRest: "Nada más por hoy.",
    pending: "Para hoy",
    upcoming: "Lo que viene",
    summary: (pending: number, habits: number, events: number) =>
      [
        plural(pending, "pendiente", "pendientes"),
        plural(habits, "hábito", "hábitos"),
        plural(events, "evento", "eventos"),
      ].join(" · "),
  },
  inbox: {
    title: "¿Qué tienes en la cabeza?",
    concept: "Lo que ya no necesitas recordar.",
    placeholder: "Escribe lo que sea…",
    capture: "Capturar",
    stream: "Lo que has capturado",
    undated: "Sin fecha",
    raw: "Lo tenemos. Lo ordenamos después.",
    empty: "Todo despejado.",
  },
  /** `when` es la hora del día en que pasa: el itinerario de la demo. */
  chapters: {
    brief: {
      when: "07:00",
      title: "Lo que importa",
      lead: "A las 7 llega tu día en un vistazo. Sin abrir nada.",
    },
    capture: {
      when: "07:15",
      title: "Dilo como te salga",
      lead: "Escríbelo como se lo dirías a alguien. Polaris le pone fecha y lugar.",
    },
    dump: {
      when: "07:30",
      title: "Vacía la cabeza",
      lead: "Suelta todo de jalón. Al final te lo regresa en orden.",
    },
    habit: {
      when: "08:00",
      title: "Lo básico, sin culpa",
      lead: "Te recuerda, te pregunta y, si no se pudo, lo pasa a la siguiente ventana.",
    },
    negotiation: {
      when: "13:00",
      title: "Pídele espacio",
      lead: "Te propone con números, te avisa una vez si te cargas de más y tú decides.",
    },
    plan: {
      when: "17:00",
      title: "Aterriza tus planes",
      lead: "Pega un plan por pasos y te dice si cabe en tus semanas.",
    },
    checkin: {
      when: "21:30",
      title: "Una decisión, no culpa",
      lead: "Cada noche, lo que no se hizo recibe una decisión en un tap.",
    },
    friday: {
      when: "Viernes",
      title: "Nada se pierde",
      lead: "Aunque Polaris se apague, al volver te dice qué se pasó.",
    },
  },
} as const;

// --- Botones ---

export const BTN = {
  yes: "✅ Ya",
  now: "⚡ Ahorita",
  reschedule: "📅 Reagendar",
  defer: "⏭ Recorrer",
  kill: "🗑 Matar",
  tomorrow: "Mañana",
  after: "Pasado",
  saturday: "Sábado",
  si: "Sí",
  no: "No",
  snooze: "⏰ 30 min",
  todayNo: "❌ Hoy no",
  skipToday: "🗑 Hoy no",
  listo: "✅ Listo",
  va: "Va",
  vaAsi: "Va, así",
  noThanks: "No, gracias",
  schedulePlan: "Va, agéndalo",
  notNow: "Ahora no",
} as const;

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
