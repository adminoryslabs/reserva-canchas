# ADR 0006: Prisma como ORM para Neon Postgres

## Estado

Aceptado

## Contexto

El sistema necesita una capa de acceso a datos (ADR 0001) hacia Neon Postgres, con entidades
simples (canchas seed, horarios/slots fijos, reservas — ADR 0003 y 0004). Es un MVP de demo, sin
requisito de escala ni de rendimiento extremo en cold start.

## Decisión

Se usa Prisma como ORM para todo el acceso a datos hacia Neon Postgres, con su capa de migraciones
declarativas para versionar el esquema.

## Alternativas consideradas

- **Drizzle ORM** — más liviano y con mejor rendimiento en entornos serverless/edge, pero con una
  API más manual (menos generada automáticamente) y menor tooling/comunidad que Prisma; para un
  MVP de demo sin restricción de rendimiento, no compensa la curva de aprendizaje adicional.

## Consecuencias

- Tipado automático de las entidades y migraciones declarativas simples de mantener, con buena
  documentación para resolver dudas rápido durante la demo.
- Trade-off: Prisma agrega algo de overhead en cold starts de funciones serverless en Vercel
  comparado con Drizzle; aceptable para el volumen de uso de un MVP de demo, pero sería un punto a
  reevaluar si el proyecto escalara a tráfico real.
