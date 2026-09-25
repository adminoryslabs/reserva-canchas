# ADR 0008: Manejo de errores proporcional al riesgo de un MVP

## Estado

Aceptado

## Contexto

El caso crítico de conflicto de reserva ya está cubierto a nivel de datos por el constraint de
unicidad (ADR 0004). Falta definir el comportamiento de la aplicación ante: conflicto de reserva
detectado por ese constraint, código de reserva inválido al cancelar (ADR 0002), y falla de
conexión a Neon. El proyecto es un MVP de demostración, por lo que el nivel de resiliencia debe ser
proporcional al riesgo real, sin sobre-ingeniería.

## Decisión

- **Conflicto de reserva:** la API captura la violación del constraint de unicidad de Prisma y
  responde con estado 409 y un mensaje indicando que el horario ya no está disponible (cubre HU-02,
  escenario de caso borde).
- **Código de reserva inválido al cancelar:** la API responde con estado 404 y un mensaje genérico
  ("código inválido o reserva no encontrada"), sin distinguir si el código no existe o pertenece a
  otra reserva, para no filtrar información.
- **Falla de conexión a Neon:** la API responde con estado 500 y un mensaje genérico al usuario
  ("no se pudo procesar la solicitud, intentar nuevamente"). No se implementa reintento automático
  ni circuit breaker.

## Alternativas consideradas

- **Reintentos automáticos y/o circuit breaker ante falla de Neon** — descartado para el alcance de
  MVP: Neon es un servicio gestionado con alta disponibilidad propia, y agregar esa lógica sería
  complejidad no justificada por el riesgo real de una demo.

## Consecuencias

- El caso crítico del PRD (doble reserva) queda cubierto de forma correcta y simple, apoyándose en
  la base de datos en lugar de lógica de aplicación adicional.
- Los mensajes de error son simples y no requieren infraestructura extra (colas de reintento,
  monitoreo de circuit breaker).
- Trade-off: ante una caída real de Neon, el usuario recibe un error genérico sin ningún mecanismo
  de recuperación automática; aceptable para un MVP de demo, pero sería insuficiente para un
  entorno de producción con usuarios reales.
