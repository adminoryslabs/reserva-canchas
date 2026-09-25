# HU-01: Ver disponibilidad de canchas por día y horario

## Historia de usuario
Como **jugador**
Quiero **ver la disponibilidad de canchas por día y horario**
Para **elegir cuándo y en qué cancha jugar sin depender de que el administrador confirme a mano**

## Contexto
Cubre Alcance — Incluye ("Ver disponibilidad de canchas por día y horario"). Es el primer paso del flujo que exige el Criterio de éxito: *"un jugador puede reservar una cancha de principio a fin sin llamar ni escribir al complejo"*.

## Criterios de aceptación (Gherkin)

### Escenario 1 — Camino feliz
```gherkin
Feature: Disponibilidad de canchas

  Scenario: Jugador consulta un día con horarios libres
    Given existen canchas registradas para el complejo con horarios definidos para el día "2026-09-20"
    And al menos un horario está libre para alguna cancha ese día
    When el jugador consulta la disponibilidad de canchas para el día "2026-09-20"
    Then el sistema muestra, por cancha, los horarios libres y los ocupados de ese día
```

### Escenario 2 — Caso borde: día sin disponibilidad
```gherkin
  Scenario: Jugador consulta un día sin horarios libres
    Given todos los horarios de todas las canchas están reservados para el día "2026-09-20"
    When el jugador consulta la disponibilidad de canchas para ese día
    Then el sistema indica que no hay horarios disponibles para ese día
    And no permite iniciar una reserva desde esa vista
```

## Puntos abiertos
- **Alcance de "cancha"** — *¿El complejo tiene una sola sede o varias? ¿Cuántas canchas de fulbito y de vóley hay que administrar?* No definido en el PRD (Punto Abierto #5). Afecta directamente cómo se agrupa y muestra la disponibilidad (por sede + cancha, o solo por cancha).
- **Gestión de canchas** — *¿El administrador debe poder crear/editar/eliminar canchas y sus horarios disponibles desde la app, o eso se maneja fuera del sistema (config manual/fija)?* No definido en el PRD (Punto Abierto #1). Esta HU asume que existe algún origen de datos de canchas/horarios, pero no define cuál. **Si la respuesta es "desde la app", se necesitará una HU adicional de gestión de canchas para el Administrador — no cubierta aquí porque no aparece en el Alcance — Incluye.**

## Fuera de alcance (explícitamente excluido en el PRD)
- Pagos en línea.
- Torneos o ligas.
- Sistema de puntos o fidelización.
- Reservas recurrentes automáticas.
