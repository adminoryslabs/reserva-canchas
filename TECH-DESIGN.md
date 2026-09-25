# Technical Design Document: Reserva de Canchas para Complejo Deportivo

**Tipo de proyecto:** Greenfield.
**Design.md disponible:** No — el modelo de datos y los flujos se derivaron del PRD y de las
Historias de Usuario HU-01 a HU-04.

## Resumen

Se construye un MVP de demostración que permite a un jugador ver disponibilidad de canchas por día
y horario, reservar un slot libre, y cancelar su propia reserva, mientras el administrador del
complejo ve todas las reservas del día en una única agenda. El sistema se implementa como un único
proyecto Next.js desplegado en Vercel, con persistencia en Neon Postgres, priorizando la
simplicidad y el uso de recursos gratuitos por sobre la escalabilidad, dado el alcance de demo del
proyecto (ver PRD.md).

## Arquitectura de componentes

- **Aplicación Next.js (App Router)** — único componente/deploy en Vercel. Contiene:
  - **UI (Server Components)** — vistas de disponibilidad, reserva, cancelación y agenda de
    administrador.
  - **API Routes (REST)** — endpoints bajo `/api/*` para canchas, horarios y reservas (ADR-0005).
  - **Capa de acceso a datos** — separada de los handlers de UI/API, usando Prisma como ORM
    (ADR-0001, ADR-0006) contra Neon Postgres.
- **Neon Postgres** — base de datos gestionada, único almacén de persistencia.

Todos los componentes son nuevos (proyecto greenfield).

**Diagramas** (generados con `archify`, ver `diagramas/`):
- [`diagramas/componentes.html`](diagramas/componentes.html) — componentes y sus conexiones.
- [`diagramas/reserva.html`](diagramas/reserva.html) — secuencia del flujo de reserva (HU-02),
  camino feliz y conflicto de horario.
- [`diagramas/despliegue.html`](diagramas/despliegue.html) — despliegue sobre recursos gratuitos
  (Vercel + Neon).

## Decisiones de arquitectura

| # | Decisión | Estado |
|---|---|---|
| [ADR-0001](adrs/0001-componentes-monolito-nextjs-capa-datos-separada.md) | Monolito Next.js con capa de acceso a datos separada | Aceptado |
| [ADR-0002](adrs/0002-identificacion-jugador-sin-cuenta.md) | Identificación del jugador por código de reserva, sin cuenta | Aceptado |
| [ADR-0003](adrs/0003-modelo-datos-canchas-seed-fijo.md) | Canchas como dato semilla fijo, sin gestión desde la app | Aceptado |
| [ADR-0004](adrs/0004-modelo-datos-slots-fijos.md) | Horarios como slots fijos de 1 hora | Aceptado |
| [ADR-0005](adrs/0005-api-rest-nextjs-routes.md) | Contrato de API REST vía Next.js API Routes | Aceptado |
| [ADR-0006](adrs/0006-orm-prisma.md) | Prisma como ORM para Neon Postgres | Aceptado |
| [ADR-0007](adrs/0007-estado-server-components.md) | Estado en el servidor vía Server Components, sin librería de estado cliente | Aceptado |
| [ADR-0008](adrs/0008-resiliencia-manejo-errores.md) | Manejo de errores proporcional al riesgo de un MVP | Aceptado |
| [ADR-0009](adrs/0009-proteccion-vista-administrador.md) | Protección de la vista de administrador con contraseña única | Aceptado |

## Modelo de datos

Derivado del PRD y de las HU, sin Design.md disponible.

- **Cancha** — dato semilla fijo (ADR-0003): `id`, `nombre` (ej. "Fulbito 1"), `tipo` (`fulbito` |
  `voley`). No editable desde la app.
- **Horario** (slot fijo, ADR-0004) — franja horaria de 1 hora asociada a una cancha:
  `cancha_id`, `fecha`, `hora_inicio` (hora en punto dentro del rango operativo del complejo, ej.
  08:00–22:00).
