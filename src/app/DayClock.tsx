import { UI } from "../copy/es";
import { dayOf, hhmm, longDate } from "../demo/time";

const SIZES = {
  display: "text-display",
  sm: "text-reloj-sm",
  xs: "text-reloj-xs",
} as const;

/** El reloj del día: la fecha como etiqueta y la hora como display. */
export function DayClock({ now, size }: { now: number; size: keyof typeof SIZES }) {
  const minute = Math.floor(now);
  return (
    <div className="flex flex-col gap-2">
      <p className="etiqueta text-niebla">{longDate(dayOf(minute))}</p>
      <p className={`cifras font-normal ${SIZES[size]}`}>
        <span className="sr-only">{UI.controls.clock}: </span>
        {hhmm(minute)}
      </p>
    </div>
  );
}
