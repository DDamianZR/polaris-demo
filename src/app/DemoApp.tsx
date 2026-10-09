import { ChatCircle, DotsThree } from "@phosphor-icons/react";
import { type ReactNode, useEffect, useState } from "react";
import { Brand } from "../brand/Brand";
import { ChatPanel } from "../chat/ChatPanel";
import { relativeDay, UI } from "../copy/es";
import { CHAPTERS } from "../demo/script";
import { dayOf } from "../demo/time";
import { goToDemo } from "../landing/scroll";
import { CHAPTER_VIEW, MOBILE_PRIMARY, NAV, type View } from "../polaris/nav";
import { PolarisPanel } from "../polaris/PolarisPanel";
import { ChapterBar } from "./ChapterBar";
import { CommandPalette } from "./CommandPalette";
import { DayClock } from "./DayClock";
import { useDemo } from "./DemoContext";
import { IdeaMap } from "./IdeaMap";
import { Itinerary } from "./Itinerary";
import { type Command, viewFor } from "./palette";
import { chapterIndex } from "./session";
import { DESKTOP, TABLET, useMediaQuery } from "./useMediaQuery";

/**
 * La demo: chat y Polaris sincronizados con el reloj. Vive dentro de la landing, en un bloque del
 * alto de la pantalla, y toma el estado del DemoProvider de la página.
 */
