# ADR 0001: Monolito Next.js con capa de acceso a datos separada

## Estado

Aceptado

## Contexto

El PRD exige un flujo simple (ver disponibilidad, reservar, cancelar, agenda diaria del
administrador) para un MVP de demostración, con el requisito explícito de usar Vercel para
despliegue/hosting y Neon Postgres para persistencia, aprovechando planes gratuitos. Con equipo
chico y foco en demo, agregar más piezas de infraestructura de las necesarias no aporta valor.

## Decisión

El sistema se construye como un único proyecto Next.js (App Router) que contiene tanto la UI como
los endpoints de backend (API Routes/Server Actions), desplegado como un solo proyecto en Vercel.
Dentro de ese mismo repo, el acceso a datos se aísla en una capa propia (ORM — Prisma o Drizzle,
decisión de stack pendiente en ADR aparte) separada de los handlers de UI/API, para no mezclar
lógica de presentación con queries a Neon.

## Alternativas consideradas

- **Frontend y backend en repos/deploys separados** (SPA + API independiente en otro servicio,
  ej. Render/Railway) — viable, pero agrega CORS, dos pipelines de deploy y dos configuraciones de
  variables de entorno sin beneficio real para el alcance de un MVP de demo.
- **Monolito Next.js sin separación de capa de datos** (queries de Neon mezcladas directamente en
  los handlers de UI/API) — viable y más rápido de escribir al inicio, pero mezcla
  responsabilidades y dificulta testear o cambiar el ORM más adelante.

## Consecuencias

- Un solo deploy en Vercel, sin CORS ni configuración de infraestructura adicional — encaja
  directo con el objetivo de MVP gratuito y rápido de armar.
- La capa de datos separada permite testear queries de forma aislada y cambiar de ORM sin tocar la
  UI/API si hiciera falta.
- Trade-off: todo vive en un solo repo/deploy; si el proyecto creciera más allá del alcance de MVP,
  frontend y backend seguirían acoplados al mismo ciclo de despliegue (no es un problema para el
  alcance actual, pero es una limitación real si el proyecto escala).
