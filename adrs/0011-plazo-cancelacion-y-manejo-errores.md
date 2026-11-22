# ADR 0011: Manejo de errores con plazo de cancelación (reemplaza a ADR-0008)

## Estado

Aceptado — reemplaza a ADR-0008

## Contexto

ADR-0008 definió cómo responde la API ante cada error. CAMBIO-01 resolvió el Punto Abierto #4 del
PRD: una reserva solo se puede cancelar hasta 2 horas antes de su horario, en hora de Lima, Perú.
ADR-0008 no contempla ese caso, y el TDD dejaba la zona horaria sin confirmar, con efecto solo
sobre la fecha "hoy". Ahora la zona define en qué momento se corta la cancelación, así que deja de
ser un detalle menor.

`fecha` y `hora_inicio` se guardan como hora local del complejo, sin zona (TDD §"Zona horaria").
Lima no tiene cambio de horario de verano, así que no hay horas repetidas ni que falten.

## Decisión

Se mantienen todas las decisiones de ADR-0008 y se agregan dos nuevas:

- **Conflicto de reserva:** la API captura la violación del constraint de unicidad de Prisma y
  responde con estado 409 y un mensaje indicando que el horario ya no está disponible (cubre HU-02,
  escenario de caso borde). Además dispara la revalidación de la vista de disponibilidad (ADR-0007).
- **Límite de intentos excedido:** 429 con cabecera `Retry-After` (ADR-0010).
- **Contrato de errores:** toda respuesta de error es JSON `{ "error": "<mensaje>" }` con el status
  indicado; nunca se devuelve el error crudo de Prisma ni stack traces.
- **Código de reserva inexistente al cancelar:** 404 con el mensaje genérico "código inválido o
  reserva no encontrada". El formato inválido (no son 6 dígitos) responde 400 sin consultar la base.
- **Reserva ya cancelada al cancelar:** 410 con el mensaje "la reserva ya no está activa", sin
  modificar nada (HU-03, escenario 2). Se mantiene la fuga mínima de información aceptada en
  ADR-0008, por las mismas razones (ADR-0002, ADR-0010).
- **Nuevo — Cancelación fuera de plazo:** si la reserva está activa y faltan menos de 2 horas para
  su inicio (o el horario ya pasó), la API responde 409 con el mensaje "ya no se puede cancelar:
  faltan menos de 2 horas para el horario reservado" y no modifica nada (HU-03, escenarios 3 y 4).
  Si faltan exactamente 2 horas, se cancela. La regla se revisa en el servidor, nunca solo en la
  pantalla. Orden de las comprobaciones: 400 → 404 → 410 → 409.
- **Nuevo — Zona horaria del complejo:** la hora actual se calcula en `America/Lima`.
  `COMPLEX_TIMEZONE` pasa a valer `America/Lima`, y si falta, el valor por defecto deja de ser UTC
  y pasa a ser `America/Lima`. Esto también afecta el cálculo de "hoy".
- **Falla de conexión a Neon:** 500 con mensaje genérico ("no se pudo procesar la solicitud,
  intentar nuevamente"), sin reintento automático ni circuit breaker.

## Alternativas consideradas

- **Reusar el 410 con el mismo mensaje** — no sumaba un código nuevo, pero el mensaje "la reserva
  ya no está activa" sería falso: la reserva sigue activa.
- **403 (prohibido)** — en HTTP se usa para falta de permisos, y el jugador sí tiene derecho a
  gestionar su reserva. Lo que lo impide es el momento.
- **422 (entrada inválida)** — el código es válido. El problema es el estado de la reserva en este
  momento, y eso es lo que expresa el 409 (conflicto con el estado actual).
- **Bloquear solo en la pantalla** — no protege la API, que se puede llamar directamente.
- **Reintentos automáticos y/o circuit breaker ante falla de Neon** — se mantiene descartado, como
  en ADR-0008.

## Consecuencias

- La regla del cliente queda aplicada en un único punto del servidor, con un mensaje claro para el
  jugador. La pantalla `/cancelar` ya muestra cualquier mensaje de la API, así que no necesita
  cambios.
- El 409 ya registra un aviso en el log (`src/lib/http.ts:23`), así que los rechazos por plazo
  quedan registrados sin cambios extra.
- Costo: el 409 pasa a tener dos significados, según la ruta: "horario tomado" al reservar y
  "fuera de plazo" al cancelar. El mensaje es lo que los distingue.
- Costo: la regla depende del reloj del servidor y de la zona correcta. Las pruebas tienen que
  poder fijar la hora actual.
- Costo: una reserva hecha con menos de 2 horas de anticipación no se puede cancelar nunca, mientras
  el Punto Abierto #3 (ventana de reserva) siga abierto.
- ADR-0008 queda reemplazado. No se edita: se conserva como historial.
