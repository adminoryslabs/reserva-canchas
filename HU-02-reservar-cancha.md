# HU-02: Reservar un horario de cancha

## Historia de usuario
Como **jugador**
Quiero **reservar un horario libre de una cancha**
Para **asegurar mi horario de juego sin llamar ni escribir al complejo**

## Contexto
Cubre Alcance — Incluye ("Reservar un horario libre para una cancha"). Cubre directamente los Criterios de éxito: *"un jugador puede reservar una cancha de principio a fin sin llamar ni escribir al complejo"* y *"el sistema nunca permite dos reservas para la misma cancha en el mismo horario"*.

## Criterios de aceptación (Gherkin)

### Escenario 1 — Camino feliz
```gherkin
Feature: Reserva de cancha

  Scenario: Jugador reserva un horario libre
    Given existe un horario libre para la cancha "Fulbito 1" el día "2026-09-20" a las "19:00"
    When el jugador selecciona ese horario y confirma la reserva
    Then el sistema registra la reserva para esa cancha, día y hora
    And el sistema confirma la reserva dentro de la app
```

### Escenario 2 — Caso borde: conflicto de horario
```gherkin
  Scenario: Jugador intenta reservar un horario que ya fue tomado por otro jugador
    Given ya existe una reserva confirmada para la cancha "Fulbito 1" el día "2026-09-20" a las "19:00"
    When otro jugador intenta reservar la misma cancha, el mismo día y hora
    Then el sistema rechaza la solicitud
    And informa al jugador que el horario ya no está disponible
    And no se registra una reserva duplicada
```

## Puntos abiertos
- **Identificación del jugador** — *¿El jugador necesita registrarse/loguearse (con qué dato: teléfono, email, etc.) para reservar, o puede reservar sin cuenta?* No definido en el PRD (Punto Abierto #2). Sin esto no se puede definir a quién pertenece cada reserva.
- **Ventana de reserva** — *¿Con cuánta anticipación máxima se puede reservar (mismo día, una semana, un mes)? ¿Hay un mínimo de anticipación antes del horario de juego?* No definido en el PRD (Punto Abierto #3). No se debe construir ningún límite de fechas sin confirmar esto.
- **Alcance de "cancha"** — mismo punto que HU-01: ¿una sede o varias?, ¿cuántas canchas hay? (Punto Abierto #5).
- **Notificaciones** — *¿El jugador recibe alguna confirmación o recordatorio (push, email, SMS) al reservar, o la confirmación es solo visual dentro de la app?* No definido en el PRD (Punto Abierto #6). Esta HU solo asume confirmación visual dentro de la app, por ser el mínimo necesario para cumplir el criterio de éxito; cualquier canal adicional (push/email/SMS) queda pendiente de negocio.

## Fuera de alcance (explícitamente excluido en el PRD)
- Pagos en línea (no se solicita cobro al reservar).
- Torneos o ligas.
- Sistema de puntos o fidelización.
- Reservas recurrentes automáticas.
