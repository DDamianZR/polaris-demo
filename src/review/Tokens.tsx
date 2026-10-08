const BACKGROUNDS = [
  ["midnight", "bg-midnight", "#070A14"],
  ["base", "bg-base", "#0B1020"],
  ["raised", "bg-raised", "#0F1525"],
  ["surface", "bg-surface", "#131A2A"],
  ["elevated", "bg-elevated", "#182033"],
  ["line", "bg-line", "#222B40"],
] as const;

const TEXTS = [
  ["fg", "text-fg", "#F5F7FA", "Lo tenemos."],
  ["fg-soft", "text-fg-soft", "#A7B0C0", "Esto puede esperar."],
  ["fg-muted", "text-fg-muted", "#808A9E", "Lo dejamos para después."],
] as const;

const TYPE_SCALE = [
  ["Display 48/56", "text-display", "Todo en orden."],
  ["H1 32/40", "text-h1", "Tu día está bajo control."],
  ["H2 24/32", "text-h2", "¿Qué tienes en la cabeza?"],
  ["H3 18/26", "text-h3", "Cálculo Multivariable"],
  ["Body 15/24", "text-body", "Resolver ejercicios del tema 4."],
  ["Small 13/20", "text-small", "Jueves · Proyecto ADS"],
  ["Caption 12/18", "text-caption", "EN CURSO · 45 MIN"],
] as const;

/** Hoja de revisión de los tokens de docs/ux.md. Temporal: se va en D2. */
export function Tokens() {
  return (
    <section aria-labelledby="tokens-title" className="flex flex-col gap-12">
      <h2 id="tokens-title" className="text-h2">
        Tokens
      </h2>

      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-3">
          <h3 className="text-small text-fg-muted">Fondos</h3>
          <ul className="grid grid-cols-3 gap-3">
            {BACKGROUNDS.map(([name, bg, hex]) => (
              <li key={name} className="flex flex-col gap-2">
                <span className={`h-14 rounded-md border border-line ${bg}`} />
                <span className="text-caption text-fg-soft">
                  {name} {hex}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-small text-fg-muted">Texto y marca</h3>
          <ul className="flex flex-col gap-2">
            {TEXTS.map(([name, cls, hex, sample]) => (
              <li key={name} className={cls}>
                {sample} <span className="text-caption">{`${name} ${hex}`}</span>
              </li>
            ))}
            <li className="text-blue">Enlace en Electric Blue #3B82F6</li>
            <li>
              <span
                className="inline-block h-1 w-40 rounded-full"
                style={{ backgroundImage: "var(--gradient-brand)" }}
              />
              <span className="ml-3 text-caption text-fg-soft">Gradiente #22A8F0 → #7C3AED</span>
            </li>
            <li>
              <button
                type="button"
                className="mt-2 rounded-sm bg-blue px-4 py-2 font-medium text-midnight transition-transform duration-150 ease-out active:scale-[0.98]"
              >
                Pruébalo
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-small text-fg-muted">Tipografía (Inter)</h3>
        <ul className="flex flex-col gap-4">
          {TYPE_SCALE.map(([label, cls, sample]) => (
            <li key={label} className="grid gap-1 md:grid-cols-[140px_1fr] md:items-baseline">
              <span className="text-caption text-fg-muted">{label}</span>
              <span className={cls}>{sample}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
