/** Aterrizar planes (F7): Polaris le hace espacio en tus semanas o te dice que no cabe. */
import { BTN, PLAN_DECLINED, planConfirmed, planError, planSummary } from "../../copy/es";
import { distributePlan, parsePlan } from "../plan";
import { addMessage, type DemoState, findMessage, logDecision, nextId, normalize } from "../state";
import type { Minute } from "../time";

export function onPlan(s: DemoState, text: string, now: Minute) {
  const parsed = parsePlan(text);
  if (!parsed.ok) {
    addMessage(s, "polaris", now, planError(parsed.line, parsed.error));
    return;
  }
  const spec = parsed.plan;
  const distribution = distributePlan(s, spec, now);
  const message = addMessage(
    s,
    "polaris",
    now,
    planSummary({
      name: spec.name,
      steps: spec.steps.length,
      totalMin: distribution.totalMin,
      maxPerDayMin: spec.maxPerDayMin,
      fits: distribution.fits,
      finishDay: distribution.finishDay,
      deadlineDay: spec.deadlineDay,
      missingMin: distribution.missingMin,
    }),
    distribution.fits
      ? [
          [
            { label: BTN.schedulePlan, press: { kind: "plan", choice: "confirm" } },
            { label: BTN.notNow, press: { kind: "plan", choice: "decline" } },
          ],
        ]
      : [[{ label: BTN.notNow, press: { kind: "plan", choice: "decline" } }]],
  );
  s.flows.plan = { spec, distribution, messageId: message.id };
}

export function onPlanConfirm(s: DemoState, now: Minute): boolean {
  const f = s.flows.plan;
  if (!f?.distribution.fits) return false;
  const { spec, distribution } = f;

  let goal = spec.goal
    ? s.goals.find((g) => normalize(g.title) === normalize(spec.goal ?? ""))
    : undefined;
  if (spec.goal && !goal) {
    goal = { id: nextId(s, "g"), title: spec.goal };
    s.goals.push(goal);
  }
  const project = { id: nextId(s, "p"), goalId: goal?.id ?? "", title: spec.name };
  s.projects.push(project);

  const stepIds = spec.steps.map((step, idx) => {
    const days = distribution.allocations.filter((a) => a.stepIdx === idx).map((a) => a.day);
    const id = nextId(s, "i");
    s.items.push({
      id,
      kind: "task",
      title: step.title,
      context: spec.name,
      area: "estudio",
      status: "active",
      dueDay: days.at(-1) ?? null,
      dueAt: null,
      estimateMin: step.minutes,
      deferCount: 0,
      projectId: project.id,
      createdAt: now,
      doneAt: null,
      captured: false,
      source: null,
    });
    return id;
  });
  for (const a of distribution.allocations) {
    s.blocks.push({
      id: nextId(s, "b"),
      title: spec.steps[a.stepIdx]?.title ?? spec.name,
      itemId: stepIds[a.stepIdx] ?? null,
      start: a.start,
      end: a.end,
      status: "planned",
    });
  }
  logDecision(s, now, "planned", spec.name, null);

  const summary = findMessage(s, f.messageId);
  if (summary) summary.buttons = [];
  const [first] = distribution.allocations;
  addMessage(s, "polaris", now, planConfirmed(first?.day ?? 0, spec.steps[0]?.title ?? spec.name));
  s.flows.plan = null;
  return true;
}

export function onPlanDecline(s: DemoState, now: Minute): boolean {
  const f = s.flows.plan;
  if (!f) return false;
  const summary = findMessage(s, f.messageId);
  if (summary) summary.buttons = [];
  addMessage(s, "polaris", now, PLAN_DECLINED);
  s.flows.plan = null;
  return true;
}
