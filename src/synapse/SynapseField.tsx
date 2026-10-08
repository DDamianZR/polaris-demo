import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import type { Neuron } from "../demo/selectors";
import {
  ambientParticles,
  brainParticles,
  HUBS,
  neuronPosition,
  PALETTE,
  type Particle,
  type Point,
} from "./brain";

const FRAME_MS = 33;
const SPARK_MS = 1600;
const PULSE_MS = 700;
const WAVE_MS = 1400;
/** Saltos de reloj mayores a esto disparan la onda (el reloj corriendo no). */
const JUMP_MIN = 2;
const ALPHA_STEPS = [0.25, 0.5, 0.75, 1];

const CHISPA = "#ffb829";
const CREMA = "#f2ebdf";
const SINAPSIS = "#15846e";
const SINAPSIS_TEXTO = "#3fbf9f";
const ZONA = "#a9a196";
const VACIO = "#050407";

type Props = {
  neurons: Neuron[];
  /** Ids que trajo la última acción: su neurona se enciende. */
  fresh: string[];
  /** Minuto del reloj de la demo: un salto manda una onda por el cerebro. */
  minute: number;
  /** `compact`: menos partículas y sin nombres de zona (cel). */
  variant?: "full" | "compact";
  className?: string;
};

type Placed = Neuron & Point & { hub: Point };

function place(neurons: Neuron[]): Placed[] {
  return neurons.map((n) => {
    const hub = HUBS[n.area ?? "otras"];
    return { ...n, hub, ...neuronPosition(n.id, hub, n.state === "suelta") };
  });
}

/** Punto de control de la sinapsis: curva suave, hacia un lado fijo según la neurona. */
function control(a: Point, b: Point): Point {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  return { x: mx - (b.y - a.y) * 0.35, y: my + (b.x - a.x) * 0.35 };
}

function onCurve(a: Point, c: Point, b: Point, u: number): Point {
  const v = 1 - u;
  return {
    x: v * v * a.x + 2 * v * u * c.x + u * u * b.x,
    y: v * v * a.y + 2 * v * u * c.y + u * u * b.y,
  };
}

/**
 * El mapa de ideas: un cerebro de partículas donde cada pendiente es una neurona. Las sueltas
 * brillan en ámbar; las conectadas se unen a su zona con una sinapsis punteada.
 */
