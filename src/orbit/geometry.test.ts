import { describe, expect, it } from "vitest";
import type { Ring } from "../demo/selectors";
import type { Area } from "../demo/types";
import {
  CENTER,
  labelClearance,
  type OrbitPoint,
  orbitLayout,
  RING_RADII,
  ringPath,
  SECTORS,
  SIZE,
  sectorIndex,
} from "./geometry";

const area = (name: (typeof SECTORS)[number]): Area | null => (name === "otras" ? null : name);

/** Un montón de pendientes en todos los anillos y áreas. */
const crowd: OrbitPoint[] = SECTORS.flatMap((name) =>
  ([0, 1, 2, 3] as Ring[]).flatMap((ring) =>
    Array.from({ length: 5 }, (_, n) => ({ id: `${name}-${ring}-${n}`, area: area(name), ring })),
  ),
);

describe("geometría de Orbit", () => {
  it("un nodo cae siempre en el mismo lugar", () => {
    const points: OrbitPoint[] = [
      { id: "i10", area: "estudio", ring: 3 },
      { id: "i2", area: "estudio", ring: 3 },
    ];
    expect(orbitLayout(points)).toEqual(orbitLayout([...points].reverse()));
  });

  it("lo urgente queda más cerca del centro que lo que puede esperar", () => {
    const distance = (ring: Ring) => {
      const p = orbitLayout([{ id: "i5", area: "estudio", ring }]).get("i5");
      return Math.hypot((p?.x ?? 0) - CENTER, (p?.y ?? 0) - CENTER);
    };
    expect(distance(0)).toBeLessThan(distance(1));
    expect(distance(1)).toBeLessThan(distance(2));
    expect(distance(2)).toBeLessThan(distance(3));
  });

  it("cada nodo queda dentro de su sector y dentro del lienzo", () => {
    const layout = orbitLayout(crowd);
    for (const p of crowd) {
      const at = layout.get(p.id);
      const start = -90 + sectorIndex(p.area) * 60;
      expect(at?.angle).toBeGreaterThanOrEqual(start);
      expect(at?.angle).toBeLessThanOrEqual(start + 60);
      for (const v of [at?.x, at?.y]) {
        expect(v).toBeGreaterThan(0);
        expect(v).toBeLessThan(SIZE);
      }
    }
  });

  it("dos nodos nunca se enciman, aunque el tramo esté lleno", () => {
    const placed = [...orbitLayout(crowd).values()];
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        if (a && b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(9);
      }
    }
  });

  it("ningún nodo cae sobre el nombre de su anillo, arriba en el eje", () => {
    for (const [id, at] of orbitLayout(crowd)) {
      const ring = Number(id.split("-")[1]) as Ring;
      const turn = (((at.angle + 90) % 360) + 360) % 360;
      const fromTop = Math.min(turn, 360 - turn);
      expect(fromTop).toBeGreaterThanOrEqual(labelClearance(ring));
    }
  });

  it("los anillos son 4 arcos con cortes en los ejes, como el isotipo", () => {
    for (const r of RING_RADII) expect(ringPath(r).match(/M/g)).toHaveLength(4);
  });
});
