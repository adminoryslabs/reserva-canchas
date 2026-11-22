# HU-03: Cancelar una reserva propia

## Historia de usuario
Como **jugador**
Quiero **cancelar una reserva que hice**
Para **liberar el horario cuando ya no pueda asistir, sin llamar ni escribir al complejo**

## Contexto
Cubre Alcance — Incluye ("Cancelar una reserva propia") — a diferencia de otros proyectos, aquí la cancelación está explícitamente dentro del alcance, sin conflicto entre secciones del PRD. Apoya el Criterio de éxito: *"un jugador puede reservar una cancha de principio a fin sin llamar ni escribir al complejo"* (cancelar es parte de ese ciclo completo). Desde CAMBIO-01 aplica la regla de negocio 1 del PRD ("Plazo para cancelar"): solo se puede cancelar hasta 2 horas antes del horario, en hora de Lima.

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

### Escenario 3 — Caso borde: cancelar fuera de plazo (CAMBIO-01)
```gherkin
  Scenario: Jugador intenta cancelar con menos de 2 horas de anticipación
    Given el jugador tiene una reserva confirmada para la cancha "Fulbito 1" el día "2026-09-20" a las "19:00"
    And son las "17:30" del día "2026-09-20" en hora de Lima
    When el jugador intenta cancelar esa reserva
    Then el sistema informa que ya no se puede cancelar porque faltan menos de 2 horas para el horario reservado
    And la reserva sigue activa
    And el horario sigue ocupado
```

### Escenario 4 — Caso borde: cancelar justo en el límite (CAMBIO-01)
```gherkin
  Scenario: Jugador cancela cuando faltan exactamente 2 horas
    Given el jugador tiene una reserva confirmada para la cancha "Fulbito 1" el día "2026-09-20" a las "19:00"
    And son las "17:00" del día "2026-09-20" en hora de Lima
    When el jugador cancela esa reserva
    Then el sistema marca la reserva como cancelada
    And libera el horario para que otro jugador pueda reservarlo
```

## Puntos abiertos
- **Identificación del jugador** — mismo punto que HU-02 (Punto Abierto #2). Sin definir cómo se identifica al jugador, no se puede validar que la reserva es "propia" antes de permitir cancelarla.
- **Política de cancelación** — **Cerrado (CAMBIO-01, 2026-11-10).** Se resolvió como regla de negocio 1 del PRD: cancelar solo hasta 2 horas antes, en hora de Lima (escenarios 3 y 4). No incluye penalización.
- **Notificaciones** — *¿Se notifica la cancelación al jugador y/o al administrador por algún canal (push/email/SMS), o solo se refleja visualmente en la app/calendario?* No definido en el PRD (Punto Abierto #6). Esta HU solo asume que la cancelación se refleja visualmente en la app; cualquier notificación activa queda pendiente de negocio.

## Fuera de alcance (explícitamente excluido en el PRD)
- Pagos en línea (no aplica reembolso, ya que no hay pago en línea en este alcance).
- Torneos o ligas.
- Sistema de puntos o fidelización.
- Reservas recurrentes automáticas.
