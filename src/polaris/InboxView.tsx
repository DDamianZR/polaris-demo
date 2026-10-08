import { type FormEvent, useEffect, useRef, useState } from "react";
import { useDemo } from "../app/DemoContext";
import { isNewItem, visibleSuggestions } from "../app/session";
import { UI } from "../copy/es";
import { inboxStream, showsSource } from "../demo/selectors";
import { dayOf } from "../demo/time";
import type { Parsed } from "../demo/types";
import { ItemRow } from "./ItemRow";

const CONFIRM_MS = 3000;

/**
 * Inbox: zona de descarga mental. No pide proyecto, prioridad, fecha ni etiquetas.
 * Un solo flujo, lo más nuevo arriba: lo que escribiste y en qué lo convirtió Polaris.
 */
export function InboxView({ focusKey, revealKey = 0 }: { focusKey: number; revealKey?: number }) {
  const { session, capture } = useDemo();
  const [draft, setDraft] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const today = dayOf(Math.floor(session.now));
  const stream = inboxStream(session.demo);
  // Las sugerencias de captura del capítulo también se pueden soltar desde aquí.
  const suggestions = visibleSuggestions(session).filter((sg) => sg.parsed?.intent === "capture");

  // "+ Capturar" abre el campo de inmediato.
  useEffect(() => {
    if (focusKey > 0) inputRef.current?.focus();
  }, [focusKey]);

  useEffect(() => {
    if (!confirmed) return;
    const id = window.setTimeout(() => setConfirmed(false), CONFIRM_MS);
    return () => window.clearTimeout(id);
  }, [confirmed]);

  function drop(text: string, parsed?: Parsed) {
    capture(text, parsed);
    setConfirmed(true);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    drop(draft);
    setDraft("");
  }

  return (
    <div className="mx-auto flex max-w-[580px] flex-col gap-8 px-6 py-8 md:px-8 md:py-10">
      <header className="flex flex-col gap-3">
        <h2 className="text-titular font-normal">{UI.inbox.title}</h2>
        <p className="text-entrada font-light text-ceniza">{UI.inbox.concept}</p>
      </header>

      <div className="flex flex-col gap-3">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label htmlFor="inbox-input" className="etiqueta text-niebla">
            {UI.inbox.dropLabel}
          </label>
          <textarea
            id="inbox-input"
            ref={inputRef}
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) submit(e);
            }}
            placeholder={UI.inbox.placeholder}
            className="min-h-16 resize-none border-b border-trazo bg-transparent py-2 text-entrada font-light text-crema placeholder:text-niebla focus:border-chispa focus:outline-none"
          />
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={!draft.trim()}
              className={`min-h-11 rounded-full px-6 text-[13px] font-semibold tracking-[0.06em] uppercase transition-[background-color,border-color,color,filter,transform] duration-150 ease-out active:scale-[0.98] ${
                draft.trim()
                  ? "bg-iris text-sobre-iris hover:brightness-110"
                  : "border border-trazo text-niebla"
              }`}
            >
              {UI.inbox.capture}
            </button>
            <p aria-live="polite" className="flex items-center gap-2 text-chico text-ceniza">
              {confirmed ? (
                <>
                  <span aria-hidden="true" className="size-2 rounded-full bg-chispa" />
                  {UI.inbox.raw}
                </>
              ) : null}
            </p>
          </div>
        </form>
        {suggestions.length ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {suggestions.map((sg) => (
              <button
                key={sg.text}
                type="button"
                onClick={() => drop(sg.text, sg.parsed)}
                className="min-h-11 max-w-full truncate rounded-full border border-trazo px-4 text-left text-chico text-ceniza transition-[border-color,color] duration-150 hover:border-crema hover:text-crema"
              >
                {sg.label ?? sg.text}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {stream.length ? (
        <ul aria-label={UI.inbox.stream} className="flex flex-col">
          {stream.map((entry) => {
            const quoted = showsSource(entry);
            return (
              <li key={entry.key} className="punteado-t flex flex-col gap-2 py-4">
                {quoted ? (
                  <p className="text-entrada font-light text-ceniza">«{entry.source}»</p>
                ) : null}
                {/* Lo que Polaris sacó de tu frase, colgado de ella como de una sinapsis. */}
                <ul
                  className={`flex flex-col ${quoted ? "ml-1 border-l border-dashed border-sinapsis pl-4" : ""}`}
                >
                  {entry.items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      today={today}
                      showUndated
                      isNew={isNewItem(session, item.id)}
                      reveal={session.fresh.includes(item.id)}
                      revealKey={revealKey}
                    />
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="etiqueta text-ceniza">{UI.inbox.empty}</p>
      )}
    </div>
  );
}
