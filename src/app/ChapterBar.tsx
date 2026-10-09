import { Pause, Play } from "@phosphor-icons/react";
import { UI } from "../copy/es";
import { CHAPTERS } from "../demo/script";
import { dayOf, hhmm, shortDate } from "../demo/time";
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

type Props = { size: "large" | "compact"; className?: string };

/** El capítulo en curso y la acción principal de la página: avanzar el día. */
export function ChapterBar({ size, className = "" }: Props) {
  const { session, dispatch } = useDemo();
  const index = chapterIndex(session);
  const chapter = CHAPTERS[index];
  const copy = chapter ? UI.chapters[chapter.key] : null;
  const large = size === "large";

  return (
    <section
      aria-label={UI.controls.section}
      className={`flex flex-wrap items-end justify-between gap-x-10 gap-y-4 ${className}`}
    >
      <div className="min-w-0 max-w-[720px]">
        <p className="etiqueta cifras text-chispa">
          {UI.controls.position(index + 1, CHAPTERS.length)}
        </p>
        <h3 className={`mt-2 font-normal ${large ? "text-titular" : "text-titulo"}`}>
          {copy?.title}
        </h3>
        <p
          className={`mt-2 max-w-[60ch] font-light text-ceniza ${large ? "text-entrada" : "text-cuerpo"}`}
        >
          {copy?.lead}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label={session.playing ? UI.controls.pause : UI.controls.play}
          title={session.playing ? UI.controls.pause : UI.controls.play}
          onClick={() => dispatch({ type: session.playing ? "pause" : "play" })}
          className="grid size-11 place-items-center rounded-full border border-trazo text-ceniza transition-colors duration-150 hover:border-crema hover:text-crema"
        >
          {session.playing ? (
            <Pause size={18} weight="light" aria-hidden="true" />
          ) : (
            <Play size={18} weight="light" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "next" })}
          className="cifras min-h-11 rounded-full bg-iris px-6 text-[13px] font-semibold tracking-[0.06em] whitespace-nowrap text-sobre-iris uppercase transition-[filter,transform] duration-150 ease-out hover:brightness-110 active:scale-[0.98]"
        >
          {nextLabel(session)}
        </button>
      </div>
    </section>
  );
}
