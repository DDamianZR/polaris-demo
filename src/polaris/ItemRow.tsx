import { Bell, Check, Lightbulb } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { relativeDay, UI } from "../copy/es";
import { duration, hhmm } from "../demo/time";
import type { Item } from "../demo/types";

const EASE = [0.16, 1, 0.3, 1] as const;

type Props = {
  item: Item;
  today: number;
  showDay?: boolean;
  /** Llegó en esta sesión: entra con un destello breve para que se vea dónde cayó. */
  isNew?: boolean;
  /** Lo trajo la última acción: la vista se mueve hasta aquí. */
  reveal?: boolean;
  /** En el Inbox, lo que no tiene fecha lo dice: es lo que queda por ordenar. */
  showUndated?: boolean;
  /** Cambia al abrir la vista (en el cel estaba escondida): vuelve a llevarla a lo nuevo. */
  revealKey?: number;
};

/** La neurona del pendiente, como en el mapa de ideas: suelta en ámbar, conectada en crema. */
function Glyph({ item }: { item: Item }) {
  const box = "mt-1 grid size-4 shrink-0 place-items-center";
  if (item.status === "done") {
    return (
      <span className={box}>
        <Check size={14} weight="regular" className="text-sinapsis-texto" aria-hidden="true" />
      </span>
    );
  }
  if (item.kind === "reminder") {
    return (
      <span className={box}>
        <Bell size={15} weight="light" className="text-ceniza" aria-hidden="true" />
      </span>
    );
  }
  if (item.kind === "idea") {
    return (
      <span className={box}>
        <Lightbulb size={15} weight="light" className="text-chispa" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className={box} aria-hidden="true">
      {item.status === "inbox" ? (
        <span className="size-2.5 rounded-full border border-chispa" />
      ) : (
        <span className="size-2 rounded-full bg-crema" />
      )}
    </span>
  );
}

/** Un pendiente: el título y solo la metadata que importa. */
export function ItemRow({
  item,
  today,
  showDay = true,
  isNew = false,
  reveal = false,
  showUndated = false,
  revealKey = 0,
}: Props) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLLIElement>(null);
  // Al aparecer (o al abrir su vista): si cayó fuera de la vista, la vista va hacia él.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a propósito, solo al montar o al abrir la vista.
  useEffect(() => {
    if (reveal)
      ref.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [revealKey]);

  const loose = showUndated && item.dueDay === null && item.status !== "done";
  const when =
    showDay && item.dueDay !== null
      ? `${relativeDay(item.dueDay, today)}${item.dueAt !== null ? ` ${hhmm(item.dueAt)}` : ""}`
      : null;
  const rest = [item.context ?? item.area, item.estimateMin ? duration(item.estimateMin) : null];
  const meta = [when, ...rest].filter(Boolean);
  const done = item.status === "done";

  return (
    <motion.li
      ref={ref}
      initial={
        reduce || !isNew
          ? false
          : {
              opacity: 0,
              y: 6,
              backgroundColor: "color-mix(in srgb, var(--color-chispa) 12%, transparent)",
            }
      }
      animate={{
        opacity: 1,
        y: 0,
        backgroundColor: "color-mix(in srgb, var(--color-chispa) 0%, transparent)",
      }}
      transition={{ duration: 0.22, ease: EASE, backgroundColor: { duration: 1.6 } }}
      className="-mx-3 flex gap-3 rounded-globo px-3 py-2.5"
    >
      <Glyph item={item} />
      <div className="min-w-0">
        <p className={done ? "text-niebla line-through decoration-linea" : "text-crema"}>
          {item.title}
        </p>
        {loose || meta.length ? (
          <p className="text-chico text-niebla">
            {loose ? <span className="text-chispa">{UI.inbox.undated}</span> : null}
            {loose && meta.length ? " · " : null}
            {meta.join(" · ")}
          </p>
        ) : null}
      </div>
    </motion.li>
  );
}

/** Etiqueta de sección: mayúsculas tenues sobre un punteado que separa la estructura. */
export function SectionLabel({ id, children }: { id: string; children: string }) {
  return (
    <h4 id={id} className="etiqueta text-niebla">
      {children}
    </h4>
  );
}
