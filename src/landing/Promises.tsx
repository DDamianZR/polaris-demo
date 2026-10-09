import { UI } from "../copy/es";
import { Band } from "./Band";

/**
 * Columnas de cada promesa en la cuadrícula de 6: la primera abre a todo lo ancho y las demás
 * se cruzan (ancha y angosta, angosta y ancha), para que no parezcan tarjetas iguales.
 */
const SPANS = ["md:col-span-6", "md:col-span-4", "md:col-span-2", "md:col-span-2", "md:col-span-4"];

/** Lo que Polaris te promete, como lista asimétrica. */
export function Promises() {
  const copy = UI.landing.promises;
  return (
    <Band labelledBy="promesas-title" className="py-20 md:py-28">
      <h2 id="promesas-title" className="text-titular font-normal">
        {copy.title}
      </h2>
      <ul className="mt-12 grid gap-x-12 md:grid-cols-6">
        {copy.items.map((promise, i) => (
          <li
            key={promise.title}
            className={`punteado-t pt-6 pb-12 ${SPANS[i] ?? ""} ${
              i === 0 ? "md:grid md:grid-cols-2 md:items-end md:gap-12" : ""
            }`}
          >
            <h3
              className={`font-normal text-balance ${i === 0 ? "max-w-[20ch] text-reloj-xs" : "text-titulo"}`}
            >
              {promise.title}
            </h3>
            <p
              className={`mt-4 max-w-[46ch] text-ceniza ${i === 0 ? "text-entrada font-light md:mt-0" : "text-cuerpo"}`}
            >
              {promise.body}
            </p>
          </li>
        ))}
      </ul>
    </Band>
  );
}