export function SynapseField({ neurons, fresh, minute, variant = "full", className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion() ?? false;
  const compact = variant === "compact";
  const particles = useMemo(() => brainParticles(compact ? 700 : 1600), [compact]);
  const dust = useMemo(() => ambientParticles(compact ? 30 : 90), [compact]);

  const placed = useRef<Placed[]>([]);
  placed.current = useMemo(() => place(neurons), [neurons]);
  const sparks = useRef<{ id: string; start: number }[]>([]);
  const freshNow = useRef<string[]>([]);
  freshNow.current = fresh;
  const wave = useRef<number | null>(null);
  const lastMinute = useRef(minute);
  const draw = useRef<(t: number) => void>(() => {});

  const freshKey = fresh.join();
  // biome-ignore lint/correctness/useExhaustiveDependencies: se enciende solo cuando llega algo nuevo.
  useEffect(() => {
    const now = performance.now();
    for (const id of fresh) sparks.current.push({ id, start: now });
    if (reduce) draw.current(now);
  }, [freshKey]);

  useEffect(() => {
    if (Math.abs(minute - lastMinute.current) > JUMP_MIN) wave.current = performance.now();
    lastMinute.current = minute;
  }, [minute]);

  // Con reduced motion no hay ciclo: se redibuja cuando cambian las neuronas.
  // biome-ignore lint/correctness/useExhaustiveDependencies: el dibujo lee las neuronas por ref.
  useEffect(() => {
    if (reduce) draw.current(performance.now());
  }, [neurons, reduce]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const view = { w: 0, h: 0, bw: 0, bh: 0, ox: 0, oy: 0 };
    const toScreen = (p: Point) => ({ x: view.ox + p.x * view.bw, y: view.oy + p.y * view.bh });

    function particlesPass(list: Particle[], t: number, waveX: number | null) {
      if (!ctx) return;
      const buckets = PALETTE.map(() => ALPHA_STEPS.map(() => [] as number[]));
      for (const p of list) {
        const dx = reduce ? 0 : Math.cos(t * 0.00035 + p.phase) * p.drift;
        const dy = reduce ? 0 : Math.sin(t * 0.00028 + p.phase) * p.drift;
        let alpha = reduce ? p.alpha : p.alpha * (0.72 + 0.28 * Math.sin(t * 0.0011 + p.phase));
        let size = p.size;
        if (waveX !== null) {
          const boost = Math.exp(-(((p.x - waveX) / 0.07) ** 2));
          alpha = Math.min(1, alpha * (1 + 1.6 * boost));
          size *= 1 + 0.35 * boost;
        }
        const step = Math.min(ALPHA_STEPS.length - 1, Math.floor(alpha * ALPHA_STEPS.length));
        const s = toScreen({ x: p.x + dx, y: p.y + dy });
        buckets[p.color]?.[step]?.push(s.x, s.y, size, p.rotation);
      }
      ctx.lineWidth = 1;
      buckets.forEach((byAlpha, c) => {
        ctx.strokeStyle = PALETTE[c] ?? CREMA;
        byAlpha.forEach((flat, step) => {
          if (!flat.length) return;
          ctx.globalAlpha = ALPHA_STEPS[step] ?? 1;
          ctx.beginPath();
          for (let i = 0; i < flat.length; i += 4) {
            const [x, y, size, rot] = [
              flat[i] ?? 0,
              flat[i + 1] ?? 0,
              flat[i + 2] ?? 0,
              flat[i + 3] ?? 0,
            ];
            const r = size * 0.62;
            ctx.moveTo(x + Math.cos(rot) * r, y + Math.sin(rot) * r);
            ctx.lineTo(x + Math.cos(rot + 2.094) * r, y + Math.sin(rot + 2.094) * r);
            ctx.lineTo(x + Math.cos(rot + 4.189) * r, y + Math.sin(rot + 4.189) * r);
            ctx.closePath();
          }
          ctx.stroke();
        });
      });
      ctx.globalAlpha = 1;
    }

    function render(t: number) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, view.w, view.h);
      const age = wave.current === null ? Number.POSITIVE_INFINITY : t - wave.current;
      const waveX = !reduce && age < WAVE_MS ? -0.12 + (age / WAVE_MS) * 1.3 : null;
      particlesPass(dust, t, null);
      particlesPass(particles, t, waveX);

      const all = placed.current;
      const usedHubs = new Set<Point>();
      // Sinapsis: de cada neurona conectada a su zona.
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.3;
      for (const n of all) {
        if (n.state === "suelta") continue;
        usedHubs.add(n.hub);
        const a = toScreen(n);
        const b = toScreen(n.hub);
        const c = toScreen(control(n, n.hub));
        ctx.strokeStyle = n.state === "hecha" ? SINAPSIS : SINAPSIS_TEXTO;
        ctx.globalAlpha = n.state === "hecha" ? 0.4 : 0.95;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Zonas con algo conectado, con su nombre.
      for (const [name, hub] of Object.entries(HUBS)) {
        if (!usedHubs.has(hub)) continue;
        const h = toScreen(hub);
        ctx.fillStyle = SINAPSIS_TEXTO;
        ctx.beginPath();
        ctx.arc(h.x, h.y, 3, 0, Math.PI * 2);
        ctx.fill();
        if (!compact) {
          ctx.font = "500 10px 'Inter Variable', Inter, sans-serif";
          ctx.textAlign = "center";
          // Halo del color del fondo: el nombre se lee aunque caiga sobre partículas.
          ctx.lineWidth = 4;
          ctx.strokeStyle = VACIO;
          ctx.strokeText(name.toUpperCase(), h.x, h.y + 16);
          ctx.fillStyle = ZONA;
          ctx.fillText(name.toUpperCase(), h.x, h.y + 16);
        }
      }

      // Neuronas.
      for (const n of all) {
        const p = toScreen(n);
        ctx.beginPath();
        if (n.state === "suelta") {
          ctx.strokeStyle = CHISPA;
          ctx.lineWidth = 1.4;
          ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = n.state === "hecha" ? SINAPSIS : CREMA;
          ctx.globalAlpha = n.state === "hecha" ? 0.6 : 1;
          ctx.arc(p.x, p.y, n.state === "hecha" ? 2.2 : 2.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // Chispas: lo nuevo se enciende y, si ya tiene lugar, la señal viaja hasta su zona.
      if (reduce) {
        for (const id of freshNow.current) {
          const n = all.find((x) => x.id === id);
          if (!n) continue;
          const p = toScreen(n);
          ctx.strokeStyle = CHISPA;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        sparks.current = sparks.current.filter((sp) => t - sp.start < SPARK_MS);
        for (const sp of sparks.current) {
          const n = all.find((x) => x.id === sp.id);
          if (!n) continue;
          const k = (t - sp.start) / SPARK_MS;
          const p = toScreen(n);
          ctx.strokeStyle = CHISPA;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = (1 - k) * 0.9;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4 + k * 24, 0, Math.PI * 2);
          ctx.stroke();
          if (n.state !== "suelta") {
            const u = Math.min(1, (t - sp.start) / PULSE_MS);
            const q = toScreen(onCurve(n, control(n, n.hub), n.hub, u));
            ctx.fillStyle = CHISPA;
            ctx.globalAlpha = 1 - k * 0.6;
            ctx.beginPath();
            ctx.arc(q.x, q.y, 2.6, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
      }
    }
    draw.current = render;

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      view.w = rect.width;
      view.h = rect.height;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // El cerebro ocupa ~1.1:1; se centra con aire alrededor.
      view.bw = Math.min(rect.width * 0.94, rect.height * 0.94 * 1.1);
      view.bh = view.bw / 1.1;
      view.ox = (rect.width - view.bw) / 2;
      view.oy = (rect.height - view.bh) / 2;
      render(performance.now());
    }

    let raf = 0;
    let last = 0;
    let visible = true;
    const tick = (t: number) => {
      if (!visible || document.hidden) return;
      if (t - last >= FRAME_MS) {
        last = t;
        render(t);
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (!reduce) raf = requestAnimationFrame(tick);
    };

    const resizer = new ResizeObserver(resize);
    resizer.observe(canvas);
    // Fuera de pantalla o en otra pestaña, el cerebro no gasta nada.
    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
    });
    watcher.observe(canvas);
    const onVisibility = () => {
      if (!document.hidden) start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    start();
    return () => {
      cancelAnimationFrame(raf);
      resizer.disconnect();
      watcher.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduce, particles, dust, compact]);

  return <canvas ref={canvasRef} className={`block size-full ${className}`} />;
}
