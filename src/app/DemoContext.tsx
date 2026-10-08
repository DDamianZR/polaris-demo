import { createContext, type ReactNode, useContext, useEffect, useMemo, useReducer } from "react";
import type { Parsed, Press } from "../demo/types";
import { initialSession, reduceSession, type Session, type SessionAction } from "./session";

const TICK_MS = 100;

type Demo = {
  session: Session;
  dispatch: (action: SessionAction) => void;
  send: (text: string, parsed?: Parsed) => void;
  capture: (text: string, parsed?: Parsed) => void;
  press: (press: Press, messageId: string) => void;
};

const DemoContext = createContext<Demo | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(reduceSession, undefined, initialSession);

  // El reloj solo corre si lo pides. Nunca arranca solo (tampoco con reduced motion).
  useEffect(() => {
    if (!session.playing) return;
    const id = window.setInterval(() => dispatch({ type: "elapse", ms: TICK_MS }), TICK_MS);
    return () => window.clearInterval(id);
  }, [session.playing]);

  const value = useMemo<Demo>(
    () => ({
      session,
      dispatch,
      send: (text, parsed) => dispatch({ type: "act", action: { type: "send", text, parsed } }),
      capture: (text, parsed) =>
        dispatch({ type: "act", action: { type: "capture", text, parsed } }),
      press: (press, messageId) =>
        dispatch({ type: "act", action: { type: "press", press, messageId } }),
    }),
    [session],
  );
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): Demo {
  const demo = useContext(DemoContext);
  if (!demo) throw new Error("useDemo va dentro de <DemoProvider>");
  return demo;
}
