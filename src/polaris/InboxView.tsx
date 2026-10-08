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
    <div className="mx-auto flex max-w-[640px] flex-col gap-8 px-5 py-8 md:px-8 md:py-10">
      <header className="flex flex-col gap-1">
        <h2 className="text-h1">{UI.inbox.title}</h2>
        <p className="text-fg-soft">{UI.inbox.concept}</p>
      </header>

      <div className="flex flex-col gap-2">
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label htmlFor="inbox-input" className="sr-only">
            {UI.inbox.placeholder}
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
            className="min-h-20 flex-1 resize-none rounded-sm border border-line bg-raised px-4 py-3 text-body text-fg placeholder:text-fg-muted focus:border-blue focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="min-h-11 rounded-sm bg-blue px-5 font-medium text-midnight transition-[opacity,transform] duration-150 ease-out active:scale-[0.98] disabled:opacity-40"
          >
            {UI.inbox.capture}
          </button>
        </form>
        <p aria-live="polite" className="min-h-5 text-small text-fg-soft">
          {confirmed ? UI.inbox.raw : ""}
        </p>
        {suggestions.map((sg) => (
          <button
            key={sg.text}
            type="button"
            onClick={() => drop(sg.text, sg.parsed)}
            className="min-h-11 rounded-sm border border-line px-3 py-2 text-left text-small text-fg-soft transition-colors duration-150 hover:bg-surface hover:text-fg"
          >
            {sg.label ?? sg.text}
          </button>
        ))}
      </div>

      {stream.length ? (
        <ul aria-label={UI.inbox.stream} className="flex flex-col gap-5">
          {stream.map((entry) => {
            const quoted = showsSource(entry);
            return (
              <li key={entry.key} className="flex flex-col">
                {quoted ? <p className="mb-1 text-fg-soft">«{entry.source}»</p> : null}
                <ul className={`flex flex-col ${quoted ? "border-l border-line pl-4" : ""}`}>
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
        <p className="text-fg-soft">{UI.inbox.empty}</p>
      )}
    </div>
  );
}
