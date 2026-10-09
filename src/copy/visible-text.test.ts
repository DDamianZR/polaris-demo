import { describe, expect, it } from "vitest";

/** Todo archivo que puede pintar texto: los textos de es.ts y cualquier literal en componentes. */
const sources = import.meta.glob<string>(["./es.ts", "../**/*.tsx"], {
  query: "?raw",
  import: "default",
  eager: true,
});

/** Los comentarios no se ven: ahí sí puede haber rangos como "F2–F7". */
const withoutComments = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

describe("texto visible", () => {
  it("no lleva guiones largos (— ni –) en ningún lado", () => {
    const paths = Object.keys(sources);
    // Que la prueba no pase por no encontrar nada.
    expect(paths).toContain("./es.ts");
    expect(paths.filter((path) => path.endsWith(".tsx")).length).toBeGreaterThan(20);

    const offenders = Object.entries(sources).flatMap(([path, code]) =>
      withoutComments(code)
        .split("\n")
        .filter((line) => /[—–]/.test(line))
        .map((line) => `${path}: ${line.trim()}`),
    );
    expect(offenders).toEqual([]);
  });
});
