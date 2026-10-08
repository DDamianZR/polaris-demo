/** Reloj simulado de la demo. Puro: el componente decide cuándo llamarlo. */
import type { Chapter } from "./script";
import type { DemoState } from "./state";
import type { Minute } from "./time";

/** Minutos simulados por segundo real. */
export const SPEEDS = [2, 10, 30] as const;

export function advance(now: number, elapsedMs: number, minutesPerSecond: number): number {
  return now + (elapsedMs / 1000) * minutesPerSecond;
}

/** Lo próximo que va a pasar: un evento de la cola o el inicio de otro capítulo. */
export function nextMoment(s: DemoState, now: Minute, chapters: Chapter[]): Minute | null {
  const times = [
    ...Object.values(s.events)
      .filter((e) => e.status === "pending" && e.dueAt > now)
      .map((e) => e.dueAt),
    ...chapters.map((c) => c.start).filter((t) => t > now),
  ];
  return times.length ? Math.min(...times) : null;
}

/** Capítulo en curso: el último que ya empezó. */
export function chapterAt(now: Minute, chapters: Chapter[]): number {
  let index = 0;
  chapters.forEach((c, i) => {
    if (c.start <= now) index = i;
  });
  return index;
}
