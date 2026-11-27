# Security Pass — Reserva de Canchas (reserva-canchas)

Fecha: 2026-11-24
Alcance revisado: producto (`PRD.md`, `CAMBIO-01`), historias y contrato (`HU-01` a `HU-04`, `CONTRATO-HU-03.md`), arquitectura (`TECH-DESIGN.md`, `adrs/0001`–`0011`, `REVISION-ADVERSARIAL.md`, `docs/puertas.md`), código (`middleware.ts`, `src/`, `prisma/`), configuración (`.env.example`, `.env.test`, `.gitignore`, `docker-compose.yml`, `next.config.ts`), dependencias (`package.json`, `package-lock.json`) y pruebas (`tests/`).
Capas omitidas por falta de material: CI/CD (no existe `.github/` ni otro pipeline en el repositorio). Configuración real de producción en Vercel (variables cargadas, plataforma de despliegue efectiva): no está en el repositorio, NO VERIFICADO.
Auditoría de dependencias: `npm audit` (solo lectura). Resultado: 6 vulnerabilidades (1 crítica, 5 altas) en `next` (directa), `postcss`, `prisma` (directa, de desarrollo), `@prisma/config`, `effect` y `deepmerge-ts`. Detalle en SEC-02 y SEC-07.

## Resumen ejecutivo

El sistema es chico y está razonablemente bien protegido en lo que el diseño ya pensó: la sesión de administrador, la validación de entradas, la regla de "una reserva por horario" y el manejo de errores están bien hechos y probados. El riesgo más importante no está en un error de programación sino en un hueco del diseño: **cualquier persona, sin identificarse y sin límite de intentos, puede reservar todos los horarios del complejo** con un script de unas mil solicitudes, y con suficiente volumen puede agotar para siempre los códigos de reserva. El segundo tema urgente es que la versión instalada de Next.js tiene avisos de seguridad críticos y altos con arreglo disponible dentro de la misma versión mayor. El resto son riesgos medios ya conocidos (adivinación distribuida de códigos de cancelación) o detalles de configuración y de pruebas.

## Fortalezas de seguridad

Controles que funcionan bien y conviene no tocar al remediar:

- **Acceso de administrador cerrado por defecto**: si falta `ADMIN_PASSWORD` o `ADMIN_SESSION_SECRET`, el login responde 503 y la página `/admin` nunca valida una sesión, así que la agenda no se abre (`src/app/api/admin/login/route.ts:11`, `src/lib/admin-session.ts:34`, probado en `tests/hu-04-agenda.test.ts:177`). La barrera adicional de `middleware.ts` **no se ejecuta** (ver SEC-09).
- **Comparación de contraseña en tiempo constante** sobre resúmenes del mismo largo (`src/lib/admin-session.ts:22-26`), y verificación de la firma de la cookie también en tiempo constante (`src/lib/admin-session.ts:15-19,37`).
- **Cookie de sesión bien configurada**: firmada con HMAC, `HttpOnly`, `SameSite=Lax`, `Secure` en producción, vence a las 8 horas (`src/app/api/admin/login/route.ts:20-24`). La sesión se verifica en el servidor en cada carga de `/admin` (`src/app/admin/page.tsx:17-18`).
- **Códigos de reserva aleatorios de verdad** (`crypto.randomInt`, `src/server/services/reservas.ts:9-11`), nunca reutilizados (`UNIQUE` en `prisma/migrations/20261014004656_init/migration.sql:33`) y nunca mostrados en la agenda (`src/server/services/agenda.ts:6-10`, probado en `tests/hu-04-agenda.test.ts:143`).
- **Imposible duplicar un horario**, incluso con dos pedidos simultáneos: índice único parcial en la base (`prisma/migrations/20261014004700_indice_unico_parcial_reserva_activa/migration.sql`) y prueba de concurrencia (`tests/hu-02-reservar.test.ts:40`). La cancelación concurrente también es segura (`src/server/services/reservas.ts:59-64`).
- **Toda entrada validada con Zod** antes de tocar la base (`src/lib/validation.ts`), y Prisma evita inyección SQL (no hay SQL armado a mano en el código de la aplicación).
- **Errores sin detalles internos**: siempre `{ "error": "<mensaje>" }`, nunca la traza ni el error crudo de Prisma (`src/lib/http.ts:28-34`).
- **Los logs no registran la contraseña ni el código de reserva** (`src/lib/logger.ts:10`, revisado en todos los llamados a `log`).
- **Secretos fuera del repositorio**: `.env` está ignorado (`.gitignore:6`) y nunca fue versionado. `.env.test` sí está versionado, pero solo con valores locales de prueba.
- **El interruptor para apagar el rate limiting se ignora en producción** (`src/lib/rate-limit.ts:10-12`).
- **El plazo de cancelación se revisa en el servidor**, con la hora fijable en las pruebas (`src/server/services/reservas.ts:48-57`, `tests/hu-03-cancelar.test.ts`).

