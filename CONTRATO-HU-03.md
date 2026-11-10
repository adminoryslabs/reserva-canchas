# CONTRATO — HU-03 Cancelar una reserva propia

**Versión:** v1 · **Estado:** aprobado (gate 1) · **Jira:** RCAN-4

Describe lo que se ve desde afuera. Es lo único que leen el TESTER y el DEV. Cómo se implementa por dentro es libertad del DEV.

## Entrada

`DELETE /api/reservas/{codigo}`

- `codigo`: código de reserva de 6 dígitos (puede empezar con ceros).

## Salida

| Caso | Respuesta | Mensaje (`{ "error": "…" }`) |
|---|---|---|
| Reserva activa → queda cancelada y el horario vuelve a estar libre | 204, sin cuerpo | — |
| El código no tiene 6 dígitos | 400 | "el código debe tener 6 dígitos" |
| No existe una reserva con ese código | 404 | "código inválido o reserva no encontrada" |
| La reserva ya estaba cancelada (o alguien la canceló al mismo tiempo) | 410 | "la reserva ya no está activa" |
| Más de 5 intentos por minuto desde la misma conexión | 429 + `Retry-After` | — |

## Pantalla

`/cancelar`: el jugador escribe su código. Si sale bien, ve "Reserva cancelada. El horario quedó libre.". Si falla, ve el mensaje de error que devuelve la API.

## No se negocian

Ruta · método · códigos 204/400/404/410/429 · mensajes de error.

## Fuera de este contrato

- Límite de tiempo para cancelar: **no existe**. Es el Punto Abierto #4 del PRD; no se construye sin confirmación de negocio.
- Notificaciones al cancelar (Punto Abierto #6 del PRD).

## Origen

Gherkin 1 y 2 de HU-03 · TECH-DESIGN §"Cancelar una reserva (HU-03)" · ADR-0002 · ADR-0008 · ADR-0010.
