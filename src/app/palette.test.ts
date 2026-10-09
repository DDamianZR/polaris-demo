import { describe, expect, it } from "vitest";
import { fixtureState } from "../demo/fixture";
import { MAR } from "../demo/time";
import { type Command, filterCommands, normalize, viewFor } from "./palette";

const noop = () => {};
const commands: Command[] = [
  { id: "c1", group: "chapters", label: "Lo que importa", hint: "07:00", run: noop },
  { id: "i1", group: "items", label: "Resolver ejercicios del tema 4", hint: "Cálculo", run: noop },
  { id: "v1", group: "views", label: "Orbit", keywords: "mapa semana", run: noop },
  { id: "a1", group: "actions", label: "Capturar algo", run: noop },
];

describe("paleta de comandos", () => {
  it("sin búsqueda: acciones, vistas y capítulos, en ese orden; los pendientes no", () => {
    expect(filterCommands(commands, "  ").map((c) => c.id)).toEqual(["a1", "v1", "c1"]);
  });

  it("busca sin acentos ni mayúsculas, con todas las palabras en cualquier orden", () => {
    expect(normalize("CÁLCULO Multivariable")).toBe("calculo multivariable");
    expect(filterCommands(commands, "calculo").map((c) => c.id)).toEqual(["i1"]);
    expect(filterCommands(commands, "tema ejercicios").map((c) => c.id)).toEqual(["i1"]);
    expect(filterCommands(commands, "semana").map((c) => c.id)).toEqual(["v1"]);
    expect(filterCommands(commands, "nada parecido")).toEqual([]);
  });

  it("cada pendiente abre la vista donde vive", () => {
    const items = fixtureState().items;
    const loose = items.find((i) => i.status === "inbox");
    const late = items.find((i) => i.status === "active" && i.dueDay !== null && i.dueDay < MAR);
    const later = items.find((i) => i.status === "active" && i.dueDay !== null && i.dueDay > MAR);
    expect(loose && viewFor(loose, MAR)).toBe("inbox");
    expect(late && viewFor(late, MAR)).toBe("today");
    expect(later && viewFor(later, MAR)).toBe("orbit");
  });
});
