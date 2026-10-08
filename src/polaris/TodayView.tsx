import { useDemo } from "../app/DemoContext";
import { isNewItem } from "../app/session";
import { UI } from "../copy/es";
import { todayView } from "../demo/selectors";
import { duration, hhmm } from "../demo/time";
import { ItemRow, SectionLabel } from "./ItemRow";

/** Today: entender la situación en menos de 3 segundos. Sin información secundaria. */
export function TodayView() {
  const { session } = useDemo();
  const now = Math.floor(session.now);
  const view = todayView(session.demo, now);
  const { current, next, counts } = view;
  const calm = counts.pending === 0;

  const elapsed = current ? (now - current.start) / (current.end - current.start) : 0;
  const [firstNext] = next;

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-10 px-5 py-8 md:px-8 md:py-10">
      <header className="flex flex-col gap-1">
        <h2 className="text-h1">{view.greeting}</h2>
        <p className="text-h3 font-normal text-fg-soft">
          {calm ? UI.today.calm : UI.today.onTrack}
        </p>
      </header>

      <section aria-labelledby="today-now" className="flex flex-col gap-3">
        <SectionLabel id="today-now">{UI.today.now}</SectionLabel>
        {current ? (
          <div className="flex gap-4">
            <span
              aria-hidden="true"
              className="w-[3px] shrink-0 rounded-full"
              style={{
                backgroundImage: "linear-gradient(180deg, var(--color-sky), var(--color-violet))",
              }}
            />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-small text-fg-muted tabular-nums">{hhmm(current.start)}</p>
              <p className="text-h2">{current.context ?? current.title}</p>
              {current.context ? <p className="text-fg-soft">{current.title}</p> : null}
              <p className="mt-1 text-caption text-fg-soft">
                {UI.today.inProgress(duration(current.end - now))}
              </p>
              <div className="mt-1 h-0.5 w-48 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(elapsed * 100)}%`,
                    backgroundImage: "var(--gradient-brand)",
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-h3 font-normal text-fg-soft">
            {firstNext ? UI.today.freeUntil(hhmm(firstNext.start)) : UI.today.freeRest}
          </p>
        )}
      </section>

      {next.length > 0 ? (
        <section aria-labelledby="today-after" className="flex flex-col gap-3">
          <SectionLabel id="today-after">{UI.today.after}</SectionLabel>
          <ul className="flex flex-col gap-2">
            {next.map((entry) => (
              <li key={entry.id} className="grid grid-cols-[56px_1fr] gap-3">
                <span className="text-fg-muted tabular-nums">{hhmm(entry.start)}</span>
                <span className="min-w-0">
                  {entry.context ?? entry.title}
                  {entry.context ? <span className="text-fg-muted"> · {entry.title}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {view.pendingToday.length > 0 ? (
        <section aria-labelledby="today-pending" className="flex flex-col gap-1">
          <SectionLabel id="today-pending">{UI.today.pending}</SectionLabel>
          <ul className="mt-2 flex flex-col">
            {view.pendingToday.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                today={view.day}
                showDay={item.dueDay !== view.day}
                isNew={isNewItem(session, item.id)}
                reveal={session.fresh.includes(item.id)}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {view.upcoming.length > 0 ? (
        <section aria-labelledby="today-upcoming" className="flex flex-col gap-1">
          <SectionLabel id="today-upcoming">{UI.today.upcoming}</SectionLabel>
          <ul className="mt-2 flex flex-col">
            {view.upcoming.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                today={view.day}
                isNew={isNewItem(session, item.id)}
                reveal={session.fresh.includes(item.id)}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-small text-fg-muted">
        {UI.today.summary(counts.pending, counts.habits, counts.events)}
      </p>
    </div>
  );
}
