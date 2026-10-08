# POLARIS — Sistema UX/UI

> El concepto, la arquitectura, el tono y la accesibilidad de este documento siguen vigentes.
> La paleta, la tipografía y la composición las reemplaza `docs/diseno.md` (Sinapsis).

## Concepto de marca

POLARIS es un centro de orientación personal, no un simple task manager ni un dashboard de productividad.

### El usuario es el centro

- Estrella central → punto estable.
- Círculo incompleto → sistema, contexto, movimiento y órbita.
- Azul → violeta → tecnología, inteligencia y profundidad.
- Geometría blanca → claridad sobre el caos.
- Wordmark con espacio → sensación premium, tranquila y precisa.

**Principio:** POLARIS mantiene todo alrededor del usuario en orden, pero el usuario siempre conserva el control.

---

## Filosofía UX

La interfaz debe responder rápidamente:

- ¿Dónde estoy?
- ¿Qué importa ahora?
- ¿Qué viene después?
- ¿Hacia dónde voy?

### Principio fundamental

> La complejidad puede existir internamente; la experiencia debe sentirse simple externamente.

POLARIS debe reducir carga cognitiva, no exigirle al usuario que se organice antes de poder usarlo.

---

## Personalidad

POLARIS debe sentirse:

- tranquilo
- confiable
- preciso
- inteligente
- discreto
- premium
- humano
- estable
- tecnológico
- extremadamente claro

Debe producir la sensación:

> "Ah, aquí está todo."

> "No tengo que acordarme de todo."

> "Esto sabe qué está pasando."

> "Estoy bajo control."

No debe sentirse:

- infantil
- hiperactivo
- corporativo
- frío
- clínico
- robótico
- excesivamente futurista
- como una aplicación genérica de IA

---

## Arquitectura

Navegación principal:

```text
Today
Inbox
Orbit
Direction
History
```

Settings permanece separado.

| Vista | Pregunta |
|---|---|
| Today | ¿Qué está pasando ahora? |
| Inbox | ¿Qué tengo en la cabeza? |
| Orbit | ¿Qué está alrededor de mi atención? |
| Direction | ¿Hacia dónde estoy construyendo mi vida? |
| History | ¿Qué ha ocurrido? |

### Today

Pantalla principal y centro de gravedad. Debe permitir entender la situación actual en menos de 3 segundos.

```text
Buenas tardes.

Tu día está bajo control.

AHORA

18:30
Cálculo Multivariable
Resolver ejercicios del tema 4

En curso · 45 min

DESPUÉS

20:00  Entrenamiento
22:00  Proyecto Polaris

3 pendientes · 2 hábitos · 1 evento
```

No mostrar información secundaria innecesaria.

### Inbox

Zona de descarga mental.

```text
¿Qué tienes en la cabeza?

Escribe lo que sea...
```

El usuario puede escribir libremente:

```text
El jueves tengo que entregar sistemas y comprar cables para la práctica.
```

No debe tener que seleccionar:

- proyecto
- prioridad
- fecha
- duración
- etiquetas

POLARIS estructura la información posteriormente.

**Concepto.** Inbox no significa "cosas que tienes que hacer". Significa "cosas que ya no necesitas recordar mentalmente".

### Orbit

Representa todo aquello que actualmente ocupa espacio en la vida del usuario:

- tareas
- eventos
- hábitos
- pendientes
- compromisos

No utilizar una galaxia 3D literal. Usar una representación abstracta basada en:

- centro
- proximidad
- agrupación
- prioridad

Los elementos importantes pueden estar más cerca del centro. Los menos relevantes pueden permanecer en la periferia.

### Direction

Capa estratégica. Representar:

```text
Objetivo
   ↓
Proyecto
   ↓
Próxima acción
```

Ejemplo:

```text
Graduarme
   ↓
Proyecto de Sistemas
   ↓
Preparar documentación
```

No utilizar métricas genéricas como:

