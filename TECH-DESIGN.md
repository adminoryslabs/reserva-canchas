# Technical Design Document: Reserva de Canchas para Complejo Deportivo

**Tipo de proyecto:** Greenfield.
**Design.md disponible:** No — el modelo de datos y los flujos se derivaron del PRD y de las
Historias de Usuario HU-01 a HU-04.

## Historial de revisiones

- **Revisión adversarial** (`REVISION-ADVERSARIAL.md`): 4 críticos, 5 advertencias y 4 sugerencias.
  Este documento y los ADRs 0002, 0004, 0005, 0006, 0007, 0008 y 0009 se ajustaron para resolverlos,
  y se agregó el ADR-0010. Estado por hallazgo: tabla "Estado de resolución" de ese archivo.
- **Abierto tras la revisión:** diagramas por actualizar (S1), Historias de Usuario por alinear con
  ADR-0002/0008 y zona horaria del complejo sin confirmar. Detalle en "Riesgos técnicos abiertos".
- Una revisión posterior debe evaluar el contenido actual, no los hallazgos ya resueltos.

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
    administrador. Los formularios de mutación son Client Components mínimos.
  - **API Routes (REST)** — endpoints bajo `/api/*` para canchas, horarios y reservas (ADR-0005).
  - **Capa de acceso a datos / servicios** — única dueña de la lógica de negocio y del acceso a
    Prisma (ADR-0001, ADR-0006) contra Neon Postgres. UI y API son adaptadores delgados sobre ella.
- **Neon Postgres** — base de datos gestionada, único almacén de persistencia (acceso vía pooler).
- **Upstash Redis** — servicio gestionado usado solo para rate limiting (ADR-0010).

Todos los componentes son nuevos (proyecto greenfield).

### Conexión UI ↔ datos

Resuelta en ADR-0007 ("Conexión UI ↔ datos"):

- **Lecturas**: los Server Components llaman directamente a los servicios de la capa de datos; no
  hacen `fetch` a `/api/*`.
- **Mutaciones** (reservar, cancelar, login admin): Client Components llaman a las API Routes REST y
  luego `router.refresh()`.
- **Una sola lógica de negocio**: handlers de API y Server Components solo adaptan; las reglas viven
  en los servicios. Esto define la estrategia de pruebas: los servicios se prueban contra una base
  Postgres real (por el índice parcial); los handlers, con pruebas de contrato HTTP.
- Tras una mutación exitosa o un 409 se invoca `revalidatePath` de la vista afectada; no se usan
  tags de invalidación.

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
| [ADR-0009](adrs/0009-proteccion-vista-administrador.md) | Protección de la vista de administrador con contraseña única (cookie firmada, deny-by-default) | Aceptado |
| [ADR-0010](adrs/0010-rate-limiting-enumeracion.md) | Rate limiting por IP en cancelación y login admin (Upstash) | Aceptado |

## Modelo de datos

Derivado del PRD y de las HU, sin Design.md disponible.

- **Cancha** — dato semilla fijo (ADR-0003): `id`, `nombre` (ej. "Fulbito 1"), `tipo` (`fulbito` |
  `voley`). No editable desde la app.
- **Slot** (franja fija de 1 hora, ADR-0004) — no es una tabla: es la combinación `cancha_id` +
  `fecha` + `hora_inicio`, con `hora_inicio` tomada de la lista cerrada de horas en punto del rango
  operativo del complejo (ej. 08:00–22:00, definido junto al seed). Un slot está **ocupado** si
  existe una `Reserva` `activa` para esa combinación; si no, está libre.
- **Reserva** — `id`, `codigo_reserva` (6 dígitos, ADR-0002), `cancha_id`, `fecha` (`DATE`),
  `hora_inicio` (`TIME`), `estado` (`activa` | `cancelada`), `creado_en`.
  - **Índice único parcial** sobre `(cancha_id, fecha, hora_inicio) WHERE estado = 'activa'`
    — garantiza a nivel de base de datos que nunca hay dos reservas activas para el mismo slot y
    que un slot cancelado se puede volver a reservar (ADR-0004):

    ```sql
    CREATE UNIQUE INDEX uniq_reserva_activa
      ON "Reserva" (cancha_id, fecha, hora_inicio)
      WHERE estado = 'activa';
    ```

    Prisma no soporta `WHERE` en `@@unique`: el índice se crea con SQL crudo en una migración
    editada a mano, y el schema **no** declara un `@@unique` común sobre esas columnas.
  - **`UNIQUE` común (sin `WHERE`)** sobre `codigo_reserva`: el código no se reutiliza ni tras
    cancelar (ADR-0002). Son dos políticas distintas a propósito: el slot se libera, el código no.

