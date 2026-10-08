/**
 * Planes (F7). El plan llega en el formato Polaris y se parsea SIN LLM:
 *
 *   # Plan: Aprender FastAPI
 *   objetivo: Conseguir mi primera chamba de backend
 *   fecha_limite: 2026-11-06
 *   horas_por_dia_max: 1
 *   - [2h] Leer el tutorial oficial
 *   - [1h30] Pruebas con pytest
 *
 * `objetivo` es propio de la demo: dice en qué objetivo de Direction cae el plan.
 */
import { place, plannedMinutes } from "./slots";
import type { DemoState } from "./state";
import { dayFromIso, dayOf, isWeekend, type Minute } from "./time";

export type PlanStep = { title: string; minutes: number };

export type PlanSpec = {
  name: string;
  goal: string | null;
  deadlineDay: number | null;
  maxPerDayMin: number;
  steps: PlanStep[];
};

export type PlanParse = { ok: true; plan: PlanSpec } | { ok: false; line: number; error: string };

export type Allocation = { day: number; stepIdx: number; start: Minute; end: Minute };

export type Distribution = {
  allocations: Allocation[];
  finishDay: number | null;
  fits: boolean;
  missingMin: number;
  totalMin: number;
};

/** `2h`, `45m`, `1h30`, `1h30m`, `90m`, `90 min`. */
export function parseDuration(text: string): number | null {
  const t = text.trim().toLowerCase();
  const hours = /^(\d+)\s*h(?:\s*(\d+)\s*m?)?$/.exec(t);
  if (hours) return Number(hours[1]) * 60 + Number(hours[2] ?? 0);
  const mins = /^(\d+)\s*m(?:in)?$/.exec(t);
  return mins ? Number(mins[1]) : null;
}

export function isPlanText(text: string): boolean {
  return /^\s*#\s*plan:/i.test(text);
}

export function parsePlan(text: string): PlanParse {
  const lines = text.split(/\r?\n/);
  let name: string | null = null;
  let goal: string | null = null;
  let deadlineDay: number | null = null;
  let maxPerDayMin = 60;
  const steps: PlanStep[] = [];

  for (const [idx, raw] of lines.entries()) {
    const line = raw.trim();
    const n = idx + 1;
    if (!line) continue;
    const header = /^#\s*plan:\s*(.+)$/i.exec(line);
    if (header) {
      name = header[1]?.trim() ?? null;
      continue;
    }
    if (name === null)
      return { ok: false, line: n, error: "La primera línea va como «# Plan: nombre»." };
    const step = /^-\s*\[([^\]]+)\]\s*(.+)$/.exec(line);
    if (step) {
      const minutes = parseDuration(step[1] ?? "");
      if (minutes === null || minutes <= 0) {
        return { ok: false, line: n, error: `No entendí la duración «${step[1]}».` };
      }
      steps.push({ title: (step[2] ?? "").trim(), minutes });
      continue;
    }
    const field = /^([a-z_]+)\s*:\s*(.+)$/i.exec(line);
    const key = field?.[1]?.toLowerCase();
    const value = field?.[2]?.trim() ?? "";
    if (key === "fecha_limite" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      deadlineDay = dayFromIso(value);
    } else if (key === "horas_por_dia_max" && Number(value) > 0) {
      maxPerDayMin = Math.round(Number(value) * 60);
    } else if (key === "objetivo" && value) {
      goal = value;
    } else {
      return { ok: false, line: n, error: "Esta línea no tiene el formato de un paso." };
    }
  }
  if (name === null) return { ok: false, line: 1, error: "Falta «# Plan: nombre»." };
  if (steps.length === 0) return { ok: false, line: lines.length, error: "El plan no trae pasos." };
  return { ok: true, plan: { name, goal, deadlineDay, maxPerDayMin, steps } };
}

/** Reparte los pasos en orden, entre semana, sin pasar del tope diario ni de la capacidad. */
export function distributePlan(s: DemoState, spec: PlanSpec, now: Minute): Distribution {
  const sim = structuredClone(s);
  const { focusMaxMin, minChunkMin } = sim.settings;
  const remaining = spec.steps.map((step) => step.minutes);
  const totalMin = remaining.reduce((a, b) => a + b, 0);
  const allocations: Allocation[] = [];
  const firstDay = dayOf(now) + 1;
  const lastDay = spec.deadlineDay ?? firstDay + 180;
  let stepIdx = 0;

  for (let day = firstDay; day <= lastDay && stepIdx < spec.steps.length; day++) {
    if (isWeekend(day)) continue;
    let available = Math.min(spec.maxPerDayMin, focusMaxMin - plannedMinutes(sim, day));
    while (stepIdx < spec.steps.length && available > 0) {
      const left = remaining[stepIdx] ?? 0;
      const chunk = Math.min(available, left);
      if (chunk < minChunkMin && chunk < left) break;
      const slot = place(sim, day, chunk, false)?.[0];
      if (!slot) break;
      allocations.push({ day, stepIdx, start: slot.start, end: slot.end });
      sim.blocks.push({
        id: `sim${allocations.length}`,
        title: "",
        itemId: null,
        ...slot,
        status: "planned",
      });
      available -= chunk;
      remaining[stepIdx] = left - chunk;
      if (remaining[stepIdx] === 0) stepIdx += 1;
    }
  }
  const missingMin = remaining.reduce((a, b) => a + b, 0);
  return {
    allocations,
    finishDay: allocations.at(-1)?.day ?? null,
    fits: missingMin === 0,
    missingMin,
    totalMin,
  };
}
