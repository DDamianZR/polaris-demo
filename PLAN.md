# Plan de la demo web de Polaris

**Estado:** D0 ✅ · D1 ✅ · D2 ✅ · D3 ✅ · D4 ✅ · D5 en curso · **Actualizado:** 2026-10-08 · **Aprobado:** 2026-10-07

## Objetivo

Que un **usuario potencial** entre, juegue un día con Polaris y salga pensando: "por fin no tengo que acordarme de todo". Se habla de beneficios, no de tecnología.

## Principios

1. **Simulada y honesta.** 100 % estática: sin backend ni LLM. La salida del parser va escrita en el guion, y el texto libre cae al Inbox tal cual. Una etiqueta discreta dice "Demo interactiva con datos de ejemplo".
2. **El sistema de diseño manda.** `docs/diseno.md` (Sinapsis) fija la paleta, la tipografía y la composición; `docs/ux.md`, el concepto, el tono y la accesibilidad.
3. **El motor es puro.** `src/demo/` es TS sin React, con `now` inyectado y pruebas, igual que el dominio del bot.
4. **Aislada del bot.** Rama huérfana; lo que haga falta del bot se copia, no se importa.

## Formato: chat + Polaris UI sincronizados

A un lado va el chat, donde escribe el visitante. Al otro va la UI de Polaris (Today, Inbox, Orbit, Direction y History), que reacciona en vivo. Es la división del documento: Telegram sirve para capturar y la UI para orientarse.

Un reloj simulado recorre "Un día con Polaris", y Polaris escribe por su cuenta solo cuando toca. El visitante usa chips con frases sugeridas (que muestran cómo se estructura todo) o texto libre (que va al Inbox: "Lo tenemos. Lo ordenamos después.").

## Página (landing para usuarios)

1. Nav: isotipo + wordmark + "Pruébalo". Mide 72 px o menos y va en una línea.
2. Hero dividido: "Por fin no tienes que acordarte de todo.", un subtexto de 20 palabras o menos, "Pruébalo", y la vista Today real a la derecha.
3. "Primero captura. Después organizamos.": el texto crudo se vuelve "tarea · jue · Sistemas".
4. Demo "Un día con Polaris".
5. "Cuando algo no se cumple: una decisión, no culpa": el carrusel del check-in con la regla de 3.
6. Lo que Polaris te promete, como lista asimétrica: nada se pierde, cero preguntas, te escribe solo cuando importa, tus datos no salen de tu compu, tú decides.
7. Cierre: "Todo en orden.", el CTA final y el pie de página.

## Capítulos de "Un día con Polaris"

La semana de ejemplo va del lun 12 al dom 18 de oct 2026, y hoy es martes 13. El visitante es un estudiante de ingeniería sin nombre propio: es "tú".

| # | Momento | Chat | UI |
|---|---|---|---|
| 1 | 07:00 Brief | Llega el brief | Today: "Buenos días. Tu día está bajo control." |
| 2 | Captura | "El jueves tengo que entregar sistemas y comprar cables para la práctica." | 2 pendientes con fecha y área. El ack se edita en su lugar |
| 3 | Volcado | 4 mensajes con 👍, luego /listo y un resumen por área | El Inbox se llena y se ordena |
| 4 | Hábito | Desayuno → seguimiento → No → "Pásalo a almuerzo" | Puntos de hábitos en History |
| 5 | Negociación | "Ábreme un espacio para el capítulo, 4 h": jueves → martes, una advertencia y confirmación | Orbit y la semana se reacomodan |
| 6 | Plan | Plan por pasos → "Cabe en 3 semanas a 1 h/día" | Direction: Objetivo → Proyecto → Próxima acción |
| 7 | 21:30 Check-in | Carrusel 1/4. A un pendiente recorrido 3 veces se le quita Recorrer | Lo hecho se atenúa. "Hoy basta con esto." |
| 8 | Viernes | Catch-up tras una caída | History: "De lo que dijiste esta semana, 23 de 24 siguen en algún lado." |

Controles: reproducir/pausa, siguiente momento y saltar a un capítulo. Con reduced motion no hay autoplay.

## Ajustes de contraste (aprobados con el plan)

Medidos con WCAG sobre Midnight `#070A14`:

1. **Muted** `#697386` da 4.1:1 y no pasa AA. Para texto se usa `#808A9E`: 5.7:1 sobre Midnight y 4.7:1 sobre Elevated. El plan proponía `#7D879B`, pero la prueba de contraste mostró que sobre Elevated da 4.49:1. El `#697386` queda para bordes y elementos deshabilitados. Todo esto lo verifica `src/design/contrast.test.ts`.
2. **Violet** `#7C3AED` da 3.5:1. Sirve en el gradiente, en gráficos y en texto de 18 px o más, nunca en texto chico.
3. **Blanco sobre Electric Blue** da 3.4:1. Los botones rellenos llevan texto Midnight (5.4:1), o el azul va solo como contorno o foco.

## Fases

