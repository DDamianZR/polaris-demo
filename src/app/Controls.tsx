import { Pause, Play } from "@phosphor-icons/react";
import { UI } from "../copy/es";
import { CHAPTERS } from "../demo/script";
import { dayOf, hhmm, shortDate } from "../demo/time";
import { DemoClock } from "./DemoClock";
import { useDemo } from "./DemoContext";
import { chapterIndex, nextTime, pendingAuto, type Session } from "./session";

/** Lo que dice el botón de avanzar: exactamente a dónde te lleva. */
function nextLabel(session: Session): string {
  const auto = pendingAuto(session)?.action.type;
  if (auto === "skipDays") return UI.controls.skipDays;
  if (auto === "outage") return UI.controls.outage;
  const target = nextTime(session);
  if (target === null) return UI.controls.goAt(hhmm(Math.floor(session.now)));
  return dayOf(target) === dayOf(Math.floor(session.now))
    ? UI.controls.goAt(hhmm(target))
    : UI.controls.goAtDay(shortDate(dayOf(target)), hhmm(target));
}

/** El reloj, el capítulo en curso y cómo avanzar. */
export function Controls() {
  const { session, dispatch } = useDemo();
  const index = chapterIndex(session);
  const chapter = CHAPTERS[index];
  const copy = chapter ? UI.chapters[chapter.key] : null;

  return (
    <section aria-label={UI.controls.section} className="flex flex-col gap-3 md:gap-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 md:gap-x-10">
        <DemoClock now={session.now} />
        <div className="order-3 w-full min-w-0 md:order-2 md:w-auto md:flex-1">
          <h2 className="text-h3">{copy?.title}</h2>
          <p className="max-w-[62ch] text-small text-fg-soft md:text-body">{copy?.lead}</p>
        </div>
        <div className="order-2 ml-auto flex gap-2 md:order-3">
          <button
            type="button"
            aria-label={session.playing ? UI.controls.pause : UI.controls.play}
            title={session.playing ? UI.controls.pause : UI.controls.play}
            onClick={() => dispatch({ type: session.playing ? "pause" : "play" })}
            className="hidden size-11 place-items-center rounded-sm border border-line text-fg-soft sm:grid transition-colors duration-150 hover:bg-surface hover:text-fg"
          >
            {session.playing ? (
              <Pause size={20} aria-hidden="true" />
            ) : (
              <Play size={20} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "next" })}
            className="h-11 rounded-sm bg-blue px-4 font-medium whitespace-nowrap text-midnight tabular-nums transition-[filter,transform] duration-150 ease-out hover:brightness-110 active:scale-[0.98] md:px-5"
          >
            {nextLabel(session)}
          </button>
        </div>
      </div>
      <Itinerary index={index} onGo={(i) => dispatch({ type: "goTo", index: i })} />
    </section>
  );
}

/** Los capítulos como el itinerario del día: cada uno a su hora. El punto de color marca dónde vas. */
function Itinerary({ index, onGo }: { index: number; onGo: (index: number) => void }) {
  return (
    <nav aria-label={UI.controls.chapters}>
      <ol className="-mx-4 flex items-center overflow-x-auto px-4 [mask-image:linear-gradient(to_right,black_88%,transparent)] [scrollbar-width:none] md:mx-0 md:px-0 md:[mask-image:none]">
        {CHAPTERS.map((c, i) => {
          const copy = UI.chapters[c.key];
          const current = i === index;
          const past = i < index;
          return (
            <li key={c.key} className="flex shrink-0 items-center">
              {i > 0 ? (
                <span
                  aria-hidden="true"
                  className={
                    c.key === "friday"
                      ? "w-8 border-t border-dashed border-faint"
                      : `h-px w-3 md:w-5 ${past || current ? "bg-faint" : "bg-line"}`
                  }
                />
              ) : null}
              <button
                type="button"
                title={copy.title}
                aria-label={UI.controls.goTo(i + 1, copy.title)}
                aria-current={current ? "step" : undefined}
                onClick={() => onGo(i)}
                className={`flex h-11 items-center gap-2 rounded-sm px-2.5 text-small tabular-nums transition-colors duration-150 ${
                  current
                    ? "bg-surface text-fg"
                    : past
                      ? "text-fg-muted hover:text-fg"
                      : "text-fg-soft hover:text-fg"
                }`}
              >
                {current ? (
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ backgroundImage: "var(--gradient-brand)" }}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${past ? "bg-faint" : "border border-faint"}`}
                  />
                )}
                {copy.when}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
