import { ArrowRight, Pause, Play } from "@phosphor-icons/react";
import { clockLabel, UI } from "../copy/es";
import { CHAPTERS } from "../demo/script";
import { useDemo } from "./DemoContext";
import { chapterIndex, pendingAuto } from "./session";

/** El capítulo en curso, el reloj y cómo avanzar. */
export function Controls() {
  const { session, dispatch } = useDemo();
  const index = chapterIndex(session);
  const chapter = CHAPTERS[index];
  const copy = chapter ? UI.chapters[chapter.key] : null;
  const auto = pendingAuto(session)?.action.type;
  const nextLabel =
    auto === "skipDays"
      ? UI.controls.skipDays
      : auto === "outage"
        ? UI.controls.outage
        : UI.controls.next;

  return (
    <section
      aria-label={UI.controls.chapters}
      className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-caption text-fg-muted tabular-nums" aria-live="polite">
          {UI.controls.position(index + 1, CHAPTERS.length)} · {clockLabel(Math.floor(session.now))}
        </p>
        <h2 className="text-h2">{copy?.title}</h2>
        <p className="max-w-[60ch] text-fg-soft">{copy?.lead}</p>
      </div>

      <div className="flex shrink-0 flex-col gap-2 md:items-end">
        <ol className="hidden gap-1 sm:flex">
          {CHAPTERS.map((c, i) => {
            const title = UI.chapters[c.key].title;
            const state = i === index ? "current" : i < index ? "past" : "future";
            return (
              <li key={c.key}>
                <button
                  type="button"
                  aria-label={UI.controls.goTo(i + 1, title)}
                  aria-current={i === index ? "step" : undefined}
                  title={title}
                  onClick={() => dispatch({ type: "goTo", index: i })}
                  className="group grid h-11 w-8 place-items-center"
                >
                  <span
                    className={`h-1 w-full rounded-full transition-colors duration-200 ${
                      state === "past"
                        ? "bg-faint"
                        : state === "future"
                          ? "bg-line group-hover:bg-faint"
                          : ""
                    }`}
                    style={
                      state === "current" ? { backgroundImage: "var(--gradient-brand)" } : undefined
                    }
                  />
                </button>
              </li>
            );
          })}
        </ol>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={session.playing ? UI.controls.pause : UI.controls.play}
            title={session.playing ? UI.controls.pause : UI.controls.play}
            onClick={() => dispatch({ type: session.playing ? "pause" : "play" })}
            className="grid size-11 place-items-center rounded-sm border border-line text-fg-soft transition-colors duration-150 hover:bg-surface hover:text-fg"
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
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-sm bg-blue px-5 font-medium text-midnight transition-[filter,transform] duration-150 ease-out hover:brightness-110 active:scale-[0.98] md:flex-none"
          >
            {nextLabel}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