## Findings

### HIGH

#### SEC-01 — Crear reservas no tiene ningún límite: un script puede ocupar todos los horarios y agotar los códigos

- **Severity:** HIGH
- **Confidence:** HIGH
- **Category:** Lógica de negocio abusable / falta de límite en una operación sensible (disponibilidad)
- **Affected artifact:** Arquitectura (ADR-0010), código
- **Location:** `src/app/api/reservas/route.ts:13-24`; `adrs/0010-rate-limiting-enumeracion.md` (tabla de endpoints); `src/server/services/reservas.ts:22-46`
- **Description:** `POST /api/reservas` no pide identificación (ADR-0002) y no tiene límite de intentos: ADR-0010 solo limita la cancelación y el login. Cada reserva además "quema" para siempre uno de los 10⁶ códigos posibles (ADR-0002).
- **Evidence:** la ruta no llama a `enforceRateLimit` (comparar con `src/app/api/reservas/[codigo]/route.ts:8`). ADR-0010 lista solo `DELETE /api/reservas/[codigo]` y `POST /api/admin/login`. El código no se libera al cancelar (`UNIQUE` común sobre `codigo_reserva`). Si se agotan 5 intentos de generar código, la API responde 500 (`src/server/services/reservas.ts:26,45`).
- **Attack scenario:**
  1. *Acaparar la agenda:* con 3 canchas y 14 horarios por día, ocupar los próximos 30 días son ~1.260 pedidos `POST /api/reservas`, que un script hace en minutos desde una sola conexión. Los jugadores reales ven todo "ocupado". El administrador no tiene forma de cancelar desde la aplicación (PRD, regla 1: sin cancelación por el administrador), así que limpiar exige entrar a la base de datos a mano.
  2. *Agotar los códigos:* como las fechas aceptadas no tienen techo (ver SEC-03), el atacante puede crear cientos de miles de reservas en fechas lejanas. Cuando el espacio de códigos está, por ejemplo, 90 % ocupado, cada reserva legítima falla con probabilidad 0,9⁵ ≈ 59 %; cerca del 100 %, nadie puede reservar más. Como los códigos nunca se reutilizan, el daño es permanente hasta que se cambie el largo del código.
- **Potential impact:** se rompe el criterio de éxito central del PRD ("un jugador puede reservar una cancha de principio a fin"). El complejo vuelve a WhatsApp. Severidad HIGH porque el ataque no requiere ninguna habilidad, ni cuenta, ni secreto, y afecta a todo el negocio; no es CRITICAL porque no expone datos ni da control del sistema.
- **Existing mitigation:** ninguna en la aplicación. Upstash ya está integrado para otros endpoints, así que la pieza técnica existe.
- **Recommended remediation:** ampliar ADR-0010 para cubrir `POST /api/reservas` con un límite por IP (y decidir si falla abierta o cerrada). Evaluar además un tope de reservas activas por día por IP. La decisión de los valores corresponde a arquitectura/negocio; el cambio de código es una línea con `enforceRateLimit`.
- **Suggested verification:** prueba que haga N+1 pedidos de reserva desde la misma IP con un limitador simulado y espere 429 con `Retry-After`; prueba manual con un script contra un entorno de prueba.
- **Required change type:** ACCEPT RISK (antes: DESIGN / ADR CHANGE)
- **Decisión (2026-11-24, Mario Yahuarcani):** riesgo aceptado. Motivo: es un negocio pequeño, nadie gana nada ocupando todos los horarios, y si ocurre se resolverá manualmente. Consecuencias que acepta esta decisión: la limpieza manual exige operar directamente sobre la base de datos, porque la aplicación no permite que el administrador cancele reservas. Borrar las reservas falsas libera los horarios y también los códigos. Esta decisión no cierra SEC-03 (fechas sin límite), que sigue abierto y es el que hace fácil agotar los códigos.

