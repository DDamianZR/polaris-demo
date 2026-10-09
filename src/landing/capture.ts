/**
 * Datos de "Primero captura": la misma frase y la misma salida del parser que el capítulo 2 del
 * guion, para que la landing cuente exactamente lo que la demo hace.
 */
import { capitalize, UI } from "../copy/es";
import { CHAPTERS, type Suggestion } from "../demo/script";
import { dayFromIso, shortDate } from "../demo/time";
import type { ParsedItem } from "../demo/types";

export type Role = "when" | "what";
export type Segment = { text: string; role: Role | null };
export type Row = { title: string; meta: string[]; dated: boolean };

const suggestion = (key: string, pick: (s: Suggestion) => boolean) =>
  CHAPTERS.find((c) => c.key === key)?.suggestions.find(pick);

export const SENTENCE = suggestion("capture", () => true);
export const IDEA = suggestion("dump", (s) => s.parsed?.items?.[0]?.kind === "idea");

/** Lo que Polaris lee en la frase: cuándo y qué. */
export const MARKS: { phrase: string; role: Role }[] = [
  { phrase: "El jueves", role: "when" },
  { phrase: "entregar sistemas", role: "what" },
  { phrase: "comprar cables para la práctica", role: "what" },
];

/** Parte el texto en tramos, marcando cada frase en el orden en que aparece. */
export function segments(text: string, marks: typeof MARKS): Segment[] {
  const out: Segment[] = [];
  let from = 0;
  for (const mark of marks) {
    const at = text.indexOf(mark.phrase, from);
    if (at < 0) continue;
    if (at > from) out.push({ text: text.slice(from, at), role: null });
    out.push({ text: mark.phrase, role: mark.role });
    from = at + mark.phrase.length;
  }
  if (from < text.length) out.push({ text: text.slice(from), role: null });
  return out;
}

/** Un pendiente estructurado, dicho como lo ve el visitante: tipo, cuándo y área. */
export function row(item: ParsedItem): Row {
  const copy = UI.landing.capture;
  return {
    title: item.title,
    dated: item.due_date !== null,
    meta: [
      copy.kinds[item.kind],
      item.due_date ? shortDate(dayFromIso(item.due_date)) : copy.undated,
      item.due_date ? capitalize(item.area ?? "") : copy.inbox,
    ].filter(Boolean),
  };
}