| Fase | Qué queda | Aceptación | Estado |
|---|---|---|---|
| D0 Cimientos | Docs, scaffold, tokens, Inter, Phosphor, Biome, Vitest, isotipo SVG y loader | `npm run check` en verde. El SVG se aprueba lado a lado con el `.webp` | ✅ |
| D1 Motor | fixture, engine, script y reloj, con pruebas por capítulo | `npm test` en verde, todavía sin UI | ✅ |
| D2 Today + Inbox + chat | Estructura responsive y capítulos 1–3 | La captura aparece en Today y el texto libre cae al Inbox | ✅ |
| D3 Hábitos + check-in + History | Capítulos 4, 7 y 8 | Check-in de 4 pendientes a puro tap y la regla de 3 se ve | ✅ |
| D4 Orbit + Direction | Capítulos 5 y 6, Orbit con alternativa en lista y el árbol de Direction | La negociación se reproduce completa | ✅ |
| D5 Landing + pulido | Secciones de la landing, Ctrl+K, a11y, checklist de diseño y Lighthouse | Se ve bien a 375, 768 y 1280 px. Lighthouse ≥ 90 en a11y y rendimiento. Cero guiones largos visibles | ⏳ |

Estados: ⬜ sin empezar · ⏳ en curso · ✅ hecha

### D0 Cimientos

- [x] `docs/ux.md` y `PLAN.md` de la demo.
- [x] Scaffold con Vite + React 19 + TS, Tailwind v4, Biome, Vitest y script `check`. Las versiones van fijas y tienen al menos ~2 semanas de publicadas.
- [x] Tokens de `docs/ux.md` en `@theme`, con los ajustes de contraste y una prueba que mide el contraste de cada par texto/fondo.
- [x] Inter self-hosted y Phosphor.
- [x] Isotipo en SVG y loader (el anillo gira, la estrella queda fija; estático con reduced motion). La geometría se midió del `.webp` y se ajustó con Béziers: el contorno queda a ≤ 1 px y la IoU es de 0.94 en la estrella y 0.91 en el anillo. El favicon sale de la misma geometría.
- [x] Página de revisión con el SVG junto al `.webp`. **SVG aprobado el 2026-10-07.**

### D1 Motor

Todo en `src/demo/`, TS puro: `step(state, action, now)` nunca muta su entrada ni lee el reloj. Antes de aplicar cualquier acción, procesa los eventos que ya vencieron, igual que el tick del bot. Los textos viven en `src/copy/es.ts`, copiados de `render/es.py` y de las specs F2–F7 del bot.

- [x] **Tiempo** (`time.ts`): minutos desde el lun 12 oct 2026 00:00, hora local. Fechas cortas ("jue 15 oct"), horas y duraciones.
- [x] **Fixture** (`fixture.ts`): la semana de un estudiante de ingeniería. Lleva clases recurrentes, bloques planeados, pendientes (uno ya recorrido 3 veces), 2 hábitos con ventanas, objetivos y proyectos, y un recordatorio el viernes.
- [x] **Huecos y carga** (`slots.ts`, versión simple de F5): huecos libres, carga por día, colocación en chunks, candidatos con movimientos y advertencia de sobrecarga.
- [x] **Planes** (`plan.ts`, F7): el formato Polaris se parsea con regex, sin LLM, y se reparte con tope por día y fecha límite.
- [x] **Motor** (`engine.ts` y sus flows):
  - Captura con ack que se edita en su lugar; el texto libre va al inbox.
  - Consultas y `/hoy`, `/inbox`, `/volcado`, `/listo`.
  - Brief, hábitos de lazo cerrado y recordatorios.
  - Check-in con regla de 3, negociación y plan.
  - Caída con un solo catch-up, y salto de días.
- [x] **Guion** (`script.ts`): los 8 capítulos con sus sugerencias (chips con su JSON) y los pasos canónicos. `replayTo(n)` reconstruye el estado de cualquier capítulo.
- [x] **Reloj** (`clock.ts`): siguiente momento, capítulo actual y avance simulado.
- [x] **Pruebas:** una por capítulo y la conversación dorada de la negociación. Además, el día completo de punta a punta sin guiones largos en el chat. Son 77 en total.

**Lo que dejó D1 para D2:**
- **Salto al viernes:** es un recurso de la demo (`skipDays`), no del bot. El chat lo avisa con un mensaje del sistema, para que no parezca que Polaris se quedó callado.
- **Texto libre:** sin parser solo se lee lo que el código puede leer solo. Es el tiempo con número ("4 horas") y un "va" o un "no" en una negociación o un plan abierto. Todo lo demás cae al inbox, tal cual.

### D2 Today + Inbox + chat

Aceptada el 2026-10-08 con el rediseño Sinapsis (`docs/diseno.md`): mapa de ideas en forma de cerebro, columna del reloj, chat editorial, Today e Inbox en un solo flujo.

### D3 Hábitos + check-in + History

