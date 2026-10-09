/** Id del bloque de la demo: a donde llevan "Pruébalo" y el salto del teclado. */
export const DEMO_ID = "demo";

/** Lleva a la demo y le pasa el foco, para que el teclado siga desde ahí. */
export function goToDemo() {
  const demo = document.getElementById(DEMO_ID);
  if (!demo) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  demo.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  demo.focus({ preventScroll: true });
}
