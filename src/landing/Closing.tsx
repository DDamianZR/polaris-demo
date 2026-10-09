import { useDemo } from "../app/DemoContext";
import { Brand } from "../brand/Brand";
import { Isotipo } from "../brand/Isotipo";
import { UI } from "../copy/es";
import { Band } from "./Band";
import { Pill } from "./Pill";
import { goToDemo } from "./scroll";

/** El cierre tranquilo: todo en su lugar, y dos caminos de vuelta a la demo. */
export function Closing() {
  const copy = UI.landing.closing;
  const { dispatch } = useDemo();
  return (
    <Band labelledBy="cierre-title" className="flex flex-col items-start py-24 md:py-32">
      <Isotipo size={44} />
      <h2
        id="cierre-title"
        className="mt-10 text-reloj-xs font-normal md:text-reloj-sm xl:text-display"
      >
        {copy.title}
      </h2>
      <p className="mt-6 max-w-[46ch] text-entrada font-light text-ceniza">{copy.lead}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Pill tone="iris" onClick={goToDemo}>
          {UI.landing.tryIt}
        </Pill>
        <Pill
          tone="ghost"
          onClick={() => {
            dispatch({ type: "goTo", index: 0 });
            goToDemo();
          }}
        >
          {copy.restart}
        </Pill>
      </div>
    </Band>
  );
}

export function Footer() {
  return (
    <footer className="punteado-t">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-10 gap-y-4 px-6 py-8 md:px-10">
        <Brand />
        <p className="text-chico text-niebla">{UI.landing.closing.footer}</p>
      </div>
    </footer>
  );
}
