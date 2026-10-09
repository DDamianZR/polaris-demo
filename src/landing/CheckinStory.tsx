import { useState } from "react";
import { MessageBubble } from "../chat/MessageBubble";
import { UI } from "../copy/es";
import { step } from "../demo/engine";
import { CHAPTERS, replayTo } from "../demo/script";
import type { DemoState } from "../demo/state";
import { at, MAR, type Minute } from "../demo/time";
import { Band } from "./Band";
import { Pill } from "./Pill";

const CHECKIN = CHAPTERS.findIndex((c) => c.key === "checkin");
const START = at(MAR, "21:30");

type Run = { state: DemoState; now: Minute; from: number };

/** El martes de la demo justo a las 21:30, con el check-in recién llegado. */
function freshRun(): Run {
  const base = replayTo(CHECKIN);
  return { state: step(base, { type: "tick" }, START), now: START + 1, from: base.messages.length };
}

/**
 * "Una decisión, no culpa": el check-in de verdad, con el mismo motor de la demo. La tarjeta se
 * edita en su lugar con cada toque, igual que en Telegram, hasta el resumen de la noche.
 */
export function CheckinStory() {
  const copy = UI.landing.checkin;
  const [run, setRun] = useState(freshRun);
  const card = run.state.messages.slice(run.from).findLast((m) => m.from === "polaris");
  const finished = card !== undefined && card.buttons.length === 0;

  return (
    <Band
      labelledBy="checkin-title"
      className="grid gap-12 py-20 md:py-28 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-20"
    >
      <div>
        <h2 id="checkin-title" className="max-w-[20ch] text-titular font-normal text-balance">
          {copy.title}
        </h2>
        <p className="mt-6 max-w-[52ch] text-entrada font-light text-ceniza">{copy.lead}</p>
      </div>

      <div className="flex flex-col gap-5 lg:pt-3">
        <p className="etiqueta text-niebla">{copy.caption}</p>
        <div aria-live="polite" className="punteado-t flex min-h-[260px] flex-col pt-6">
          {card ? (
            <MessageBubble
              message={card}
              isNew={false}
              onPress={(press, messageId) =>
                setRun((r) => ({
                  ...r,
                  state: step(r.state, { type: "press", press, messageId }, r.now),
                  now: r.now + 1,
                }))
              }
            />
          ) : null}
        </div>
        {finished ? (
          <Pill tone="ghost" onClick={() => setRun(freshRun())} className="self-start">
            {copy.again}
          </Pill>
        ) : null}
      </div>
    </Band>
  );
}
