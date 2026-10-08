import { ArrowUp } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { type FormEvent, Fragment, type KeyboardEvent, useEffect, useRef, useState } from "react";
import { useDemo } from "../app/DemoContext";
import { nextTime, visibleSuggestions } from "../app/session";
import { Isotipo } from "../brand/Isotipo";
import { UI } from "../copy/es";
import { dayOf, hhmm, shortDate } from "../demo/time";
import { MessageBubble } from "./MessageBubble";

const EASE = [0.16, 1, 0.3, 1] as const;

export function ChatPanel({ className = "" }: { className?: string }) {
  const { session, send, press } = useDemo();
  const reduce = useReducedMotion();
  const { messages } = session.demo;
  const suggestions = visibleSuggestions(session);
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  /** ¿Estás leyendo lo último? Entonces el chat te sigue cuando algo crece o llega. */
  const pinned = useRef(true);

  // Un mensaje nuevo siempre te trae al final.
  // biome-ignore lint/correctness/useExhaustiveDependencies: solo importa cuántos mensajes hay.
  useEffect(() => {
    pinned.current = true;
  }, [messages.length]);

  // El ack crece de ✓ al texto completo después de llegar: se sigue el tamaño, no el estado.
  // Scroll instantáneo: uno suave dispara scrolls intermedios que lo despegarían del final.
  useEffect(() => {
    const log = logRef.current;
    const content = contentRef.current;
    if (!log || !content) return;
    const observer = new ResizeObserver(() => {
      if (pinned.current) log.scrollTo({ top: log.scrollHeight });
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    send(text);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) submit(event);
  }

  const ready = draft.trim().length > 0;

  return (
    <section aria-label={UI.chat.log} className={`min-h-0 min-w-0 flex-col ${className}`}>
      <header className="punteado-b flex h-14 shrink-0 items-center gap-3 px-5">
        <Isotipo size={22} />
        <p className="font-medium">{UI.chat.title}</p>
        <p className="etiqueta ml-auto text-niebla">{UI.chat.channel}</p>
      </header>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        onScroll={(e) => {
          const log = e.currentTarget;
          pinned.current = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
        }}
        className="min-h-0 flex-1 overflow-y-auto px-5 py-6"
      >
        <div ref={contentRef} className="flex min-h-full flex-col gap-6">
          {messages.length === 0 ? <EmptyChat firstAt={nextTime(session)} /> : null}
          {messages.map((message, i) => {
            const prev = messages[i - 1];
            const newDay = !prev || dayOf(prev.at) !== dayOf(message.at);
            // Lo que ya estaba al saltar de capítulo no se anima.
            const isNew = i >= session.baseline;
            return (
              <Fragment key={message.id}>
                {newDay ? (
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex-1 border-t border-dashed border-linea"
                    />
                    <p className="etiqueta text-niebla">{shortDate(dayOf(message.at))}</p>
                    <span
                      aria-hidden="true"
                      className="flex-1 border-t border-dashed border-linea"
                    />
                  </div>
                ) : null}
                <motion.div
                  className="flex flex-col"
                  initial={reduce || !isNew ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: EASE }}
                >
                  <MessageBubble message={message} isNew={isNew} onPress={press} />
                </motion.div>
              </Fragment>
            );
          })}
        </div>
      </div>

      <div className="punteado-t flex shrink-0 flex-col gap-3 px-5 pt-4 pb-5">
        {suggestions.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="etiqueta text-niebla">{UI.chat.suggestions}</p>
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none]">
              {suggestions.map((sg) => (
                <button
                  key={sg.text}
                  type="button"
                  onClick={() => send(sg.text, sg.parsed)}
                  className="min-h-11 max-w-[280px] shrink-0 truncate rounded-full border border-trazo px-4 text-left text-chico text-ceniza transition-[border-color,color,transform] duration-150 ease-out hover:border-crema hover:text-crema active:scale-[0.99]"
                >
                  {sg.label ?? sg.text}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <form onSubmit={submit} className="flex items-end gap-3">
          <label className="sr-only" htmlFor="chat-input">
            {UI.chat.placeholder}
          </label>
          <textarea
            id="chat-input"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={UI.chat.placeholder}
            className="max-h-32 min-h-11 flex-1 resize-none border-b border-trazo bg-transparent py-2.5 text-cuerpo text-crema placeholder:text-niebla focus:border-chispa focus:outline-none"
          />
          <button
            type="submit"
            aria-label={UI.chat.send}
            disabled={!ready}
            className={`grid size-11 shrink-0 place-items-center rounded-full transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.96] ${
              ready ? "bg-iris text-sobre-iris" : "border border-trazo text-niebla"
            }`}
          >
            <ArrowUp size={18} weight="regular" aria-hidden="true" />
          </button>
        </form>
      </div>
    </section>
  );
}

/** Antes del primer mensaje: qué va a pasar y cuándo. */
function EmptyChat({ firstAt }: { firstAt: number | null }) {
  return (
    <div className="m-auto flex max-w-[260px] flex-col gap-2 text-center">
      <p className="etiqueta text-ceniza">{UI.chat.emptyTitle}</p>
      {firstAt !== null ? (
        <p className="text-chico font-light text-niebla">{UI.chat.emptyHint(hhmm(firstAt))}</p>
      ) : null}
    </div>
  );
}