#### SEC-02 — Next.js 15.5.27 tiene avisos de seguridad críticos y altos con arreglo disponible

- **Severity:** HIGH
- **Confidence:** MEDIUM
- **Category:** Riesgo de dependencias
- **Affected artifact:** Dependencias
- **Location:** `package.json:23` (`"next": "^15.5.27"`), versión instalada `15.5.27`
- **Description:** `npm audit` marca `next` (dependencia directa de producción) como CRITICAL, con arreglo disponible sin cambio de versión mayor (`fixAvailable: true`).
- **Evidence:** salida de `npm audit`:
  - GHSA-2464-fhr4-w9xw — ejecución remota de código sin autenticación en la API de optimización de imágenes con SVG.
  - GHSA-7qx7-33qx-rqx2 — evasión del rechazo de SVG en la optimización de imágenes.
  - GHSA-p3m5-59mp-jv5r — denegación de servicio en App Router usando Server Actions.
  - GHSA-f3mh-rxg3-f5g2 — exposición de cookies `HttpOnly` a través de una cabecera interna en rutas del runtime Edge.
  - GHSA-pc58-hwjq-p385 — inyección de respuestas entre clientes en apps auto-hospedadas que reenvían respuestas obtenidas.
- **Attack scenario / aplicabilidad a este proyecto:**
  - Imágenes (RCE, SVG): el proyecto no usa `next/image`, no tiene carpeta `public/` y no configura dominios remotos (`next.config.ts` vacío). El riesgo parece bajo, pero el endpoint `/_next/image` existe por defecto y no se verificó el detalle del aviso.
  - Cookies en runtime Edge: la primera versión de este informe suponía que `middleware.ts` corría en el runtime Edge. La verificación de RCAN-9 mostró que no se ejecuta (SEC-09), así que hoy este aviso tampoco tiene un camino claro en el proyecto. Volvería a importar si se corrige SEC-09 sin haber actualizado `next`.
  - Server Actions: el proyecto no las usa (no hay `"use server"`). Bajo impacto.
  - Respuestas reenviadas en auto-hospedaje: el despliegue previsto es Vercel y el código no reenvía respuestas. No aplica según lo que hay en el repositorio.
- **Potential impact:** en el peor caso aplicable, robo de la sesión de administrador (y con ella, la vista de todas las reservas). Severidad HIGH y no CRITICAL porque el vector crítico (SVG en imágenes) no tiene evidencia de uso en este proyecto.
- **Existing mitigation:** no se usan imágenes ni Server Actions, lo que reduce la superficie.
- **Recommended remediation:** actualizar `next` a la versión parcheada dentro de 15.x que indica `npm audit` y regenerar el lockfile; correr `npm run typecheck` y `npm run test` después.
- **Suggested verification:** `npm audit --omit=dev` ya no muestra los 5 avisos propios de `next`; las 4 suites de `tests/` en verde. `next` puede seguir apareciendo con gravedad menor, como dependiente de `postcss` (ver SEC-07).
- **Corrección (2026-11-24):** la primera versión de este informe decía que actualizar `next` dentro de 15.x también arreglaba `postcss`. Es falso: `next@15.5.29`, la última de la serie 15, fija `postcss` en `8.4.31`. Seguimiento en Jira: RCAN-9.
- **Required change type:** CODE FIX

### MEDIUM

#### SEC-03 — Se puede reservar en fechas pasadas y en cualquier año futuro

