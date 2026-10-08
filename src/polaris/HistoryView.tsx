import { useDemo } from "../app/DemoContext";
import { relativeDay, UI } from "../copy/es";
import { decisionsByDay, type HabitMark, habitRows, weekMetric } from "../demo/selectors";
import { dayOf, hhmm, weekday } from "../demo/time";
import type { Decision } from "../demo/types";
import { SectionLabel } from "./ItemRow";

/** Una marca de la semana. Lo que no se pudo es un círculo vacío: continuidad, no culpa. */
function Mark({ mark }: { mark: HabitMark }) {
  if (mark === "done") return <span className="size-2.5 rounded-full bg-sinapsis-texto" />;
  if (mark === "pending") return <span className="size-2.5 rounded-full border border-chispa" />;
  if (mark === "missed") return <span className="size-2.5 rounded-full border border-trazo" />;
  if (mark === "skipped") return <span className="h-px w-2.5 bg-trazo" />;
  return <span className="size-1 rounded-full bg-linea" />;
}

const KIND_TONE: Record<Decision["kind"], string> = {
  done: "text-sinapsis-texto",
  rescheduled: "text-ceniza",
  deferred: "text-ceniza",
  moved: "text-ceniza",
  planned: "text-ceniza",
  killed: "text-niebla",
};

/** History: ¿qué ha ocurrido? La semana, los hábitos y lo que decidiste. */
export function HistoryView() {
  const { session } = useDemo();
  const now = Math.floor(session.now);
  const today = dayOf(now);
  const metric = weekMetric(session.demo);
  const rows = habitRows(session.demo, now);
  const days = decisionsByDay(session.demo);
  const todayColumn = today >= 0 && today < 7 ? weekday(today) : -1;
  const section = "punteado-t flex flex-col gap-4 pt-5";

  return (
    <div className="mx-auto flex max-w-[580px] flex-col gap-8 px-6 py-8 md:px-8 md:py-10">
      <header className="flex flex-col gap-3">
        <h2 className="text-titular font-normal">{UI.history.title}</h2>
        <p className="text-entrada font-light text-ceniza">{UI.history.concept}</p>
      </header>

      <section aria-labelledby="history-week" className={section}>
        <SectionLabel id="history-week">{UI.history.week}</SectionLabel>
        <p className="text-titulo font-light">{UI.history.kept(metric.kept, metric.said)}</p>
      </section>

      <section aria-labelledby="history-habits" className={section}>
        <SectionLabel id="history-habits">{UI.history.habits}</SectionLabel>
        <table className="w-full border-separate border-spacing-y-2">
          <thead>
            <tr>
              <th className="sr-only">{UI.history.habits}</th>
              {UI.history.weekdays.map((letter, i) => (
                <th
                  key={UI.history.weekdayNames[i]}
                  scope="col"
                  abbr={UI.history.weekdayNames[i]}
                  className={`etiqueta w-8 text-center font-medium ${
                    i === todayColumn ? "text-crema" : "text-niebla"
                  }`}
                >
                  {letter}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="pr-4 text-left font-normal text-crema">
                  {row.name}
                </th>
                {row.marks.map((mark, i) => (
                  <td key={UI.history.weekdayNames[i]} className="text-center">
                    <span
                      role="img"
                      aria-label={`${UI.history.weekdayNames[i]}: ${UI.history.marks[mark]}`}
                      className="inline-grid size-6 place-items-center align-middle"
                    >
                      <Mark mark={mark} />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p aria-hidden="true" className="etiqueta flex flex-wrap gap-x-5 gap-y-2 text-niebla">
          <span className="inline-flex items-center gap-2">
            <Mark mark="done" /> {UI.history.marks.done}
          </span>
          <span className="inline-flex items-center gap-2">
            <Mark mark="pending" /> {UI.history.marks.pending}
          </span>
          <span className="inline-flex items-center gap-2">
            <Mark mark="missed" /> {UI.history.marks.missed}
          </span>
        </p>
      </section>

      <section aria-labelledby="history-decisions" className={section}>
        <SectionLabel id="history-decisions">{UI.history.decisions}</SectionLabel>
        {days.length === 0 ? (
          <p className="font-light text-ceniza">{UI.history.empty}</p>
        ) : (
          days.map((d) => (
            <div key={d.day} className="flex flex-col gap-2">
              <p className="etiqueta text-niebla">{relativeDay(d.day, today)}</p>
              <ul className="flex flex-col">
                {d.entries.map((entry) => (
                  <li key={entry.id} className="grid grid-cols-[56px_1fr] gap-3 py-1.5">
                    <span className="cifras text-niebla">{hhmm(entry.at)}</span>
                    <span className="min-w-0">
                      <span
                        className={
                          entry.kind === "killed"
                            ? "text-niebla line-through decoration-linea"
                            : "text-crema"
                        }
                      >
                        {entry.title}
                      </span>
                      <span className={`etiqueta ml-3 whitespace-nowrap ${KIND_TONE[entry.kind]}`}>
                        {UI.history.kinds[entry.kind]}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
