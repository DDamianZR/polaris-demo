import { describe, expect, it } from "vitest";
import { dueLabel } from "./es";

const LUN = 0;
const MAR = 1;

describe("plazos dichos como frase", () => {
  it("cerca de hoy, en palabras", () => {
    expect(dueLabel(MAR, MAR)).toBe("Para hoy");
    expect(dueLabel(MAR + 1, MAR)).toBe("Para mañana");
    expect(dueLabel(LUN, MAR)).toBe("Era para ayer");
  });

  it("esta semana por nombre; más lejos, con fecha", () => {
    expect(dueLabel(MAR + 3, MAR)).toBe("Para el viernes");
    expect(dueLabel(23, MAR)).toBe("Para el mié 4 nov");
  });
});
