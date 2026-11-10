# Puertas del sistema (excepto API HTTP)

Una "puerta" es todo punto por donde una persona u otro sistema le pide algo a este sistema. Este documento cubre las puertas que **no** son rutas HTTP (esas están en `docs/openapi.yaml`).

Se describe qué ofrece cada puerta, no cómo funciona por dentro. Lo que no se pudo comprobar en el código se marca como **NO VERIFICADO**.

## 1. Pantallas

Hoy existe una sola pantalla: la de cancelar una reserva. El diseño técnico (`TECH-DESIGN.md`) describe además pantallas de disponibilidad, reserva y una vista de administrador, que no están construidas. Para `/admin` solo existe una protección de acceso:

| Puerta | Qué recibe | Qué devuelve | Cómo falla (negocio) | HU que la abre | Evidencia |
|---|---|---|---|---|---|
| Pantalla `/cancelar` | El código de reserva que escribe el jugador | El mensaje "Reserva cancelada. El horario quedó libre." | Muestra el mensaje de error que da el sistema (código mal escrito, no encontrado, reserva ya cancelada, demasiados intentos). Si no hay mensaje, "No se pudo cancelar la reserva."; sin conexión, "No se pudo conectar. Intentá nuevamente." | HU-03 | `src/app/cancelar/page.tsx:9-23`, `src/app/cancelar/page.tsx:28-35` |
| Dirección `/admin` (filtro de acceso) | Una visita a `/admin` o a cualquier dirección bajo `/admin/` | Si el acceso de administración está configurado, deja pasar la visita. La pantalla de destino **no existe**: qué ve el usuario es **NO VERIFICADO** | Si falta la contraseña de administrador o el secreto de sesión en la configuración, responde "el acceso de administración no está configurado" y no deja entrar | HU-04 (la vista de agenda que protegería); la regla de bloqueo viene de ADR-0009, no de la HU | `middleware.ts:7-14`, `middleware.ts:22` |

## 2. Comandos

Comandos que una persona del equipo ejecuta con `npm run <comando>`. Ninguno tiene HU: son herramientas de operación, no funciones para el jugador o el administrador.

