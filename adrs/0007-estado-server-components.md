# ADR 0007: Estado en el servidor vía Server Components, sin librería de estado cliente

## Estado

Aceptado

## Contexto

Con REST vía Next.js API Routes ya decidido (ADR 0005), falta definir dónde vive y cómo se
sincroniza el estado de disponibilidad/reservas que ve el jugador y el administrador. El PRD no
exige actualización en tiempo real (no hay websockets, notificaciones push en el alcance): el flujo
es de consulta/reserva/cancelación por request normal.

## Decisión

El estado de disponibilidad y reservas vive en el servidor (Neon, vía Prisma). Las vistas se
renderizan con Server Components de Next.js, haciendo fetch server-side en cada request/navegación,
sin librería de manejo de estado ni cache en el cliente.

## Alternativas consideradas

- **TanStack Query (React Query) en el cliente** — permitiría refrescar disponibilidad sin recargar
  la página completa (polling o refetch on focus), pero agrega una dependencia y complejidad de
  cache que no está justificada sin un requisito real de "vista viva"; el PRD no lo pide.

## Consecuencias

- Menos dependencias y menos código: no hay que manejar invalidación de cache en el cliente ni
  sincronización manual de estado.
- Encaja de forma natural con el modelo de Server Components de Next.js ya elegido.
- Trade-off: si el jugador tiene la vista de disponibilidad abierta y otro jugador reserva el mismo
  slot en simultáneo, no se entera hasta que recarga o navega de nuevo — el conflicto real igual
  queda cubierto por el índice único parcial en base de datos (ADR 0004), pero la UX de "verlo
  reflejado sin recargar" no está cubierta de forma automática. Aceptable para un MVP de demo.
- Mitigación de UX ante el 409: cuando la reserva falla por conflicto, el handler invoca
  `revalidatePath` sobre la vista de disponibilidad y el formulario cliente ejecuta
  `router.refresh()` al recibir el 409, de modo que el jugador ve el slot actualizado como
  ocupado junto al mensaje "el horario ya no está disponible", sin recargar a mano.

## Conexión UI ↔ datos

Se adopta esta regla única (resuelve la ambigüedad con ADR 0005):

- **Lecturas** (disponibilidad, agenda admin): los Server Components llaman **directamente** a
  la capa de acceso a datos (funciones de servicio), sin pasar por `fetch` a `/api/*`. Evita un
  round-trip HTTP innecesario dentro del mismo servidor.
- **Mutaciones** (reservar, cancelar, login admin): los formularios son Client Components mínimos
  que llaman a las API Routes REST (ADR 0005) y luego `router.refresh()`. Así la API REST tiene
  consumidores reales y su contrato queda ejercitado por la propia UI.
- **Una sola lógica de negocio:** los handlers de API Routes y los Server Components son
  adaptadores delgados sobre las mismas funciones de servicio. Ninguno contiene reglas de negocio
  ni accede a Prisma por su cuenta.
- **Tags de invalidación:** no se usan; solo `revalidatePath` de la vista de disponibilidad y de
  la agenda admin tras una mutación exitosa o un 409.
