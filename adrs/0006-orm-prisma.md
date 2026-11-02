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

Conexión a Neon desde funciones serverless de Vercel (cada invocación puede abrir su propia
conexión y el plan gratuito de Neon tiene un tope bajo de conexiones):

- **Runtime:** `DATABASE_URL` apunta a la URL **con pooler** de Neon (PgBouncer integrado, host
  `-pooler`) y lleva `?pgbouncer=true&connection_limit=1`.
- **Migraciones:** `DIRECT_URL` apunta a la URL **directa** (sin pooler); se declara como
  `directUrl` en el datasource de `schema.prisma`. Las migraciones no funcionan de forma fiable a
  través de PgBouncer.
- **Cliente:** una única instancia de `PrismaClient` por proceso (patrón singleton en un módulo de
  la capa de datos), para no abrir un cliente por request en desarrollo ni por import.
- **Migraciones con SQL crudo:** el índice único parcial de ADR-0004 vive en una migración
  editada a mano; `prisma migrate dev` no lo regenera, por lo que no se debe borrar ni
  recrear el historial de migraciones sin reaplicarlo.

## Alternativas consideradas

- **Drizzle ORM** — más liviano y con mejor rendimiento en entornos serverless/edge, pero con una
  API más manual (menos generada automáticamente) y menor tooling/comunidad que Prisma; para un
  MVP de demo sin restricción de rendimiento, no compensa la curva de aprendizaje adicional.

## Consecuencias

- Tipado automático de las entidades y migraciones declarativas simples de mantener, con buena
  documentación para resolver dudas rápido durante la demo.
- El pooler de Neon es gratuito y evita el agotamiento de conexiones en picos de demo; se descartó
  Prisma Accelerate por tener costo y sumar un servicio más.
- Trade-off: Prisma agrega algo de overhead en cold starts de funciones serverless en Vercel
  comparado con Drizzle; aceptable para el volumen de uso de un MVP de demo, pero sería un punto a
  reevaluar si el proyecto escalara a tráfico real.
