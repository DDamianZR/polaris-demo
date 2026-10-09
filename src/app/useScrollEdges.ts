import { useEffect, useState } from "react";

export type Edges = { overflows: boolean; atStart: boolean; atEnd: boolean };

const NONE: Edges = { overflows: false, atStart: true, atEnd: true };

/**
 * Si un carril horizontal se desborda y en qué orilla va. Se recalcula al cambiar de tamaño, de
 * contenido o al deslizarlo. Ref por callback: el carril puede aparecer después del primer render.
 */
export function useScrollEdges<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [edges, setEdges] = useState<Edges>(NONE);

  useEffect(() => {
    if (!el) return;
    const measure = () => {
      const next: Edges = {
        overflows: el.scrollWidth > el.clientWidth + 1,
        atStart: el.scrollLeft <= 1,
        atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
      };
      setEdges((prev) =>
        prev.overflows === next.overflows &&
        prev.atStart === next.atStart &&
        prev.atEnd === next.atEnd
          ? prev
          : next,
      );
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    const content = new MutationObserver(measure);
    content.observe(el, { childList: true, subtree: true, characterData: true });
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      resize.disconnect();
      content.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [el]);

  return { ref: setEl, el, edges };
}

/** La orilla que todavía esconde algo se desvanece; si cabe todo, nada se desvanece. */
export function edgeMask(edges: Edges): string {
  if (!edges.overflows) return "";
  if (edges.atStart) return "[mask-image:linear-gradient(to_right,black_85%,transparent)]";
  if (edges.atEnd) return "[mask-image:linear-gradient(to_left,black_85%,transparent)]";
  return "[mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]";
}
