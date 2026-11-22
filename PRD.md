# PRD — Reserva de Canchas para Complejo Deportivo

## Problema

Hoy las reservas de canchas de fulbito y vóley se hacen por WhatsApp o llamada telefónica. Esto genera dos problemas concretos:

- El administrador del complejo pierde tiempo confirmando disponibilidad a mano para cada solicitud.
- No hay un control centralizado de horarios, por lo que a veces se cruzan dos reservas para la misma cancha en el mismo horario.

Se necesita una app que permita a los jugadores ver disponibilidad y reservar directamente, sin pasar por el administrador para confirmar cada solicitud.

## Actores

- **Jugador**: persona que quiere reservar un horario de cancha (fulbito o vóley) para jugar.
- **Administrador del complejo**: persona que gestiona las canchas y necesita ver el calendario de reservas del día en un solo lugar.

## Alcance — Incluye

- Ver disponibilidad de canchas por día y horario.
- Reservar un horario libre para una cancha.
- Cancelar una reserva propia.
- El administrador ve todas las reservas del día en un solo lugar (vista de calendario/agenda diaria).

## Alcance — No incluye (por ahora)

- Pagos en línea.
- Torneos o ligas.
- Sistema de puntos o fidelización.
- Reservas recurrentes automáticas.

## Criterios de éxito

- Un jugador puede reservar una cancha de principio a fin sin llamar ni escribir al complejo.
- El sistema nunca permite dos reservas para la misma cancha en el mismo horario.
- El administrador puede ver todas las reservas del día sin tener que revisar WhatsApp.

## Reglas de negocio

1. **Plazo para cancelar** (resuelve el Punto Abierto #4; origen: CAMBIO-01): una reserva se puede cancelar solo hasta 2 horas antes de su horario de inicio. Si faltan exactamente 2 horas, todavía se puede cancelar; si faltan menos, o si el horario ya pasó, no.
   - Las horas se cuentan en la hora de Lima, Perú, que es donde opera el complejo.
   - La regla vale para todas las reservas activas desde que entra en vigencia, incluidas las hechas antes del cambio.
   - Reservar con menos de 2 horas de anticipación no se restringe (eso depende del Punto Abierto #3, que sigue abierto). Una reserva hecha así ya no se puede cancelar.
   - Este cambio no agrega una cancelación por parte del administrador ni avisos al jugador (Punto Abierto #6). Si hacen falta, son pedidos aparte.

## Puntos Abiertos

Estos puntos no fueron definidos en los insumos recibidos. Se dejan marcados aquí para que el equipo los resuelva antes de que el BA los traduzca en Historias de Usuario — no se asumió ningún valor por defecto:

1. **Gestión de canchas (alta/edición/baja)**: la descripción del actor Administrador dice que "gestiona canchas", pero el Alcance — Incluye solo menciona que ve las reservas del día. ¿El administrador debe poder crear/editar/eliminar canchas y sus horarios disponibles desde la app, o eso se maneja fuera del sistema (config manual/fija)?
2. **Identificación del jugador**: ¿el jugador necesita registrarse/loguearse (con qué dato: teléfono, email, etc.) para reservar, o puede reservar sin cuenta?
3. **Ventana de reserva**: ¿con cuánta anticipación máxima se puede reservar (mismo día, una semana, un mes)? ¿hay un mínimo de anticipación antes del horario de juego?
4. **Política de cancelación** — **Resuelto (CAMBIO-01, 2026-11-10).** Pasó a la regla de negocio 1 ("Plazo para cancelar").
5. **Alcance de "cancha"**: ¿el complejo tiene una sola sede o varias? ¿cuántas canchas de fulbito y de vóley hay que administrar?
6. **Notificaciones**: ¿el jugador recibe alguna confirmación o recordatorio (push, email, SMS) al reservar o cancelar, o la confirmación es solo visual dentro de la app?
7. **Acceso a la vista de administrador**: el PRD no definía ningún control de acceso para que el administrador vea la agenda diaria (HU-04), lo que dejaría esa vista pública y expondría las reservas de todos los jugadores. Detectado durante el diseño técnico (ver ADR-0009 en `adrs/`); para el MVP se resolvió con una contraseña única compartida por variable de entorno, sin sistema de usuarios ni roles. Queda pendiente que negocio confirme si ese nivel de protección es suficiente o si se requiere un esquema de acceso más robusto.

## Próximo paso

Este PRD se entrega al Agente BA para iniciar la redacción de las Historias de Usuario correspondientes al Alcance — Incluye. Los Puntos Abiertos deben quedar reflejados como tales en cada Historia de Usuario afectada, sin asumir respuesta.

## Registro de cambios

| Versión | Fecha | Qué cambió | Quién lo decidió | Origen |
|---|---|---|---|---|
| 1.0 | 2026-09-24 | Versión inicial. | — | — |
| 1.1 | 2026-11-10 | El Punto Abierto #4 (política de cancelación) pasa a regla de negocio: cancelar solo hasta 2 horas antes, en hora de Lima. Se agrega la sección "Reglas de negocio". | Pedido: administración del complejo. Aprobación y zona horaria: Mario Yahuarcani. Detalles (límite exacto de 2 h, alcance sobre reservas existentes, sin excepción de administrador): definidos por el agente por delegación de Mario Yahuarcani. | CAMBIO-01 |
