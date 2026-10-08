import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { UI } from "../copy/es";
import { hhmm } from "../demo/time";
import type { Message, Press } from "../demo/types";

/** El ✓ inmediato vive esto antes de editarse con el ack completo (parse ~1 s en el bot). */
const EDIT_DELAY_MS = 900;
const EASE = [0.16, 1, 0.3, 1] as const;

/** El bot escribe con parse_mode HTML y solo usa <b>. Se pinta como texto, nunca como HTML. */
function Rich({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let offset = 0;
  for (const chunk of text.split(/(<b>[^<]*<\/b>)/)) {
    const bold = /^<b>([^<]*)<\/b>$/.exec(chunk);
    parts.push(
      bold ? (
        <strong key={offset} className="font-semibold text-crema">
          {bold[1]}
        </strong>
      ) : (
        chunk
      ),
    );
    offset += chunk.length;
  }
  return <>{parts}</>;
}

type Props = {
  message: Message;
  /** Llegó durante esta sesión (no venía de saltar de capítulo). */
  isNew: boolean;
  onPress: (press: Press, messageId: string) => void;
};

/**
 * Un mensaje, en registro editorial: Polaris habla sin globo, con su etiqueta; lo tuyo va en un
 * globo de tinta. Los botones del bot son píldoras fantasma.
 */
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
      <div className="flex items-center gap-3 py-1">
        <span aria-hidden="true" className="flex-1 border-t border-dashed border-linea" />
        <p className="max-w-[80%] text-center text-chico text-ceniza">{message.text}</p>
        <span aria-hidden="true" className="flex-1 border-t border-dashed border-linea" />
      </div>
    );
  }

  const mine = message.from === "user";
  const text = showFinal ? message.text : (message.editedFrom ?? message.text);
  const stamp = [
    mine ? UI.chat.you : UI.chat.title,
    hhmm(message.at),
    message.editedFrom && showFinal ? UI.chat.edited : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={`flex max-w-[92%] flex-col gap-2 ${mine ? "items-end self-end" : "self-start"}`}
    >
      <p className="etiqueta cifras text-niebla">{stamp}</p>
      <motion.div
        layout={reduce ? false : "size"}
        transition={{ duration: 0.2, ease: EASE }}
        className={`relative ${mine ? "rounded-globo rounded-br-[6px] bg-tinta px-4 py-2.5" : ""}`}
      >
        <p className="whitespace-pre-wrap break-words text-cuerpo text-crema">
          <Rich text={text} />
        </p>
        {message.reaction ? (
          <span className="absolute -bottom-3 left-3 rounded-full border border-linea bg-vacio px-1.5 text-chico">
            {message.reaction}
          </span>
        ) : null}
      </motion.div>

      {message.buttons.length > 0 && showFinal ? (
        <div className="mt-1 flex w-full flex-col gap-2">
          {message.buttons.map((row) => (
            <div key={row.map((b) => b.label).join("|")} className="flex flex-wrap gap-2">
              {row.map((button) => (
                <button
                  key={button.label}
                  type="button"
                  onClick={() => onPress(button.press, message.id)}
                  className="min-h-11 rounded-full border border-trazo px-4 text-chico text-crema transition-[border-color,background-color,transform] duration-150 ease-out hover:border-crema hover:bg-crema/5 active:scale-[0.98]"
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
