/**
 * Geometría del isotipo, medida sobre assets/brand/polaris-isotipo.webp (1254 px).
 * Centro en (0, 0). Unidades = pixeles del original. Las curvas se ajustaron por mínimos
 * cuadrados contra el contorno real (error RMS < 0.5 px).
 */

type Point = readonly [number, number];
/** Un cuarto de lado: de la punta superior a la cintura sobre la diagonal, como cúbica. */
type Quarter = { tip: Point; c1: Point; c2: Point; waist: Point };

export const VIEWBOX = "-300 -300 600 600";

/** Estrella exterior: puntas a 295, cintura casi en esquina en (45.9, -45.9). */
const OUTER: Quarter = {
  tip: [0, -295],
  c1: [11.4, -209.3],
  c2: [28, -63.8],
  waist: [45.9, -45.9],
};

/** Hueco interior: otra estrella de 4 puntas, con cintura redondeada. */
const INNER: Quarter = {
  tip: [0, -120.3],
  c1: [7.3, -91.6],
  c2: [9.7, -38.3],
  waist: [24, -24],
};

/** Anillo: bordes a 218 y 237 (medidos a media intensidad), cortes rectos a 38 de cada eje. */
export const RING = { inner: 218, outer: 237, gap: 38 } as const;

const fmt = (n: number) => String(Math.round(n * 10) / 10);
const pt = ([x, y]: Point) => `${fmt(x)} ${fmt(y)}`;

/** Refleja sobre la diagonal y = -x: convierte el lado del brazo superior en el del derecho. */
const mirror = ([x, y]: Point): Point => [-y, -x];
/** Gira 90° en sentido horario alrededor del centro. */
const rotate = ([x, y]: Point, quarterTurns: number): Point => {
  let p: Point = [x, y];
  for (let i = 0; i < quarterTurns; i++) p = [-p[1], p[0]];
  return p;
};

function starPath(q: Quarter): string {
  let d = `M${pt(q.tip)}`;
  for (let turn = 0; turn < 4; turn++) {
    const r = (p: Point) => rotate(p, turn);
    d += `C${pt(r(q.c1))} ${pt(r(q.c2))} ${pt(r(q.waist))}`;
    d += `C${pt(r(mirror(q.c2)))} ${pt(r(mirror(q.c1)))} ${pt(r(mirror(q.tip)))}`;
  }
  return `${d}Z`;
}

/** Estrella con su hueco. Se pinta con `fill-rule="evenodd"`. */
export const STAR_PATH = `${starPath(OUTER)}${starPath(INNER)}`;

/** Los 4 arcos del anillo, con los cortes paralelos a los ejes como en el original. */
function ringPath(): string {
  const { inner, outer, gap } = RING;
  const far = (r: number) => Math.sqrt(r * r - gap * gap);
  let d = "";
  for (let turn = 0; turn < 4; turn++) {
    const r = (p: Point) => rotate(p, turn);
    const a = r([gap, -far(outer)]);
    const b = r([far(outer), -gap]);
    const c = r([far(inner), -gap]);
    const e = r([gap, -far(inner)]);
    d += `M${pt(a)}A${outer} ${outer} 0 0 1 ${pt(b)}L${pt(c)}A${inner} ${inner} 0 0 0 ${pt(e)}Z`;
  }
  return d;
}

export const RING_PATH = ringPath();

/** Gradiente de marca de docs/ux.md, de izquierda a derecha sobre el anillo. */
export const GRADIENT = { from: "#22a8f0", to: "#7c3aed" } as const;
export const STAR_FILL = "#f5f7fa";

/** SVG autónomo (favicon). Con fondo para que la estrella blanca se vea en pestañas claras. */
export function isotipoSvg(): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}">`,
    `<title>Polaris</title>`,
    `<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="-${RING.outer}" y1="0" x2="${RING.outer}" y2="0">`,
    `<stop offset="0" stop-color="${GRADIENT.from}"/><stop offset="1" stop-color="${GRADIENT.to}"/>`,
    `</linearGradient></defs>`,
    `<rect x="-300" y="-300" width="600" height="600" rx="120" fill="#070a14"/>`,
    `<path fill="url(#g)" d="${RING_PATH}"/>`,
    `<path fill="${STAR_FILL}" fill-rule="evenodd" d="${STAR_PATH}"/>`,
    `</svg>`,
    "",
  ].join("\n");
}
