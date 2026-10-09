import { MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UI } from "../copy/es";
import { type Command, filterCommands, GROUPS } from "./palette";

type Props = {
  open: boolean;
  onClose: () => void;
  commands: Command[];
};

/**
 * Ctrl+K: un campo y una lista. Las flechas mueven la selección sin sacar el foco del campo
 * (patrón combobox), Enter ejecuta, Esc cierra y el foco regresa a donde estaba.
 */
export function CommandPalette({ open, onClose, commands }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const listId = useId();
  const results = useMemo(() => filterCommands(commands, query), [commands, query]);
  const current = results[Math.min(active, results.length - 1)];

  useEffect(() => {
    if (!open) return;
    returnTo.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuery("");
    setActive(0);
    inputRef.current?.focus();
  }, [open]);

  // La opción activa siempre a la vista, aunque la lista tenga scroll.
  useEffect(() => {
    if (!current) return;
    document.getElementById(`${listId}-${current.id}`)?.scrollIntoView({ block: "nearest" });
  }, [current, listId]);

  if (!open) return null;

  function dismiss() {
    onClose();
    returnTo.current?.focus();
  }

  function choose(command: Command) {
    onClose();
    command.run();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (results.length ? (a + step + results.length) % results.length : 0));
    } else if (e.key === "Enter" && current) {
      e.preventDefault();
      choose(current);
    } else if (e.key === "Escape") {
      e.preventDefault();
      dismiss();
    } else if (e.key === "Tab") {
      // El diálogo solo tiene el campo: el foco no se escapa.
      e.preventDefault();
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      {/* El fondo cierra con el mouse; con el teclado, Esc. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label={UI.palette.close}
        onClick={dismiss}
        className="absolute inset-0 cursor-default bg-vacio/80 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={UI.palette.title}
        onKeyDown={onKeyDown}
        className="relative flex max-h-[70vh] w-full max-w-[560px] flex-col rounded-globo border border-trazo bg-vacio"
      >
        <div className="punteado-b flex items-center gap-3 px-5">
          <MagnifyingGlass size={18} weight="light" aria-hidden="true" className="text-niebla" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={current ? `${listId}-${current.id}` : undefined}
            aria-autocomplete="list"
            aria-label={UI.palette.title}
            aria-describedby={`${listId}-help`}
            placeholder={UI.palette.placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            className="h-14 min-w-0 flex-1 bg-transparent text-entrada font-light text-crema placeholder:text-niebla focus:outline-none"
          />
          <kbd className="etiqueta shrink-0 rounded-full border border-linea px-2 py-1 text-niebla">
            Esc
          </kbd>
        </div>

        <div
          id={listId}
          role="listbox"
          aria-label={UI.palette.results}
          className="min-h-0 flex-1 overflow-y-auto py-2"
        >
          {GROUPS.map((group) => {
            const options = results.filter((c) => c.group === group);
            if (!options.length) return null;
            return (
              // biome-ignore lint/a11y/useSemanticElements: dentro de un listbox el grupo es role="group"; fieldset es para formularios.
              <div key={group} role="group" aria-labelledby={`${listId}-${group}`}>
                <div id={`${listId}-${group}`} className="etiqueta px-5 pt-4 pb-2 text-niebla">
                  {UI.palette.groups[group]}
                </div>
                {options.map((command) => {
                  const selected = command.id === current?.id;
                  return (
                    // biome-ignore lint/a11y/useKeyWithClickEvents: el teclado vive en el campo (combobox con aria-activedescendant).
                    <div
                      key={command.id}
                      id={`${listId}-${command.id}`}
                      role="option"
                      aria-selected={selected}
                      tabIndex={-1}
                      onMouseMove={() => setActive(results.indexOf(command))}
                      onClick={() => choose(command)}
                      className={`relative flex min-h-11 cursor-pointer items-center justify-between gap-4 px-5 ${
                        selected ? "bg-tinta" : ""
                      }`}
                    >
                      {selected ? (
                        <span
                          aria-hidden="true"
                          className="absolute top-2 bottom-2 left-0 border-l-2 border-chispa"
                        />
                      ) : null}
                      <span className="min-w-0 truncate text-cuerpo text-crema">
                        {command.label}
                      </span>
                      {command.hint ? (
                        <span className="etiqueta shrink-0 text-niebla">{command.hint}</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        {results.length === 0 ? (
          <p className="px-5 pb-6 font-light text-ceniza">{UI.palette.empty}</p>
        ) : null}
        <p id={`${listId}-help`} className="sr-only">
          {UI.palette.help}
        </p>
      </div>
    </div>,
    document.body,
  );
}