- [x] **History** ("¿Qué ha ocurrido?"):
  - La métrica de la semana, dicha como frase: de lo que dijiste, cuánto sigue en algún lado.
  - Los hábitos de lunes a domingo, sin rachas ni culpa.
  - Lo que decidiste cada día: hecho, reagendado, recorrido, descartado, movido o agendado.
- [x] **Navegación:** History entra a las pestañas y a la barra del cel. Los capítulos de hábito, check-in y viernes abren History.
- [x] **Capítulos 4, 7 y 8 en la UI:**
  - El lazo del desayuno al almuerzo.
  - El check-in de 4 pendientes a puro tap, donde la regla de 3 se ve.
  - El salto al viernes y la caída, con un solo catch-up.
- [x] **Pruebas** de los selectores de History.

**Notas de D3:**
- El check-in de 4 pendientes se resuelve con 5 toques (reagendar pide la fecha). La regla de 3 se ve en la tarjeta, en negritas, y sin el botón Recorrer.
- Lo hecho "mientras tanto" en el salto al viernes queda registrado en su día (miércoles y jueves), no en el momento del salto.

### D4 Orbit + Direction

- [x] **Orbit** ("¿Qué está alrededor de tu atención?"):
  - Anillos incompletos, como el isotipo, con tú en el centro. Lo urgente va cerca y lo que puede esperar, en las orillas.
  - Sectores por área.
  - Los nodos se reacomodan con movimiento cuando algo cambia de fecha.
  - Alternativa "Ver como lista". En el cel solo hay lista, y también donde el mapa no cabe legible (la tablet).
- [x] **Tu semana** en Orbit: los minutos de foco planeados por día contra el tope, y el día que se pasa, marcado. Es donde se ve la advertencia de la negociación.
- [x] **Direction:** Objetivo → Proyecto → Próxima acción, con indicadores humanos ("Vas avanzando", "Esto es lo siguiente", "Lo terminas el…") y sin porcentajes. Los planes aterrizados (F7) aparecen aquí.
- [x] **Navegación:** Orbit y Direction entran a las pestañas. En el cel van en "Más", para no pasar de 5. La negociación abre Orbit y el plan abre Direction.
- [x] **Pruebas** de los selectores y de la geometría de Orbit.

**Notas de D4:**
- En el mapa, los pendientes de un mismo anillo y área se reparten parejo en su tramo: nunca se enciman. El nombre de cada punto aparece al pasar el cursor; la lista lo dice todo sin cursor.
- La negociación mueve la tesis del anillo de afuera al de próximos días, y el jueves queda marcado "Muy cargado" (5 h 30 de 5 h).
- Direction dice los plazos como frase ("Para el viernes") y solo cuenta pasos cuando el proyecto tiene más de uno.

### D5 Landing + pulido

Una sola página: la demo es la sección 4 y ocupa la pantalla completa. Todo lo de arriba y abajo de ella cuenta beneficios, no tecnología.

- [x] **Landing alrededor de la demo:**
  - Nav de una línea (72 px o menos): isotipo, wordmark y "Pruébalo".
  - Portada: "Por fin no tienes que acordarte de todo.", un subtexto de 20 palabras o menos y "Pruébalo". A la derecha va el cerebro con tus ideas en lugar de Today: es el elemento firma de Sinapsis, y Today ya vive en la demo.
  - "Primero captura. Después organizamos.": la frase cruda se vuelve dos pendientes con fecha y área, y una idea sin fecha cae al Inbox sin preguntas. Es el único momento orquestado de la página.
  - "Una decisión, no culpa": el check-in de verdad, con el mismo motor, una tarjeta a la vez y la regla de 3.
  - Lo que Polaris te promete, como lista asimétrica.
  - Cierre: "Todo en orden.", "Pruébalo", "Vuelve a empezar el día" y el pie.
- [ ] **Ctrl+K:** una paleta de comandos sobre la demo, con capítulos, vistas y pendientes.
- [ ] **Pulido de lo visto en D4:**
  - El conteo del cerebro cabe en una línea a 1280 px.
  - Las sugerencias del chat avisan que hay más.
  - En el cel, la vista gana espacio.
- [ ] **Accesibilidad:** salto a la demo, jerarquía de títulos, teclado completo, focos visibles, reduced motion y lectores de pantalla.
- [ ] **Revisión final:**
  - Se revisa a 375, 768 y 1280 px.
  - Lighthouse de 90 o más en accesibilidad y rendimiento.
  - Una prueba garantiza cero guiones largos en el texto visible.

## Decisiones abiertas (con default)

1. **CTA final.** D5 arranca con el default: "Pruébalo" y "Vuelve a empezar el día". La lista de espera o el contacto quedan para después. Una lista de espera necesita backend y guarda correos.
2. **Deploy.** Default: solo local hasta D5. Candidato: un repo público aparte, `DDamianZR/polaris-demo`, con GitHub Pages. **Antes de crear un remoto o hacer deploy se pide OK.**
3. **Idioma.** Solo español mexicano informal; el inglés va al backlog.

## Backlog

- Versión en inglés.
- Settings (horarios del brief y del check-in, áreas).
