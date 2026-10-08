/**
 * Tiempo de la demo: minutos desde el lunes 12 oct 2026 00:00, hora local.
 * Sin zonas horarias: la demo vive en un solo lugar. El bot real guarda instantes en UTC.
 */

export type Minute = number;

export const DAY = 1440;
/** Lunes de la semana de la demo, como fecha UTC solo para calcular días y meses. */
const BASE_UTC = Date.UTC(2026, 9, 12);
const MS_PER_DAY = 86_400_000;

/** Días de la semana de la demo (lun 12 a dom 18 oct). */
export const LUN = 0;
export const MAR = 1;
export const MIE = 2;
export const JUE = 3;
export const VIE = 4;
export const SAB = 5;
export const DOM = 6;

export const DAY_SHORT = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"] as const;
export const DAY_LONG = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
] as const;
const MONTH_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];
/** Claves de día del parser del bot (`preferred_days`). */
const DAY_KEYS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Instante de un día a una hora: `at(MAR, "07:00")`. */
export function at(day: number, hhmm: string): Minute {
  return day * DAY + toMinutes(hhmm);
}

export function dayOf(t: Minute): number {
  return Math.floor(t / DAY);
}

export function minuteOfDay(t: Minute): number {
  return t - dayOf(t) * DAY;
}

/** 0 = lunes … 6 = domingo, para cualquier día (también de otras semanas). */
export function weekday(day: number): number {
  return ((day % 7) + 7) % 7;
}

export function isWeekend(day: number): boolean {
  return weekday(day) >= 5;
}

function dateParts(day: number): { y: number; m: number; d: number } {
  const date = new Date(BASE_UTC + day * MS_PER_DAY);
  return { y: date.getUTCFullYear(), m: date.getUTCMonth(), d: date.getUTCDate() };
}

/** `13:05`. */
export function hhmm(t: Minute): string {
  const m = minuteOfDay(t);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** `jue 15 oct`, como `short_date` del bot. */
export function shortDate(day: number): string {
  const { m, d } = dateParts(day);
  return `${DAY_SHORT[weekday(day)]} ${d} ${MONTH_SHORT[m]}`;
}

/** `2026-10-15`, como `due_date` del parser. */
export function isoDate(day: number): string {
  const { y, m, d } = dateParts(day);
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function dayFromIso(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1) - BASE_UTC) / MS_PER_DAY);
}

/** Siguiente día (desde `from`, incluido) que cae en el día de semana de `key` ("mie"). */
export function nextWeekday(key: string, from: number): number | null {
  const target = DAY_KEYS.indexOf(key);
  if (target < 0) return null;
  return from + ((target - weekday(from) + 7) % 7);
}

/** `45 min`, `2 h`, `1 h 40`. */
export function duration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}

const MONTH_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** `martes 13 de octubre`. */
export function longDate(day: number): string {
  const { m, d } = dateParts(day);
  return `${DAY_LONG[weekday(day)]} ${d} de ${MONTH_LONG[m]}`;
}
