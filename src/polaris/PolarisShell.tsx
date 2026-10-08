import { Plus } from "@phosphor-icons/react";
import { Isotipo } from "../brand/Isotipo";
import { Wordmark } from "../brand/Wordmark";
import { UI } from "../copy/es";
import { InboxView } from "./InboxView";
import { NAV, type View } from "./nav";
import { TodayView } from "./TodayView";

type Props = {
  view: View;
  onView: (view: View) => void;
  focusKey: number;
  onQuickCapture: () => void;
  className?: string;
};

/** Polaris UI: entender, revisar, reorganizar y decidir. Sidebar + contenido. */
export function PolarisShell({ view, onView, focusKey, onQuickCapture, className = "" }: Props) {
  return (
    <div
      className={`min-h-0 md:grid md:grid-cols-[72px_1fr] lg:grid-cols-[208px_1fr] ${className}`}
    >
      <nav
        aria-label={UI.nav.label}
        className="hidden min-h-0 flex-col gap-1 border-r border-line bg-base p-3 md:flex"
      >
        <div className="mb-3 flex h-10 items-center gap-2.5 px-2.5">
          <Isotipo size={22} />
          <Wordmark className="hidden text-caption text-fg lg:inline" />
        </div>
        {NAV.map(({ key, label, icon: Icon }) => {
          const active = view === key;
          return (
            <button
              key={key}
              type="button"
              aria-label={label}
              aria-current={active ? "page" : undefined}
              onClick={() => onView(key)}
              className={`relative flex h-11 items-center gap-3 rounded-sm px-3 transition-colors duration-150 ${
                active ? "bg-surface text-fg" : "text-fg-soft hover:bg-surface hover:text-fg"
              }`}
            >
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-2 left-0 w-0.5 rounded-full"
                  style={{
                    backgroundImage:
                      "linear-gradient(180deg, var(--color-sky), var(--color-violet))",
                  }}
                />
              ) : null}
              <Icon size={20} aria-hidden="true" />
              <span className="hidden lg:inline">{label}</span>
            </button>
          );
        })}
        <button
          type="button"
          aria-label={UI.inbox.capture}
          onClick={onQuickCapture}
          className="mt-auto flex h-11 items-center gap-3 rounded-sm border border-line px-3 text-fg-soft transition-colors duration-150 hover:bg-surface hover:text-fg"
        >
          <Plus size={20} aria-hidden="true" />
          <span className="hidden lg:inline">{UI.inbox.capture}</span>
        </button>
      </nav>

      <div className="h-full min-h-0 overflow-y-auto bg-base">
        {view === "today" ? <TodayView /> : <InboxView focusKey={focusKey} />}
      </div>
    </div>
  );
}