export function DemoSection() {
  const { session, dispatch } = useDemo();
  const desktop = useMediaQuery(DESKTOP);
  const tablet = useMediaQuery(TABLET);
  const [view, setView] = useState<View>("today");
  /** En el cel se ve una cosa a la vez: el chat o Polaris. */
  const [mobileChat, setMobileChat] = useState(true);
  const [unseen, setUnseen] = useState(false);
  const [focusKey, setFocusKey] = useState(0);
  const [revealKey, setRevealKey] = useState(0);
  /** El menú "Más" del cel, con las vistas que no caben en la barra. */
  const [moreOpen, setMoreOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const index = chapterIndex(session);
  useEffect(() => {
    const key = CHAPTERS[index]?.key;
    setView((key && CHAPTER_VIEW[key]) || "today");
    setMobileChat(true);
    setMoreOpen(false);
  }, [index]);

  // En el cel, si algo cae en Polaris mientras ves el chat, la pestaña lo avisa con un punto.
  // Solo cuando llega algo: cambiar de pestaña no cuenta como novedad.
  const freshKey = session.fresh.join();
  // biome-ignore lint/correctness/useExhaustiveDependencies: el aviso depende solo de lo que llegó.
  useEffect(() => {
    if (freshKey && mobileChat) setUnseen(true);
  }, [freshKey]);
  useEffect(() => {
    if (!mobileChat) setUnseen(false);
  }, [mobileChat]);

  function openView(next: View) {
    setView(next);
    setMobileChat(false);
    setMoreOpen(false);
    setRevealKey((k) => k + 1);
  }

  // Ctrl+K (o ⌘K) desde cualquier parte de la página abre y cierra la paleta.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function capture() {
    openView("inbox");
    setFocusKey((k) => k + 1);
  }

  /** Todo lo de la paleta lleva a la demo: si la abriste desde la portada, ahí aterrizas. */
  const today = dayOf(Math.floor(session.now));
  const commands: Command[] = [
    {
      id: "a-capture",
      group: "actions",
      label: UI.palette.capture,
      keywords: UI.palette.keywords.capture,
      run: () => {
        goToDemo();
        capture();
      },
    },
    {
      id: "a-play",
      group: "actions",
      label: session.playing ? UI.palette.pause : UI.palette.play,
      run: () => {
        goToDemo();
        dispatch({ type: session.playing ? "pause" : "play" });
      },
    },
    {
      id: "a-restart",
      group: "actions",
      label: UI.palette.restart,
      run: () => {
        dispatch({ type: "goTo", index: 0 });
        goToDemo();
      },
    },
    ...NAV.map(
      ({ key, label }): Command => ({
        id: `v-${key}`,
        group: "views",
        label,
        keywords: UI.palette.keywords[key],
        run: () => {
          openView(key);
          goToDemo();
        },
      }),
    ),
    ...CHAPTERS.map(
      (chapter, i): Command => ({
        id: `c-${chapter.key}`,
        group: "chapters",
        label: UI.chapters[chapter.key].title,
        hint: UI.chapters[chapter.key].when,
        run: () => {
          dispatch({ type: "goTo", index: i });
          goToDemo();
        },
      }),
    ),
    ...session.demo.items
      .filter((item) => item.status === "inbox" || item.status === "active")
      .map(
        (item): Command => ({
          id: `i-${item.id}`,
          group: "items",
          label: item.title,
          hint: [
            item.area,
            item.dueDay === null ? UI.inbox.undated : relativeDay(item.dueDay, today),
          ]
            .filter(Boolean)
            .join(" · "),
          run: () => {
            openView(viewFor(item, today));
            goToDemo();
          },
        }),
      ),
  ];

  const panel = (showTabs: boolean, className = "") => (
    <PolarisPanel
      className={className}
      showTabs={showTabs}
      view={view}
      onView={setView}
      focusKey={focusKey}
      revealKey={revealKey}
      onQuickCapture={() => {
        setView("inbox");
        setFocusKey((k) => k + 1);
      }}
      onOpenPalette={() => setPaletteOpen(true)}
    />
  );

  let body: ReactNode;
  if (desktop) {
    body = (
      <div className="grid h-full grid-cols-[minmax(360px,30vw)_minmax(0,1fr)] overflow-hidden">
        <div className="punteado-r flex min-h-0 flex-col px-8 pt-6 pb-6">
          <Brand />
          <div className="mt-10">
            <DayClock now={session.now} size="display" />
          </div>
          <IdeaMap variant="full" withStats className="mt-2 min-h-[180px] flex-1" />
          <Itinerary orientation="vertical" className="punteado-t mt-5 pt-3" />
          <p className="etiqueta mt-4 text-niebla">{UI.demoLabel}</p>
        </div>
        <div className="flex min-h-0 min-w-0 flex-col">
          <ChapterBar size="large" className="punteado-b px-10 pt-7 pb-6" />
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(320px,26vw)_minmax(0,1fr)]">
            <ChatPanel className="punteado-r flex" />
            {panel(true)}
          </div>
        </div>
      </div>
    );
  } else if (tablet) {
    body = (
      <div className="flex h-full flex-col overflow-hidden">
        <header className="punteado-b flex h-14 shrink-0 items-center justify-between px-6">
          <Brand />
          <p className="etiqueta text-niebla">{UI.demoLabel}</p>
        </header>
        <section className="punteado-b grid shrink-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-8 px-6 py-4">
          <DayClock now={session.now} size="sm" />
          <IdeaMap variant="full" withStats className="h-[170px]" />
        </section>
        <ChapterBar size="compact" className="punteado-b px-6 py-4" />
        <Itinerary orientation="horizontal" className="punteado-b px-6" />
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
          <ChatPanel className="punteado-r flex" />
          {panel(true)}
        </div>
      </div>
    );
  } else {
    body = (
      <div className="flex h-full flex-col overflow-hidden">
        {/* En el cel la página ya trae la marca arriba: la demo arranca con el reloj, para que
            la vista tenga más espacio. */}
        <div className="relative flex h-[100px] shrink-0 items-center px-4">
          <IdeaMap
            variant="compact"
            className="pointer-events-none absolute inset-y-0 right-0 w-[56%]"
          />
          <div className="relative">
            <DayClock now={session.now} size="xs" />
          </div>
        </div>
        <ChapterBar size="compact" className="punteado-t px-4 py-3" />
        <Itinerary orientation="horizontal" className="punteado-t punteado-b px-4" />
        <div className="flex min-h-0 flex-1">
          {mobileChat ? <ChatPanel className="flex flex-1" /> : panel(false, "flex-1")}
        </div>
        <div className="relative shrink-0">
          {moreOpen ? (
            <div className="punteado-t absolute inset-x-0 bottom-full flex flex-col bg-vacio px-4 py-2">
              {NAV.filter((n) => !MOBILE_PRIMARY.includes(n.key)).map(
                ({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    aria-current={!mobileChat && view === key ? "page" : undefined}
                    onClick={() => openView(key)}
                    className={`etiqueta flex min-h-12 items-center gap-3 ${
                      !mobileChat && view === key ? "text-crema" : "text-ceniza"
                    }`}
                  >
                    <Icon size={18} weight="light" aria-hidden="true" />
                    {label}
                  </button>
                ),
              )}
            </div>
          ) : null}
          <nav
            aria-label={UI.nav.label}
            className="punteado-t grid grid-cols-4 pb-[env(safe-area-inset-bottom)]"
          >
            <TabButton
              active={mobileChat}
              label={UI.nav.chat}
              onClick={() => {
                setMobileChat(true);
                setMoreOpen(false);
              }}
            >
              <ChatCircle size={20} weight="light" aria-hidden="true" />
            </TabButton>
            {NAV.filter((n) => MOBILE_PRIMARY.includes(n.key)).map(({ key, label, icon: Icon }) => (
              <TabButton
                key={key}
                active={!mobileChat && view === key}
                label={label}
                dot={unseen && key === view}
                onClick={() => openView(key)}
              >
                <Icon size={20} weight="light" aria-hidden="true" />
              </TabButton>
            ))}
            <TabButton
              active={!mobileChat && !MOBILE_PRIMARY.includes(view)}
              label={UI.nav.more}
              dot={unseen && !MOBILE_PRIMARY.includes(view)}
              expanded={moreOpen}
              onClick={() => setMoreOpen((open) => !open)}
            >
              <DotsThree size={20} weight="light" aria-hidden="true" />
            </TabButton>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <>
      {body}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />
    </>
  );
}

function TabButton(props: {
  active: boolean;
  label: string;
  dot?: boolean;
  /** Solo para el botón "Más": dice si su menú está abierto. */
  expanded?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-current={props.active ? "page" : undefined}
      aria-expanded={props.expanded}
      className={`etiqueta relative flex h-16 flex-col items-center justify-center gap-1.5 ${
        props.active ? "text-crema" : "text-niebla"
      }`}
    >
      {props.children}
      {props.label}
      {props.dot ? (
        <span className="absolute top-3 left-[calc(50%+9px)] size-2 rounded-full bg-chispa" />
      ) : null}
    </button>
  );
}
