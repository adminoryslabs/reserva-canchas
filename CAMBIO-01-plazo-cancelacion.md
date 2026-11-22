# CAMBIO-01 — Plazo para cancelar una reserva

**Estado:** aprobado
**Pedido por:** administración del complejo
**Fecha:** 2026-11-10
**Fecha de aprobación:** 2026-11-10

## El pedido, tal como llegó

> "Nos están cancelando reservas 10 minutos antes del partido y la cancha queda vacía. A partir de ahora, una reserva se puede cancelar solo hasta 2 horas antes del horario reservado. Después de eso, ya no."

## Qué responde

El Punto Abierto #4 del PRD ("Política de cancelación"), que estaba sin definir desde el inicio del proyecto.

## Análisis de impacto

`IMPACTO-CAMBIO-01-plazo-cancelacion.md`

## Decisión

**Aprobado** el 2026-11-10 por Mario Yahuarcani. Entra en el **próximo sprint**, según la recomendación del análisis de impacto.

Decisiones tomadas:

| Tema | Decisión | Quién decidió |
|---|---|---|
| Zona horaria | Hora de Lima, Perú (`America/Lima`). | Mario Yahuarcani |
| Límite exacto | Si faltan exactamente 2 horas, todavía se puede cancelar. | Agente, por delegación |
| Respuesta al jugador | 409 con el mensaje "ya no se puede cancelar: faltan menos de 2 horas para el horario reservado". | Agente, por delegación |
| Reservas existentes | La regla se aplica a todas las reservas activas, incluidas las hechas antes del cambio. | Agente, por delegación |
| Cancelación por el administrador | No se agrega. Si hace falta, es un pedido aparte. | Agente, por delegación |
| Reservas con menos de 2 h de anticipación | No se restringen (el Punto Abierto #3 sigue abierto). Una reserva hecha así ya no se puede cancelar. | Agente, por delegación |
| Efecto sobre las ausencias | Se aplica la regla tal como la pidió el cliente. Sin penalización: los pagos están fuera de alcance. | Agente, por delegación |
| Aviso previo del plazo | No se agrega ningún aviso nuevo; el jugador solo ve el mensaje de rechazo (el Punto Abierto #6 sigue abierto). | Agente, por delegación |

Artefactos actualizados: `PRD.md` (v1.1), `HU-03-cancelar-reserva.md`, `CONTRATO-HU-03.md` (v2, pendiente de gate), `adrs/0011-plazo-cancelacion-y-manejo-errores.md` (reemplaza a ADR-0008) y `TECH-DESIGN.md`. El código, `docs/puertas.md` y `docs/openapi.yaml` se actualizan cuando se implemente el cambio.
