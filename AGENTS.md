# AGENTS.md — test-project

## Qué es esta carpeta

Workspace para el proyecto de Sistema de reservas de canchas deportivas. Actualmente tiene documentación. No hay código, `package.json`, build, lint, typecheck ni tests: no los busques. Todo el contenido está en español y los artefactos nuevos deben seguir en español.

Aunque la raíz git está un nivel arriba (`DMC - Diploma AI-First Software Architecture`), esta carpeta no es un repo propio y sus archivos están sin trackear.

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

## Coordinación multi-agente (Herdr)

- Ver agentes activos en la sesión: `herdr agent list` (identificar al destinatario por `terminal_title`).
- Enviar handoff: `herdr agent prompt <pane_id> "<texto>"` (opcional `--wait --until idle`; un timeout del `--wait` no implica que el mensaje no llegó → verificar con `herdr agent list`).
- Todo handoff incluye: ruta exacta del artefacto, contexto del proyecto en una línea, reglas de negocio clave y puntos abiertos vigentes.
- Todo hallazgo nuevo que surja de la coordinación se registra de vuelta en la(s) HU(s) afectada(s), no queda solo en el chat.

## Gotchas

- Los playbooks mencionan carpetas por proyecto (ej. `reservas-complejo-deportivo/`) en "Ejemplos aplicados", pero en esta carpeta los archivos están **planos**. No asumas que esas carpetas existen.
- Los ejemplos citan un caso de "Clínica Salud Total" que **no está en esta carpeta**: son ilustrativos, no artefactos de este proyecto.