- **Reserva** — `id`, `codigo_reserva` (token único de 6 dígitos, ADR-0002), `cancha_id`, `fecha`,
  `hora_inicio`, `estado` (`activa` | `cancelada`), `creado_en`.
  - Constraint de unicidad sobre `(cancha_id, fecha, hora_inicio)` para reservas en estado
    `activa` — garantiza a nivel de base de datos que nunca hay dos reservas activas para el mismo
    slot (ADR-0004).
  - Constraint de unicidad sobre `codigo_reserva` para reservas activas (ADR-0002).

No existe entidad `Sede` ni entidad de usuario/jugador (ADR-0002, ADR-0003).

## Criterios de aceptación por flujo

### Ver disponibilidad (HU-01)

- [ ] Para una cancha y fecha dadas, se listan todos los slots fijos del rango operativo,
      marcados como libres u ocupados.
- [ ] Un slot se marca como ocupado si existe una `Reserva` en estado `activa` para esa
      `cancha_id` + `fecha` + `hora_inicio`.
- [ ] Si no hay ningún slot libre para la fecha consultada, el sistema lo indica explícitamente y
      no permite iniciar una reserva desde esa vista.

### Reservar un horario (HU-02)

- [ ] Al confirmar una reserva sobre un slot libre, el sistema crea una `Reserva` en estado
      `activa`, genera un `codigo_reserva` único de 6 dígitos y lo muestra en pantalla.
- [ ] Si el slot ya fue tomado (constraint de unicidad violado), la API responde 409 y no se crea
      ninguna reserva duplicada (ADR-0008).
- [ ] El jugador ve el código de reserva de forma clara, con indicación de que debe guardarlo para
      cualquier gestión posterior (ADR-0002).

### Cancelar una reserva (HU-03)

- [ ] El jugador debe ingresar el `codigo_reserva` para cancelar una reserva.
- [ ] Si el código no corresponde a ninguna reserva activa, la API responde 404 con un mensaje
      genérico, sin distinguir "no existe" de "pertenece a otra reserva" (ADR-0008).
- [ ] Al cancelar, la `Reserva` pasa a estado `cancelada` y su slot vuelve a aparecer como libre en
      la vista de disponibilidad.
- [ ] Si se intenta cancelar una reserva que ya está en estado `cancelada`, el sistema informa que
      ya no está activa y no repite la liberación del slot.

### Agenda diaria del administrador (HU-04)

- [ ] El acceso a la vista de administrador requiere la contraseña única configurada por variable
      de entorno (ADR-0009).
- [ ] La vista lista todas las reservas en estado `activa` de la fecha consultada, agrupadas por
      cancha y horario.
- [ ] Si no hay ninguna reserva activa para la fecha consultada, la vista lo indica explícitamente
      en lugar de mostrarse en blanco sin explicación.

## Riesgos técnicos abiertos

- **Recuperación del código de reserva**: si el jugador pierde su código de 6 dígitos, no hay
  ningún dato de contacto asociado para identificarlo por otra vía; la reserva queda inaccesible
  para el jugador (aunque sigue existiendo y ocupando el slot) (ADR-0002).
- **Fuerza bruta sobre el código de reserva**: al ser un código de 6 dígitos sin dato de contacto
  asociado, existe una superficie teórica de adivinación; no se implementó rate limiting sobre el
  endpoint de cancelación en este MVP. Debería revisarse antes de un uso real.
- **Contraseña única de administrador**: sin sistema de usuarios ni auditoría de acceso (ADR-0009);
  aceptable para MVP, insuficiente si hay más de un administrador o se requiere trazabilidad.
- **Puntos abiertos del PRD no resueltos por esta arquitectura** (ventana de reserva, política de
  cancelación, notificaciones — Puntos Abiertos #3, #4 y #6 del PRD): esta arquitectura
  deliberadamente no construye ningún límite de fechas, bloqueo de cancelación o canal de
  notificación, ya que el PRD indica explícitamente que no deben asumirse sin confirmación de
  negocio.
- **Diagramas generados sin `archify` en un primer intento de instalación global**: la instalación
  de `archify` en scope global reportó un error de compatibilidad con el agente actual
  (PromptScript no soporta instalación global); la skill quedó disponible igualmente vía symlink
  universal, pero si al invocarla para generar los diagramas fallara, corresponde regenerarlos
  manualmente con Mermaid inline y dejarlo señalado.
