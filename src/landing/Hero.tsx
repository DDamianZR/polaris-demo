import { IdeaMap } from "../app/IdeaMap";
import { UI } from "../copy/es";
import { Pill } from "./Pill";
import { goToDemo } from "./scroll";

/** La portada: la promesa en grande y, a un lado, el cerebro con las ideas de la semana. */
export function Hero() {
  const copy = UI.landing.hero;
  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto grid max-w-[1280px] gap-10 px-6 pt-8 pb-20 md:px-10 md:pt-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:gap-16 lg:pb-28"
    >
      <div>
        <h1
          id="hero-title"
          className="max-w-[11ch] text-reloj-xs font-normal text-balance md:text-reloj-sm xl:text-display"
        >
          {copy.title}
        </h1>
        <p className="mt-8 max-w-[44ch] text-entrada font-light text-ceniza">{copy.lead}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Pill tone="iris" onClick={goToDemo}>
            {UI.landing.tryIt}
          </Pill>
          <Pill tone="ghost" href="#captura">
            {copy.how}
          </Pill>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <p className="etiqueta text-niebla">{copy.brain}</p>
        <IdeaMap variant="full" withStats className="h-[300px] md:h-[420px] lg:h-[500px]" />
      </div>
    </section>
  );
}
