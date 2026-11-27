# AGENTS.md — reserva-canchas

## Qué es este repositorio

Sistema de reservas de canchas deportivas (fulbito y vóley). Tiene la documentación del proyecto (PRD, Historias de Usuario, Tech Design, ADRs) y la aplicación Next.js + Prisma que cubre HU-01 a HU-04. Todo el contenido está en español y los artefactos nuevos deben seguir en español.

## Dónde está cada cosa

- `PRD.md`, `HU-0X-<slug>.md`, `TECH-DESIGN.md`, `adrs/`: decisiones del producto y de la arquitectura.
- `CONTRATO-HU-0X.md`: contrato observable de una HU (qué se ve desde afuera). Lo leen TESTER y DEV.
- `CAMBIO-0X-<slug>.md`: pedidos de cambio del cliente, con su estado.
- `VEREDICTO-HU-0X.md`: resultado de verificar cada HU contra sus escenarios, con lo NO VERIFICADO.
- `docs/puertas.md` y `docs/openapi.yaml`: las puertas del sistema (qué recibe, qué devuelve, cómo falla).
- `src/app/api/`: rutas HTTP. `src/app/`: pantallas. `src/server/services/`: lógica de negocio. `src/lib/`: utilidades y configuración.
- `prisma/`: modelo de datos, migraciones y datos semilla. `tests/`: pruebas automáticas, una por HU (corren contra el Postgres local: `npm run db:up` antes de `npm run test`).
- Comandos: `npm run dev`, `npm run typecheck`, `npm run test`, `npm run db:up` (ver `package.json`).

## Claves de Jira

Toda rama, commit y PR lleva la clave de Jira de la HU (`RCAN-n`). Mapa:

| HU | Clave |
|---|---|
| HU-01 Ver disponibilidad | RCAN-2 |
| HU-02 Reservar cancha | RCAN-3 |
| HU-03 Cancelar reserva | RCAN-4 |
| HU-04 Calendario del administrador | RCAN-5 |

## Archivos y convenciones

- `PRD.md` — fuente de alcance (rol PM). Secciones fijas: Problema, Actores, Alcance — Incluye, Alcance — No incluye (por ahora), Criterios de éxito, y Puntos Abiertos cuando corresponda. El orden importa.
- `HU-0X-<slug>.md` — una Historia de Usuario por archivo. Estructura fija: Historia (Como/Quiero/Para) → Contexto → Criterios de aceptación (Gherkin) → Supuestos → Puntos abiertos → Fuera de alcance. **Mínimo 2 escenarios Gherkin**: camino feliz + 1 caso borde.
- `PLAYBOOK-<ROL>.md` — guías de rol reutilizables (PM, BA, UX). Son plantillas transversales: **no se reescriben** Rol ni Proceso al sumar un proyecto; solo se agrega un caso nuevo a "Ejemplos aplicados".
- `.atl/` — auto-generado por `gentle-ai skill-registry`. No editar a mano; regenerar con `gentle-ai skill-registry refresh --force`. El protocolo de carga de skills está en `.atl/skill-registry.md`.

## Reglas de dominio no negociables (las más fáciles de romper)

- **Ningún dato no confirmado por el PRD/insumos se asume**, ni siquiera la opción "más común". Se declara como **Punto Abierto** con la pregunta exacta a negocio.
- **"Alcance — No incluye" es un límite duro.** No se agrega nada de ahí por iniciativa propia ni porque otro agente (p. ej. UX) lo proponga: se marca como bloqueo, no como sugerencia.
- **Conflictos entre secciones del PRD se documentan, no se resuelven en silencio.** Solo se construye lo mínimo necesario para cumplir el criterio y se deja constancia de que falta confirmación.
- No redactar una suposición como si ya estuviera decidida; separar lo construido de lo supuesto.
- Elementos extra que agregan las herramientas de diseño (Stitch, etc.) se reportan como pendientes de aprobación, no se dejan pasar.

## Seguridad

Reglas que salen de `SECURITY-REPORT.md` (Security Pass del 2026-11-24). Solo incluye los hallazgos ya resueltos o decididos; los demás siguen abiertos en el informe.

- **SEC-01 · Crear reservas no tiene límite de intentos — riesgo aceptado** (2026-11-24, `TECH-DESIGN.md` §"Riesgos técnicos abiertos"). No agregues rate limiting a `POST /api/reservas` por iniciativa propia: la falta de límite es una decisión, no un descuido.
- **SEC-02 · Next.js con avisos críticos — mitigado** (RCAN-9, `next@15.5.29`). No bajes `next` de 15.5.29. Si tocas dependencias, corre `npm audit --omit=dev` antes de cerrar el cambio. Nunca uses `npm audit fix --force`: propone pasar a `next` 16, que es un cambio de versión mayor.

## Coordinación multi-agente (Herdr)

- Ver agentes activos en la sesión: `herdr agent list` (identificar al destinatario por `terminal_title`).
- Enviar handoff: `herdr agent prompt <pane_id> "<texto>"` (opcional `--wait --until idle`; un timeout del `--wait` no implica que el mensaje no llegó → verificar con `herdr agent list`).
- Todo handoff incluye: ruta exacta del artefacto, contexto del proyecto en una línea, reglas de negocio clave y puntos abiertos vigentes.
- Todo hallazgo nuevo que surja de la coordinación se registra de vuelta en la(s) HU(s) afectada(s), no queda solo en el chat.

## Gotchas

- Los playbooks mencionan carpetas por proyecto (ej. `reservas-complejo-deportivo/`) en "Ejemplos aplicados", pero en esta carpeta los archivos están **planos**. No asumas que esas carpetas existen.
- Los ejemplos citan un caso de "Clínica Salud Total" que **no está en esta carpeta**: son ilustrativos, no artefactos de este proyecto.
