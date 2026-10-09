import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { UI } from "../copy/es";
import { Band } from "./Band";
import { IDEA, MARKS, type Row, row, SENTENCE, segments } from "./capture";
import { Pill } from "./Pill";

const EASE = [0.16, 1, 0.3, 1] as const;
/** Cuándo pasa cada cosa (ms): se marca la frase, salen los pendientes y la idea va al Inbox. */
const STAGES = [500, 1400, 2400];
const LAST = STAGES.length;

const MARK_COLOR = { when: "decoration-chispa", what: "decoration-sinapsis-texto" } as const;

function Result({ item, show, delay }: { item: Row; show: boolean; delay: number }) {
  return (
    <motion.li
      initial={false}
      animate={{ opacity: show ? 1 : 0, x: show ? 0 : -10 }}
      transition={{ duration: 0.5, ease: EASE, delay: show ? delay : 0 }}
      className="punteado-b flex gap-4 py-5"
    >
      <span
        aria-hidden="true"
        className={`mt-2 size-2.5 shrink-0 rounded-full ${item.dated ? "bg-crema" : "border border-chispa"}`}
      />
      <div className="min-w-0">
        <p className="text-entrada text-crema">{item.title}</p>
        <p className="etiqueta mt-1.5 text-niebla">{item.meta.join(" · ")}</p>
      </div>
    </motion.li>
  );
}

/**
 * "Primero captura. Después organizamos.": la frase cruda se marca y se vuelve pendientes. Es el
 * único momento orquestado de la página; arranca al entrar en pantalla y con reduced motion se
 * muestra ya resuelto.
 */
export function CaptureStory() {
  const copy = UI.landing.capture;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [stage, setStage] = useState(0);
  const [run, setRun] = useState(0);
  const shown = reduce ? LAST : stage;

  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` vuelve a correr la secuencia.
  useEffect(() => {
    if (!inView || reduce) return;
    setStage(0);
    const timers = STAGES.map((ms, i) => window.setTimeout(() => setStage(i + 1), ms));
    return () => timers.forEach(window.clearTimeout);
  }, [inView, reduce, run]);

  const text = SENTENCE?.text ?? "";
  const rows = (SENTENCE?.parsed?.items ?? []).map(row);
  const idea = (IDEA?.parsed?.items ?? []).map(row)[0];

  return (
    <Band id="captura" labelledBy="captura-title" className="py-20 md:py-28">
      <h2 id="captura-title" className="max-w-[18ch] text-titular font-normal text-balance">
        {copy.title}
      </h2>
      <p className="mt-6 max-w-[56ch] text-entrada font-light text-ceniza">{copy.lead}</p>

      <div ref={ref} className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col gap-6">
          <p className="etiqueta text-niebla">{copy.youWrite}</p>
          <p className="rounded-globo rounded-br-[6px] bg-tinta px-6 py-5 text-titulo font-light text-crema">
            {segments(text, MARKS).map((part) =>
              part.role ? (
                <span
                  key={part.text}
                  className={`underline decoration-dashed decoration-[1.5px] underline-offset-[7px] transition-[text-decoration-color] duration-500 ${
                    shown >= 1 ? MARK_COLOR[part.role] : "decoration-transparent"
                  }`}
                >
                  {part.text}
                </span>
              ) : (
                part.text
              ),
            )}
          </p>
          {IDEA ? (
            <p className="self-start rounded-globo rounded-br-[6px] bg-tinta px-5 py-3.5 text-entrada font-light text-crema">
              {IDEA.text}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <p className="etiqueta text-niebla">{copy.polarisReads}</p>
          <ul className="punteado-t">
            {rows.map((item, i) => (
              <Result key={item.title} item={item} show={shown >= 2} delay={i * 0.12} />
            ))}
            {idea ? <Result item={idea} show={shown >= 3} delay={0} /> : null}
          </ul>
          <motion.p
            initial={false}
            animate={{ opacity: shown >= 3 ? 1 : 0 }}
            transition={{ duration: 0.4, delay: shown >= 3 ? 0.3 : 0 }}
            className="text-chico text-ceniza"
          >
            {copy.noQuestions}
          </motion.p>
          {/* El botón aparece al final sin mover nada: su lugar ya está apartado. */}
          {reduce ? null : (
            <div className="min-h-11">
              {stage === LAST ? (
                <Pill tone="ghost" onClick={() => setRun((n) => n + 1)}>
                  {copy.replay}
                </Pill>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Band>
  );
}
