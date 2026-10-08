import { describe, expect, it } from "vitest";
import { CHECKIN_EMPTY, DUMP_NONE, NEG_DECLINED, NEG_HOW_LONG, OTHER_SHORT } from "../copy/es";
import { type Action, step } from "./engine";
import { fixtureState } from "./fixture";
import { PLAN_TEXT } from "./script";
import { inboxStream, showsSource } from "./selectors";
import type { DemoState } from "./state";
import { at, JUE, MAR, MIE, type Minute, VIE } from "./time";
import type { Message, Parsed, Press } from "./types";

const run = (s: DemoState, ...steps: [Minute, Action][]) =>
  steps.reduce((state, [t, action]) => step(state, action, t), s);
const send = (text: string, parsed?: Parsed): Action => ({ type: "send", text, parsed });
const press = (p: Press): Action => ({ type: "press", press: p });
const tick: Action = { type: "tick" };
const fromPolaris = (s: DemoState) => s.messages.filter((m) => m.from === "polaris");
const last = (s: DemoState) => s.messages.at(-1) as Message;
const labels = (m: Message) => m.buttons.flat().map((b) => b.label);

describe("motor puro", () => {
  it("step nunca muta el estado que recibe", () => {
    const s = fixtureState();
    const before = JSON.stringify(s);
    run(s, [at(MAR, "07:20"), send("hola")], [at(MAR, "21:30"), tick]);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("procesar dos veces no duplica nada (dedupe_key)", () => {
    const s = run(
      fixtureState(),
      [at(MAR, "07:00"), tick],
      [at(MAR, "07:00"), tick],
      [at(MAR, "07:05"), tick],
    );
    expect(fromPolaris(s).filter((m) => m.text.startsWith("Buenos días"))).toHaveLength(1);
  });
});

describe("brief (F2)", () => {
  it("llega a las 7 con el fijo, lo de hoy y lo que viene, en 12 líneas o menos", () => {
    const s = run(fixtureState(), [at(MAR, "07:00"), tick]);
    const lines = last(s).text.split("\n");
    expect(lines[0]).toBe("Buenos días. Hoy es mar 13 oct.");
    expect(lines[1]).toBe("<b>Fijo</b> 08:00 ADS · 11:00 Sistemas Digitales · 20:00 Entrenamiento");
    expect(lines).toContain("<b>Para hoy</b>");
    expect(lines.at(-1)).toBe("Inbox: 3");
    expect(lines.length).toBeLessThanOrEqual(12);
  });
});

describe("captura (F1)", () => {
  const sentence = "El jueves tengo que entregar sistemas y comprar cables para la práctica.";
  const parsed: Parsed = {
    intent: "capture",
    items: [
      {
        kind: "task",
        title: "Entregar Sistemas",
        area: "estudio",
        due_date: "2026-10-15",
        due_time: null,
        estimate_min: null,
      },
      {
        kind: "task",
        title: "Comprar cables para la práctica",
        area: "estudio",
        due_date: "2026-10-15",
        due_time: null,
        estimate_min: null,
      },
    ],
  };

  it("un mensaje, dos pendientes con fecha, y el ✓ se edita con el ack completo", () => {
    const s = run(fixtureState(), [at(MAR, "07:20"), send(sentence, parsed)]);
    const ack = last(s);
    expect(ack.editedFrom).toBe("✓");
    expect(ack.text).toBe(
      "✓ 2 pendientes:\n1. Entregar Sistemas · jue 15 oct · estudio\n2. Comprar cables para la práctica · jue 15 oct · estudio",
    );
    const created = s.items.filter((i) => i.dueDay === JUE && i.createdAt === at(MAR, "07:20"));
    expect(created.map((i) => i.status)).toEqual(["active", "active"]);
  });

  it("sin parser, el texto libre cae al inbox tal cual y nunca falla", () => {
    const s = run(fixtureState(), [at(MAR, "07:20"), send("comprar leche y huevos")]);
    expect(last(s).text).toBe("✓ Al inbox: comprar leche y huevos");
    expect(s.items.at(-1)?.status).toBe("inbox");
  });

  it("un saludo recibe una respuesta corta y no se guarda", () => {
    const s = run(fixtureState(), [at(MAR, "07:20"), send("hola")]);
    expect(last(s).text).toBe(OTHER_SHORT);
    expect(s.items).toHaveLength(fixtureState().items.length);
  });

  it("un recordatorio con hora llega a su hora con botones", () => {
    const reminder: Parsed = {
      intent: "capture",
      items: [
        {
          kind: "reminder",
          title: "Llevar el cargador",
          area: "personal",
          due_date: "2026-10-14",
          due_time: "08:00",
          estimate_min: null,
        },
      ],
    };
    const s = run(
      fixtureState(),
      [at(MAR, "07:20"), send("Mañana a las 8 llévate el cargador", reminder)],
      [at(MIE, "08:00"), tick],
    );
    const msg = s.messages.find((m) => m.text === "⏰ Llevar el cargador");
    expect(msg?.at).toBe(at(MIE, "08:00"));
    expect(msg && labels(msg)).toEqual(["✅ Listo", "⏰ 30 min"]);
  });

  it("«+ Capturar» de la UI guarda sin pasar por el chat y recuerda lo que escribiste", () => {
    const before = run(fixtureState(), [at(MAR, "07:20"), tick]);
    const s = run(
      before,
      [at(MAR, "07:20"), { type: "capture", text: sentence, parsed }],
      [at(MAR, "07:21"), { type: "capture", text: "  cotizar audífonos  " }],
    );
    expect(s.messages).toHaveLength(before.messages.length);
    const stream = inboxStream(s);
    const [raw, structured] = stream;
    expect([raw, structured].map((e) => [e?.source, e?.items.map((i) => i.title)])).toEqual([
      ["cotizar audífonos", ["cotizar audífonos"]],
      [sentence, ["Entregar Sistemas", "Comprar cables para la práctica"]],
    ]);
    // Se cita lo que escribiste solo si Polaris lo convirtió en otra cosa.
    expect(raw && showsSource(raw)).toBe(false);
    expect(structured && showsSource(structured)).toBe(true);
    // Cada pendiente aparece una sola vez en el Inbox.
    const ids = stream.flatMap((e) => e.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("en el Inbox, lo capturado en el mismo minuto sale de lo más nuevo a lo más viejo", () => {
    const t = at(MAR, "07:30");
    const s = run(
      fixtureState(),
      [t, { type: "capture", text: "primero" }],
      [t, { type: "capture", text: "segundo" }],
    );
    expect(
      inboxStream(s)
        .slice(0, 2)
        .map((e) => e.source),
    ).toEqual(["segundo", "primero"]);
  });

  it("consultas y cambios por pista", () => {
    const s = run(
      fixtureState(),
      [
        at(MAR, "07:20"),
        send("¿Ya entregué lo de ADS?", {
          intent: "query",
          query: { scope: "item", item_hint: "ADS" },
        }),
      ],
      [
        at(MAR, "07:21"),
        send("ya pagué el internet", {
          intent: "update",
          update: { action: "done", item_hint: "internet", new_date: null },
        }),
      ],
    );
    const texts = fromPolaris(s).map((m) => m.text);
    expect(texts).toContain("Terminar documentación de ADS: pendiente, para el jue 15 oct.");
    expect(texts).toContain("✓ Hecho: Pagar el internet");
  });
});

describe("volcado (F1)", () => {
  it("guarda todo con 👍 sin contestar y al final manda UN resumen por área", () => {
    const s = run(
      fixtureState(),
      [at(MAR, "07:32"), send("/volcado")],
      [
        at(MAR, "07:33"),
        send("Sacar copias", {
          intent: "capture",
          items: [
            {
              kind: "task",
              title: "Sacar copias",
              area: "estudio",
              due_date: null,
              due_time: null,
              estimate_min: null,
            },
          ],
        }),
      ],
      [at(MAR, "07:34"), send("cotizar la moto")],
      [at(MAR, "07:35"), send("/listo")],
    );
    const users = s.messages.filter((m) => m.from === "user" && !m.text.startsWith("/"));
    expect(users.map((m) => m.reaction)).toEqual(["👍", "👍"]);
    expect(last(s).text).toBe(
      "📥 Volcado: 2 cosas\n<b>estudio</b>\n1. Sacar copias · inbox\n<b>sin área</b>\n2. cotizar la moto · inbox\nCorrige respondiendo: «el 3 es para el viernes», «borra el 4».",
    );
    expect(run(s, [at(MAR, "07:36"), send("/listo")]).messages.at(-1)?.text).toBe(DUMP_NONE);
  });
});

describe("hábitos con lazo cerrado (F4)", () => {
  const day = MAR;
  const k = "comida-1";

  it("avisa, pregunta y, si no, lo pasa a la siguiente ventana con su etiqueta", () => {
    let s = run(fixtureState(), [at(day, "08:00"), tick]);
    const ping = last(s);
    expect(ping.text).toBe("🍳 Desayuno");
    expect(labels(ping)).toEqual(["✅ Ya", "⏰ 30 min", "❌ Hoy no"]);

    s = run(s, [at(day, "08:45"), tick]);
    expect(last(s).text).toBe("¿Ya desayunaste?");
    expect(s.messages.find((m) => m.id === ping.id)?.buttons).toEqual([]);

    s = run(s, [at(day, "08:47"), press({ kind: "habit_followup", key: k, day, done: false })]);
    expect(labels(last(s))).toEqual(["⏭ Pásalo a almuerzo", "🗑 Hoy no"]);

    s = run(s, [at(day, "08:48"), press({ kind: "habit_next", key: k, day, move: true })]);
    expect(last(s).text).toBe("¿Ya desayunaste?\nVa. Te vuelvo a avisar a las 11:00 (almuerzo).");

    s = run(s, [at(day, "11:00"), tick]);
    expect(last(s).text).toBe("🍳 Almuerzo");

    s = run(s, [at(day, "11:05"), press({ kind: "habit", key: k, day, choice: "done" })]);
    expect(s.habitDays.find((h) => h.key === k && h.day === day)).toMatchObject({
      status: "done",
      windowIdx: 1,
    });
  });

  it("el snooze al final de la ventana salta a la siguiente", () => {
    const snooze = press({ kind: "habit", key: k, day, choice: "snooze" });
    // 08:00 → 09:00 → 10:00 dentro del desayuno; a las 10:35, +30 min ya se pasa de las 11:00.
    const s = run(
      fixtureState(),
      [at(day, "08:30"), snooze],
      [at(day, "09:30"), snooze],
      [at(day, "10:35"), snooze],
    );
    expect(s.messages.at(-1)?.text).toBe(
      "🍳 Desayuno\nVa. Te vuelvo a avisar a las 11:00 (almuerzo).",
    );
    expect(run(s, [at(day, "11:00"), tick]).messages.at(-1)?.text).toBe("🍳 Almuerzo");
  });

  it("sin respuesta en todo el día queda como no hecho, sin insistir", () => {
    const s = run(fixtureState(), [at(day, "17:30"), tick]);
    expect(s.habitDays.find((h) => h.key === k && h.day === day)?.status).toBe("missed");
    expect(fromPolaris(s).filter((m) => m.buttons.length && m.text.startsWith("🍳"))).toHaveLength(
      0,
    );
  });

  it("un botón viejo ya no hace nada", () => {
    const s = run(fixtureState(), [at(day, "08:00"), tick], [at(day, "08:45"), tick]);
    const after = run(s, [at(day, "08:50"), press({ kind: "habit", key: k, day, choice: "done" })]);
    expect(after.habitDays.find((h) => h.key === k && h.day === day)?.status).toBe("pending");
  });
});

describe("negociación (F5): la conversación dorada", () => {
  const request = (minutes: number | null): Parsed => ({
    intent: "block_request",
    block_request: {
      title: "Capítulo 2 de la tesis",
      minutes,
      same_day: true,
      splittable: true,
      deadline: "2026-10-16",
    },
  });
  const counterWed: Parsed = { intent: "counter", counter: { preferred_days: ["mie"] } };

  function untilWarning() {
    return run(
      fixtureState(),
      [
        at(MAR, "13:00"),
        send(
          "Ábreme un espacio esta semana para terminar el capítulo 2 de la tesis",
          request(null),
        ),
      ],
      [at(MAR, "13:01"), send("Unas 4 h, no seguidas pero el mismo día", request(240))],
      [at(MAR, "13:02"), send("¿Y no lo puedes poner el miércoles?", counterWed)],
    );
  }

  it("pregunta solo el tiempo, propone, advierte una vez y obedece", () => {
    const s = untilWarning();
    const replies = fromPolaris(s).filter((m) => m.at >= at(MAR, "13:00"));
    expect(replies.map((m) => m.text)).toEqual([
      NEG_HOW_LONG,
      "El jueves tienes 3 h libres. Para que quepan 4 h, muevo «Proyecto Polaris» al miércoles a las 11:10.",
      "Se puede, pero el jueves te quedaría muy cargado: 5 h 30 de foco.",
    ]);
    // Nada se escribe en blocks hasta confirmar.
    expect(s.blocks).toEqual(fixtureState().blocks);

    const done = run(s, [
      at(MAR, "13:03"),
      send("Va, no importa, quiero el miércoles", { intent: "confirm" }),
    ]);
    expect(last(done).text).toBe(
      [
        "Confirmado. Tu miércoles queda así:",
        "08:00 Capítulo 2 de la tesis (50 min)",
        "09:00 Redes",
        "11:10 Capítulo 2 de la tesis (2 h)",
        "13:20 Capítulo 2 de la tesis (1 h 10)",
        "16:00 Cálculo Multivariable",
        "Moví 3 cosas para hacerle espacio.",
      ].join("\n"),
    );
    const moved = ["b3", "b4", "b5"].map((id) => done.blocks.find((b) => b.id === id));
    expect(moved.every((b) => b && Math.floor(b.start / 1440) === JUE)).toBe(true);
    expect(done.items.find((i) => i.id === "i10")).toMatchObject({ status: "active", dueDay: MIE });
    expect(done.flows.negotiation).toBeNull();
  });

  it("la advertencia no se repite si insistes", () => {
    const s = run(untilWarning(), [at(MAR, "13:03"), send("el miércoles", counterWed)]);
    expect(last(s).text).toMatch(/^El miércoles tienes/);
  });

  it("el tiempo dicho con número lo lee el código, sin parser", () => {
    const s = run(
      fixtureState(),
      [at(MAR, "13:00"), send("ábreme un espacio", request(null))],
      [at(MAR, "13:01"), send("como 4 horas, partido")],
    );
    expect(last(s).text).toMatch(/^El jueves tienes 3 h libres/);
  });

  it("si dices que no, no mueve nada", () => {
    const s = run(untilWarning(), [
      at(MAR, "13:03"),
      press({ kind: "negotiation", choice: "decline" }),
    ]);
    expect(last(s).text).toBe(NEG_DECLINED);
    expect(s.blocks).toEqual(fixtureState().blocks);
  });
});

describe("planes (F7)", () => {
  it("dice si cabe y, al confirmar, crea pasos y bloques en el objetivo", () => {
    let s = run(fixtureState(), [at(MAR, "17:00"), send(PLAN_TEXT)]);
    expect(last(s).text).toBe(
      "📘 Aprender FastAPI: 8 pasos, 15 h.\nCabe: a 1 h por día entre semana lo terminas el mar 3 nov, 3 días antes del límite.",
    );
    s = run(s, [at(MAR, "17:01"), press({ kind: "plan", choice: "confirm" })]);
    expect(last(s).text).toBe(
      "Listo, ya está en tu calendario. Empiezas el mié 14 oct con «Leer el tutorial oficial».",
    );
    const project = s.projects.find((p) => p.title === "Aprender FastAPI");
    expect(project?.goalId).toBe("g-chamba");
    expect(s.items.filter((i) => i.projectId === project?.id)).toHaveLength(8);
  });

  it("un plan roto dice la línea", () => {
    const s = run(fixtureState(), [at(MAR, "17:00"), send("# Plan: X\n- [2h] Uno\nnada que ver")]);
    expect(last(s).text).toBe(
      "No pude leer el plan, línea 3. Esta línea no tiene el formato de un paso.",
    );
  });
});

describe("check-in nocturno (F3)", () => {
  const night = at(MAR, "21:30");

  it("UN mensaje que se edita en su lugar; con la regla de 3 no hay Recorrer", () => {
    let s = run(fixtureState(), [night, tick]);
    const card = last(s);
    expect(card.text).toBe(
      "1/4 · Reporte de la práctica de Redes (vencía ayer)\n<b>Ya se recorrió 3 veces.</b> Fecha dura o se va.",
    );
    expect(labels(card)).not.toContain("⏭ Recorrer");

    s = run(s, [night + 1, press({ kind: "checkin", choice: "reschedule" })]);
    expect(labels(last(s))).toEqual(["Mañana", "Pasado", "Sábado"]);
    s = run(s, [night + 1, press({ kind: "checkin_date", target: "tomorrow" })]);
    expect(last(s).text).toBe("2/4 · Leer el capítulo 3 de Redes (vencía hoy)");
    expect(labels(last(s))).toContain("⏭ Recorrer");

    s = run(
      s,
      [night + 2, press({ kind: "checkin", choice: "defer" })],
      [night + 3, press({ kind: "checkin", choice: "done" })],
      [night + 4, press({ kind: "checkin", choice: "kill" })],
    );
    expect(last(s).id).toBe(card.id);
    expect(last(s).text).toBe(
      "Listo: 1 hecha, 1 reagendada, 1 recorrida, 1 muerta.\nHoy basta con esto.",
    );
    expect(s.items.find((i) => i.id === "i3")).toMatchObject({ dueDay: MIE, deferCount: 2 });
    expect(s.items.find((i) => i.id === "i4")).toMatchObject({ dueDay: MIE, deferCount: 3 });
  });

  it("Ahorita pregunta en 45 min si ya quedó", () => {
    let s = run(
      fixtureState(),
      [night, tick],
      [night + 1, press({ kind: "checkin", choice: "now" })],
    );
    s = run(s, [night + 46, tick]);
    const question = s.messages.find(
      (m) => m.text === "¿Ya quedó «Reporte de la práctica de Redes»?",
    );
    expect(question?.at).toBe(night + 46);
    s = run(s, [night + 50, press({ kind: "checkin_followup", itemId: "i4", done: true })]);
    expect(s.items.find((i) => i.id === "i4")?.status).toBe("done");
  });

  it("si no quedó nada pendiente, lo dice tranquilo", () => {
    const empty = fixtureState();
    for (const item of empty.items)
      if (item.dueDay !== null && item.dueDay <= MAR) item.status = "done";
    expect(last(run(empty, [night, tick])).text).toBe(CHECKIN_EMPTY);
  });
});

describe("caída y catch-up (F3)", () => {
  it("al volver, UN solo mensaje con lo que se pasó y sus botones", () => {
    const before = run(fixtureState(), [at(VIE, "09:12"), tick]);
    const after = run(before, [at(VIE, "09:12"), { type: "outage", until: at(VIE, "14:40") }]);
    const added = after.messages.slice(before.messages.length);
    expect(added).toHaveLength(1);
    expect(added[0]?.text).toBe(
      "Estuve fuera de 09:12 a 14:40. Se pasó:\n⏰ Llamar al dentista (10:00)",
    );
    expect(added[0] && labels(added[0])).toEqual(["✅ Listo", "⏰ 30 min"]);
  });

  it("el brief perdido se manda al volver si aún no da mediodía", () => {
    const s = run(fixtureState(), [at(MAR, "06:50"), { type: "outage", until: at(MAR, "09:30") }]);
    const texts = s.messages.map((m) => m.text);
    expect(texts[0]).toBe("Estuve fuera de 06:50 a 09:30. No se pasó nada.");
    expect(texts[1]).toMatch(/^Buenos días/);
    expect(s.messages[1]?.at).toBe(at(MAR, "09:30"));
  });

  it("saltar días no suelta una ráfaga de mensajes", () => {
    const before = run(fixtureState(), [at(MAR, "22:30"), tick]);
    const s = run(before, [
      at(MAR, "22:30"),
      { type: "skipDays", until: at(VIE, "09:12"), outcomes: { done: ["internet"], habits: [] } },
    ]);
    const added = s.messages.slice(before.messages.length);
    expect(added.map((m) => m.from)).toEqual(["system"]);
    expect(s.items.find((i) => i.id === "i2")?.status).toBe("done");
    // Lo que quedó con botones antes del salto ya no se puede tocar.
    expect(s.messages.every((m) => m.buttons.length === 0)).toBe(true);
  });
});
