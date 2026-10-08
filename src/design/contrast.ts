/** Contraste WCAG 2.x entre dos colores `#rrggbb`. */

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) throw new Error(`Color inválido: ${hex}`);
  const [r, g, b] = match.slice(1).map((part) => channel(Number.parseInt(part, 16)));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

/** Lee los `--color-*` del bloque `@theme` de un CSS. */
export function themeColors(css: string): Record<string, string> {
  const theme = /@theme\s*{([\s\S]*?)\n}/.exec(css)?.[1] ?? "";
  const colors: Record<string, string> = {};
  for (const [, name, value] of theme.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6});/gi)) {
    if (name && value) colors[name] = value;
  }
  return colors;
}
