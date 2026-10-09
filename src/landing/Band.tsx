import type { ReactNode } from "react";

type Props = {
  /** Id del título de la sección, para que los lectores de pantalla la nombren. */
  labelledBy: string;
  id?: string;
  /** Clases del contenido (espaciado y cuadrícula). */
  className?: string;
  children: ReactNode;
};

/** Una sección de la landing: el punteado cruza de orilla a orilla y el contenido va centrado. */
export function Band({ labelledBy, id, className = "", children }: Props) {
  return (
    <section id={id} aria-labelledby={labelledBy} className="punteado-t">
      <div className={`mx-auto max-w-[1280px] px-6 md:px-10 ${className}`}>{children}</div>
    </section>
  );
}