```text
Productivity Score: 87%
```

Preferir indicadores humanos:

- Vas avanzando.
- Esta semana has mantenido el rumbo.
- Esto es lo siguiente.

### Hábitos

Mostrar continuidad sin gamificación agresiva.

```text
L M M J V S D
● ● ● ● ○ ○ ○
```

Evitar:

- puntos
- monedas
- rankings
- trofeos
- confeti

El objetivo es mostrar consistencia, no generar culpa.

### Eventos y tareas

Diferenciar conceptualmente:

- Eventos → ocurren.
- Tareas → requieren acción.
- Hábitos → requieren continuidad.
- Objetivos → definen dirección.

```text
Tarea
○ Terminar documentación de ADS
Jueves · Proyecto ADS
45 min
```

Mostrar únicamente metadata relevante.

---

## Tipografía

Familia principal: **Inter**.

Pesos:

- Regular 400
- Medium 500
- SemiBold 600
- Bold 700

No utilizar múltiples familias tipográficas.

Si se utiliza una interfaz nativa de Apple:

- SF Pro Display para títulos.
- SF Pro Text para interfaz.

### Jerarquía

```text
Display   48 / 56 / 600
H1        32 / 40 / 600
H2        24 / 32 / 600
H3        18 / 26 / 600
Body      15 / 24 / 400
Medium    15 / 24 / 500
Small     13 / 20 / 400
Caption   12 / 18 / 500
```

La tipografía debe sentirse prácticamente invisible: clara, precisa y legible.

---

## Paleta de color

### Background

```text
Midnight       #070A14
Primary        #0B1020
Secondary      #0F1525
Surface        #131A2A
Elevated       #182033
Border         #222B40
```

### Texto

```text
Primary        #F5F7FA
Secondary      #A7B0C0
Muted          #697386
```

### Polaris

```text
Electric Blue  #3B82F6
Violet         #7C3AED
```

### Gradiente de marca

```text
#22A8F0 → #7C3AED
```

Utilizar principalmente en:

- logo
- elementos activos importantes
- progreso especial
- indicadores de foco
- detalles de identidad

No convertir toda la interfaz en un gradiente.

### Regla

80–90% de la interfaz debe ser neutral.

El color debe significar: **Esto importa.**

No: **Todo es importante.**

---

## Espaciado

Utilizar sistema basado en 4 px:

```text
4 8 12 16 20 24 32 40 48 64 80 96
```

Referencias:

- Componentes: 16–24 px.
- Secciones: 32–48 px.
- Cambios contextuales grandes: 64–96 px.

La interfaz debe respirar.

## Border radius

```text
4px   elementos pequeños
8px   inputs y controles
12px  cards
16px  superficies
20px  contenedores principales
```

Evitar exceso de elementos tipo pill y tarjetas excesivamente redondeadas.

## Superficies y profundidad

No convertir cada elemento en una card. Preferir:

```text
contenido
espacio
contenido
```

sobre:

```text
card
card
card
card
```

La jerarquía debe surgir principalmente mediante:

- espacio
- tipografía
- contraste
- posición

Utilizar bordes y sombras de forma extremadamente sutil.

## Iconografía

Utilizar iconos lineales:

- geometría simple
- 1.5–2 px de stroke
- esquinas ligeramente redondeadas
- tamaño base de 20 px

No utilizar emojis como iconos de interfaz.

La iconografía debe compartir el lenguaje geométrico del logo.

## Logo como sistema visual

El logo no debe ser únicamente branding.

- **Estrella** representa: centro / prioridad / ahora.
- **Círculo incompleto** representa: contexto / movimiento / todo lo que sucede alrededor.

El símbolo puede utilizarse discretamente como:

- indicador del sistema
- loading
- estado de sincronización
- navegación
- indicador de foco

No abusar de él.

## Loading

Evitar spinners genéricos cuando sea posible. Utilizar una versión sutil del símbolo:

