# Análisis de impacto — CAMBIO-01: Plazo para cancelar una reserva

**Pedido analizado:** `CAMBIO-01-plazo-cancelacion.md`
**Fecha del análisis:** 2026-11-10
**Estado:** análisis terminado · decisión pendiente (la toma una persona)

**Fuentes revisadas:** PRD, HU-01 a HU-04, `CONTRATO-HU-03.md`, `TECH-DESIGN.md`, ADRs, código en `src/`, `prisma/`, carpeta `tests/`, `docs/puertas.md`, `docs/openapi.yaml` y las tarjetas de Jira RCAN-2, RCAN-3, RCAN-4 y RCAN-5.

## 1. El cambio en una línea

A partir de ahora, un jugador solo puede cancelar su reserva hasta 2 horas antes del horario reservado; pasado ese momento, el sistema no le permite cancelar.

## 2. Piezas afectadas

| Pieza | ¿Cambia? | Qué cambia | Evidencia |
|---|---|---|---|
| PRD | Sí | El Punto Abierto #4 ("Política de cancelación") queda resuelto. Le corresponde al rol PM. | `PRD.md:44` |
| HU-03 | Sí | Se agrega un escenario Gherkin nuevo (cancelar con menos de 2 horas → rechazo) y se retira el punto abierto de política de cancelación. | `HU-03-cancelar-reserva.md:35` |
| HU-01, HU-02, HU-04 | No | No tratan la cancelación. HU-02 se relaciona con la ventana de reserva (ver pregunta 6). | `HU-02-reservar-cancha.md`; RCAN-3 (Punto Abierto #3) |
| CONTRATO-HU-03 | Sí | Hoy dice que el límite de tiempo "no existe" y declara que los códigos y mensajes "no se negocian". Requiere una versión 2 y una nueva aprobación (gate 1). | `CONTRATO-HU-03.md:29`, `CONTRATO-HU-03.md:33` |
| TECH-DESIGN | Sí | Se agrega un criterio a HU-03. Se retira la frase que dice que el diseño "deliberadamente no construye" un bloqueo de cancelación. La zona horaria deja de afectar solo a la fecha "hoy" y pasa a ser crítica. | `TECH-DESIGN.md:146-157`, `TECH-DESIGN.md:113-120`, `TECH-DESIGN.md:217-219`, `TECH-DESIGN.md:224-227` |
| ADR-0008 (manejo de errores) | Sí | Se agrega el caso de error nuevo, con su código de respuesta y su mensaje. | `adrs/0008-resiliencia-manejo-errores.md:24-34` |
| ADR nuevo | A decidir | Puede bastar con ampliar ADR-0008 o puede hacer falta un ADR propio para la regla de tiempo. | — |
| ADR-0002, ADR-0004, ADR-0009, ADR-0010 | No | El código de reserva, los horarios, el acceso de administrador y el límite de intentos no cambian. | `src/app/api/reservas/[codigo]/route.ts:8` |
| Servicio `cancelarReserva` | Sí | Antes de cancelar, debe comparar la fecha y hora de la reserva con la hora actual del complejo. | `src/server/services/reservas.ts:48-59` |
| Utilidades de fechas (`dates.ts`) | Sí | Hoy solo calcula qué día es "hoy". Falta obtener la hora actual en la zona del complejo. | `src/lib/dates.ts:21-29` |
| Zona horaria (`config.ts`) | Sí (crítico) | Si `COMPLEX_TIMEZONE` no está configurada, el sistema usa UTC. Una zona incorrecta mueve el corte varias horas. | `src/lib/config.ts:15-17` |
| Ruta `DELETE /api/reservas/{codigo}` | No | Solo llama al servicio. | `src/app/api/reservas/[codigo]/route.ts:7-14` |
| Registro de rechazos (`http.ts`) | A decidir | Solo registra como advertencia los rechazos 404, 409 y 410. Si se elige otro código, ese rechazo no queda registrado. | `src/lib/http.ts:23` |
| Pantalla `/cancelar` | No (técnico) · a decidir (experiencia de uso) | Ya muestra cualquier mensaje que envíe la API. Falta decidir si debe informar el plazo antes de que el jugador intente cancelar. | `src/app/cancelar/page.tsx:17-18` |
| Base de datos y migraciones | No | La reserva ya guarda la fecha y la hora de inicio, que es lo que se necesita. | `prisma/schema.prisma:36-37` |
| Servicios de disponibilidad y agenda | No | No dependen de la cancelación. | `src/server/services/disponibilidad.ts`, `src/server/services/agenda.ts` |
| Pruebas | Sí | La carpeta `tests/` está vacía: HU-03 no tiene ninguna prueba hoy. Las pruebas de la regla nueva deben poder fijar la hora actual. | `tests/` (vacía) |
| `docs/openapi.yaml` | Sí | Se agrega la respuesta nueva, se elimina la nota "No hay límite de tiempo para cancelar" y se sube la versión 0.2.0. | `docs/openapi.yaml:3`, `docs/openapi.yaml:348`, `docs/openapi.yaml:379-388` |
| `docs/puertas.md` | Sí | Se agrega la falla nueva en la pantalla `/cancelar` y en la función `cancelarReserva`. | `docs/puertas.md:13`, `docs/puertas.md:43` |
| Jira RCAN-4 (HU-03) | Sí | Está "En curso". Su descripción todavía lista el Punto Abierto #4 como abierto y no incluye el escenario nuevo. | RCAN-4 (verificado en Jira) |
| Jira RCAN-2, RCAN-3, RCAN-5 | No | No mencionan la cancelación con plazo. | RCAN-2, RCAN-3, RCAN-5 (verificado en Jira) |

## 3. Preguntas que debe decidir una persona

1. **Borde del plazo:** si faltan exactamente 2 horas, ¿todavía se puede cancelar?
2. **Respuesta al jugador:** ¿con qué código y qué mensaje se rechaza? El 410 actual dice "la reserva ya no está activa", lo cual no es cierto en este caso. Cualquier código nuevo cambia lo que el contrato declara como no negociable.
3. **Zona horaria:** ¿en qué zona horaria opera el complejo? Antes era un riesgo menor; ahora define el momento del corte.
4. **Reservas existentes:** ¿la regla se aplica a las reservas ya hechas, que se tomaron con la regla de "cancelar en cualquier momento", o solo a las nuevas?
5. **Excepción para el administrador:** ¿el administrador puede cancelar fuera de plazo (por ejemplo, por lluvia o a pedido del jugador)? Hoy el administrador no tiene forma de cancelar.
6. **Reservas de último momento:** ¿se puede reservar con menos de 2 horas de anticipación? Si se puede, esa reserva nunca podría cancelarse. Esto se cruza con el Punto Abierto #3 (ventana de reserva), que sigue sin definir.
7. **Efecto real sobre el problema:** sin pago ni penalidad, el jugador que no puede cancelar puede simplemente no presentarse; la cancha queda vacía igual y el complejo deja de enterarse a tiempo. ¿Esta regla resuelve el problema planteado?
8. **Aviso previo:** ¿hay que informar el plazo al jugador antes (al reservar o en la pantalla `/cancelar`)? Se cruza con el Punto Abierto #6 (notificaciones).

## 4. Promesas de puertas que se rompen

**Sí, el cambio rompe una promesa.** La puerta `DELETE /api/reservas/{codigo}` promete que toda reserva activa se cancela con respuesta 204, y el contrato declara cerrados sus códigos y mensajes (`CONTRATO-HU-03.md:29`, `CONTRATO-HU-03.md:33`). Con el cambio, una reserva activa puede ser rechazada.

Quién la usa hoy y qué le pasaría:

- **La pantalla `/cancelar`** (`src/app/cancelar/page.tsx:13`). No se rompe: muestra el mensaje nuevo tal como llega. Si la API no enviara mensaje, el jugador vería el texto genérico "No se pudo cancelar la reserva.", sin explicación.
- **Los jugadores con reservas activas a menos de 2 horas.** Pierden una posibilidad que hoy tienen, sin aviso previo.
- **TESTER y DEV**, que trabajan sobre el contrato v1 aprobado. Sus criterios quedarían desactualizados.

## 5. NO VERIFICADO

- **Otros clientes de la API además de `/cancelar`.** No hay despliegue ni registros de uso en el repositorio.
- **Valor de `COMPLEX_TIMEZONE` en producción.** No hay despliegue y no se pudo leer `.env.example`. Si la variable no está configurada y el complejo opera en UTC-5, el sistema bloquearía cancelaciones desde 7 horas antes, no 2.
- **Cantidad de reservas activas** que quedarían dentro de la ventana bloqueada al activar la regla.
- **Trabajo abierto en RCAN-4** (estado "En curso") que pueda chocar con este cambio. No se revisaron ramas ni pull requests.

## 6. Recomendación

**Próximo sprint.** El cambio en el código es chico, pero no se puede construir sin que negocio responda antes las preguntas 1 a 4. Además, obliga a emitir un contrato v2 (hoy sus códigos y mensajes están cerrados) y a escribir las primeras pruebas de HU-03, que todavía no existen.

La decisión final corresponde al responsable del producto.
