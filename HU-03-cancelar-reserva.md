# HU-03: Cancelar una reserva propia

## Historia de usuario
Como **jugador**
Quiero **cancelar una reserva que hice**
Para **liberar el horario cuando ya no pueda asistir, sin llamar ni escribir al complejo**

## Contexto
Cubre Alcance — Incluye ("Cancelar una reserva propia") — a diferencia de otros proyectos, aquí la cancelación está explícitamente dentro del alcance, sin conflicto entre secciones del PRD. Apoya el Criterio de éxito: *"un jugador puede reservar una cancha de principio a fin sin llamar ni escribir al complejo"* (cancelar es parte de ese ciclo completo).

## Criterios de aceptación (Gherkin)

### Escenario 1 — Camino feliz
```gherkin
Feature: Cancelación de reserva

  Scenario: Jugador cancela una reserva vigente
    Given el jugador tiene una reserva confirmada para la cancha "Fulbito 1" el día "2026-09-20" a las "19:00"
    When el jugador cancela esa reserva
    Then el sistema marca la reserva como cancelada
    And libera el horario para que otro jugador pueda reservarlo
```

### Escenario 2 — Caso borde: cancelar una reserva ya cancelada
```gherkin
  Scenario: Jugador intenta cancelar una reserva que ya fue cancelada
    Given el jugador tiene una reserva cuyo estado ya es "cancelada"
    When el jugador intenta cancelarla nuevamente
    Then el sistema informa que la reserva ya no está activa
    And no repite la liberación del horario
```

## Puntos abiertos
- **Identificación del jugador** — mismo punto que HU-02 (Punto Abierto #2). Sin definir cómo se identifica al jugador, no se puede validar que la reserva es "propia" antes de permitir cancelarla.
- **Política de cancelación** — *¿Existe un límite de tiempo antes del horario reservado a partir del cual ya no se puede cancelar?* No definido en el PRD (Punto Abierto #4). No se debe construir ninguna ventana de bloqueo o penalización sin confirmar esto.
- **Notificaciones** — *¿Se notifica la cancelación al jugador y/o al administrador por algún canal (push/email/SMS), o solo se refleja visualmente en la app/calendario?* No definido en el PRD (Punto Abierto #6). Esta HU solo asume que la cancelación se refleja visualmente en la app; cualquier notificación activa queda pendiente de negocio.

## Fuera de alcance (explícitamente excluido en el PRD)
- Pagos en línea (no aplica reembolso, ya que no hay pago en línea en este alcance).
- Torneos o ligas.
- Sistema de puntos o fidelización.
- Reservas recurrentes automáticas.
