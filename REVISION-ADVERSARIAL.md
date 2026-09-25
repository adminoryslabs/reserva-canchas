# Revisión Adversarial — TECH-DESIGN.md + ADRs 0001–0009

**Skill:** `revision-adversarial`
**Alcance revisado:** `TECH-DESIGN.md`, 9 ADRs (`adrs/0001`–`0009`), `PRD.md`, `HU-01` a `HU-04`.
**Documentos no disponibles:** `Design.md` (no existe en este proyecto — confirmado en TDD §"Resumen").
**Condición:** revisión ejecutada en la misma sesión que generó el TDD. Esto activa el sesgo de
auto-preferencia del modelo (tiende a ratificar su propia salida). El revisor lo declara
explícitamente porque reduce la fuerza de la crítica. Los hallazgos C1–C4 son robustos
independientemente del historical (verificables re-leyendo los documentos); el resto son
mejoras incrementales.

## Resumen ejecutivo

| Severidad  | Cantidad |
|------------|----------|
| Crítico    | 4        |
| Advertencia | 5        |
| Sugerencia | 4        |
| Áreas defendidas (sin issues) | 2 (ADR-0001, ADR-0003) |

Cada ADR fue desafiado contra la barra del skill (contexto, alternativas, consecuencias,
proporcionalidad). **Ningún ADR fue rubricado sin intentarlo.**

---

## Críticos

### [C1] ADR-0004 — El "constraint de unicidad para reservas activas" no es expresable como `UNIQUE` simple

**Dónde:** `adrs/0004-modelo-datos-slots-fijos.md` (decisión + consecuencias), `TECH-DESIGN.md`
§"Modelo de datos" (constraint sobre `Reserva`).

**Problema:** Tanto el TDD como el ADR describen:

> "Constraint de unicidad sobre `(cancha_id, fecha, hora_inicio)` para reservas en estado
> `activa`".

Un `UNIQUE (cancha_id, fecha, hora_inicio)` *común* en PostgreSQL aplica a todas las filas, no
solo a las activas. Cuando la primera reserva de un slot se cancele (`estado = 'cancelada'`),
ningún otro jugador podrá volver a reservar ese mismo slot: el índice considerará que la fila
ya ocupa el constraint. Resultado: **el sistema libera el slot visualmente (HU-03 camino
feliz) pero la base de datos lo sigue marcando como ocupado**, y la siguiente reserva fallará
con 409 aunque la agenda diga "libre". Es un bug de invariante, no un detalle de
implementación.

**Cómo se debe expresar:** partial unique index:

```sql
CREATE UNIQUE INDEX uniq_reserva_activa
  ON "Reserva" (cancha_id, fecha, hora_inicio)
  WHERE estado = 'activa';
```

Esto **no** aparece ni en el ADR ni en el TDD. Prisma no tiene sintaxis declarativa para
partial indexes (su `@@unique` no soporta `WHERE`): se necesita `prisma.$executeRawUnsafe(...)`
en una migración. Si esto no se sabe, lo más probable es que se escriba
`@@unique([canchaId, fecha, horaInicio])` en el schema y el bug aparezca en cuanto se cancele
la primera reserva.

**Por qué importa:** invalida el criterio de éxito #2 del PRD ("el sistema nunca permite dos
reservas para la misma cancha en el mismo horario") apenas se cancele la primera reserva de un
slot. Es el camino feliz de HU-03 partiendo el invariante de HU-02. Si llega a producción
sin detección, el daño es permanente en los slots ya reservados-cancelados: requieren borrar
filas manualmente.

**Acción sugerida:** Reescribir el constraint en TDD y ADR con la sintaxis exacta del partial
index. Documentar el paso de `$executeRaw` en la migración Prisma como parte de la decisión.

---

### [C2] ADR-0008 contradice directamente los criterios de aceptación de HU-03

**Dónde:** `adrs/0008-resiliencia-manejo-errores.md` (decisión, segundo bullet);
`HU-03-cancelar-reserva.md` §"Criterios de aceptación", Escenario 2.

