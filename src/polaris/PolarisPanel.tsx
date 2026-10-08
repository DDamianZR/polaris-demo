import { Plus } from "@phosphor-icons/react";
import { UI } from "../copy/es";
import { InboxView } from "./InboxView";
import { NAV, type View } from "./nav";
import { TodayView } from "./TodayView";

type Props = {
  view: View;
  onView: (view: View) => void;
  focusKey: number;
  revealKey: number;
  onQuickCapture: () => void;
  /** En el cel las pestañas viven en la barra inferior. */
  showTabs: boolean;
  className?: string;
};

/** Polaris: entender, revisar, reorganizar y decidir. Pestañas arriba y la vista debajo. */
export function PolarisPanel({
  view,
  onView,
  focusKey,
  revealKey,
  onQuickCapture,
  showTabs,
  className = "",
}: Props) {
  return (
    <section aria-label={UI.chat.title} className={`flex min-h-0 min-w-0 flex-col ${className}`}>
      {showTabs ? (
        <header className="punteado-b flex h-14 shrink-0 items-stretch gap-7 px-6 md:px-8">
          <nav aria-label={UI.nav.label} className="flex items-stretch gap-7">
            {NAV.map(({ key, label }) => {
              const active = view === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => onView(key)}
                  className={`etiqueta relative flex items-center transition-colors duration-150 ${
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
            onClick={onQuickCapture}
            className="etiqueta my-auto ml-auto flex min-h-9 items-center gap-2 rounded-full border border-trazo px-4 text-ceniza transition-colors duration-150 hover:border-crema hover:text-crema"
          >
            <Plus size={13} weight="regular" aria-hidden="true" />
            {UI.inbox.capture}
          </button>
        </header>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {view === "today" ? (
          <TodayView revealKey={revealKey} />
        ) : (
          <InboxView focusKey={focusKey} revealKey={revealKey} />
        )}
      </div>
    </section>
  );
}