- círculo exterior en movimiento
- estrella central estable

Conceptualmente: **El mundo se mueve. El centro permanece.**

## Estados

Todo componente debe contemplar:

- Default
- Hover
- Focus
- Active
- Disabled
- Loading
- Success
- Warning
- Error
- Completed

Los estados deben ser discretos.

**Completed:** reducir contraste y tachar suavemente. No celebrar agresivamente cada tarea completada.

## Empty states

La ausencia de tareas debe sentirse como alivio.

Evitar: "¡Genial! No tienes tareas."

Preferir: "Todo despejado." o "No hay nada pendiente por ahora."

## UX Writing

Español informal mexicano. Debe ser:

- humano
- corto
- tranquilo
- claro
- directo

Evitar lenguaje corporativo o de productividad tóxica.

Preferir:

- Ya está.
- Lo tenemos.
- Todo en orden.
- Esto puede esperar.
- Lo dejamos para después.
- Hoy basta con esto.
- No tienes nada urgente.

Nunca sonar paternalista ni como coach motivacional.

## Motion

Animaciones funcionales y discretas.

```text
Microinteraction   120–160 ms
Component          180–220 ms
Modal / Panel      240–320 ms
Página             300–400 ms
```

Evitar:

- rebotes
- confeti
- animaciones constantes
- elementos flotando sin propósito

El movimiento debe comunicar estabilidad.

## Responsive

- **Desktop:** sidebar + contenido principal.
- **Tablet:** sidebar reducido.
- **Mobile:** bottom navigation o navegación compacta.

Prioridad móvil:

1. Today
2. Inbox

No intentar reproducir todo el dashboard desktop en móvil.

## Accesibilidad

- Contraste adecuado.
- Nunca depender exclusivamente del color.
- Targets táctiles mínimos de 44 × 44 px.
- Focus states visibles.
- Texto legible.
- Reduced Motion.
- Estados comprensibles sin color.

## Captura rápida

La captura debe estar siempre disponible: `+ Capturar` o simplemente `+`.

Debe abrir inmediatamente un campo de texto.

Filosofía: **Primero captura. Después organizamos.**

## Command Palette

Accesible mediante `Ctrl + K`. Debe permitir buscar:

- tareas
- eventos
- hábitos
- proyectos
- objetivos
- capturas

Diseño limpio y rápido.

## Notificaciones

POLARIS debe proteger la atención.

Notificar únicamente cuando: **Esto realmente necesita tu atención ahora.**

No notificar simplemente porque existe información nueva.

## División Telegram / UI

- **Telegram:** pensar → escribir → capturar. Funciona como memoria externa instantánea.
- **Polaris UI:** entender → revisar → reorganizar → decidir. Funciona como centro de orientación.

## Principio de calma

Una característica central de POLARIS: **la interfaz debe sentirse más vacía conforme mejor organizada está tu vida.**

No: "¡Completaste 17 tareas!"

Sino: "Todo en orden. No hay nada urgente."

La sensación buscada es: "Ahhh... ya no tengo que preocuparme."

## Principio definitivo

```text
                    USUARIO
                       ✦
                       │
                ┌──────┴──────┐
                │             │
              TODAY          INBOX
                │             │
                └──────┬──────┘
                       │
                     ORBIT
                       │
                   DIRECTION
```

El usuario es el centro. POLARIS es el punto de referencia. El caos puede existir alrededor. La interfaz convierte ese caos en una estructura tranquila.

## Sensación final

POLARIS debe sentirse:

- CALMA
- PRECISA
- CONFIABLE
- PREMIUM
- HUMANA
- TECNOLÓGICA

Y transmitir:

> "Por fin no tengo que acordarme de todo."

> "Está aquí."

> "POLARIS lo tiene."

> "Ahora puedo concentrarme en hacer lo que quiero hacer."

## Principio rector

**Complejidad interna. Simplicidad externa.**
