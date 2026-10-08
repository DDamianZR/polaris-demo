# Sinapsis: sistema visual de la demo

Este documento reemplaza la paleta, la tipografía y la composición de `docs/ux.md`. De ese documento se mantienen el concepto de marca, las cuatro preguntas de la interfaz, la división Telegram / UI, el tono de los textos y las reglas de accesibilidad.

## Idea

Polaris es el lugar donde las ideas sueltas se conectan. La interfaz lo cuenta con un cerebro hecho de partículas: cada cosa que capturas es una neurona. Mientras no tiene fecha es una chispa suelta; cuando Polaris la ordena, una sinapsis la une a su zona (estudio, personal, proyectos…). Todo lo demás es vacío, texto y líneas finas.

Referencias fusionadas:

- **Vacío y constelación:** fondo casi negro, un solo violeta para la acción, una chispa ámbar, partículas en forma de cerebro, titulares grandes de peso 400 con tracking negativo y cuerpo ligero.
- **Editorial de cuarto oscuro:** texto en crema cálida en lugar de blanco, etiquetas en mayúsculas de peso 500, divisores punteados finos, campos con solo línea inferior, botones fantasma con borde y display con interlineado 0.9.

## Color

| Token | Valor | Uso |
|---|---|---|
| `vacio` | `#050407` | Lienzo. No hay superficies elevadas ni cards. |
| `tinta` | `#100D14` | Lo poco que necesita un fondo: tu globo en el chat. |
| `crema` | `#F2EBDF` | Texto principal. Nunca blanco puro. |
| `ceniza` | `#A9A196` | Texto secundario. |
| `niebla` | `#8A8378` | Metadata y etiquetas tenues. |
| `linea` | `#2E2A24` | Divisores punteados. Solo estructura, nunca texto. |
| `trazo` | `#6B6358` | Borde de botones fantasma y campos (3:1 o más). |
| `iris` | `#8052FF` | La acción principal de cada vista. Texto encima: `sobre-iris` (`#FFFFFF`, 4.6:1). |
| `chispa` | `#FFB829` | Lo nuevo, lo de ahora y las ideas sueltas. Foco del teclado. |
| `sinapsis` | `#15846E` | Líneas que conectan. En texto se usa `sinapsis-texto` (`#3FBF9F`). |

El gradiente azul → violeta queda solo en el isotipo. El cerebro mezcla violeta, azul, verde sinapsis, ámbar, magenta y crema.

`src/design/contrast.test.ts` verifica que cada texto llegue a AA sobre `vacio` y `tinta`, y que los bordes de control lleguen a 3:1.

## Tipografía

Inter, una sola familia.

| Rol | Tamaño / interlineado | Peso | Tracking |
|---|---|---|---|
| Display (reloj) | 104 / 0.9 | 400 | -0.04em |
| Titular de vista | 44 / 0.95 | 400 | -0.03em |
| Título | 28 / 1.05 | 400 | -0.02em |
| Entrada (leads) | 18 / 1.5 | 300 | normal |
| Cuerpo (chat, pendientes) | 15 / 1.55 | 400 | normal |
| Chico (metadata) | 13 / 1.45 | 400 | normal |
| Etiqueta | 12 / 1.2, mayúsculas | 500 | 0.08em |

La jerarquía sale de la escala y el espacio, no del peso. Los números de hora van tabulares.

## Forma

- Sin cards, sin sombras y sin paneles con fondo. Las zonas se separan con líneas punteadas de 1 px en `linea`.
- La acción principal es una píldora `iris`, una por vista. Lo demás son píldoras fantasma con borde `trazo`.
- Los campos de texto llevan solo línea inferior.
- El globo de tus mensajes es lo único con fondo (`tinta`, radio 18 px).

## Movimiento

Hay un solo movimiento que no pides: el del cerebro. Las partículas respiran muy despacio; cuando capturas algo, su neurona se enciende y la sinapsis viaja hasta su zona; cuando avanza el reloj, una onda cruza el cerebro. Todo lo demás responde a tus acciones, en 150–250 ms y sin rebotes. Con reduced motion el cerebro queda quieto y lo nuevo se marca con un anillo fijo.

## Composición

- **Escritorio (1280 px o más):** a la izquierda, en una columna, el reloj gigante, el cerebro y el itinerario del día. A la derecha, la barra del capítulo con la acción y, debajo, el chat y Polaris (Today, Inbox) lado a lado. Todo cabe en la pantalla, sin scroll de página.
- **Tablet:** el reloj y el cerebro arriba, en una franja; debajo el itinerario, la barra del capítulo, y el chat y Polaris lado a lado.
- **Cel:** el reloj con el cerebro detrás, la barra del capítulo, el itinerario deslizable y una vista a la vez (Chat, Today, Inbox) con la barra inferior.