- **Severity:** MEDIUM
- **Confidence:** HIGH
- **Category:** Requisito de seguridad faltante / integridad de datos
- **Affected artifact:** Producto (PRD, Punto Abierto #3), especificación (HU-02), código
- **Location:** `src/lib/validation.ts:8-14` (`fechaSchema` solo valida formato); `HU-02-reservar-cancha.md:36`; `PRD.md` Punto Abierto #3
- **Description:** la fecha de una reserva solo se valida como fecha real `YYYY-MM-DD`. Se aceptan ayer, el año 1900 o el 9999. HU-02 prohíbe expresamente construir un límite de fechas hasta que negocio responda el Punto Abierto #3, así que el código cumple la especificación: el hueco es del requisito.
- **Evidence:** `fechaSchema` no compara contra "hoy" ni contra un máximo. HU-02, línea 36: "No se debe construir ningún límite de fechas sin confirmar esto".
- **Attack scenario:** un atacante (o un error del cliente) crea reservas en fechas pasadas, que ensucian la agenda del administrador y no se pueden cancelar (ya pasó el plazo de 2 horas). Combinado con SEC-01, el rango sin techo es lo que hace fácil agotar los códigos. Con una ventana de reserva, el atacante solo tendría unos pocos miles de horarios para ocupar y, para seguir gastando códigos, tendría que reservar y cancelar en ciclo. Eso es mucho más lento, porque la cancelación sí tiene límite por IP, pero no es imposible.
- **Potential impact:** datos basura en la agenda y amplificación de SEC-01. Severidad MEDIUM porque por sí solo no frena al negocio, pero multiplica el daño de SEC-01.
- **Existing mitigation:** ninguna; el punto está registrado como abierto en PRD y HU-02.
- **Recommended remediation:** que negocio responda el Punto Abierto #3 (mínimo: no permitir fechas pasadas; máximo: N días hacia adelante). Luego, criterio de aceptación en HU-02 como: *"Dado un jugador, cuando intenta reservar una fecha anterior a hoy (hora de Lima) o posterior a hoy + N días, entonces la API responde 400 y no crea la reserva"*.
- **Suggested verification:** prueba de servicio con fecha de ayer y con fecha hoy + N + 1 esperando 400.
- **Required change type:** PRODUCT / REQUIREMENT CHANGE

#### SEC-04 — Si Upstash no está configurado, la cancelación queda sin límite y nadie se entera

- **Severity:** MEDIUM
- **Confidence:** HIGH
- **Category:** Valor por defecto inseguro / falla abierta
- **Affected artifact:** Código
- **Location:** `src/lib/rate-limit.ts:14-17,43-44,53-58`; `src/app/api/reservas/[codigo]/route.ts:8`
- **Description:** cuando faltan `UPSTASH_REDIS_REST_URL` o `UPSTASH_REDIS_REST_TOKEN`, el código trata la falta de configuración igual que una caída momentánea de Upstash. Para la cancelación (política "fallar abierto") eso significa que no hay ningún límite, para siempre, y solo queda un log por pedido.
- **Evidence:** `getLimiter` devuelve `null` sin variables (`:17`), se lanza un error (`:44`) y el `catch` deja pasar con `fail-open` (`:56-58`). ADR-0010 justifica fallar abierto "si el servicio de rate limiting no responde", es decir, ante una caída temporal, no ante una configuración ausente.
- **Attack scenario:** un despliegue en Vercel sin las variables de Upstash (olvido al configurar un entorno nuevo, por ejemplo una preview). Un atacante recorre los 10⁶ códigos sin freno —a 100 pedidos por segundo son unas 3 horas— y cancela todas las reservas futuras que tengan más de 2 horas de margen.
- **Potential impact:** cancelación masiva de reservas legítimas. MEDIUM y no HIGH porque requiere un error de configuración, y ese mismo error hace que el login de admin responda 503, lo que da una señal visible (aunque indirecta).
- **Existing mitigation:** el login admin sí falla cerrado y los fallos se registran (`rate_limit_unavailable`).
- **Recommended remediation:** distinguir "no configurado" de "no responde": si faltan las variables en producción, fallar cerrado también para la cancelación (o negarse a arrancar). Mantener la falla abierta solo para errores de red con Upstash, como dice el ADR.
- **Suggested verification:** prueba unitaria de `enforceRateLimit` con `NODE_ENV=production`, sin variables de Upstash y política `fail-open`, esperando 503.
- **Required change type:** CODE FIX

#### SEC-05 — Un atacante con muchas IPs puede cancelar reservas ajenas al azar

- **Severity:** MEDIUM
- **Confidence:** MEDIUM
- **Category:** Control de acceso débil / enumeración
- **Affected artifact:** Arquitectura (ADR-0002, ADR-0010, ADR-0011), producto (Punto Abierto #2)
- **Location:** `src/server/services/reservas.ts:48-65`; `src/app/api/reservas/[codigo]/route.ts`; `TECH-DESIGN.md` §"Riesgos técnicos abiertos"
- **Description:** el único secreto que protege la cancelación es un código de 6 dígitos. El límite es de 5 intentos por minuto **por IP**. El atacante no necesita adivinar una reserva concreta: cualquier acierto cancela la reserva de alguien. Además, las respuestas distinguen "no existe" (404), "ya cancelada" (410) y "fuera de plazo" (409), lo que confirma qué códigos son reales.
- **Evidence:** códigos de 10⁶ combinaciones (ADR-0002); límite por IP (`src/lib/rate-limit.ts:22,45`); orden 404 → 410 → 409 (`src/server/services/reservas.ts:50-57`). El TDD ya declara el riesgo residual de "muchas IPs distribuidas".
- **Attack scenario:** con 300 reservas activas futuras, cada intento acierta con probabilidad 3 × 10⁻⁴. Una IP hace 7.200 intentos por día → unas 2 cancelaciones por día. Con 50 IPs (una botnet chica o proxies baratos), unas 100 por día: el complejo pierde reservas sin saber por qué, y los jugadores llegan a una cancha que figura libre o tomada por otro.
- **Potential impact:** sabotaje de reservas de terceros. MEDIUM porque necesita recursos (muchas IPs) y motivo, y el impacto se limita a reservas, sin datos personales.
- **Existing mitigation:** rate limiting por IP (ADR-0010), códigos no visibles en la agenda (ADR-0002), códigos no reutilizables. El riesgo residual está documentado en el TDD como "debe reevaluarse antes de un uso real".
- **Recommended remediation:** opciones para que decida un humano: (a) aceptar el riesgo formalmente para el MVP; (b) código más largo o alfanumérico (por ejemplo, 10 caracteres) para que adivinar sea inviable aun con muchas IPs; (c) un límite global de cancelaciones fallidas por minuto, además del límite por IP; (d) resolver el Punto Abierto #2 con un dato del jugador como segundo factor.
- **Suggested verification:** según la opción elegida; para (c), prueba que muchos 404 seguidos desde IPs distintas disparen el límite global.
- **Required change type:** ACCEPT RISK

### LOW

#### SEC-06 — El límite por IP confía en la primera IP de `X-Forwarded-For`

- **Severity:** LOW
- **Confidence:** LOW
- **Category:** Configuración / evasión de controles
- **Affected artifact:** Código
- **Location:** `src/lib/rate-limit.ts:30-32`
- **Description:** la IP del cliente se toma del primer valor de `X-Forwarded-For`, una cabecera que el cliente puede escribir. Si la plataforma no la reemplaza, el atacante manda un valor distinto en cada pedido y el límite de 5 por minuto deja de servir (para cancelación y login admin). Además, todos los pedidos sin esa cabecera comparten la clave `"unknown"`.
- **Evidence:** `req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"`.
- **Attack scenario:** fuera de Vercel (por ejemplo `next start` detrás de un proxy que agrega en vez de reemplazar), un script envía `X-Forwarded-For: <número aleatorio>` en cada intento y prueba códigos o contraseñas sin límite.
- **Potential impact:** anula SEC-05 y la protección del login admin. LOW con confianza LOW porque el despliegue previsto es Vercel, que por lo que se sabe reemplaza esa cabecera con la IP real; falta confirmar eso contra la documentación vigente de Vercel y contra el despliegue real.
- **Existing mitigation:** depende de la plataforma (no está en el repositorio).
- **Recommended remediation:** confirmar el comportamiento en Vercel; si se confirma, documentar en ADR-0010 que el límite depende de que la plataforma reemplace la cabecera. Si se despliega en otro lado, usar la cabecera que fije el proxy de confianza.
- **Suggested verification:** en el despliegue real, enviar 6 intentos de login con `X-Forwarded-For` distinto en cada uno y comprobar que el sexto recibe 429.
- **Required change type:** CODE FIX

#### SEC-07 — Herramientas de build con avisos altos (`postcss`, `prisma` CLI)

- **Severity:** LOW
- **Confidence:** HIGH
- **Category:** Riesgo de dependencias
- **Affected artifact:** Dependencias
- **Location:** `package.json:33` (`prisma`, devDependency); `postcss@8.4.31` (transitiva de `next`)
- **Description:** `npm audit` marca como HIGH a `postcss` (XSS al serializar CSS, lectura de archivos `.map` vía `sourceMappingURL`) y a `prisma` → `@prisma/config` → `effect` / `deepmerge-ts` (ReDoS en `effect`).
- **Evidence:** salida de `npm audit` (GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849, GHSA-7589-6fvf-x4pw). El arreglo de `prisma` requiere pasar a 7.x (cambio mayor).
- **Attack scenario:** requiere CSS o configuración controlada por un atacante durante el build o al correr la CLI de Prisma. En este proyecto el CSS y la configuración son propios y no hay entrada de usuarios en esas etapas.
- **Potential impact:** bajo; se baja de HIGH a LOW porque las partes vulnerables solo corren en build/desarrollo con entradas de confianza.
- **Existing mitigation:** no se procesa CSS ni configuración de terceros.
- **Recommended remediation:** `postcss` **no** se resuelve con SEC-02: Next 15.x lo fija en `8.4.31`, y solo se arregla pasando a Next 16 (cambio de versión mayor) o forzando la versión con un override, lo que puede romper el build. Planificar la subida a Next 16 y a Prisma 7 como tareas aparte, porque las dos son cambios mayores.
- **Suggested verification:** `npm audit` después de actualizar.
- **Required change type:** CODE FIX

#### SEC-08 — Los controles de seguridad clave no tienen pruebas

- **Severity:** LOW
- **Confidence:** HIGH
- **Category:** Cobertura de pruebas
- **Affected artifact:** Pruebas
- **Location:** `tests/` (todas las suites); `.env.test:5` (`RATE_LIMIT_DISABLED="true"`)
- **Description:** las pruebas cubren bien la lógica de negocio, pero no verifican varios controles de seguridad: el rate limiting está apagado en todas las pruebas; no se prueba que una cookie alterada o vencida sea rechazada; la ruta `DELETE /api/reservas/[codigo]` no se prueba como HTTP (400 por formato, 429); y no se prueba el middleware.
- **Evidence:** no hay ningún test que importe `enforceRateLimit` ni `middleware`; `verifySessionValue` solo se prueba con un valor válido (`tests/hu-04-agenda.test.ts:168`).
- **Attack scenario:** no es un ataque directo; es que un cambio futuro puede romper uno de estos controles sin que ninguna prueba falle (por ejemplo, quitar la línea de `enforceRateLimit` de la cancelación).
- **Potential impact:** regresiones de seguridad silenciosas.
- **Existing mitigation:** revisión humana de PR.
- **Recommended remediation:** pruebas concretas:
  - `verifySessionValue` devuelve `false` con firma alterada, con `expiresAt` modificado y con sesión vencida (usando el parámetro `now`).
  - `enforceRateLimit` con un limitador simulado: 429 + `Retry-After` al excederse; 503 con `fail-closed` si falla Upstash; deja pasar con `fail-open`.
  - `DELETE /api/reservas/abc` responde 400 sin consultar la base.
  - El middleware responde 503 en `/api/admin/login` y `/admin` sin configuración de admin.
- **Suggested verification:** las nuevas pruebas fallan si se quita el control correspondiente.
- **Required change type:** TEST FIX

#### SEC-09 — El middleware nunca se ejecuta: está fuera de la carpeta `src/`

- **Severity:** LOW
- **Confidence:** HIGH
- **Category:** Configuración / control que se cree activo y no lo está
- **Affected artifact:** Código, documentación (`docs/puertas.md`, ADR-0009)
- **Location:** `middleware.ts` (raíz del proyecto); la app vive en `src/app/`
- **Description:** cuando un proyecto usa la carpeta `src/`, Next.js carga el middleware solo desde `src/middleware.ts`. El archivo está en la raíz, así que nunca corre. Se pierden dos cosas: la barrera que devuelve 503 en `/admin` y `/api/admin` si falta configuración, y el `requestId` que debería aparecer en todos los logs.
- **Evidence:** `.next/server/middleware-manifest.json` queda con `"middleware": {}` después de compilar; los logs muestran `"requestId": null` (reportado por el TESTER en `VEREDICTO-SEC-02.md` y comprobado por el LEAD). El archivo está en la raíz desde el commit `d659cae`.
- **Attack scenario:** no hay un ataque directo. Con la configuración de administrador incompleta, la agenda igual queda cerrada, porque el login responde 503 y la página no valida ninguna sesión. El riesgo es que el equipo crea que hay una barrera que no existe, y que un cambio futuro se apoye en ella.
- **Potential impact:** defensa en profundidad ausente y logs sin `requestId`, lo que hace más difícil seguir un incidente.
- **Existing mitigation:** la ruta de login (`src/app/api/admin/login/route.ts:11`) y `verifySessionValue` (`src/lib/admin-session.ts:34`) ya fallan cerrado por su cuenta.
- **Recommended remediation:** mover `middleware.ts` a `src/middleware.ts`, sin cambiar su contenido. Hacerlo **después** de RCAN-9, para que el middleware no empiece a correr con una versión de `next` afectada por GHSA-f3mh-rxg3-f5g2.
- **Suggested verification:** después de compilar, `middleware-manifest.json` lista el middleware; los logs muestran un `requestId` no nulo; sin `ADMIN_PASSWORD`, `GET /admin` responde 503.
- **Required change type:** CODE FIX

## Prioridad

1. **SEC-02** (actualizar Next.js): es el cambio más barato y cierra los avisos de mayor severidad formal. No arregla `postcss`, que queda en SEC-07.
2. **SEC-01** (límite en crear reservas): riesgo aceptado el 2026-11-24; no requiere trabajo. Ver la decisión en el hallazgo.
3. **SEC-03** (ventana de reserva): pedir a negocio que cierre el Punto Abierto #3. Va junto a SEC-01, porque sin techo de fechas el límite por IP solo frena, no evita, el agotamiento de códigos.
4. **SEC-04** (Upstash no configurado): arreglo chico de código; conviene hacerlo antes de crear más entornos en Vercel.
5. **SEC-08** (pruebas): sumar las pruebas al mismo tiempo que SEC-01 y SEC-04, para que esos controles nuevos queden cubiertos.
6. **SEC-06** (cabecera de IP): verificar en el despliegue real; solo pide cambio de código si Vercel no reemplaza la cabecera.
7. **SEC-05** (adivinación distribuida): decisión de riesgo, antes de cualquier uso real fuera de la demo.
8. **SEC-09** (middleware que no corre): arreglo de una línea (mover el archivo), pero solo después de integrar RCAN-9.

## Gobernanza / Decisión requerida

Estos findings no se pueden resolver sin una decisión humana. Este pase no tiene autoridad para cambiar el alcance, la arquitectura ni para aceptar riesgos:

- **SEC-01 — ACCEPT RISK. DECIDIDO (2026-11-24, Mario Yahuarcani):** se acepta el riesgo de que se ocupen todos los horarios por falta de límite; si ocurre, se resolverá manualmente. Pendiente: registrarlo en `TECH-DESIGN.md` §"Riesgos técnicos abiertos", para que la decisión quede en el diseño y no solo en este informe.
- **SEC-03 — PRODUCT / REQUIREMENT CHANGE.** Depende del Punto Abierto #3 del PRD (ventana de reserva). HU-02 prohíbe construir un límite de fechas sin la respuesta de negocio, así que no se puede arreglar desde el código.
- **SEC-05 — ACCEPT RISK.** El TDD ya registra este riesgo residual como "debe reevaluarse antes de un uso real", pero nadie lo aceptó formalmente. Alguien con autoridad tiene que aceptarlo para el MVP o elegir una de las mitigaciones (código más largo, límite global o un dato del jugador, que toca el Punto Abierto #2).
