import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { useDemo } from "../app/DemoContext";
import { isNewItem } from "../app/session";
import { Isotipo } from "../brand/Isotipo";
import { relativeDay, UI } from "../copy/es";
import { type DayLoad, type OrbitNode, orbitNodes, weekLoad } from "../demo/selectors";
import { DAY_SHORT, dayOf, duration, shortDate, weekday } from "../demo/time";
import {
  CENTER,
  orbitLayout,
  type Placement,
  RING_RADII,
  ringPath,
  SECTORS,
  SIZE,
  sectorLabel,
} from "../orbit/geometry";
import { ItemRow, SectionLabel } from "./ItemRow";

const EASE = [0.16, 1, 0.3, 1] as const;
const MAX_LABEL = 30;

const clip = (text: string) =>
  text.length > MAX_LABEL ? `${text.slice(0, MAX_LABEL - 1).trimEnd()}…` : text;

/** "1 h 45" sin cortarse entre el número y su unidad: en el cel las columnas son angostas. */
const unbroken = (minutes: number) => duration(minutes).replaceAll(" ", "\u00a0");

/** Tu semana: cuánto foco hay planeado cada día contra el tope. El que se pasa, en ámbar. */
function WeekStrip({ week }: { week: DayLoad[] }) {
  return (
    <ul className="grid grid-cols-5 gap-3">
      {week.map((d) => {
        const share = Math.min(1, d.planned / d.max);
        const [dayName = "", dayNumber = ""] = shortDate(d.day).split(" ");
        return (
          <li key={d.day} className="flex min-w-0 flex-col gap-2">
            <p className={`etiqueta ${d.isToday ? "text-crema" : "text-niebla"}`}>
              {dayName} {dayNumber}
            </p>
            <div className="relative h-2" aria-hidden="true">
              <span className="absolute inset-x-0 top-1 border-t border-dashed border-trazo" />
              <span
                className={`absolute top-1 left-0 border-t transition-[width,border-color] duration-700 ease-out ${
                  d.overloaded ? "border-chispa" : "border-crema"
                }`}
                style={{ width: `${Math.round(share * 100)}%` }}
              />
            </div>
            <p className="cifras text-chico text-ceniza">
              {d.planned ? UI.orbit.focus(unbroken(d.planned), unbroken(d.max)) : UI.orbit.free}
            </p>
            {d.overloaded ? <p className="etiqueta text-chispa">{UI.orbit.overloaded}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

function Node({
  node,
  p,
  isNew,
  onHover,
}: {
  node: OrbitNode;
  p: Placement;
  isNew: boolean;
  onHover: (id: string | null) => void;
}) {
  const reduce = useReducedMotion();
  const { item, overdue } = node;
  const loose = item.status === "inbox";
  return (
    <motion.g
      initial={reduce || !isNew ? false : { opacity: 0, scale: 0.3, x: p.x, y: p.y }}
      animate={{ opacity: 1, scale: 1, x: p.x, y: p.y }}
      exit={{ opacity: 0, scale: 0.3 }}
      transition={{ duration: reduce ? 0 : 0.8, ease: EASE }}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Área de hover más grande que el punto. */}
      <circle r={12} fill="transparent" />
      {loose ? (
        <circle r={4.5} fill="none" stroke="var(--color-chispa)" strokeWidth={1.4} />
      ) : (
        <circle
          r={overdue ? 4.8 : 4}
          fill={overdue ? "var(--color-chispa)" : "var(--color-crema)"}
        />
      )}
    </motion.g>
  );
}

function OrbitMap({ nodes }: { nodes: OrbitNode[] }) {
  const { session } = useDemo();
  const [hovered, setHovered] = useState<string | null>(null);
  const today = dayOf(Math.floor(session.now));
  const layout = orbitLayout(
    nodes.map((n) => ({ id: n.item.id, area: n.item.area, ring: n.ring })),
  );
  const focus = nodes.find((n) => n.item.id === hovered);
  const fp = focus ? layout.get(focus.item.id) : null;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="size-full overflow-visible"
        role="img"
        aria-label={UI.orbit.map}
      >
        {RING_RADII.map((r) => (
          <path
            key={r}
            d={ringPath(r)}
            fill="none"
            stroke="var(--color-linea)"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        ))}
        {RING_RADII.map((r, i) => (
          <text
            key={`label-${r}`}
            x={CENTER}
            y={CENTER - r + 4}
            textAnchor="middle"
            fontSize={9}
            letterSpacing="0.08em"
            fill="var(--color-niebla)"
            stroke="var(--color-vacio)"
            strokeWidth={4}
            paintOrder="stroke"
          >
            {UI.orbit.rings[i]?.toUpperCase()}
          </text>
        ))}
        {SECTORS.map((name, i) => {
          const l = sectorLabel(i);
          return (
            <text
              key={name}
              x={l.x}
              y={l.y}
              textAnchor={l.anchor}
              dominantBaseline="middle"
              fontSize={9.5}
              letterSpacing="0.08em"
              fill="var(--color-ceniza)"
            >
              {name.toUpperCase()}
            </text>
          );
        })}
        <AnimatePresence initial={false}>
          {nodes.map((n) => {
            const p = layout.get(n.item.id);
            return p ? (
              <Node
                key={n.item.id}
                node={n}
                p={p}
                isNew={isNewItem(session, n.item.id)}
                onHover={setHovered}
              />
            ) : null;
          })}
        </AnimatePresence>
        {/* El nombre aparece al pasar por el punto, del lado que tiene aire. */}
        {focus && fp ? (
          <text
            x={fp.x > CENTER ? fp.x - 10 : fp.x + 10}
            y={fp.y - 10}
            textAnchor={fp.x > CENTER ? "end" : "start"}
            fontSize={11.5}
            fill="var(--color-crema)"
            stroke="var(--color-vacio)"
            strokeWidth={5}
            paintOrder="stroke"
          >
            {clip(focus.item.title)}
            {focus.item.dueDay !== null ? ` · ${relativeDay(focus.item.dueDay, today)}` : ""}
          </text>
        ) : null}
      </svg>
      {/* Tú, en el centro: lo único que no se mueve. */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Isotipo size={30} />
        <span className="sr-only">{UI.orbit.center}</span>
      </div>
    </div>
  );
}

/** Qué significa cada punto. Sin esto el mapa es bonito pero mudo. */
function Legend() {
  const glyph = "inline-block size-2.5 shrink-0 rounded-full";
  return (
    <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-chico text-ceniza">
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className={`${glyph} bg-crema`} />
        {UI.orbit.legend.dated}
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className={`${glyph} border border-chispa`} />
        {UI.orbit.legend.loose}
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className={`${glyph} bg-chispa`} />
        {UI.orbit.legend.overdue}
      </li>
    </ul>
  );
}

/** La misma información como lista, por anillo: es la vista del cel y la accesible. */
function OrbitList({
  nodes,
  today,
  revealKey,
}: {
  nodes: OrbitNode[];
  today: number;
  revealKey: number;
}) {
  const { session } = useDemo();
  return (
    <div className="flex flex-col gap-6">
      {UI.orbit.rings.map((label, ring) => {
        const inRing = nodes.filter((n) => n.ring === ring);
        if (!inRing.length) return null;
        return (
          <div key={label} className="flex flex-col gap-1">
            <p className="etiqueta text-niebla">{label}</p>
            <ul className="flex flex-col">
              {inRing.map((n) => (
                <ItemRow
                  key={n.item.id}
                  item={n.item}
                  today={today}
                  showUndated
                  isNew={isNewItem(session, n.item.id)}
                  reveal={session.fresh.includes(n.item.id)}
                  revealKey={revealKey}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/** Debajo de este ancho los nombres del mapa quedarían ilegibles: va la lista. */
const MAP_MIN_WIDTH = 440;

/** Ancho disponible, medido antes de pintar para no mostrar el mapa y luego quitarlo. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Orbit: ¿qué está alrededor de tu atención? Si no cabe el mapa, como en el cel, solo lista. */
export function OrbitView({ revealKey = 0 }: { revealKey?: number }) {
  const { session } = useDemo();
  const now = Math.floor(session.now);
  const today = dayOf(now);
  const nodes = orbitNodes(session.demo, now);
  const week = weekLoad(session.demo, now);
  const [asList, setAsList] = useState(false);
  const [mapRef, mapWidth] = useWidth<HTMLElement>();
  const compact = mapWidth < MAP_MIN_WIDTH;
  const list = compact || asList;
  const section = "punteado-t flex flex-col gap-4 pt-5";

  return (
    <div className="mx-auto flex max-w-[620px] flex-col gap-8 px-6 py-8 md:px-8 md:py-10">
      <header className="flex flex-col gap-3">
        <h2 className="text-titular font-normal">{UI.orbit.title}</h2>
        <p className="text-entrada font-light text-ceniza">{UI.orbit.concept}</p>
      </header>

      <section aria-labelledby="orbit-week" className={section}>
        <SectionLabel id="orbit-week">{UI.orbit.week}</SectionLabel>
        <WeekStrip week={week} />
        <p className="sr-only">
          {week
            .map(
              (d) =>
                `${DAY_SHORT[weekday(d.day)]}: ${d.planned ? duration(d.planned) : UI.orbit.free}${d.overloaded ? `, ${UI.orbit.overloaded}` : ""}`,
            )
            .join(". ")}
        </p>
      </section>

      <section ref={mapRef} aria-labelledby="orbit-map" className={section}>
        <div className="flex items-center justify-between gap-4">
          <SectionLabel id="orbit-map">{UI.orbit.map}</SectionLabel>
          {compact ? null : (
            <button
              type="button"
              onClick={() => setAsList((v) => !v)}
              className="etiqueta min-h-9 rounded-full border border-trazo px-4 text-ceniza transition-colors duration-150 hover:border-crema hover:text-crema"
            >
              {asList ? UI.orbit.asMap : UI.orbit.asList}
            </button>
          )}
        </div>
        {nodes.length === 0 ? (
          <p className="font-light text-ceniza">{UI.orbit.empty}</p>
        ) : list ? (
          <OrbitList nodes={nodes} today={today} revealKey={revealKey} />
        ) : (
          <>
            <OrbitMap nodes={nodes} />
            <Legend />
          </>
        )}
      </section>
    </div>
  );
}
