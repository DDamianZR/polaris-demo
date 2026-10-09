import { MotionConfig } from "motion/react";
import { DemoSection } from "../app/DemoApp";
import { DemoProvider } from "../app/DemoContext";
import { Brand } from "../brand/Brand";
import { UI } from "../copy/es";
import { CaptureStory } from "./CaptureStory";
import { CheckinStory } from "./CheckinStory";
import { Closing, Footer } from "./Closing";
import { Hero } from "./Hero";
import { Pill } from "./Pill";
import { Promises } from "./Promises";
import { DEMO_ID, goToDemo } from "./scroll";

function Nav() {
  return (
    <header className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-6 px-6 md:px-10">
      <a href="#top" className="rounded-full">
        <Brand />
      </a>
      <div className="flex items-center gap-6">
        <p className="etiqueta hidden text-niebla md:block">{UI.demoLabel}</p>
        <Pill tone="ghost" onClick={goToDemo}>
          {UI.landing.tryIt}
        </Pill>
      </div>
    </header>
  );
}

/**
 * Una sola página. La demo es la sección del centro y ocupa la pantalla completa; lo de arriba y
 * lo de abajo cuenta beneficios. Un solo estado de demo para todo: el cerebro de la portada es el
 * mismo que el de la demo.
 */
export function Landing() {
  const demo = UI.landing.demo;
  return (
    <DemoProvider>
      <MotionConfig reducedMotion="user">
        <a
          href={`#${DEMO_ID}`}
          onClick={(e) => {
            e.preventDefault();
            goToDemo();
          }}
          className="etiqueta sr-only z-50 rounded-full bg-crema text-vacio focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:px-5 focus:py-3"
        >
          {UI.landing.skip}
        </a>
        <div id="top">
          <Nav />
        </div>
        <main>
          <Hero />
          <CaptureStory />
          {/* La demo va a todo lo ancho y del alto de la pantalla, debajo de su título. */}
          <section aria-labelledby="demo-title" className="punteado-t">
            <div className="mx-auto max-w-[1280px] px-6 pt-20 pb-10 md:px-10 md:pt-28">
              <h2 id="demo-title" className="text-titular font-normal">
                {demo.title}
              </h2>
              <p className="mt-6 max-w-[52ch] text-entrada font-light text-ceniza">{demo.lead}</p>
              {/* En el cel la nav no muestra la etiqueta de datos de ejemplo: va aquí. */}
              <p className="etiqueta mt-5 text-niebla md:hidden">{UI.demoLabel}</p>
            </div>
            <div
              id={DEMO_ID}
              tabIndex={-1}
              className="punteado-t h-dvh min-h-[560px] focus-visible:outline-none"
            >
              <DemoSection />
            </div>
          </section>
          <CheckinStory />
          <Promises />
          <Closing />
        </main>
        <Footer />
      </MotionConfig>
    </DemoProvider>
  );
}
