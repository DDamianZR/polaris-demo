import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useDemo } from "../app/DemoContext";
import { dueLabel, UI } from "../copy/es";
import { directionTree, type ProjectView } from "../demo/selectors";
import { dayOf, shortDate } from "../demo/time";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Indicadores humanos, nunca porcentajes: cómo va el proyecto, dicho como frase. */
function Pulse({ project }: { project: ProjectView }) {
  if (project.total > 0 && !project.next) {
    return <p className="text-chico text-sinapsis-texto">{UI.direction.finished}</p>;
  }
  const lines = [
    project.moving ? UI.direction.moving : null,
    project.finishDay !== null ? UI.direction.finishes(shortDate(project.finishDay)) : null,
  ].filter(Boolean);
  if (!lines.length) return null;
  return <p className="text-chico text-sinapsis-texto">{lines.join(" ")}</p>;
}

function Project({ project, today }: { project: ProjectView; today: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      layout={reduce ? false : "position"}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="flex flex-col gap-2"
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-entrada">{project.title}</p>
        {project.total > 1 ? (
          <p className="etiqueta shrink-0 text-niebla">
            {UI.direction.steps(project.done, project.total)}
          </p>
        ) : null}
      </div>
      <Pulse project={project} />
      {project.next ? (
        <div className="mt-1 flex gap-3">
          <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-chispa" />
          <div className="min-w-0">
            <p className="etiqueta text-chispa">{UI.direction.next}</p>
            <p className="mt-1 text-crema">{project.next.title}</p>
            {project.next.dueDay !== null ? (
              <p className="text-chico text-niebla">{dueLabel(project.next.dueDay, today)}</p>
            ) : (
              <p className="text-chico text-niebla">{UI.inbox.undated}</p>
            )}
          </div>
        </div>
      ) : project.total === 0 ? (
        <p className="font-light text-ceniza">{UI.direction.noSteps}</p>
      ) : null}
    </motion.li>
  );
}

/** Direction: objetivo → proyecto → próxima acción. La capa estratégica, sin métricas genéricas. */
export function DirectionView() {
  const { session } = useDemo();
  const now = Math.floor(session.now);
  const today = dayOf(now);
  const goals = directionTree(session.demo, now);

  return (
    <div className="mx-auto flex max-w-[580px] flex-col gap-8 px-6 py-8 md:px-8 md:py-10">
      <header className="flex flex-col gap-3">
        <h3 className="text-titular font-normal">{UI.direction.title}</h3>
        <p className="text-entrada font-light text-ceniza">{UI.direction.concept}</p>
      </header>

      {goals.length === 0 ? (
        <p className="font-light text-ceniza">{UI.direction.empty}</p>
      ) : (
        goals.map((goal) => (
          <section
            key={goal.id}
            aria-labelledby={`goal-${goal.id}`}
            className="punteado-t flex flex-col gap-4 pt-5"
          >
            <p className="etiqueta text-niebla">{UI.direction.goal}</p>
            <h4 id={`goal-${goal.id}`} className="text-titulo font-normal">
              {goal.title}
            </h4>
            {/* Del objetivo cuelgan sus proyectos, unidos por una sinapsis. */}
            <ul className="ml-1 flex flex-col gap-6 border-l border-dashed border-sinapsis pl-5">
              <AnimatePresence initial={false}>
                {goal.projects.map((project) => (
                  <Project key={project.id} project={project} today={today} />
                ))}
              </AnimatePresence>
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
