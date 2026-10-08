/**
 * Geometría del cerebro de partículas. Todo en coordenadas normalizadas [0, 1] (x a la derecha,
 * y hacia abajo), vista lateral con el lóbulo frontal a la izquierda. Determinista: la misma
 * semilla da siempre la misma constelación, así no "salta" entre renders.
 */
import type { Area } from "../demo/types";

/** Colores de las partículas, en el orden en que los usa `color` de cada partícula. */
export const PALETTE = ["#8052ff", "#4c8dff", "#15846e", "#ffb829", "#e04fd3", "#f2ebdf"] as const;
/** Peso de cada color: violeta y verde dominan; ámbar y magenta salpican. */
const PALETTE_WEIGHTS = [30, 16, 20, 14, 8, 12];

export type Particle = {
  x: number;
  y: number;
  /** Lado del triángulo, en px de pantalla. */
  size: number;
  rotation: number;
  color: number;
  alpha: number;
  phase: number;
  /** Radio de la deriva, en unidades normalizadas. */
  drift: number;
};

export type Point = { x: number; y: number };

/** Aleatorio con semilla (mulberry32). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hemisferio, lóbulos, cerebelo y tallo como unión de elipses. */
const LOBES: [number, number, number, number][] = [
  [0.5, 0.4, 0.38, 0.3], // cúpula
  [0.24, 0.47, 0.2, 0.24], // frontal
  [0.76, 0.44, 0.19, 0.25], // occipital
  [0.48, 0.6, 0.3, 0.16], // temporal
  [0.73, 0.72, 0.14, 0.1], // cerebelo
  [0.6, 0.84, 0.045, 0.11], // tallo
];

export function insideBrain(x: number, y: number): boolean {
  return LOBES.some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1);
}

/** Surcos: curvas donde las partículas se juntan para dibujar los pliegues. */
function onSulcus(rand: () => number): Point {
  const kind = Math.floor(rand() * 12);
  const t = rand();
  // Cisura lateral: diagonal suave que separa el lóbulo temporal.
  if (kind === 0) return { x: 0.3 + 0.36 * t, y: 0.56 - 0.09 * t + 0.02 * Math.sin(t * 6) };
  // Surco central: curvo y con poco peso, para que no parta el cerebro en cruz.
  if (kind === 1 && rand() < 0.5) {
    return { x: 0.5 - 0.08 * t + 0.025 * Math.sin(t * 7), y: 0.12 + 0.36 * t };
  }
  // Giros: líneas que serpentean con dos frecuencias, como pliegues y no como franjas.
  const row = kind % 7;
  const x = 0.08 + 0.84 * t;
  const y =
    0.17 + row * 0.07 + 0.03 * Math.sin(x * 13 + row * 2.1) + 0.014 * Math.sin(x * 37 + row);
  return { x, y };
}

function pickColor(rand: () => number): number {
  const total = PALETTE_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (const [i, w] of PALETTE_WEIGHTS.entries()) {
    r -= w;
    if (r <= 0) return i;
  }
  return 0;
}

function particle(rand: () => number, x: number, y: number, alpha: number): Particle {
  return {
    x,
    y,
    size: 2.2 + rand() * 2.6,
    rotation: rand() * Math.PI * 2,
    color: pickColor(rand),
    alpha,
    phase: rand() * Math.PI * 2,
    drift: 0.002 + rand() * 0.004,
  };
}

/** Adentro, pero fuera del cerebro encogido: la banda del borde que dibuja la silueta. */
function nearEdge(x: number, y: number): boolean {
  const shrink = 0.93;
  return insideBrain(x, y) && !insideBrain(0.5 + (x - 0.5) / shrink, 0.5 + (y - 0.5) / shrink);
}

/** Folias del cerebelo: franjas horizontales finas. */
function onFolia(rand: () => number): Point {
  const [cx, cy, rx, ry] = LOBES[4] ?? [0.73, 0.72, 0.14, 0.1];
  const row = Math.floor(rand() * 7);
  return { x: cx - rx + rand() * rx * 2, y: cy - ry + ((row + 0.5) / 7) * ry * 2 };
}

/**
 * Partículas del cerebro. La silueta sale de una banda densa en el borde; los pliegues, de
 * los surcos; el cerebelo, de sus folias. El resto se reparte para dar cuerpo.
 */
export function brainParticles(count: number, seed = 7): Particle[] {
  const rand = seeded(seed);
  const out: Particle[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 60) {
    const kind = rand();
    let p: Point;
    if (kind < 0.3) {
      p = { x: rand(), y: rand() };
    } else if (kind < 0.55) {
      p = { x: rand(), y: rand() };
      if (!nearEdge(p.x, p.y)) continue;
    } else if (kind < 0.92) {
      const s = onSulcus(rand);
      p = { x: s.x + (rand() - 0.5) * 0.016, y: s.y + (rand() - 0.5) * 0.016 };
    } else {
      const s = onFolia(rand);
      p = { x: s.x + (rand() - 0.5) * 0.01, y: s.y + (rand() - 0.5) * 0.006 };
    }
    if (insideBrain(p.x, p.y)) out.push(particle(rand, p.x, p.y, 0.55 + rand() * 0.45));
  }
  return out;
}

/** Polvo alrededor del cerebro: tenue, para que flote en el vacío. */
export function ambientParticles(count: number, seed = 11): Particle[] {
  const rand = seeded(seed);
  const out: Particle[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    const x = -0.04 + rand() * 1.08;
    const y = 0.02 + rand() * 1.0;
    if (!insideBrain(x, y)) out.push(particle(rand, x, y, 0.05 + rand() * 0.12));
  }
  return out;
}

/** Cada área tiene su zona del cerebro; lo sin área cae al centro. */
export const HUBS: Record<Area | "otras", Point> = {
  estudio: { x: 0.26, y: 0.42 },
  trabajo: { x: 0.46, y: 0.22 },
  emprendimiento: { x: 0.66, y: 0.26 },
  proyectos: { x: 0.8, y: 0.46 },
  personal: { x: 0.46, y: 0.63 },
  otras: { x: 0.56, y: 0.44 },
};

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/**
 * Dónde vive la neurona de un pendiente. Conectada: cerca de su zona. Suelta: en cualquier
 * parte del cerebro, lejos del orden. Siempre adentro y siempre en el mismo lugar.
 */
export function neuronPosition(id: string, hub: Point, loose: boolean): Point {
  const rand = seeded(hash(id));
  for (let i = 0; i < 60; i++) {
    const p = loose
      ? { x: 0.08 + rand() * 0.84, y: 0.12 + rand() * 0.62 }
      : (() => {
          const angle = rand() * Math.PI * 2;
          const radius = 0.04 + rand() * 0.08;
          return { x: hub.x + Math.cos(angle) * radius, y: hub.y + Math.sin(angle) * radius * 0.8 };
        })();
    if (insideBrain(p.x, p.y)) return p;
  }
  return hub;
}
