/**
 * Huecos, carga y búsqueda de bloques: versión simple de `scheduler/slots.py` (F5).
 * Funciones puras: reciben el estado y nunca lo mutan, salvo `applyOption`, que trabaja
 * sobre el borrador del motor.
 */
import { type DemoState, nextId } from "./state";
import { at, dayOf, isWeekend, type Minute, weekday } from "./time";
import type { Block } from "./types";

export type Interval = { start: Minute; end: Minute };

export type Move = {
  blockId: string;
  title: string;
  fromDay: number;
  toDay: number;
  start: Minute;
  end: Minute;
};

export type Option = {
  day: number;
  moves: Move[];
  placement: Interval[];
  /** Minutos planeados que quedarían en cada día tocado. */
  plannedAfter: Record<number, number>;
  /** Días que pasarían del tope de foco. */
  overloaded: number[];
};

export type BlockRequest = {
  title: string;
  minutes: number;
  splittable: boolean;
  deadlineDay: number;
};

const length = (i: Interval) => i.end - i.start;

/** Clases y eventos fijos de ese día. */
export function fixedOn(s: DemoState, day: number): (Interval & { title: string; id: string })[] {
  return s.fixed
    .filter((f) => f.weekdays.includes(weekday(day)))
    .map((f) => ({ id: f.id, title: f.title, start: at(day, f.start), end: at(day, f.end) }))
    .sort((a, b) => a.start - b.start);
}

export function plannedOn(s: DemoState, day: number): Block[] {
  return s.blocks
    .filter((b) => b.status === "planned" && dayOf(b.start) === day)
    .sort((a, b) => a.start - b.start);
}

export function plannedMinutes(s: DemoState, day: number): number {
  return plannedOn(s, day).reduce((sum, b) => sum + length(b), 0);
}

/** Huecos libres del día dentro de [inicio de foco, hora de dormir], con colchón entre bloques. */
export function freeSlots(s: DemoState, day: number, from: Minute = 0): Interval[] {
  const { focusStart, sleep, bufferMin, minChunkMin } = s.settings;
  const windowStart = Math.max(at(day, focusStart), from);
  const windowEnd = at(day, sleep);
  const busy = [...fixedOn(s, day), ...plannedOn(s, day)]
    .map((b) => ({ start: b.start - bufferMin, end: b.end + bufferMin }))
    .sort((a, b) => a.start - b.start);
  const free: Interval[] = [];
  let cursor = windowStart;
  for (const b of busy) {
    if (b.start > cursor) free.push({ start: cursor, end: Math.min(b.start, windowEnd) });
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < windowEnd) free.push({ start: cursor, end: windowEnd });
  return free.filter((i) => length(i) >= minChunkMin);
}

/** Coloca `minutes` en los huecos más tempranos. Partido en chunks si se puede. */
export function place(
  s: DemoState,
  day: number,
  minutes: number,
  splittable: boolean,
  from: Minute = 0,
): Interval[] | null {
  const { minChunkMin, maxChunkMin, bufferMin } = s.settings;
  const slots = freeSlots(s, day, from);
  if (!splittable) {
    const slot = slots.find((i) => length(i) >= minutes);
    return slot ? [{ start: slot.start, end: slot.start + minutes }] : null;
  }
  const out: Interval[] = [];
  let remaining = minutes;
  for (const slot of slots) {
    let cursor = slot.start;
    while (remaining > 0) {
      const room = slot.end - cursor;
      const chunk = Math.min(remaining, maxChunkMin, room);
      if (chunk < minChunkMin && chunk < remaining) break;
      if (chunk <= 0) break;
      out.push({ start: cursor, end: cursor + chunk });
      remaining -= chunk;
      cursor += chunk + bufferMin;
    }
    if (remaining === 0) return out;
  }
  return null;
}

/** Días hábiles desde mañana hasta la fecha límite. */
export function candidateDays(now: Minute, deadlineDay: number): number[] {
  const days: number[] = [];
  for (let d = dayOf(now) + 1; d <= deadlineDay; d++) if (!isWeekend(d)) days.push(d);
  return days;
}

