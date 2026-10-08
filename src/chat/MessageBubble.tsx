import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { UI } from "../copy/es";
import { hhmm } from "../demo/time";
import type { Message, Press } from "../demo/types";

/** El ✓ inmediato vive esto antes de editarse con el ack completo (parse ~1 s en el bot). */
const EDIT_DELAY_MS = 900;
const EASE = [0.16, 1, 0.3, 1] as const;

type Props = {
  message: Message;
  /** Llegó durante esta sesión (no venía de saltar de capítulo). */
  isNew: boolean;
  onPress: (press: Press, messageId: string) => void;
};

export function MessageBubble({ message, isNew, onPress }: Props) {
  const reduce = useReducedMotion();
  const animateEdit = isNew && message.editedFrom !== null && !reduce;
  const [showFinal, setShowFinal] = useState(!animateEdit);

  useEffect(() => {
    if (showFinal) return;
    const id = window.setTimeout(() => setShowFinal(true), EDIT_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [showFinal]);

  if (message.from === "system") {
    return (
      <p className="mx-auto my-2 max-w-[90%] rounded-sm bg-surface px-3 py-2 text-center text-caption text-fg-soft">
        {message.text}
      </p>
    );
  }

  const mine = message.from === "user";
  const text = showFinal ? message.text : (message.editedFrom ?? message.text);

  return (
    <div
      className={`flex max-w-[88%] flex-col gap-1.5 ${mine ? "self-end items-end" : "self-start"}`}
    >
      <motion.div
        layout={reduce ? false : "size"}
        transition={{ duration: 0.2, ease: EASE }}
        className={`relative rounded-md px-3 py-2 ${
          mine
            ? "rounded-br-xs bg-[color-mix(in_srgb,var(--color-blue)_22%,var(--color-surface))]"
            : "rounded-bl-xs bg-surface"
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-body">{text}</p>
        <p className="mt-0.5 text-right text-caption font-normal text-fg-muted tabular-nums">
          {message.editedFrom && showFinal ? `${UI.chat.edited} · ` : ""}
          {hhmm(message.at)}
        </p>
        {message.reaction ? (
          <span className="absolute -bottom-3 left-2 rounded-full border border-line bg-elevated px-1.5 text-caption">
            {message.reaction}
          </span>
        ) : null}
      </motion.div>

      {message.buttons.length > 0 && showFinal ? (
        <div className="flex w-full flex-col gap-1.5">
          {message.buttons.map((row) => (
            <div
              key={row.map((b) => b.label).join("|")}
              className="grid auto-cols-fr grid-flow-col gap-1.5"
            >
              {row.map((button) => (
                <button
                  key={button.label}
                  type="button"
                  onClick={() => onPress(button.press, message.id)}
                  className="min-h-11 rounded-sm border border-line bg-raised px-2 text-small text-fg transition-[background-color,transform] duration-150 ease-out hover:bg-elevated active:scale-[0.98]"
                >
                  {button.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
