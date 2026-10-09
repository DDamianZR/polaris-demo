import { useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { UI } from "../copy/es";
import { CHAPTERS } from "../demo/script";
import { useDemo } from "./DemoContext";
import { chapterIndex } from "./session";
import { edgeMask, useScrollEdges } from "./useScrollEdges";

type Props = { orientation: "vertical" | "horizontal"; className?: string };

function Marker({ state }: { state: "current" | "past" | "future" }) {
  if (state === "current") {
    return (
      <span
        aria-hidden="true"
        className="size-2.5 rounded-full bg-chispa shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-chispa)_18%,transparent)]"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={
        state === "past"
          ? "size-1.5 rounded-full bg-niebla"
          : "size-2 rounded-full border border-trazo bg-vacio"
      }
    />
  );
}

/**
 * Los capítulos como el itinerario del día, unidos por una línea punteada. En vertical lleva
 * el nombre de cada parada; en horizontal (tablet y cel), solo la hora.
 */
export function Itinerary({ orientation, className = "" }: Props) {
  const { session, dispatch } = useDemo();
  const index = chapterIndex(session);
  const vertical = orientation === "vertical";
  const reduce = useReducedMotion();
  const lane = useScrollEdges<HTMLOListElement>();

  // En horizontal, la parada actual siempre a la vista. Se desliza solo el carril, nunca la
  // página: cambiar de capítulo desde la portada no te mueve de donde estás.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `index` es el disparo; la parada se busca en el DOM ya pintado.
  useEffect(() => {
    const ol = lane.el;
    const stop = ol?.querySelector<HTMLElement>('[aria-current="step"]');
    if (vertical || !ol || !stop) return;
    const box = ol.getBoundingClientRect();
    const at = stop.getBoundingClientRect();
    const left = ol.scrollLeft + at.left - box.left - (box.width - at.width) / 2;
    ol.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" });
  }, [index, lane.el, vertical, reduce]);

  return (
    <nav aria-label={UI.controls.chapters} className={className}>
      <ol
        ref={lane.ref}
        className={
          vertical
            ? "relative flex flex-col"
            : `-mx-4 flex items-center gap-1 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 ${edgeMask(lane.edges)}`
        }
      >
        {vertical ? (
          <span
            aria-hidden="true"
            className="absolute top-4 bottom-4 left-[5px] border-l border-dashed border-linea"
          />
        ) : null}
        {CHAPTERS.map((c, i) => {
          const copy = UI.chapters[c.key];
          const state = i === index ? "current" : i < index ? "past" : "future";
          return (
            <li key={c.key} className="relative shrink-0">
              <button
                type="button"
                title={copy.title}
                aria-current={state === "current" ? "step" : undefined}
                onClick={() => dispatch({ type: "goTo", index: i })}
                className={`group flex w-full items-center text-left transition-colors duration-150 ${
                  vertical ? "min-h-9 gap-4" : "min-h-11 gap-2 rounded-full px-3"
                } ${state === "current" && !vertical ? "border border-trazo" : ""}`}
              >
                <span className="sr-only">{UI.controls.chapterN(i + 1)} </span>
                <span className="flex w-3 shrink-0 justify-center">
                  <Marker state={state} />
                </span>
                <span
                  className={`etiqueta cifras ${vertical ? "w-14" : ""} ${
                    state === "current" ? "text-crema" : "text-niebla group-hover:text-ceniza"
                  }`}
                >
                  {copy.when}
                </span>
                {vertical ? null : <span className="sr-only"> {copy.title}</span>}
                {vertical ? (
                  <span
                    className={`truncate ${
                      state === "current"
                        ? "text-crema"
                        : state === "past"
                          ? "text-niebla group-hover:text-ceniza"
                          : "text-ceniza group-hover:text-crema"
                    }`}
                  >
                    {copy.title}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
