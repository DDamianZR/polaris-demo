import { useDemo } from "../app/DemoContext";
import { isNewItem } from "../app/session";
import { UI } from "../copy/es";
import { todayView } from "../demo/selectors";
import { duration, hhmm } from "../demo/time";
import { ItemRow, SectionLabel } from "./ItemRow";

/** Today: entender la situación en menos de 3 segundos. Sin información secundaria. */
export function TodayView({ revealKey = 0 }: { revealKey?: number }) {
  const { session } = useDemo();
  const now = Math.floor(session.now);
  const view = todayView(session.demo, now);
  const { current, next, counts } = view;
  const calm = counts.pending === 0;

  const elapsed = current ? (now - current.start) / (current.end - current.start) : 0;
  const [firstNext] = next;
  const section = "punteado-t flex flex-col gap-3 pt-5";

  return (
    <div className="mx-auto flex max-w-[580px] flex-col gap-8 px-6 py-8 md:px-8 md:py-10">
      <header className="flex flex-col gap-3">
        <h3 className="text-titular font-normal">{view.greeting}</h3>
        <p className="text-entrada font-light text-ceniza">
          {calm ? UI.today.calm : UI.today.onTrack}
        </p>
      </header>

      <section aria-labelledby="today-now" className={section}>
        <SectionLabel id="today-now">{UI.today.now}</SectionLabel>
        {current ? (
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="etiqueta cifras text-niebla">{hhmm(current.start)}</p>
            <p className="text-titulo font-normal">{current.context ?? current.title}</p>
            {current.context ? <p className="font-light text-ceniza">{current.title}</p> : null}
            <p className="etiqueta mt-2 text-chispa">
              {UI.today.inProgress(duration(current.end - now))}
            </p>
            {/* El avance es una sinapsis: el tramo recorrido se enciende y la chispa va al frente. */}
            <div className="relative mt-2 h-2 w-56" aria-hidden="true">
              <span className="absolute inset-x-0 top-1 border-t border-dashed border-trazo" />
              <span
                className="absolute top-1 left-0 border-t border-chispa"
                style={{ width: `${Math.round(elapsed * 100)}%` }}
              />
              <span
                className="absolute top-0 size-2 -translate-x-1/2 rounded-full bg-chispa"
                style={{ left: `${Math.round(elapsed * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-titulo font-light text-ceniza">
            {firstNext ? UI.today.freeUntil(hhmm(firstNext.start)) : UI.today.freeRest}
          </p>
        )}
      </section>

      {next.length > 0 ? (
        <section aria-labelledby="today-after" className={section}>
          <SectionLabel id="today-after">{UI.today.after}</SectionLabel>
          <ul className="flex flex-col gap-2.5">
            {next.map((entry) => (
              <li key={entry.id} className="grid grid-cols-[64px_1fr] gap-3">
                <span className="cifras text-niebla">{hhmm(entry.start)}</span>
                <span className="min-w-0">
                  {entry.context ?? entry.title}
                  {entry.context ? (
                    <span className="font-light text-ceniza"> · {entry.title}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {view.pendingToday.length > 0 ? (
        <section aria-labelledby="today-pending" className={section}>
          <SectionLabel id="today-pending">{UI.today.pending}</SectionLabel>
          <ul className="flex flex-col">
            {view.pendingToday.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                today={view.day}
                showDay={item.dueDay !== view.day}
                isNew={isNewItem(session, item.id)}
                reveal={session.fresh.includes(item.id)}
                revealKey={revealKey}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {view.upcoming.length > 0 ? (
        <section aria-labelledby="today-upcoming" className={section}>
          <SectionLabel id="today-upcoming">{UI.today.upcoming}</SectionLabel>
          <ul className="flex flex-col">
            {view.upcoming.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                today={view.day}
                isNew={isNewItem(session, item.id)}
                reveal={session.fresh.includes(item.id)}
                revealKey={revealKey}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <p className="etiqueta punteado-t pt-5 text-niebla">
        {UI.today.summary(counts.pending, counts.habits, counts.events)}
      </p>
    </div>
  );
}
