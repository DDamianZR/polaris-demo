import { describe, expect, it } from "vitest";
import css from "../styles/index.css?raw";
import { contrast, themeColors } from "./contrast";

const colors = themeColors(css);

function color(name: string): string {
  const value = colors[name];
  if (!value) throw new Error(`Falta --color-${name} en @theme`);
  return value;
}

const BACKGROUNDS = ["midnight", "base", "raised", "surface", "elevated"];
const AA_TEXT = 4.5;
const AA_LARGE_OR_UI = 3;

describe("contraste de los tokens", () => {
  it("compara contra un valor conocido", () => {
    expect(contrast("#ffffff", "#000000")).toBeCloseTo(21, 5);
  });

  for (const text of ["fg", "fg-soft", "fg-muted"]) {
    for (const bg of BACKGROUNDS) {
      it(`${text} sobre ${bg} llega a AA para texto`, () => {
        expect(contrast(color(text), color(bg))).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }
  }

  it("blue como texto o enlace sobre midnight llega a AA", () => {
    expect(contrast(color("blue"), color("midnight"))).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("el texto de un botón azul (midnight sobre blue) llega a AA", () => {
    expect(contrast(color("midnight"), color("blue"))).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("violet sobre midnight solo alcanza para texto grande y gráficos", () => {
    const ratio = contrast(color("violet"), color("midnight"));
    expect(ratio).toBeGreaterThanOrEqual(AA_LARGE_OR_UI);
    expect(ratio).toBeLessThan(AA_TEXT);
  });

  it("faint sirve como borde de control (3:1) pero no como texto", () => {
    const ratio = contrast(color("faint"), color("midnight"));
    expect(ratio).toBeGreaterThanOrEqual(AA_LARGE_OR_UI);
    expect(ratio).toBeLessThan(AA_TEXT);
  });
});
