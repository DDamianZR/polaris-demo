import { ArrowBendDownRight } from "@phosphor-icons/react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useDemo } from "../app/DemoContext";
import { isNewItem, visibleSuggestions } from "../app/session";
import { UI } from "../copy/es";
import { inboxItems, recentCaptures } from "../demo/selectors";
import { dayOf } from "../demo/time";
import { ItemRow, SectionLabel } from "./ItemRow";

/** Inbox: zona de descarga mental. No pide proyecto, prioridad, fecha ni etiquetas. */
export function InboxView({ focusKey }: { focusKey: number }) {
  const { session, capture } = useDemo();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const today = dayOf(Math.floor(session.now));
  const recent = recentCaptures(session.demo);
  const undated = inboxItems(session.demo);
  // Las sugerencias de captura del capítulo también se pueden capturar desde aquí.
  const suggestions = visibleSuggestions(session).filter((sg) => sg.parsed?.intent === "capture");

  // "+ Capturar" abre el campo de inmediato.
  useEffect(() => {
    if (focusKey > 0) inputRef.current?.focus();
  }, [focusKey]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    capture(draft);
    setDraft("");
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-10 px-5 py-8 md:px-8 md:py-10">
      <header className="flex flex-col gap-1">
        <h2 className="text-h1">{UI.inbox.title}</h2>
        <p className="text-fg-soft">{UI.inbox.concept}</p>
      </header>

      <div className="flex flex-col gap-3">
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
        {suggestions.map((sg) => (
          <button
            key={sg.text}
            type="button"
            onClick={() => capture(sg.text, sg.parsed)}
            className="min-h-11 rounded-sm border border-line px-3 py-2 text-left text-small text-fg-soft transition-colors duration-150 hover:bg-surface hover:text-fg"
          >
            {sg.label ?? sg.text}
          </button>
        ))}
      </div>

      {recent.length > 0 ? (
        <section aria-labelledby="inbox-recent" className="flex flex-col gap-4">
          <SectionLabel id="inbox-recent">{UI.inbox.recent}</SectionLabel>
          <ul className="flex flex-col gap-5">
            {recent.map((group) => {
              const raw = group.raw;
              return (
                <li key={`${group.at}|${group.source}`} className="flex flex-col gap-1">
                  <p className="text-fg-soft">«{group.source}»</p>
                  {raw ? (
                    <p className="flex items-center gap-2 text-small text-fg-muted">
                      <ArrowBendDownRight size={16} aria-hidden="true" />
                      {UI.inbox.raw}
                    </p>
                  ) : (
                    <ul className="flex flex-col pl-5">
                      {group.items.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          today={today}
                          isNew={isNewItem(session, item.id)}
                          reveal={session.fresh.includes(item.id)}
                        />
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="inbox-undated" className="flex flex-col gap-1">
        <SectionLabel id="inbox-undated">{UI.inbox.undated}</SectionLabel>
        {undated.length ? (
          <ul className="mt-2 flex flex-col">
            {undated.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                today={today}
                isNew={isNewItem(session, item.id)}
                reveal={session.fresh.includes(item.id)}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-fg-soft">{UI.inbox.empty}</p>
        )}
      </section>
    </div>
  );
}
