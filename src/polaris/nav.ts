import { ClockCounterClockwise, type Icon, SunHorizon, Tray } from "@phosphor-icons/react";
import { UI } from "../copy/es";
import type { ChapterKey } from "../demo/script";

/** Vistas que ya existen. Orbit y Direction llegan en D4. */
export type View = "today" | "inbox" | "history";

export const NAV: { key: View; label: string; icon: Icon }[] = [
  { key: "today", label: UI.nav.today, icon: SunHorizon },
  { key: "inbox", label: UI.nav.inbox, icon: Tray },
  { key: "history", label: UI.nav.history, icon: ClockCounterClockwise },
];

/** Al entrar a un capítulo, la UI muestra la vista donde se nota lo que pasa. */
export const CHAPTER_VIEW: Partial<Record<ChapterKey, View>> = {
  brief: "today",
  capture: "today",
  dump: "inbox",
  habit: "history",
  checkin: "history",
  friday: "history",
};
