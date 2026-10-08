import { ChatCircle } from "@phosphor-icons/react";
import { MotionConfig } from "motion/react";
import { useEffect, useState } from "react";
import { Isotipo } from "../brand/Isotipo";
import { Wordmark } from "../brand/Wordmark";
import { ChatPanel } from "../chat/ChatPanel";
import { UI } from "../copy/es";
import { CHAPTERS } from "../demo/script";
import { CHAPTER_VIEW, NAV, type View } from "../polaris/nav";
import { PolarisShell } from "../polaris/PolarisShell";
import { Controls } from "./Controls";
import { DemoProvider, useDemo } from "./DemoContext";
import { chapterIndex } from "./session";

export function DemoApp() {
  return (
    <DemoProvider>
      <MotionConfig reducedMotion="user">
        <Layout />
      </MotionConfig>
    </DemoProvider>
  );
}

function Layout() {
  const { session } = useDemo();
  const [view, setView] = useState<View>("today");
  /** En el cel se ve una cosa a la vez: el chat o Polaris. */
  const [mobileChat, setMobileChat] = useState(true);
  const [unseen, setUnseen] = useState(false);
  const [focusKey, setFocusKey] = useState(0);

  const index = chapterIndex(session);
  useEffect(() => {
    const key = CHAPTERS[index]?.key;
    setView((key && CHAPTER_VIEW[key]) || "today");
    setMobileChat(true);
  }, [index]);

  // En el cel, si algo cae en Polaris mientras ves el chat, la pestaña lo avisa con un punto.
  const itemsVersion = session.demo.items.map((i) => `${i.id}:${i.status}:${i.dueDay}`).join();
  useEffect(() => {
    if (itemsVersion && mobileChat) setUnseen(true);
  }, [itemsVersion, mobileChat]);
  useEffect(() => {
    if (!mobileChat) setUnseen(false);
  }, [mobileChat]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: al saltar de capítulo no hay nada nuevo que avisar.
  useEffect(() => setUnseen(false), [session.replayKey]);

  function openView(next: View) {
    setView(next);
    setMobileChat(false);
  }

  return (
    <div className="min-h-dvh bg-midnight pb-20 md:pb-0">
      <h1 className="sr-only">Un día con Polaris</h1>
      <header className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <Isotipo size={28} title="Polaris" />
          <Wordmark className="text-small text-fg" />
        </div>
        <p className="text-caption text-fg-muted">{UI.demoLabel}</p>
      </header>

      <main className="mx-auto flex max-w-[1400px] flex-col gap-5 px-4 md:px-8 md:pb-8">
        <Controls />
        <div className="grid h-[72dvh] min-h-[480px] overflow-hidden rounded-xl border border-line bg-base md:h-[min(780px,calc(100dvh-240px))] md:min-h-[560px] md:grid-cols-[320px_1fr] lg:grid-cols-[380px_1fr]">
          <ChatPanel
            className={`border-line md:flex md:border-r ${mobileChat ? "flex" : "hidden"}`}
          />
          <PolarisShell
            className={mobileChat ? "hidden md:grid" : "grid"}
            view={view}
            onView={setView}
            focusKey={focusKey}
            onQuickCapture={() => {
              setView("inbox");
              setFocusKey((k) => k + 1);
            }}
          />
        </div>
      </main>

      <nav
        aria-label={UI.nav.label}
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 border-t border-line bg-raised pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <TabButton active={mobileChat} label={UI.nav.chat} onClick={() => setMobileChat(true)}>
          <ChatCircle size={22} aria-hidden="true" />
        </TabButton>
        {NAV.map(({ key, label, icon: Icon }) => (
          <TabButton
            key={key}
            active={!mobileChat && view === key}
            label={label}
            dot={unseen && key === view}
            onClick={() => openView(key)}
          >
            <Icon size={22} aria-hidden="true" />
          </TabButton>
        ))}
      </nav>
    </div>
  );
}

function TabButton(props: {
  active: boolean;
  label: string;
  dot?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-current={props.active ? "page" : undefined}
      className={`relative flex h-16 flex-col items-center justify-center gap-1 text-caption ${
        props.active ? "text-fg" : "text-fg-muted"
      }`}
    >
      {props.children}
      {props.label}
      {props.dot ? (
        <span className="absolute top-3 left-[calc(50%+8px)] size-2 rounded-full bg-blue" />
      ) : null}
    </button>
  );
}
