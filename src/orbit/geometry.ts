/**
 * Geometría de Orbit: anillos alrededor de un centro (tú) y sectores por área. Determinista:
 * los pendientes de un mismo anillo y área se reparten parejo en su tramo, así nunca se
 * enciman y solo se mueven cuando alguno cambia de anillo o de área.
 */
import type { Ring } from "../demo/selectors";
import type { Area } from "../demo/types";

export const SIZE = 480;
export const CENTER = SIZE / 2;
/** Radio de cada anillo, de "hoy" (adentro) a "más adelante" (afuera). */
export const RING_RADII = [56, 96, 132, 164] as const;
/** Corte de los anillos en los ejes, como en el isotipo (grados a cada lado). */
const GAP_DEG = 6;

/**
 * En sentido horario desde el eje de arriba. Estudio, el área con más pendientes, queda a la
 * derecha, lejos de los nombres de los anillos. A los lados van los nombres cortos, para que
 * quepan dentro del lienzo.
 */
export const SECTORS: (Area | "otras")[] = [
  "personal",
  "estudio",
  "trabajo",
  "emprendimiento",
  "otras",
  "proyectos",
];
const SPAN = 360 / SECTORS.length;
/** Aire a cada lado del sector, para que dos áreas no se toquen. */
const MARGIN = 7;
/**
 * El nombre de cada anillo va arriba, en el corte del eje. Medio ancho de cada nombre (Hoy,
 * Próximos días, Esta semana, Más adelante) en unidades del lienzo, con aire: los sectores que
 * tocan el eje de arriba no ponen nodos ahí.
 */
const RING_LABEL_HALF = [18, 46, 42, 44] as const;
/** Vecinos de un mismo tramo se alternan un poco adentro y afuera del anillo. */
const STAGGER = 4;

const rad = (deg: number) => (deg * Math.PI) / 180;

export function sectorIndex(area: Area | null): number {
  return Math.max(0, SECTORS.indexOf(area ?? "otras"));
}

/** Ángulo central del sector (0° a la derecha, sentido horario; el primero empieza arriba). */
export function sectorMid(index: number): number {
  return -90 + index * SPAN + SPAN / 2;
}

export type Placement = { x: number; y: number; angle: number; radius: number };
export type OrbitPoint = { id: string; area: Area | null; ring: Ring };

/** Grados alrededor del eje de arriba que ocupa el nombre del anillo. */
export function labelClearance(ring: Ring): number {
  return (Math.atan(RING_LABEL_HALF[ring] / RING_RADII[ring]) * 180) / Math.PI;
}

/** El tramo de un anillo que le toca a un área, sin invadir al vecino ni al nombre del anillo. */
export function sectorArc(index: number, ring: Ring): { from: number; to: number } {
  const clear = Math.max(MARGIN, labelClearance(ring));
  // El primer sector empieza en el eje de arriba y el último termina ahí.
  const from = -90 + index * SPAN + (index === 0 ? clear : MARGIN);
  const to = -90 + (index + 1) * SPAN - (index === SECTORS.length - 1 ? clear : MARGIN);
  return { from, to };
}

/**
 * Dónde va cada nodo: su anillo da la distancia y su área el tramo. Dentro del tramo, los
 * vecinos se reparten parejo por id, con un vaivén leve para que no parezca una regla.
 */
export function orbitLayout(points: OrbitPoint[]): Map<string, Placement> {
  const groups = new Map<string, OrbitPoint[]>();
  for (const p of points) {
    const key = `${sectorIndex(p.area)}:${p.ring}`;
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  const layout = new Map<string, Placement>();
  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
    sorted.forEach((p, k) => {
      const { from, to } = sectorArc(sectorIndex(p.area), p.ring);
      const angle = from + ((k + 0.5) / sorted.length) * (to - from);
      const radius = RING_RADII[p.ring] + (sorted.length > 1 ? (k % 2 ? STAGGER : -STAGGER) : 0);
      layout.set(p.id, {
        x: CENTER + radius * Math.cos(rad(angle)),
        y: CENTER + radius * Math.sin(rad(angle)),
        angle,
        radius,
      });
    });
  }
  return layout;
}

/** Un anillo como 4 arcos con cortes en los ejes: el mismo gesto del isotipo. */
export function ringPath(radius: number): string {
  const point = (deg: number) =>
    `${(CENTER + radius * Math.cos(rad(deg))).toFixed(2)} ${(CENTER + radius * Math.sin(rad(deg))).toFixed(2)}`;
  return [0, 90, 180, 270]
    .map((start) => {
      const a = start + GAP_DEG;
      const b = start + 90 - GAP_DEG;
      return `M${point(a)}A${radius} ${radius} 0 0 1 ${point(b)}`;
    })
    .join("");
}

/** Dónde va el nombre de un sector: afuera del último anillo, en su ángulo central. */
export function sectorLabel(index: number): {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
} {
  const angle = sectorMid(index);
  const radius = RING_RADII[3] + 18;
  const x = CENTER + radius * Math.cos(rad(angle));
  const y = CENTER + radius * Math.sin(rad(angle));
  const c = Math.cos(rad(angle));
  return { x, y, anchor: c > 0.3 ? "start" : c < -0.3 ? "end" : "middle" };
}
