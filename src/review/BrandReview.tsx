import isotipoWebp from "../../assets/brand/polaris-isotipo.webp";
import logoWebp from "../../assets/brand/polaris-logo.webp";
import { Isotipo } from "../brand/Isotipo";
import { Loader } from "../brand/Loader";
import { Wordmark } from "../brand/Wordmark";

/** El original mide 1254 px y el centro de la estrella cae en (626, 592). */
const ORIGINAL = { size: 1254, cx: 626, cy: 592, box: 600 };
const PANEL = 300;
const scale = PANEL / ORIGINAL.size;

/** Coloca el SVG (caja de 600 centrada en la estrella) sobre la imagen original. */
const overlayStyle = {
  left: (ORIGINAL.cx - ORIGINAL.box / 2) * scale,
  top: (ORIGINAL.cy - ORIGINAL.box / 2) * scale,
} as const;

function Panel({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <figure className="flex flex-col gap-3">
      <div
        className="relative overflow-hidden rounded-lg border border-line"
        style={{ width: PANEL, height: PANEL }}
      >
        {children}
      </div>
      <figcaption className="text-small text-fg-soft">{caption}</figcaption>
    </figure>
  );
}

/** Hoja para aprobar el isotipo vectorizado contra el original. Temporal: se va en D2. */
export function BrandReview() {
  return (
    <section aria-labelledby="brand-title" className="flex flex-col gap-12">
      <div className="flex flex-col gap-2">
        <h2 id="brand-title" className="text-h2">
          Isotipo vectorizado
        </h2>
        <p className="max-w-[65ch] text-fg-soft">
          Medido sobre el original y ajustado con curvas. En "diferencia" lo que coincide se ve
          negro; cualquier desvío brilla.
        </p>
      </div>

      <div className="flex flex-wrap gap-6">
        <Panel caption="Original (.webp)">
          <img src={isotipoWebp} alt="Isotipo original" width={PANEL} height={PANEL} />
        </Panel>
        <Panel caption="SVG">
          <div className="absolute inset-0 bg-[#020715]" />
          <div className="absolute" style={overlayStyle}>
            <Isotipo size={ORIGINAL.box * scale} title="Isotipo en SVG" />
          </div>
        </Panel>
        <Panel caption="Diferencia (original menos SVG)">
          <img src={isotipoWebp} alt="" width={PANEL} height={PANEL} />
          <div className="absolute mix-blend-difference" style={overlayStyle}>
            <Isotipo size={ORIGINAL.box * scale} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-12 md:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-4">
          <h3 className="text-h3">Tamaños chicos</h3>
          <div className="flex items-end gap-6">
            {[16, 20, 24, 32, 48, 64].map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <Isotipo size={size} />
                <span className="text-caption text-fg-muted">{size}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-h3">Loader</h3>
          <p className="text-small text-fg-soft">
            El anillo gira y la estrella se queda quieta. Con reduced motion no gira.
          </p>
          <div className="flex items-end gap-6">
            <Loader size={24} />
            <Loader size={48} />
            <Loader size={96} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-h3">Logo completo</h3>
        <div className="flex flex-wrap items-center gap-12">
          <img
            src={logoWebp}
            alt="Logo original"
            width={240}
            height={240}
            className="rounded-lg border border-line"
          />
          <div className="flex flex-col items-center gap-6">
            <Isotipo size={120} />
            <Wordmark className="text-h1 text-fg" />
          </div>
          <div className="flex items-center gap-3">
            <Isotipo size={28} />
            <Wordmark className="text-small text-fg" />
          </div>
        </div>
      </div>
    </section>
  );
}