**Problema:** Dos requisitos enfrentados en el mismo flujo:

1. **ADR-0008 dice:**
   > "Código de reserva inválido al cancelar: la API responde con estado 404 y un mensaje
   > genérico (`código inválido o reserva no encontrada`), **sin distinguir si el código no
   > existe o pertenece a otra reserva**, para no filtrar información."

2. **HU-03 Escenario 2 dice:**
   > "Jugador intenta cancelar una reserva que ya fue cancelada → el sistema informa que la
   > **reserva ya no está activa**, y no repite la liberación del horario."

Una reserva cancelada tiene un `codigo_reserva` *válido* (existe en la BD, fue mostrado al
jugador) pero su `estado` no es `activa`. Si ADR-0008 obliga a no distinguir, el jugador que
intenta cancelar su propia reserva cancelada recibe "código inválido o reserva no encontrada",
lo cual:

- es **literalmente falso** (el código sí existe y es del jugador),
- contradice el mensaje exigido por HU-03 ("ya no está activa"),
- confunde al jugador que tiene el código en su captura de pantalla y aún así recibe "no
  encontrada".

No se resuelve "implementando ambos": son políticas distintas para el mismo estado
intermedio (código válido + estado no activo). Necesita una decisión de producto sobre
**cuántos estados internos debe poder discernir el usuario desde la UI** antes de fijar la
política de error de la API.

**Por qué importa:** la implementación no puede cumplir HU-03 escenario 2 sin violar ADR-0008,
ni viceversa. Bloquea codificación. Si se resuelve "implementando lo del ADR", el escenario de
Gherkin de HU-03 falla. Si se resuelve "implementando lo de HU-03", se filtra el estado
interno de las reservas (información que el ADR explícitamente quería proteger).

**Acción sugerida:** Escalar a negocio antes de implementar. Levantar el conflicto como un
**Punto Abierto adicional** del PRD (no estaba previsto); pedir decisión sobre una de tres
vías:

