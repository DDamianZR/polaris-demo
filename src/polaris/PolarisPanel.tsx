import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { UI } from "../copy/es";
import { DirectionView } from "./DirectionView";
import { HistoryView } from "./HistoryView";
import { InboxView } from "./InboxView";
import { NAV, type View } from "./nav";
import { OrbitView } from "./OrbitView";
import { TodayView } from "./TodayView";

/** En Mac la tecla es ⌘; en lo demás, Ctrl. */
const SHORTCUT =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";

type Props = {
  view: View;
  onView: (view: View) => void;
  focusKey: number;
  revealKey: number;
  onQuickCapture: () => void;
  /** Abre la paleta de Ctrl+K. */
  onOpenPalette: () => void;
  /** En el cel las pestañas viven en la barra inferior. */
  showTabs: boolean;
  className?: string;
};

/** Si el contenido de un carril horizontal no cabe; solo entonces se desvanece la orilla. */
function useOverflows<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, overflows] as const;
}

/** Polaris: entender, revisar, reorganizar y decidir. Pestañas arriba y la vista debajo. */
export function PolarisPanel({
  view,
  onView,
  focusKey,
  revealKey,
  onQuickCapture,
  onOpenPalette,
  showTabs,
  className = "",
}: Props) {
  const [tabsRef, tabsOverflow] = useOverflows<HTMLElement>();
  return (
    <section aria-label={UI.chat.title} className={`flex min-h-0 min-w-0 flex-col ${className}`}>
      {showTabs ? (
        <header className="punteado-b flex h-14 shrink-0 items-stretch gap-4 pr-4 pl-6 md:pl-8">
          {/* Cinco pestañas: si no caben, se deslizan en vez de partirse. */}
          <nav
            ref={tabsRef}
            aria-label={UI.nav.label}
            className={`flex min-w-0 items-stretch gap-6 overflow-x-auto [scrollbar-width:none] ${
              tabsOverflow ? "[mask-image:linear-gradient(to_right,black_88%,transparent)]" : ""
            }`}
          >
            {NAV.map(({ key, label }) => {
              const active = view === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => onView(key)}
                  className={`etiqueta relative flex shrink-0 items-center transition-colors duration-150 ${
                    active ? "text-crema" : "text-niebla hover:text-ceniza"
                  }`}
                >
                  {label}
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-3 border-b border-dashed border-crema"
                    />
                  ) : null}
                </button>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={onOpenPalette}
            aria-label={UI.palette.title}
            aria-keyshortcuts="Control+K Meta+K"
            title={`${UI.palette.title} (${SHORTCUT})`}
            className="etiqueta my-auto ml-auto flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-trazo px-3 text-niebla transition-colors duration-150 hover:border-crema hover:text-crema"
          >
            <MagnifyingGlass size={13} weight="regular" aria-hidden="true" />
            <kbd className="hidden font-sans xl:inline">{SHORTCUT}</kbd>
          </button>
          <button
            type="button"
            onClick={onQuickCapture}
            aria-label={UI.inbox.capture}
            title={UI.inbox.capture}
            className="etiqueta my-auto flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-trazo px-3 text-ceniza transition-colors duration-150 hover:border-crema hover:text-crema 2xl:px-4"
          >
            <Plus size={13} weight="regular" aria-hidden="true" />
            <span className="hidden 2xl:inline">{UI.inbox.capture}</span>
          </button>
        </header>
      ) : null}
      {/* Cada vista empieza arriba: la llave hace que no herede el scroll de la anterior. */}
      <div key={view} className="relative min-h-0 flex-1 overflow-y-auto">
        {view === "today" ? <TodayView revealKey={revealKey} /> : null}
        {view === "inbox" ? <InboxView focusKey={focusKey} revealKey={revealKey} /> : null}
        {view === "orbit" ? <OrbitView revealKey={revealKey} /> : null}
        {view === "direction" ? <DirectionView /> : null}
        {view === "history" ? <HistoryView /> : null}
      </div>
    </section>
  );
}
