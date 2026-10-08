import {
  ClockCounterClockwise,
  Compass,
  type Icon,
  Planet,
  SunHorizon,
  Tray,
} from "@phosphor-icons/react";
import { UI } from "../copy/es";
import type { ChapterKey } from "../demo/script";

export type View = "today" | "inbox" | "orbit" | "direction" | "history";

/** El orden de docs/ux.md: Today, Inbox, Orbit, Direction, History. */
export const NAV: { key: View; label: string; icon: Icon }[] = [
  { key: "today", label: UI.nav.today, icon: SunHorizon },
  { key: "inbox", label: UI.nav.inbox, icon: Tray },
  { key: "orbit", label: UI.nav.orbit, icon: Planet },
  { key: "direction", label: UI.nav.direction, icon: Compass },
  { key: "history", label: UI.nav.history, icon: ClockCounterClockwise },
];

/** En el cel: Today e Inbox van en la barra; el resto, en "Más" (prioridad móvil del documento). */
export const MOBILE_PRIMARY: View[] = ["today", "inbox"];

/** Al entrar a un capítulo, la UI muestra la vista donde se nota lo que pasa. */
export const CHAPTER_VIEW: Partial<Record<ChapterKey, View>> = {
  brief: "today",
  capture: "today",
  dump: "inbox",
  habit: "history",
  negotiation: "orbit",
  plan: "direction",
  checkin: "history",
  friday: "history",
};
