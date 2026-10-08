import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Isotipo } from "../brand/Isotipo";
import { UI } from "../copy/es";
import { dayOf, hhmm, longDate } from "../demo/time";

/** Más que esto entre dos lecturas es un salto ("Ir a las…"), no el reloj corriendo. */
const JUMP_MIN = 2;

/**
 * El reloj de la demo. La estrella se queda quieta y el anillo da un cuarto de vuelta cada
 * vez que cambia la hora o saltas en el tiempo: con 4 cortes, un cuarto de vuelta lo deja
 * otra vez alineado con los brazos. El mundo se mueve; el centro permanece.
 */
export function DemoClock({ now }: { now: number }) {
  const minute = Math.floor(now);
  const reduce = useReducedMotion();
  const [turns, setTurns] = useState(0);
  const previous = useRef(minute);

  useEffect(() => {
    const before = previous.current;
    previous.current = minute;
    if (minute === before) return;
    const jumped = Math.abs(minute - before) > JUMP_MIN;
    const newHour = Math.floor(minute / 60) !== Math.floor(before / 60);
    if (jumped || newHour) setTurns((t) => t + 1);
  }, [minute]);

  const date = longDate(dayOf(minute));
  return (
    <div className="flex items-center gap-3 md:gap-4">
      <div className="size-10 shrink-0 md:size-14">
        <Isotipo
          size="100%"
          ringStyle={
            reduce
              ? undefined
              : {
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  transform: `rotate(${turns * 90}deg)`,
                  transition: "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
                }
          }
        />
      </div>
      <div className="flex flex-col">
        <p className="text-caption text-fg-muted first-letter:uppercase">{date}</p>
        <p className="text-h1 tabular-nums md:text-display">
          <span className="sr-only">{UI.controls.clock}: </span>
          {hhmm(minute)}
        </p>
      </div>
    </div>
  );
}