| Puerta | Qué recibe | Qué devuelve | Cómo falla (negocio) | HU que la abre | Evidencia |
|---|---|---|---|---|---|
| `npm run dev` | Nada | Levanta la aplicación en modo desarrollo | **NO VERIFICADO** | Sin HU | `package.json:6` |
| `npm run build` | Nada | Prepara la aplicación para publicarla | **NO VERIFICADO** | Sin HU | `package.json:7` |
| `npm run start` | Nada (requiere un `build` previo) | Levanta la aplicación ya preparada | **NO VERIFICADO** | Sin HU | `package.json:8` |
| `npm run typecheck` | Nada | Informe de errores de tipos en el código | **NO VERIFICADO** | Sin HU | `package.json:9` |
| `npm run test` | Nada | Resultado de las pruebas automáticas. La carpeta `tests/` está vacía, así que hoy no hay pruebas que correr | **NO VERIFICADO** | Sin HU | `package.json:10` |
| `npm run db:up` | Nada | Levanta la base de datos local | **NO VERIFICADO** | Sin HU | `package.json:11` |
| `npm run db:migrate` | Nada | Aplica los cambios de estructura a la base de datos de desarrollo | **NO VERIFICADO** | Sin HU | `package.json:12` |
| `npm run db:deploy` | Nada | Aplica los cambios de estructura a la base de datos de producción | **NO VERIFICADO** | Sin HU | `package.json:13` |
| `npm run db:seed` | Nada (la lista de canchas está fija en el archivo) | Crea o actualiza las canchas: "Fulbito 1", "Fulbito 2" (fulbito) y "Vóley 1" (vóley). Estos datos son de ejemplo, no confirmados por negocio | **NO VERIFICADO** | Sin HU (relacionada con el Punto Abierto #5 del PRD) | `package.json:14`, `package.json:17`, `prisma/seed.ts:7-11` |

## 3. Funciones públicas de módulos

Funciones que otras partes del sistema pueden llamar para pedir algo de negocio. Se dejan fuera las ayudas internas (fechas, registro de eventos, armado de respuestas HTTP), porque no ofrecen nada de negocio por sí mismas.

**Importante:** varias de estas funciones existen pero **nadie las usa todavía** (ninguna ruta ni pantalla las llama). Se indica en cada fila.

| Puerta | Qué recibe | Qué devuelve | Cómo falla (negocio) | HU que la abre | Evidencia |
|---|---|---|---|---|---|
| `listarCanchas` | Nada | La lista de canchas (id, nombre, tipo), ordenada por id | No define fallas propias | HU-01 | `src/server/services/disponibilidad.ts:7` |
| `obtenerDisponibilidad` | Una cancha (id) y una fecha | La lista de horarios del día, cada uno marcado como libre u ocupado | No define fallas propias. Si la cancha no existe, devuelve todos los horarios como libres (no avisa) | HU-01 | `src/server/services/disponibilidad.ts:11-24` |
| `crearReserva` | Cancha (id), fecha y hora de inicio | El código de reserva de 6 dígitos y la fecha/hora en que se creó | "La cancha indicada no existe"; "el horario ya no está disponible" (otro jugador lo tomó); si no logra generar un código único tras varios intentos, falla sin mensaje para el jugador | HU-02 | `src/server/services/reservas.ts:22-46` |
| `cancelarReserva` | Un código de reserva | Nada (la reserva queda cancelada) | "Código inválido o reserva no encontrada"; "la reserva ya no está activa" (ya estaba cancelada, o alguien la canceló al mismo tiempo) | HU-03 | `src/server/services/reservas.ts:48-59`; la usa `src/app/api/reservas/[codigo]/route.ts:10` |
| `listarAgenda` — **sin uso** | Una fecha | Las reservas activas de ese día: cancha (id y nombre) y hora de inicio. Nunca incluye el código de reserva | No define fallas propias. Un día sin reservas devuelve una lista vacía | HU-04 | `src/server/services/agenda.ts:7-19` |
| `adminConfigured` — **sin uso** | Nada | Sí/no: si el acceso de administración está configurado | No falla | Sin HU directa (ADR-0009); relacionada con HU-04 | `src/lib/admin-session.ts:5-7` |
| `passwordMatches` — **sin uso** | Una contraseña candidata | Sí/no: si coincide con la contraseña de administrador | No falla; si no hay contraseña configurada, siempre responde "no" | Sin HU directa (ADR-0009); relacionada con HU-04 | `src/lib/admin-session.ts:22-26` |
| `createSessionValue` — **sin uso** | Opcionalmente, el momento actual | Un valor de sesión de administrador que vence a las 8 horas | No falla | Sin HU directa (ADR-0009); relacionada con HU-04 | `src/lib/admin-session.ts:28-31` |
| `verifySessionValue` — **sin uso** | Un valor de sesión (puede faltar) y, opcionalmente, el momento actual | Sí/no: si la sesión de administrador es válida y no venció | No falla; responde "no" si falta, está alterada, venció o el acceso no está configurado | Sin HU directa (ADR-0009); relacionada con HU-04 | `src/lib/admin-session.ts:33-39` |
| `enforceRateLimit` | La solicitud, un nombre para agrupar los intentos, la política ante caídas ("fallar abierto" o "fallar cerrado") y un identificador de solicitud | Nada si se permite seguir | "Demasiados intentos, intentar nuevamente más tarde" (más de 5 por minuto desde la misma conexión, con aviso de cuándo reintentar). Si el servicio de conteo no responde: con "fallar cerrado" responde "servicio no disponible"; con "fallar abierto" deja pasar | Sin HU (ADR-0010) | `src/lib/rate-limit.ts:35-60`; la usa la cancelación con "fallar abierto" en `src/app/api/reservas/[codigo]/route.ts:8` |

## 4. Herramientas de agente

**El producto no tiene herramientas de agente.** Las carpetas `.claude/skills/` y `.agents/skills/` contienen habilidades para los agentes que *construyen* el proyecto (PM, BA, UX, arquitecto), no puertas del sistema de reservas. Quedan fuera de este documento.

## Hallazgos

- **Solo HU-03 tiene pantalla.** HU-01, HU-02 y HU-04 describen cosas que una persona ve en pantalla, pero esas pantallas no están construidas.
- **HU-04 (agenda) no tiene ninguna puerta conectada.** Su función existe, pero ninguna ruta ni pantalla la usa.
- **La protección de administrador no se aplica en ningún lado**, salvo el bloqueo de `/admin` cuando falta configuración. **El límite de intentos solo se aplica a la cancelación**; el login de administrador, que también lo necesita (ADR-0010), no existe todavía.
- **Ninguna HU pide la protección de administrador ni el límite de intentos**; vienen de ADR-0009 y ADR-0010.
- **`obtenerDisponibilidad` no avisa si la cancha no existe**: muestra todos los horarios como libres. Falta confirmar si eso es aceptable.
