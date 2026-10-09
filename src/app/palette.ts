/**
 * La lógica de la paleta (Ctrl+K), sin React: qué comandos hay, cómo se buscan y a qué vista
 * lleva cada pendiente.
 */
import type { Item } from "../demo/types";
import type { View } from "../polaris/nav";

export type Group = "actions" | "views" | "chapters" | "items";
export const GROUPS: Group[] = ["actions", "views", "chapters", "items"];

export type Command = {
  id: string;
  group: Group;
  label: string;
  /** Lo que se lee en gris a la derecha: área, fecha o la hora del capítulo. */
  hint?: string;
  /** Palabras que también lo encuentran, aunque no estén en la etiqueta. */
  keywords?: string;
  run: () => void;
};

/** Sin acentos ni mayúsculas: "cálculo" y "CALCULO" son lo mismo. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Sin búsqueda se ven acciones, vistas y capítulos; los pendientes salen al escribir. Con
 * búsqueda, cada palabra tiene que aparecer, en cualquier orden. Siempre en el orden de los grupos.
 */
export function filterCommands(commands: Command[], query: string): Command[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const found = words.length
    ? commands.filter((c) => {
        const haystack = normalize(`${c.label} ${c.hint ?? ""} ${c.keywords ?? ""}`);
        return words.every((w) => haystack.includes(w));
      })
    : commands.filter((c) => c.group !== "items");
  return GROUPS.flatMap((g) => found.filter((c) => c.group === g));
}

/** Dónde vive un pendiente: lo suelto en Inbox, lo de hoy (o atrasado) en Today, lo demás en Orbit. */
export function viewFor(item: Item, today: number): View {
  if (item.status === "inbox") return "inbox";
  if (item.dueDay !== null && item.dueDay <= today) return "today";
  return "orbit";
}
