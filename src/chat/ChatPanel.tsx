import { PaperPlaneRight } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { type FormEvent, Fragment, type KeyboardEvent, useEffect, useRef, useState } from "react";
import { useDemo } from "../app/DemoContext";
import { visibleSuggestions } from "../app/session";
import { Isotipo } from "../brand/Isotipo";
import { UI } from "../copy/es";
import { dayOf, shortDate } from "../demo/time";
import { MessageBubble } from "./MessageBubble";

const EASE = [0.16, 1, 0.3, 1] as const;

export function ChatPanel({ className = "" }: { className?: string }) {
  const { session, send, press } = useDemo();
  const reduce = useReducedMotion();
  const { messages } = session.demo;
  const suggestions = visibleSuggestions(session);
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  // Siempre al último mensaje, también cuando uno se edita en su lugar.
  const lastText = messages.at(-1)?.text;
  // biome-ignore lint/correctness/useExhaustiveDependencies: el scroll se dispara con cada mensaje nuevo o editado.
  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    const id = window.setTimeout(
      () => log.scrollTo({ top: log.scrollHeight, behavior: reduce ? "auto" : "smooth" }),
      50,
    );
    return () => window.clearTimeout(id);
  }, [messages.length, lastText, reduce]);

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

  return (
    <section aria-label={UI.chat.log} className={`flex min-h-0 flex-col bg-raised ${className}`}>
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4">
        <Isotipo size={32} />
        <div className="leading-tight">
          <p className="font-medium">{UI.chat.title}</p>
          <p className="text-caption font-normal text-fg-muted">{UI.chat.caption}</p>
        </div>
      </header>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-4"
      >
        {messages.map((message, i) => {
          const prev = messages[i - 1];
          const newDay = !prev || dayOf(prev.at) !== dayOf(message.at);
          // Lo que ya estaba al saltar de capítulo no se anima.
          const isNew = i >= session.baseline;
          return (
            <Fragment key={message.id}>
              {newDay ? (
                <p className="my-1 self-center text-caption text-fg-muted">
                  {shortDate(dayOf(message.at))}
                </p>
              ) : null}
              <motion.div
                className="flex flex-col"
                initial={reduce || !isNew ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                <MessageBubble message={message} isNew={isNew} onPress={press} />
              </motion.div>
            </Fragment>
          );
        })}
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-line p-3">
        {suggestions.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-caption text-fg-muted">{UI.chat.suggestions}</p>
            <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 [scrollbar-width:none]">
              {suggestions.map((sg) => (
                <button
                  key={sg.text}
                  type="button"
                  onClick={() => send(sg.text, sg.parsed)}
                  className="min-h-11 max-w-[260px] shrink-0 truncate rounded-sm border border-line bg-base px-3 text-left text-small text-fg-soft transition-[background-color,color,transform] duration-150 ease-out hover:bg-surface hover:text-fg active:scale-[0.99]"
                >
                  {sg.label ?? sg.text}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <form onSubmit={submit} className="flex items-end gap-2">
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
            className="max-h-32 min-h-11 flex-1 resize-none rounded-sm border border-line bg-base px-3 py-2.5 text-body text-fg placeholder:text-fg-muted focus:border-blue focus:outline-none"
          />
          <button
            type="submit"
            aria-label={UI.chat.send}
            disabled={!draft.trim()}
            className="grid size-11 shrink-0 place-items-center rounded-sm bg-blue text-midnight transition-[opacity,transform] duration-150 ease-out active:scale-[0.96] disabled:opacity-40"
          >
            <PaperPlaneRight size={20} weight="regular" />
          </button>
        </form>
      </div>
    </section>
  );
}
