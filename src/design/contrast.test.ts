import { describe, expect, it } from "vitest";
import css from "../styles/index.css?raw";
import { contrast, themeColors } from "./contrast";

const colors = themeColors(css);

function color(name: string): string {
  const value = colors[name];
  if (!value) throw new Error(`Falta --color-${name} en @theme`);
  return value;
}

const FONDOS = ["vacio", "tinta"];
const AA_TEXTO = 4.5;
const AA_GRANDE_O_CONTROL = 3;

describe("contraste de los tokens (Sinapsis)", () => {
  it("compara contra un valor conocido", () => {
    expect(contrast("#ffffff", "#000000")).toBeCloseTo(21, 5);
  });

  for (const texto of ["crema", "ceniza", "niebla", "chispa", "sinapsis-texto"]) {
    for (const fondo of FONDOS) {
      it(`${texto} sobre ${fondo} llega a AA para texto`, () => {
        expect(contrast(color(texto), color(fondo))).toBeGreaterThanOrEqual(AA_TEXTO);
      });
    }
  }

  it("el texto de la píldora principal (sobre-iris en iris) llega a AA", () => {
    expect(contrast(color("sobre-iris"), color("iris"))).toBeGreaterThanOrEqual(AA_TEXTO);
  });

  it("el borde de los controles fantasma (trazo) llega a 3:1", () => {
    expect(contrast(color("trazo"), color("vacio"))).toBeGreaterThanOrEqual(AA_GRANDE_O_CONTROL);
  });

  it("la píldora iris se distingue del vacío (3:1)", () => {
    expect(contrast(color("iris"), color("vacio"))).toBeGreaterThanOrEqual(AA_GRANDE_O_CONTROL);
  });

  it("linea es estructura, no texto: queda por debajo de 3:1 a propósito", () => {
    expect(contrast(color("linea"), color("vacio"))).toBeLessThan(AA_GRANDE_O_CONTROL);
  });
});
