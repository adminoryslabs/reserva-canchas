# ADR 0005: Contrato de API REST vía Next.js API Routes

## Estado

Aceptado

## Contexto

Con el monolito Next.js ya decidido (ADR 0001), hace falta definir cómo se comunican la UI y el
backend dentro del mismo repo. El proyecto no tiene, por ahora, ningún consumidor externo de la
API (no hay app móvil ni integración de terceros en el alcance del PRD).

## Decisión

El contrato entre frontend y backend se implementa como API REST usando Next.js API Routes (ej.
`/api/canchas`, `/api/reservas`, `/api/reservas/[codigo]`), con rutas y verbos HTTP explícitos.

## Alternativas consideradas

- **Server Actions de Next.js** — requiere menos código de boilerplate (invocación directa desde
  componentes React sin definir rutas HTTP), pero deja el contrato implícito en el código en lugar
  de explícito por convención de rutas, y sería menos portable si en el futuro se necesitara un
  cliente externo (ej. app móvil) consumiendo la misma API.

## Consecuencias

- Contrato explícito y fácil de probar de forma aislada (curl/Postman/tests de integración) sin
  levantar la UI.
- Reutilizable a futuro por cualquier cliente HTTP adicional sin cambios de arquitectura.
- Trade-off: más código de boilerplate que Server Actions para el mismo resultado (definir rutas,
  manejar métodos HTTP, serializar respuestas), aceptable para el alcance de este MVP.
