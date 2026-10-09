# Demo web de Polaris

Demo interactiva de Polaris, un asistente personal de planeación que vive en Telegram. Le escribes lo que traes en la cabeza; Polaris le pone fecha, lo acomoda y te avisa cuando importa.

**Pruébala:** https://ddamianzr.github.io/polaris-demo/

La demo cuenta "Un día con Polaris" en 8 momentos: el brief de la mañana, una captura en lenguaje natural, un volcado de ideas, un hábito, una negociación de tiempo, un plan por pasos, el check-in de la noche y lo que pasa si Polaris se apaga. A un lado va el chat, como en Telegram; al otro, la interfaz de Polaris (Today, Inbox, Orbit, Direction y History), sincronizados con un reloj simulado.

## Qué es y qué no

- **Datos de ejemplo.** La semana, los pendientes y la persona son ficticios.
- **100 % estática.** No hay servidor ni modelo de lenguaje. Lo que el Polaris real entiende de cada mensaje va escrito en el guion; el texto libre cae al Inbox tal cual, como pasa con el Polaris real cuando no sabe cuándo es algo.
- **Lo que escribes no sale de tu navegador.**

## Correrla

Necesita Node 24.

```bash
npm install
npm run dev
```

- `npm run check`: formato, lint, tipos, pruebas y build, todo junto.
- `npm test`: solo las pruebas.

## Cómo está hecha

- Vite, React 19 y TypeScript, con Tailwind v4, motion, Phosphor e Inter.
- `src/demo/`: el motor, en TypeScript puro y sin React. Es un reducer `step(state, action, now)` que nunca lee el reloj, con la semana de ejemplo, los flujos de Polaris y el guion de los 8 capítulos. Tiene pruebas por capítulo.
- `src/app/`, `src/chat/` y `src/polaris/`: la demo (reloj, chat y vistas).
- `src/landing/`: la página alrededor de la demo.
- `src/synapse/`: el cerebro de partículas en canvas.
- `src/copy/es.ts`: todos los textos, en español.
- `docs/diseno.md`: el sistema visual (Sinapsis). `docs/ux.md`: el concepto y las reglas de experiencia.
- `PLAN.md`: las fases con las que se construyó y sus decisiones.

Se publica sola en GitHub Pages con cada cambio a `main` (`.github/workflows/pages.yml`).
