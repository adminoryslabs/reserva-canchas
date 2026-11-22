# CONTRATO — HU-03 Cancelar una reserva propia

**Versión:** v2 · **Estado:** pendiente de gate · **Jira:** RCAN-4

Describe lo que se ve desde afuera. Es lo único que leen el TESTER y el DEV. Cómo se implementa por dentro es libertad del DEV.

**Cambios respecto de v1 (CAMBIO-01):** se agrega el caso "fuera de plazo" (409). Los demás casos no cambian.

## Entrada

`DELETE /api/reservas/{codigo}`

- `codigo`: código de reserva de 6 dígitos (puede empezar con ceros).

## Salida

| Caso | Respuesta | Mensaje (`{ "error": "…" }`) |
|---|---|---|
| Reserva activa, faltan 2 horas o más para su horario → queda cancelada y el horario vuelve a estar libre | 204, sin cuerpo | — |
| El código no tiene 6 dígitos | 400 | "el código debe tener 6 dígitos" |
| No existe una reserva con ese código | 404 | "código inválido o reserva no encontrada" |
| La reserva ya estaba cancelada (o alguien la canceló al mismo tiempo) | 410 | "la reserva ya no está activa" |
| Reserva activa, faltan menos de 2 horas para su horario o el horario ya pasó → no se cancela, sigue activa | 409 | "ya no se puede cancelar: faltan menos de 2 horas para el horario reservado" |
| Más de 5 intentos por minuto desde la misma conexión | 429 + `Retry-After` | — |

**Cómo se cuenta el plazo:** se compara la hora actual en Lima, Perú, con la fecha y hora de inicio de la reserva. Si faltan exactamente 2 horas, todavía se puede cancelar.

**Orden de los casos:** una reserva que ya estaba cancelada responde 410 aunque esté fuera de plazo.

## Pantalla

`/cancelar`: el jugador escribe su código. Si sale bien, ve "Reserva cancelada. El horario quedó libre.". Si falla, ve el mensaje de error que devuelve la API (incluido el de fuera de plazo).

## No se negocian

Ruta · método · códigos 204/400/404/409/410/429 · mensajes de error · límite de 2 horas en hora de Lima.

## Fuera de este contrato

- Cancelación por parte del administrador fuera de plazo: no existe.
- Penalización por cancelar tarde o por no presentarse: no existe.
- Notificaciones al cancelar (Punto Abierto #6 del PRD).

## Origen

Gherkin 1 a 4 de HU-03 · regla de negocio 1 del PRD (CAMBIO-01) · TECH-DESIGN §"Cancelar una reserva (HU-03)" · ADR-0002 · ADR-0010 · ADR-0011 (reemplaza a ADR-0008).
