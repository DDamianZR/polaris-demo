import { Bell, CheckCircle, Circle, Lightbulb } from "@phosphor-icons/react";
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

function Icon({ item }: { item: Item }) {
  const props = { size: 20, className: "mt-0.5 shrink-0 text-fg-muted", "aria-hidden": true };
  if (item.status === "done") return <CheckCircle {...props} />;
  if (item.kind === "reminder") return <Bell {...props} />;
  if (item.kind === "idea") return <Lightbulb {...props} />;
  return <Circle {...props} />;
}

/** Una tarea como la pide docs/ux.md: el título y solo la metadata que importa. */
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
  const when =
    showDay && item.dueDay !== null
      ? `${relativeDay(item.dueDay, today)}${item.dueAt !== null ? ` ${hhmm(item.dueAt)}` : ""}`
      : showUndated && item.dueDay === null
        ? UI.inbox.undated
        : null;
  const meta = [
    when,
    item.context ?? item.area,
    item.estimateMin ? duration(item.estimateMin) : null,
  ].filter(Boolean);
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
              backgroundColor: "color-mix(in srgb, var(--color-blue) 16%, transparent)",
            }
      }
      animate={{
        opacity: 1,
        y: 0,
        backgroundColor: "color-mix(in srgb, var(--color-blue) 0%, transparent)",
      }}
      transition={{ duration: 0.22, ease: EASE, backgroundColor: { duration: 1.6 } }}
      className="-mx-2 flex gap-3 rounded-sm px-2 py-2"
    >
      <Icon item={item} />
      <div className="min-w-0">
        <p className={done ? "text-fg-muted line-through decoration-faint" : ""}>{item.title}</p>
        {meta.length ? <p className="text-small text-fg-muted">{meta.join(" · ")}</p> : null}
      </div>
    </motion.li>
  );
}

export function SectionLabel({ id, children }: { id: string; children: string }) {
  return (
    <h3 id={id} className="text-caption text-fg-muted">
      {children}
    </h3>
  );
}
