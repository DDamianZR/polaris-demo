import type { ReactNode } from "react";

const BASE =
  "inline-flex min-h-11 items-center justify-center rounded-full px-6 text-[13px] tracking-[0.06em] whitespace-nowrap uppercase transition-[filter,transform,border-color,color] duration-150 ease-out active:scale-[0.98]";

/** Violeta solo para la acción principal de cada zona; lo demás va fantasma. */
const TONES = {
  iris: "bg-iris font-semibold text-sobre-iris hover:brightness-110",
  ghost: "border border-trazo font-medium text-ceniza hover:border-crema hover:text-crema",
} as const;

type Props = {
  tone: keyof typeof TONES;
  children: ReactNode;
  onClick?: () => void;
  /** Con href es un enlace dentro de la página; sin él, un botón. */
  href?: string;
  className?: string;
};

export function Pill({ tone, children, onClick, href, className = "" }: Props) {
  const classes = `${BASE} ${TONES[tone]} ${className}`;
  if (href) {
    return (
      <a href={href} onClick={onClick} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