- (a) mantener ADR-0008 y relajar HU-03 (cambiar el escenario a "404 genérico, sin más
  detalle").
- (b) cambiar ADR-0008 para distinguir "existe pero cancelada" (HTTP 410 Gone con mensaje
  específico), aceptando la pequeña fuga de información.
- (c) introducir un endpoint "consultar estado de reserva" previo al DELETE, de modo que la
  UI muestre el estado sin que el endpoint de cancelación filtre nada.

---

### [C3] No existe ADR sobre rate limiting ni protección contra enumeración — riesgo materializado, no teórico

**Dónde:** `adrs/0002-identificacion-jugador-sin-cuenta.md` (consecuencias, trade-off de
pérdida de código); `TECH-DESIGN.md` §"Riesgos técnicos abiertos" (fuerza bruta sobre código
de reserva y contraseña admin).

**Problema:** El TDD declara el riesgo explícitamente:

> "Fuerza bruta sobre el código de reserva: al ser un código de 6 dígitos sin dato de contacto
> asociado, existe una superficie teórica de adivinación; no se implementó rate limiting sobre
> el endpoint de cancelación en este MVP. Debería revisarse antes de un uso real."

Pero **no hay una decisión arquitectónica** que diga cómo se mitiga, solo un "debería
revisarse":

- Endpoint de cancelación (`DELETE /api/reservas/[codigo]` o equivalente): acepta cualquier
  código de 6 dígitos. 10⁶ códigos × N reservas activas = espacio enumerable. Un atacante
  que observe la agenda del admin (que muestra el código de cada reserva, ver HU-04)
  **tiene una lista de códigos que ya fueron cancelados y son visibles** (ver [A1]); puede
  probar fuerza bruta contra el endpoint en cuestión de horas.
- Endpoint admin: una sola contraseña compartida. Sin rate limiting, atacable igual con un
  diccionario pequeño.

"Revisar antes de un uso real" no es una decisión arquitectónica — es posponer la decisión.
Para un MVP de demo en Vercel gratis, un rate limiter cuesta 0 líneas si se usa Vercel
Firewall (incluido en el plan) con throttling por IP, o unas pocas líneas si se usa Upstash
Ratelimit (también tiene tier gratuito).

**Por qué importa:** convierte un riesgo documentado en una superficie real. Un usuario
curioso con `curl` puede romper el modelo de identificación del jugador antes de que se
decida mitigarlo. Y peor: como el admin ve los códigos en pantalla, **el rate limiter es la
única defensa efectiva** que queda.

**Acción sugerida:** Agregar ADR-0010 "Rate limiting y mitigación de enumeración" **antes de**
implementar los endpoints. Decidir explícitamente: (a) rate limit por IP en endpoints
sensibles con Vercel Firewall + reglas básicas, (b) Upstash Ratelimit si se quiere lógica
más rica, o (c) aceptar el riesgo y documentarlo como **decisión consciente** (no como
"revisar").

---

### [C4] Ambigüedad arquitectónica entre ADR-0005 y ADR-0007: ¿REST interno o queries directas?

**Dónde:** `adrs/0005-api-rest-nextjs-routes.md` (decisión: API REST en `/api/*`);
`adrs/0007-estado-server-components.md` (decisión: Server Components con fetch server-side);
`TECH-DESIGN.md` §"Arquitectura de componentes".

**Problema:** El TDD describe la arquitectura como tres piezas separadas:

- "UI (Server Components) — vistas de disponibilidad, reserva, cancelación y agenda".
- "API Routes (REST) — endpoints bajo `/api/*`".
- "Capa de acceso a datos — separada de los handlers de UI/API, usando Prisma como ORM".

Pero no dice **cómo se conecta la UI con los datos**. Tres interpretaciones posibles, todas
plausibles y todas distintas:

1. **Server Components hacen `fetch` a las API Routes del mismo repo:** round-trip HTTP
   innecesario en server-side, dos stacks de error handling (REST + Server Components
   directo), pero valida que la API REST es consumible externamente.
2. **Server Components importan funciones de la capa de datos directamente (Prisma):** salta
   la capa REST, el "contrato REST" solo existe para clientes externos hipotéticos, y la
   API REST queda sin consumidores reales hasta que aparezcan.
3. **Server Components hacen fetch + invalidan con `revalidatePath` / `revalidateTag`:**
   híbrido, requiere definir tags de invalidación y un mapa de qué pantalla invalida qué,
   no mencionado en ningún ADR.

Esta ambigüedad cambia la forma del proyecto:

- La estructura de carpetas (¿hay una capa `services/` que llaman API y Server Components
  por igual?).
- La estrategia de tests (¿se mockea `fetch`, se mockea Prisma, o ambos?).
- La justificación misma de ADR-0005: "reutilizable a futuro por cualquier cliente HTTP
  adicional". Si la interpretación es (2), la reutilización es solo potencial — el código que
  se escribe hoy no la valida.

**Por qué importa:** dos implementadores producirían dos arquitecturas distintas. Para un
MVP chico es manejable, pero **bloquea el diseño de carpetas, la estrategia de tests, y
cuestiona la justificación de ADR-0005**.

**Acción sugerida:** Agregar una sección "Conexión UI ↔ datos" en el TDD que diga
explícitamente cuál de las tres es la adoptada. Si es la (2), reconsiderar ADR-0005: ¿vale
la pena el boilerplate de API Routes sin consumidor actual? Si es la (1), documentar por qué
se prefiere round-trip HTTP a Prisma directo (testabilidad real, contrato explícito). Si es
la (3), listar las tags de invalidación.

---

## Advertencias

### [A1] ADR-0002 no define el ciclo de vida del `codigo_reserva` tras cancelación

**Dónde:** `adrs/0002-identificacion-jugador-sin-cuenta.md` §"Decisión" y §"Consecuencias";
`TECH-DESIGN.md` §"Modelo de datos" (constraint de unicidad sobre `codigo_reserva` para
reservas activas).

**Problema:** El ADR dice que el código es único por reserva activa (constraint), pero no
dice qué pasa con el código cuando la reserva se cancela. Tres políticas posibles, todas con
trade-offs distintos:

- **Reutilizar códigos cancelados:** el espacio de 10⁶ códigos dura más, pero **un código que
  aparece en la agenda del admin puede ser adoptado por otra persona para una reserva
  futura**. Anula parcialmente la protección del código como "secreto compartido entre
  jugador y sistema".
- **No reutilizar (quemar el código para siempre):** seguridad más simple (constraint UNIQUE
  sin cláusula `WHERE`), pero el espacio de 10⁶ códigos puede reducirse notablemente según
  el rango horario y la cantidad de canchas (variables que el PRD no cerró, Punto Abierto
  #5). Orden de magnitud optimista: con 5 canchas × 14 slots × 365 días ≈ 25k slots/año, el
  espacio dura décadas. Pero el constraint UNIQUE debe ser **sin** la cláusula `WHERE`,
  mientras que el de cancha+fecha+hora sí la necesita (ver [C1]) — son políticas distintas.
- **Soft-delete con timestamp:** requiere cambiar la semántica del constraint; overkill para
  el alcance.

**Por qué importa:** decisión de seguridad que, si no se hace, quedará resuelta "por
implementación" sin haberla pensado. Y es asimétrica: una vez que se quema un código, no hay
vuelta atrás sin migración de datos.

**Acción sugerida:** Agregar al ADR-0002 la política explícita. Recomendación: **no
reutilizar**, constraint `UNIQUE` sin cláusula `WHERE` sobre `codigo_reserva`. Justificación:
espacio suficiente, previene la superficie de reuso indebido, y mantiene invariante más
simple.

---

### [A2] ADR-0006 ignora el problema de connection pooling Neon + Vercel serverless

**Dónde:** `adrs/0006-orm-prisma.md` §"Decisión"; `TECH-DESIGN.md` §"Arquitectura de
componentes" (Neon Postgres).

**Problema:** El plan gratuito de Neon tiene un límite bajo de conexiones simultáneas. Las
funciones serverless de Vercel levantan **una nueva instancia por request** (al menos en
cold start), y Prisma abre una conexión por instancia del cliente. En un pico de tráfico de
demo — precisamente el momento en el que más se prueba el sistema — es plausible que se
agoten las conexiones y las requests fallen con `P1001: Can't reach database server` o
similar.

La solución estándar es una de:

- **Neon connection pooler (PgBouncer integrado):** usar la URL del pooler en el cliente
  Prisma. Gratis, incluido en Neon.
- **Prisma Accelerate:** capa de cache + connection pooling gestionada. Pago.
- **Singleton pattern en código:** compartir el cliente Prisma entre invocaciones de la
  misma función. Limita, no resuelve.

Nada de esto aparece en ADR-0006 ni en el TDD. Si se descubre en producción, el fix típico
es "agreguemos Prisma Accelerate", pero eso tiene costo y cambia la decisión del ADR.

**Por qué importa:** en demo puede pasar inadvertido. Pero si se usa para un partido real y
varios jugadores entran a la vez a reservar, el sistema cae. No está alineado con el
criterio "el sistema nunca permite dos reservas para la misma cancha en el mismo horario" —
porque **ningún jugador podrá reservar nada** si la BD no responde.

**Acción sugerida:** Agregar a ADR-0006 (o como ADR nuevo) la decisión de pooler. Para un
MVP en Neon free, **PgBouncer integrado de Neon es suficiente y gratis**: documentar la URL
del pooler como variable de entorno separada (`DATABASE_URL` para migraciones,
`DATABASE_POOL_URL` para runtime).

---

### [A3] Sin ADR sobre time zone — bug latente para cualquier complejo fuera de UTC

**Dónde:** Modelo de datos (`Reserva.fecha`, `Reserva.hora_inicio`); ADR-0004 (slots fijos).

**Problema:** El TDD dice "fecha" y "hora_inicio (hora en punto dentro del rango operativo
del complejo, ej. 08:00–22:00)" pero no dice en qué zona horaria. Tres opciones, todas con
consecuencias distintas:

- `TIMESTAMP WITH TIME ZONE` (UTC en Postgres): se necesita conversión en UI y seed; riesgo
  de mostrar 03:00 al jugador si no se convierte bien.
- `DATE` + `TIME` sin zona (recomendado para MVP local): el "08:00" es el 08:00 del complejo,
  no del cliente; más simple para demo de un complejo local.
- `TIMESTAMP WITHOUT TIME ZONE`: similar al anterior pero más fácil de equivocarse con
  funciones de Postgres.

**Por qué importa:** una vez escrito el código y la migración, cambiar el tipo es caro
(cambio de tipo de columna, posible re-seed, lógica de presentación).

**Acción sugerida:** Definir en el TDD: fecha/hora **local del complejo**, almacenada como
`DATE` + `TIME` sin zona. El seed genera slots en esa zona local. La UI muestra horas
locales, no UTC del servidor.

---

### [A4] ADR-0007 — el "conflicto queda cubierto por el constraint" oculta un problema de UX

**Dónde:** `adrs/0007-estado-server-components.md` §"Consecuencias" (trade-off sobre
actualización live).

**Problema:** El ADR dice que la falta de actualización en vivo "no es un problema porque el
constraint cubre el conflicto real". Es cierto a nivel de **datos**, pero no aborda la UX:

- Jugador A ve "libre" en pantalla, hace click en "Reservar 19:00 Fulbito 1".
- En paralelo, Jugador B ya envió su request. El backend aceptó la de B, rechazó la de A
  con 409.
- Jugador A ve un mensaje 409 ("ya no está disponible") sin contexto. Si la página no se
  recarga automáticamente, A puede pensar que es un error de la app y reintentar, recibiendo
  otro 409, sin saber qué slot específico cambió.

**Por qué importa:** no es bloqueante, pero es un gap de producto que conviene documentar
junto a la decisión arquitectónica, no descubrirlo en demo.

**Acción sugerida:** Agregar a ADR-0007 o al TDD que la respuesta 409 viene acompañada de
**revalidación de la disponibilidad** (`revalidatePath` o equivalente), de modo que el
jugador ve el slot actualizado sin tener que recargar manualmente.

---

### [A5] ADR-0009 no especifica sesión, expiración ni CSRF

**Dónde:** `adrs/0009-proteccion-vista-administrador.md` §"Decisión".

**Problema:** La decisión dice "contraseña única compartida" pero no especifica:

- ¿Cómo se valida? (Header `Authorization`, cookie httpOnly, redirect con query string,
  basic auth).
- ¿Hay expiración de sesión? ¿Cuánto dura?
- Si es cookie: ¿es httpOnly + Secure + SameSite? Si es SameSite=Lax y se autentica por GET,
  hay riesgo de CSRF si en el futuro hay endpoints admin de mutación.
- ¿Qué pasa si la variable de entorno no está seteada? (¿Acceso denegado, abierto, error
  500? deny-by-default debería ser la política).

Hoy no hay endpoints admin de mutación (HU-04 es solo lectura), así que el riesgo de CSRF es
teórico. **Pero la decisión sienta precedente** y un próximo ADR que agregue una mutación
admin heredará esta base sin pensarlo.

**Por qué importa:** pequeña deuda de seguridad que se paga cara cuando se quiere extender.

**Acción sugerida:** Especificar en el ADR: validación vía cookie httpOnly + Secure +
SameSite=Lax con expiración de 8h; variable de entorno **requerida** (deny-by-default si
falta → 503 con mensaje claro, nunca acceso abierto).

---

## Sugerencias

### [S1] Sin diagrama de secuencia de cancelación ni de agenda admin

El TDD enlaza diagramas para componentes, reserva y despliegue, pero no para cancelación
(HU-03) ni para agenda admin (HU-04). Para mantener coherencia con el resto del documento,
agregar `diagramas/cancelacion.html` y `diagramas/agenda-admin.html`.

### [S2] Validación de inputs no tiene decisión arquitectónica

No hay ADR ni sección que diga cómo se validan inputs: código de 6 dígitos numéricos, fecha
en formato `YYYY-MM-DD`, hora en formato `HH:MM`, cancha existente en el seed, slot dentro
del rango operativo. Recomendación mínima: **Zod** en API Routes + tipos compartidos con
Server Components (reutilización via `z.infer`). Es un cambio pequeño que evita toda una
categoría de bugs.

### [S3] Nomenclatura inconsistente: "slot", "horario", "franja"

El TDD alterna entre "slot fijo" (ADR-0004), "horario" (TDD §"Modelo de datos"), "franja
horaria" (ADR-0004 contexto) y "horarios definidos" (HU-01). Sugerencia: elegir un término
y usarlo consistentemente. Preferencia: **"slot"** si se mantiene la metáfora técnica, o
**"horario"** si se prioriza legibilidad para el equipo no técnico.

### [S4] Logging mínimo no decidido

No hay decisión sobre logging estructurado. Para debugging del 409 (constraint violation), la
agenda admin o el login admin, sin logs no hay forma de investigar un fallo sin reproducirlo
manualmente. Recomendación: `console.log` estructurado en JSON con `requestId` propagado
desde middleware, mínimo viable para demo. No requiere plataforma de logs externa.

---

## Áreas que resistieron el escrutinio

### ADR-0001 — Monolito Next.js con capa de datos separada

- Contexto justificado por el PRD y el requisito de Vercel/Neon.
- Alternativas reales (SPA+API separada vs monolito sin separación), no son nombres
  distintos para lo mismo.
- Consecuencias incluyen trade-off real (acoplamiento ciclo de deploy) sin disfrazar el
  costo.
- Proporcionalidad correcta: si fuera un SaaS multi-tenant, sería under-engineering; para
  MVP demo es exacto.

**No hay issues que reportar.**

### ADR-0003 — Canchas como seed fijo

- Contexto bien apoyado en los Puntos Abiertos #1 y #5 del PRD, y en que ninguna HU pide
  CRUD de canchas.
- Alternativas razonables (CRUD admin, modelar Sede) y correctamente descartadas con
  justificación.
- Trade-off explícito sobre qué se revierte si negocio confirma gestión de canchas.

**No hay issues que reportar.**

---

## Áreas con observaciones menores (no escaladas a hallazgo)

- **ADR-0005 — justificación de REST sobre Server Actions es débil.** El ADR argumenta
  "reutilizable a futuro por un cliente externo" como ventaja de REST sobre Server Actions,
  pero Server Actions también son HTTP-routables (Next.js las expone bajo el header
  `Next-Action` y son invocables vía HTTP). La justificación es **directionally correcta**
  (REST es más portable en el sentido de "no acoplado a Next.js") pero **débilmente
  argumentada**. Sin embargo, ya está mitigada por ADR-0001 (la decisión monolítica hace
  REST razonable) y por el alcance demo. **No agrego como hallazgo separado**, queda
  registrado como nota.
- **ADR-0008 (manejo de errores):** la decisión de no implementar reintentos/circuit breaker
  es coherente con el alcance demo. No hay issue.

---

## Notas de método

- **Sesgo de auto-preferencia declarado:** esta revisión se ejecutó en la misma sesión que
  generó el TDD. Según el protocolo de la skill, esto reduce la fuerza de la crítica. Los
  hallazgos C1–C4 son robustos independientemente del historical (verificables re-leyendo
  los documentos); los demás son mejoras incrementales que podrían aparecer en cualquier
  revisión posterior.
- **PRD.md y HU-01 a HU-04 disponibles:** cross-checked contra todos los hallazgos. No hay
  contradicción con el PRD; sí hay una contradicción interna entre ADR-0008 y HU-03 (ver
  [C2]).
- **Design.md no disponible:** no se pudo verificar cobertura del modelo de datos contra UI
  detallada. El modelo se ve completo para HU-01 a HU-04, pero no se puede confirmar que
  cada elemento visual tenga contraparte en datos.
- **Diagramas HTML enlazados en TDD no inspeccionados:** referenciados pero no abiertos en
  esta revisión; el alcance es sobre documentos de decisión, no sobre artefactos
  derivados.