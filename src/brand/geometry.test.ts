import { describe, expect, it } from "vitest";
import favicon from "../../public/favicon.svg?raw";
import { isotipoSvg, RING_PATH, STAR_PATH } from "./geometry";

/** Pares de coordenadas de un path (todas las cifras, de dos en dos). */
function points(d: string): [number, number][] {
  const nums = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) out.push([nums[i] ?? 0, nums[i + 1] ?? 0]);
  return out;
}

describe("isotipo", () => {
  it("el favicon sale de la misma geometría", () => {
    // Si cambias la geometría: node -e "import('./src/brand/geometry.ts').then(m => process.stdout.write(m.isotipoSvg()))" > public/favicon.svg
    expect(favicon).toBe(isotipoSvg());
  });

  it("la estrella tiene sus 4 puntas a 295 del centro", () => {
    const pts = points(STAR_PATH);
    for (const tip of [
      [0, -295],
      [295, 0],
      [0, 295],
      [-295, 0],
    ]) {
      expect(pts).toContainEqual(tip);
    }
  });

  it("estrella y hueco son simétricos al girar 90°", () => {
    const pts = points(STAR_PATH);
    const key = ([x, y]: [number, number]) => `${x},${y}`;
    const set = new Set(pts.map(key));
    for (const [x, y] of pts) {
      const rotated: [number, number] = [y === 0 ? 0 : -y, x];
      expect(set.has(key(rotated))).toBe(true);
    }
  });

  it("el anillo tiene 4 arcos y deja libre el paso de los brazos", () => {
    expect(RING_PATH.match(/M/g)).toHaveLength(4);
    // Los cortes están a 38 de cada eje: ningún punto del anillo cae dentro de esas franjas.
    for (const [x, y] of points(RING_PATH.replace(/A\d+ \d+ 0 0 [01] /g, "L"))) {
      expect(Math.min(Math.abs(x), Math.abs(y))).toBeGreaterThanOrEqual(38);
    }
  });
});