No existe entidad `Sede` ni entidad de usuario/jugador (ADR-0002, ADR-0003).

### Glosario

Se usa un único término por concepto en el TDD, los ADRs y el código:

- **Slot**: franja fija de 1 hora de una cancha en una fecha (reemplaza "horario" y "franja
  horaria" del lenguaje informal). En la UI se puede mostrar como "horario", pero el término
  técnico es *slot*.
- **Reserva**: la ocupación de un slot por un jugador. **Código de reserva**: el secreto de 6
  dígitos de esa reserva.

### Zona horaria

`fecha` y `hora_inicio` son la fecha y la hora **locales del complejo**, almacenadas como `DATE` y
`TIME` sin zona, sin conversión en ninguna capa. El seed genera los slots en hora local y la UI
muestra esos valores tal cual, nunca la hora UTC del servidor. La única operación que necesita
saber qué día es "hoy" (fecha por defecto de la vista) usa la zona configurada en la variable de
entorno `COMPLEX_TIMEZONE` (ej. un identificador IANA). La zona real del complejo **no está
confirmada por el PRD**: queda como Punto Abierto técnico (ver Riesgos).

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
      `activa`, genera un `codigo_reserva` único de 6 dígitos (aleatorio seguro, con reintento
      acotado ante colisión, ADR-0002) y lo muestra en pantalla.
- [ ] Si el slot ya fue tomado (índice único parcial violado), la API responde 409, no se crea
      ninguna reserva duplicada y la vista de disponibilidad se revalida para mostrar el slot
      ocupado sin recarga manual (ADR-0008, ADR-0007).
- [ ] Un slot cuya reserva fue cancelada puede reservarse de nuevo sin error (regresión del índice
      parcial, ADR-0004).
- [ ] El jugador ve el código de reserva de forma clara, con indicación de que debe guardarlo para
      cualquier gestión posterior (ADR-0002).

### Cancelar una reserva (HU-03)

- [ ] El jugador debe ingresar el `codigo_reserva` para cancelar una reserva.
- [ ] Si el código no tiene formato válido (no son 6 dígitos), la API responde 400 sin consultar la
      base. Si el formato es válido pero no corresponde a ninguna reserva, responde 404 con mensaje
      genérico (ADR-0008).
- [ ] Al cancelar, la `Reserva` pasa a estado `cancelada` y su slot vuelve a aparecer como libre en
      la vista de disponibilidad.
- [ ] Si se intenta cancelar una reserva que ya está en estado `cancelada`, la API responde 410 con
      el mensaje "la reserva ya no está activa" y no repite la liberación del slot (cumple HU-03
      escenario 2; ADR-0008).
- [ ] Tras 5 intentos por minuto desde la misma IP, la API responde 429 con `Retry-After`
      (ADR-0010).

### Agenda diaria del administrador (HU-04)

- [ ] El acceso a la vista de administrador requiere la contraseña única configurada por variable
      de entorno; tras autenticarse se emite una cookie `HttpOnly`, `Secure`, `SameSite=Lax`, firmada
      y con expiración de 8 horas (ADR-0009).
- [ ] Si `ADMIN_PASSWORD` o `ADMIN_SESSION_SECRET` no están definidas, el acceso admin responde 503
      con mensaje claro; nunca queda abierto (ADR-0009).
- [ ] El login admin está limitado a 5 intentos por minuto por IP; si el servicio de rate limiting
      no responde, el login se deniega (ADR-0010).
- [ ] La vista lista todas las reservas en estado `activa` de la fecha consultada, agrupadas por
      cancha y horario, **sin mostrar el `codigo_reserva`** (ADR-0002).
- [ ] Si no hay ninguna reserva activa para la fecha consultada, la vista lo indica explícitamente
      en lugar de mostrarse en blanco sin explicación.

## Aspectos transversales

### Validación de entradas

Toda entrada de las API Routes se valida con **Zod** antes de llegar a los servicios; los esquemas
son la fuente de los tipos compartidos con los Server Components (`z.infer`). Reglas mínimas:
`codigo_reserva` = exactamente 6 dígitos; `fecha` = `YYYY-MM-DD` válida; `hora_inicio` = `HH:00`
dentro del rango operativo; `cancha_id` existente en el seed. Una entrada inválida responde 400
(ADR-0008) y no toca la base.

### Logging

`console.log` estructurado en JSON (nivel, evento, `requestId`, ruta, status), con `requestId`
generado en middleware y propagado a los servicios. Se registran como mínimo: 409 de conflicto,
404/410 de cancelación, 429 de rate limiting, login admin fallido y errores 500. **Nunca** se
registra la contraseña de admin ni el `codigo_reserva` completo. Sin plataforma de logs externa
(se usan los logs de Vercel).

### Variables de entorno

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Neon con pooler, runtime (ADR-0006) |
| `DIRECT_URL` | Neon directa, solo migraciones (ADR-0006) |
| `ADMIN_PASSWORD` | Contraseña única de admin; requerida (ADR-0009) |
| `ADMIN_SESSION_SECRET` | Firma de la cookie de sesión admin; requerida (ADR-0009) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (ADR-0010) |
| `COMPLEX_TIMEZONE` | Zona para calcular "hoy" (ver "Zona horaria") |

## Riesgos técnicos abiertos

- **Recuperación del código de reserva**: si el jugador pierde su código de 6 dígitos, no hay
  ningún dato de contacto asociado para identificarlo por otra vía; la reserva queda inaccesible
  para el jugador (aunque sigue existiendo y ocupando el slot) (ADR-0002).
- **Fuerza bruta sobre el código de reserva y la contraseña admin**: mitigada con rate limiting por
  IP y sin exponer códigos en la agenda admin (ADR-0010, ADR-0002). **Riesgo residual**: un
  atacante con muchas IPs distribuidas no queda cubierto; debe reevaluarse antes de un uso real.
- **Fuga mínima de información en la cancelación**: el 410 revela que un código existió y fue
  cancelado (ADR-0008). Aceptada: los códigos cancelados no se reutilizan ni dan acceso a nada.
- **Contraseña única de administrador**: sin sistema de usuarios ni auditoría de acceso (ADR-0009);
  aceptable para MVP, insuficiente si hay más de un administrador o se requiere trazabilidad.
- **Dependencia de un servicio externo para rate limiting** (Upstash): su caída deja el login admin
  denegado (falla cerrada) y la cancelación sin límite (falla abierta) (ADR-0010).
- **Zona horaria del complejo no confirmada**: el PRD no la define. Solo afecta el cálculo de la
  fecha "hoy" por defecto; no hay conversión de horas almacenadas. Pregunta a negocio: ¿en qué zona
  horaria opera el complejo?
- **Historias de Usuario desalineadas con los ADRs**: HU-02, HU-03 y HU-04 no mencionan el código
  de reserva ni el estado 410; las HU deben actualizarse para reflejar ADR-0002 y ADR-0008. HU-04
  debe aclarar que la agenda no muestra el código. Hasta entonces, los criterios de este TDD son
  los vigentes para la implementación.
- **Puntos abiertos del PRD no resueltos por esta arquitectura** (ventana de reserva, política de
  cancelación, notificaciones — Puntos Abiertos #3, #4 y #6 del PRD): esta arquitectura
  deliberadamente no construye ningún límite de fechas, bloqueo de cancelación o canal de
  notificación, ya que el PRD indica explícitamente que no deben asumirse sin confirmación de
  negocio.
- **Diagramas pendientes de actualizar**: los diagramas enlazados no se regeneraron tras estos
  ajustes. Deben reflejar (a) lecturas directas de Server Components a la capa de datos, (b)
  Upstash en componentes y despliegue, y (c) la respuesta 410. Faltan además diagramas de secuencia
  de cancelación (HU-03) y de agenda admin (HU-04). Tampoco se verificó que existan en `diagramas/`.
- **Diagramas generados sin `archify` en un primer intento de instalación global**: la instalación
  de `archify` en scope global reportó un error de compatibilidad con el agente actual
  (PromptScript no soporta instalación global); la skill quedó disponible igualmente vía symlink
  universal, pero si al invocarla para generar los diagramas fallara, corresponde regenerarlos
  manualmente con Mermaid inline y dejarlo señalado.
