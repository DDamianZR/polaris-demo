import { useId } from "react";
import { GRADIENT, RING, RING_PATH, STAR_FILL, STAR_PATH, VIEWBOX } from "./geometry";

type Props = {
  size?: number | string;
  /** Texto para lectores de pantalla. Sin él, el isotipo es decorativo. */
  title?: string;
  className?: string;
  /** Clase del grupo del anillo, p. ej. para girarlo en el loader. */
  ringClassName?: string;
};

export function Isotipo({ size = 32, title, className, ringClassName }: Props) {
  // useId trae caracteres que rompen url(#…); se dejan solo letras y números.
  const gradientId = `polaris-ring-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const content = (
    <>
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={-RING.outer}
          y1={0}
          x2={RING.outer}
          y2={0}
        >
          <stop offset={0} stopColor={GRADIENT.from} />
          <stop offset={1} stopColor={GRADIENT.to} />
        </linearGradient>
      </defs>
      <g className={ringClassName}>
        <path fill={`url(#${gradientId})`} d={RING_PATH} />
      </g>
      <path fill={STAR_FILL} fillRule="evenodd" d={STAR_PATH} />
    </>
  );

  if (title) {
    return (
      <svg viewBox={VIEWBOX} width={size} height={size} className={className} role="img">
        <title>{title}</title>
        {content}
      </svg>
    );
  }
  return (
    <svg viewBox={VIEWBOX} width={size} height={size} className={className} aria-hidden="true">
      {content}
    </svg>
  );
}