function blockDeadline(s: DemoState, block: Block): number | null {
  return s.items.find((i) => i.id === block.itemId)?.dueDay ?? null;
}

/**
 * ¿Cabe la petición en `day`? Si no cabe, mueve primero los bloques con fecha límite más
 * lejana (los sin fecha van primero) y busca a cada uno su mejor destino.
 */
export function evaluateDay(
  s: DemoState,
  req: BlockRequest,
  day: number,
  now: Minute,
): Option | null {
  const sim = structuredClone(s);
  const { focusMaxMin } = sim.settings;
  const days = candidateDays(now, req.deadlineDay);
  const deadlineRank = (b: Block) => blockDeadline(sim, b) ?? Number.POSITIVE_INFINITY;

  let capacity = focusMaxMin - plannedMinutes(sim, day);
  const movable = plannedOn(sim, day)
    .filter((b) => b.start > now)
    .sort((a, b) => deadlineRank(b) - deadlineRank(a) || b.start - a.start);
  const toMove: Block[] = [];
  for (const block of movable) {
    if (capacity >= req.minutes) break;
    toMove.push(block);
    capacity += length(block);
  }
  if (capacity < req.minutes) return null;
  for (const block of toMove) block.status = "cancelled";

  const moves: Move[] = [];
  for (const block of toMove) {
    const len = length(block);
    const deadline = blockDeadline(sim, block);
    let best: { day: number; slot: Interval; after: number; fits: boolean } | null = null;
    for (const d of days) {
      if (d === day || (deadline !== null && d > deadline)) continue;
      const slot = place(sim, d, len, false)?.[0];
      if (!slot) continue;
      const after = plannedMinutes(sim, d) + len;
      const fits = after <= focusMaxMin;
      const better =
        !best ||
        (fits && !best.fits) ||
        (fits === best.fits && (after < best.after || (after === best.after && d < best.day)));
      if (better) best = { day: d, slot, after, fits };
    }
    if (!best) return null;
    block.start = best.slot.start;
    block.end = best.slot.end;
    block.status = "planned";
    moves.push({
      blockId: block.id,
      title: block.title,
      fromDay: day,
      toDay: best.day,
      ...best.slot,
    });
  }

  const placement = place(sim, day, req.minutes, req.splittable);
  if (!placement) return null;

  const touched = [day, ...moves.map((m) => m.toDay)];
  const plannedAfter: Record<number, number> = {};
  for (const d of touched) {
    plannedAfter[d] = plannedMinutes(sim, d) + (d === day ? req.minutes : 0);
  }
  const overloaded = Object.entries(plannedAfter)
    .filter(([, minutes]) => minutes > focusMaxMin)
    .map(([d]) => Number(d))
    .sort((a, b) => a - b);
  return { day, moves, placement, plannedAfter, overloaded };
}

/** Orden de F5: cabe sin mover > menos cosas movidas > menor carga resultante > más temprano. */
export function bestOption(s: DemoState, req: BlockRequest, now: Minute): Option | null {
  const options = candidateDays(now, req.deadlineDay)
    .map((d) => evaluateDay(s, req, d, now))
    .filter((o): o is Option => o !== null);
  const peak = (o: Option) => Math.max(...Object.values(o.plannedAfter));
  options.sort((a, b) => a.moves.length - b.moves.length || peak(a) - peak(b) || a.day - b.day);
  return options[0] ?? null;
}

/** Aplica una opción confirmada sobre el borrador del motor. Devuelve los bloques nuevos. */
export function applyOption(
  s: DemoState,
  option: Option,
  title: string,
  itemId: string | null,
): Block[] {
  for (const move of option.moves) {
    const block = s.blocks.find((b) => b.id === move.blockId);
    if (block) {
      block.start = move.start;
      block.end = move.end;
    }
  }
  const created = option.placement.map((slot) => ({
    id: nextId(s, "b"),
    title,
    itemId,
    start: slot.start,
    end: slot.end,
    status: "planned" as const,
  }));
  s.blocks.push(...created);
  return created;
}
