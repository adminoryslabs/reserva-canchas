# HU-04: Vista de calendario/agenda diaria de reservas

## Historia de usuario
Como **administrador del complejo**
Quiero **ver todas las reservas del día en un solo lugar (calendario/agenda diaria)**
Para **no tener que revisar WhatsApp para saber qué está reservado**

## Contexto
Cubre Alcance — Incluye ("El administrador ve todas las reservas del día en un solo lugar"). Cubre el Criterio de éxito: *"el administrador puede ver todas las reservas del día sin tener que revisar WhatsApp"*.

## Criterios de aceptación (Gherkin)

### Escenario 1 — Camino feliz
```gherkin
Feature: Agenda diaria de reservas

  Scenario: Administrador consulta el calendario de un día con reservas
    Given existen reservas confirmadas para distintas canchas el día "2026-09-20"
    When el administrador abre la vista de calendario/agenda para ese día
    Then el sistema muestra todas las reservas de ese día, agrupadas por cancha y horario
```

### Escenario 2 — Caso borde: día sin reservas
```gherkin
  Scenario: Administrador consulta un día sin ninguna reserva
    Given no existe ninguna reserva registrada para el día "2026-09-21"
    When el administrador abre la vista de calendario/agenda para ese día
    Then el sistema muestra la agenda de ese día vacía, indicando que no hay reservas
```

## Puntos abiertos
- **Alcance de "cancha"** — mismo punto que HU-01 y HU-02 (Punto Abierto #5): ¿una sede o varias?, ¿cuántas canchas hay? Afecta cómo se agrupa y filtra la vista de calendario (por sede, por tipo de cancha, etc.).
- **Gestión de canchas** — mismo punto que HU-01 (Punto Abierto #1). Si el administrador debe poder crear/editar/eliminar canchas y horarios desde la app, esta vista podría necesitar una HU adicional de gestión — no cubierta aquí porque no aparece en el Alcance — Incluye.
- **Notificaciones al administrador** — el Punto Abierto #6 del PRD solo pregunta por notificaciones al jugador; no está definido si el administrador también debe recibir un aviso (push/email) ante nuevas reservas o cancelaciones, o si le basta con esta vista de calendario. No se asume ningún aviso activo.

## Fuera de alcance (explícitamente excluido en el PRD)
- Pagos en línea.
- Torneos o ligas.
- Sistema de puntos o fidelización.
- Reservas recurrentes automáticas.
