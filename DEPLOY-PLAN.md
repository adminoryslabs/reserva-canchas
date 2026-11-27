# Deploy Plan — reserva-canchas

Fecha: 2026-11-26 (revisión 2: alineado con el flujo probado en `REPORTE-ensayo.md` del 2026-11-22)
Estado: APROBADO y GENERADO (2026-11-26). Nada commiteado ni desplegado.

## Qué cambió en esta revisión

La revisión 1 proponía que el CI compilara y subiera el artefacto (`vercel build` + `vercel deploy --prebuilt`), con migraciones en el pipeline y aprobación humana en un GitHub Environment. Ese camino **no se probó nunca**.

Esta revisión adopta el flujo que el ensayo probó de punta a punta: pipeline verde, gate en rojo bloqueando un cambio roto, reversión y rollback de recursos.

- **Deploy:** el CI dispara un **Deploy Hook** de Vercel solo si pasan las pruebas y el build.
- **Migraciones y seed:** manuales, fuera del pipeline.
- **Secretos:** a nivel del repositorio, sin GitHub Environment.

Además incorpora las lecciones del ensayo: framework `nextjs`, conexión de Vercel con GitHub, comillas en las URLs de Neon, CLI en lugar de MCP para los secretos y actions sin Node 20.

## Resumen del proyecto

- **Aplicación:** Next.js 15.5.29 con App Router, más Prisma 6 sobre PostgreSQL.
  - Pantallas: `/`, `/cancelar` y `/admin`.
  - Rutas HTTP: `/api/canchas`, `/api/disponibilidad` (exige `canchaId` y `fecha`), `/api/reservas`, `/api/reservas/{codigo}` y `/api/admin/login`.
- **Infraestructura ya decidida en los ADRs:**
  - Vercel para la aplicación y Neon Postgres para la base (ADR-0001).
  - `DATABASE_URL` usa el pooler de Neon y `DIRECT_URL` la conexión directa, solo para migraciones (ADR-0006).
  - Upstash Redis para el límite de intentos (ADR-0010).
  - Contraseña compartida y cookie firmada con HMAC para el administrador (ADR-0009).
  - Logs JSON por `console.log`.
- **Repositorio:** GitHub `adminoryslabs/reserva-canchas`.
  - Es público, pertenece a una cuenta de usuario y su rama de producción es `main`.
  - `main` no tiene protección de rama. No hay GitHub Environments, secrets ni variables de Actions.
  - Tampoco hay `.github/` ni `vercel.json`.
- **Pruebas:** Vitest contra un Postgres real (`.env.test`, `tests/global-setup.ts` corre `prisma migrate deploy`), en serie. En el ensayo pasaron 17/17.
- **Versiones:**
  - Node 22.22.0 en la máquina local; `package.json` no fija `engines`.
  - Postgres 16 (`postgres:16-alpine`) en local y en CI.
- **Herramientas y cuentas (verificadas el 2026-11-26):**
  - CLIs: Vercel 67.0.0, Neon 9.10.0 y Upstash 1.8.0, con sesión iniciada.
  - Cuentas: Vercel en el scope `marioyahuars-projects` (plan Hobby), Neon en la org `org-lucky-wildflower-35809703` y Upstash sin bases.
  - Las tres cuentas las maneja la misma persona. Es un entorno de **demo de clase**.

## Sistema de deployment propuesto

### Build

- **En el CI:** `npm ci`, `npm run typecheck`, `npm run test` y `npm run build`. El build del CI es una verificación: si no compila, no hay deploy.
- **En Vercel:** al recibir el Deploy Hook, Vercel compila el commit con `npm run build` (`prisma generate && next build`).
- **Versión de Node:** se fija en 22 en ambos lados, con `"engines": { "node": "22.x" }` en `package.json` y `node-version: 22` en el workflow.
- **Riesgo aceptado:** Vercel vuelve a compilar, así que lo desplegado no es byte a byte lo que compiló el CI. Lo mitiga que los dos compilan el mismo commit con el mismo `package-lock.json` y la misma versión de Node.

### Artifact

- **Qué es:** un deployment inmutable de Vercel, compilado desde el commit de la rama de producción.
- **Trazabilidad:** con Vercel conectado al repositorio, cada deployment queda asociado a su commit, y Vercel publica un *commit status* en GitHub para ese SHA.

### Config & Secrets

| Variable | Tipo | Dónde vive |
|---|---|---|
| `DATABASE_URL` (pooler Neon, `?pgbouncer=true&connection_limit=1`) | Secret | Vercel → Production |
| `DIRECT_URL` (conexión directa Neon: el mismo host sin `-pooler`) | Secret | Vercel → Production; en la máquina local solo para la migración manual |
| `ADMIN_PASSWORD` | Secret | Vercel → Production (generado con `openssl rand -hex`) |
| `ADMIN_SESSION_SECRET` (al menos 32 bytes) | Secret | Vercel → Production (generado con `openssl rand -hex 32`) |
| `UPSTASH_REDIS_REST_URL` | Config | Vercel → Production |
| `UPSTASH_REDIS_REST_TOKEN` | Secret | Vercel → Production |
| `COMPLEX_TIMEZONE=America/Lima` | Config | Vercel → Production |
| `RATE_LIMIT_DISABLED` | Config | **No se define en producción.** El código ya lo ignora ahí (`src/lib/rate-limit.ts:11`). |
| `VERCEL_DEPLOY_HOOK_URL` | Secret del CI | GitHub → secret del repositorio |
| `PRODUCTION_URL` | Config del CI | GitHub → variable del repositorio |

Reglas:

- **Los secretos nunca van al repositorio, a los logs ni al chat.** El repositorio es público y los logs de Actions también: ningún paso imprime variables ni cadenas de conexión.
- **Los valores van de la herramienta a Vercel por tubería,** sin mostrarse: `printf '%s' "$VAR" | vercel env add NOMBRE production`.
- **Se usan las CLIs y no los MCP de Neon o Upstash.** Esos MCP devuelven contraseñas y tokens dentro de su respuesta, así que pasan por el contexto del agente (lección del ensayo).
- **Las URLs de Neon tienen `&`.** Si se guardan en un archivo temporal para cargarlas con `source`, van entre **comillas simples**; si no, Prisma termina usando el `.env` local (`P1001 ... localhost:5432` en el ensayo). Ese archivo temporal vive fuera del repositorio y se borra al terminar.
- **`vercel link` crea `.vercel/` y un `.env.local` con `VERCEL_OIDC_TOKEN`, y agrega `.vercel` y `.env*` al `.gitignore`.** El cambio al `.gitignore` se revisa antes de commitearlo. `.env.test` y `.env.example` ya están versionados, así que siguen trackeados.
- `.env.test` es público y solo tiene credenciales del Postgres local de pruebas (Punto Abierto 8).

### Infraestructura

Lo decide ADR-0001. Para la demo:

- **Vercel:** el proyecto `reserva-canchas`, creado **con `framework=nextjs`** y conectado a `adminoryslabs/reserva-canchas`, con `main` como rama de producción.
  - En el ensayo, `vercel project add` lo creó como "Other" y el primer deploy falló con `STATIC_BUILD_NO_OUT_DIR`.
- **Neon:** un proyecto nuevo (el `LogManager` que ya existe no se toca), con **Postgres 16**, la misma versión que el CI y el entorno local. En el ensayo se usó la 18 por defecto.
- **Upstash:** una base Redis en el plan `free`.
- **Región:** las funciones de Vercel, Neon y Upstash tienen que estar juntas, porque cada reserva hace varias consultas y la latencia se suma en cada una. Se propone `iad1`, `aws-us-east-1` y `us-east-1`, que es lo que probó el ensayo. São Paulo queda como alternativa para producción real (Punto Abierto 5).

### Entornos

| Entorno | App | Base | Upstash | Uso |
|---|---|---|---|---|
| Local | `npm run dev` | Docker `db` (`postgres:16-alpine`) | Opcional (`RATE_LIMIT_DISABLED=true`) | Desarrollo |
| CI | Runner de GitHub Actions | Service container `postgres:16-alpine` (`reservas_test`) | No se usa | Pruebas y build |
| Producción (demo) | Vercel Production | Neon | Upstash | Demo de clase |

- **Previews desactivados.** Un preview sin Upstash deja la cancelación sin límite (SEC-04), y un preview sin base propia apuntaría a producción.
- **Sin staging en v1** (Punto Abierto 6).

### Estrategia de release

Se usa **release directo y atómico.** Vercel crea un deployment nuevo y mueve el dominio cuando está listo; el anterior queda vivo para un rollback instantáneo.

- No hay canary ni feature flags: es una sola app, de poco tráfico y sin SLA.
- **Sin aprobación humana en el pipeline.** El gate son las pruebas, el typecheck, el audit y el build. Es lo que probó el ensayo. Si después se quiere aprobación, se agrega un GitHub Environment con revisor al job `deploy` (Punto Abierto 11).

### Data & Migrations

- **Las migraciones son manuales y van antes del deploy de código que las necesita.** Se corre `npx prisma migrate deploy` desde la máquina local, con `DATABASE_URL` y `DIRECT_URL` de Neon cargadas.
  - El pipeline **no** migra; es la decisión que probó el ensayo.
  - Consecuencia: si un PR trae una migración, hay que aplicarla **antes** del merge a `main`, o el código nuevo correrá contra un esquema viejo.
- **Punto de restauración:** antes de cada migración se crea una rama de Neon con `neon branches create --name pre-migrate-<sha>`.
- **Regla expand/contract obligatoria:**
  - Se agrega antes de usar: columnas nullable o con default, índices nuevos.
  - Se borra o renombra en un release posterior.
- **Rollback de código ≠ rollback de datos.** Volver a un deployment de Vercel no deshace migraciones.
- **Índice único parcial:** la migración `20261014004700_indice_unico_parcial_reserva_activa` es SQL hecho a mano y es la garantía contra la doble reserva (ADR-0006). **Nunca** se regenera el historial ni se usa `prisma db push` en producción.
- **Primer deploy:** se aplican las 2 migraciones existentes sobre la base Neon vacía.
- **Seed de demo:** `npm run db:seed` carga las 3 canchas **de ejemplo** ("Fulbito 1", "Fulbito 2", "Vóley 1").
  - Sirve **solo para la demo**: el smoke las necesita y negocio todavía no confirmó las canchas reales (Punto Abierto #5 del PRD).
  - Para una salida pública real, el seed se reemplaza por los datos confirmados (Punto Abierto 2).

### Deploy gates

Un check que solo informa no alcanza: si Vercel conserva su auto-deploy por push, puede haber un check en rojo y un deploy en vivo al mismo tiempo. Por eso el diseño es:

1. **Se desactiva el auto-deploy por git** con `vercel.json` → `"git": { "deploymentEnabled": false }`. Esto también apaga los previews.
2. **Vercel queda conectado al repositorio** (`vercel git connect`) solo para poder usar un Deploy Hook. La cuenta de Vercel tiene que estar conectada a GitHub **como `adminoryslabs`**; si no, falla con `Failed to connect ... to project` (bloqueo de 23 minutos en el ensayo).
3. **Deploy Hook** `ci-gate` sobre `main`. Su URL se guarda como secret del repositorio y nunca se imprime.
4. **Pipeline** `.github/workflows/ci-cd.yml`:
   - **Job `test`** (en cada push y PR):
     1. `npm ci`
     2. `npm run typecheck`
     3. `npm run test`, con un service container `postgres:16-alpine`
     4. `npm audit --omit=dev --audit-level=critical`. Hoy da 0 críticas. Nunca se usa `audit fix --force` (SEC-02).
     5. `npm run build`
   - **Job `deploy`** (necesita `test`; solo con `push` a `main`): un `POST` al Deploy Hook.
   - **Job `smoke`** (necesita `deploy`):
     1. Espera el **commit status de Vercel para ese mismo SHA**.
     2. Si es `failure`, falla.
     3. Si es `success`, corre los checks de abajo.

     Sin esa espera, el smoke daría verde contra la versión anterior (lección del ensayo).
5. **Si `test` falla, `deploy` y `smoke` no corren,** y producción sigue en la versión buena. El ensayo lo verificó con el commit `de08256`.
6. **Por ser un repositorio público:** el workflow nunca usa `pull_request_target`. Los PR desde forks corren `test` sin secrets, y el deploy solo ocurre con `push` a `main`.
7. Las actions van en versiones que no usen Node 20, porque `@v4` da aviso de deprecación. La versión exacta se confirma contra los releases al generar el workflow.

### Verify & Observe

Los checks automáticos **no crean reservas.** Una reserva de prueba ocuparía un horario real.

| Check | Esperado | Qué demuestra |
|---|---|---|
| Commit status de Vercel para el SHA | `success` | Que se desplegó **este** commit |
| `GET /` | 200 | La app responde |
| `GET /api/canchas` | 200, con un array no vacío | Hay conexión a Neon por el pooler y la semilla está cargada |
| `GET /api/disponibilidad?canchaId=<primer id>&fecha=<hoy en Lima>` | 200 | Consulta real y zona horaria funcionando |
| `GET /admin` | 200 con el campo de contraseña y sin la agenda | Que `ADMIN_*` estén cargadas |
| `POST /api/admin/login` con una contraseña inválida | **401**, no 503 | Que Upstash esté configurado: el login falla cerrado sin él |

Prueba manual en el primer deploy (la que validó el ensayo):

- Reservar da 201 y el horario queda "ocupado".
- La clave mala da 401 y la buena 204.
- La agenda muestra la reserva.
- Cancelar da 204, cancelar de nuevo da 410, y el horario vuelve a quedar libre.

Pendientes que no se automatizan:

- **SEC-09:** el middleware está en la raíz y no en `src/`, así que no hay `x-request-id`. Hoy no se incluye en el smoke porque fallaría (Punto Abierto 4).
- **SEC-06:** confirmar que Vercel sobrescribe `X-Forwarded-For`.

Observación:

- Logs en Vercel.
- Conexiones a Neon y uso de Upstash.
- Sin herramienta externa de alertas, por decisión de TECH-DESIGN.

### Recovery

| Falla | Respuesta | Quién la ejecuta |
|---|---|---|
| Pruebas o build en rojo | No hubo deploy y producción sigue intacta. Se corrige o se revierte, y se vuelve a hacer push. | — |
| El deploy de Vercel falla (smoke en rojo por el commit status) | Producción sigue en el deployment anterior. Se lee el log de Vercel y se corrige la causa. | Humano |
| Deploy roto pero ya activo | **Instant Rollback** desde el dashboard o con `vercel rollback <url>`. Después hay que usar `vercel promote` para que los deploys nuevos vuelvan a tomar el dominio. | Humano, con autorización |
| La migración falla | No se mergea el código que la necesita. Se revisa `_prisma_migrations` y se corrige con una migración nueva, nunca editando una aplicada. | Humano |
| La migración corrompió datos | Se restaura desde la rama `pre-migrate-<sha>` o con el restore por point-in-time de Neon (Punto Abierto 7). | Humano, con autorización explícita |
| Upstash caído | El login del administrador da 503 (falla cerrado) y la cancelación queda sin límite (falla abierto), por diseño (ADR-0010). | Humano |
| Secreto filtrado | Se rota en Vercel y se redespliega. Si es la URL del hook, se borra el hook, se crea otro y se actualiza el secret de GitHub. | Humano, con autorización |
| Fin de la demo | Rollback de recursos como en el ensayo: `vercel project rm`, borrar el proyecto Neon y la base Upstash, `gh secret delete` y `gh variable delete`. | Humano, con autorización |

## Puntos abiertos

Ninguno se asume. Cada uno lleva la pregunta exacta.

1. ~~**Repositorio.**~~ **Resuelto:** GitHub `adminoryslabs/reserva-canchas`, rama `main`. Sigue la pregunta: ¿el repositorio queda público, sabiendo que los logs del pipeline también lo son?
2. **Canchas reales (bloquea la salida pública, no la demo).** ¿Cuántas canchas, con qué nombres y de qué tipo? (Punto Abierto #5 del PRD).
3. **Zona horaria.** ¿Negocio confirma `America/Lima`?
4. **SEC-09: middleware fuera de `src/`.** ¿Se corrige antes del primer deploy, en su propio PR con su clave Jira?
5. **Región.** La demo usa `iad1` + `aws-us-east-1`. ¿Producción real va a São Paulo (`gru1` + `aws-sa-east-1`)?
6. **Staging.** ¿Hace falta en v1?
7. **Plan de Neon.** ¿Cuántos días de restore por point-in-time da el plan contratado?
8. **`.env.test`.** Ya es público. ¿Se mantiene así a propósito?
9. **Dominio.** ¿Alcanza `*.vercel.app`?
10. ~~**Cuentas.**~~ **Resuelto para la demo:** las tres cuentas las maneja la misma persona. Queda la pregunta para producción real: el plan Hobby de Vercel es **no comercial**, ¿se contrata Pro antes de una salida pública?
11. **Aprobación humana.** El pipeline despliega sin revisor, como en el ensayo. ¿Se agrega un GitHub Environment con revisor para producción real?
12. **Protección de `main`.** ¿Se exige PR + el check `test` en verde antes de mergear?
13. ~~**Rama de la demo.**~~ **Resuelto (2026-11-26): `main`.** No hace falta el PATCH de la rama de producción y el hook se crea con `--ref main`. Pregunta original: ¿La clase despliega desde `main` o desde una rama aparte, como `ensayo-s23` en el ensayo? Si es una rama aparte, tiene que existir en GitHub antes de fijarla como rama de producción (`vercel api /v9/projects/<id>/branch -X PATCH`, con `MSYS_NO_PATHCONV=1` en Git Bash), y el hook se crea con `--ref <rama>`.

## Qué se va a generar (GENERATE, una vez aprobado este plan)

- **`vercel.json`:** `"framework": "nextjs"` (refuerza el framework del proyecto) y `"git": { "deploymentEnabled": false }`. La región se fija en la configuración del proyecto en Vercel.
- **`.github/workflows/ci-cd.yml`:** los jobs `test` → `deploy` → `smoke` descritos arriba.
- **`scripts/smoke.sh`:** checks de solo lectura, con la espera del commit status. Recibe `PRODUCTION_URL` y el SHA, y no imprime secretos.
- **`package.json`:** se agrega `"engines": { "node": "22.x" }`. Es el único cambio sobre un archivo existente.
- Nada de esto se ejecuta solo: sin el secret del hook ni la variable `PRODUCTION_URL`, el job `deploy` no tiene a qué llamar.

**Generado el 2026-11-26.** Diferencias con lo de arriba, decididas al generar:

- **Paso `npx prisma generate` antes del typecheck.** Con `npm ci` solo, `tsc` falló en local por los tipos de Prisma (`PrismaClientKnownRequestError` no exportado). El paso explícito evita depender del postinstall de `@prisma/client`.
- **Actions `actions/checkout@v7` y `actions/setup-node@v7`.** Se verificó contra los releases (v7.0.1 y v7.1.0): las dos corren en `node24`.
- **El job `deploy` tiene `concurrency: production`.** Así dos pushes seguidos no disparan el hook en paralelo.
- **Sin `workflow_dispatch`.** El plan dice deploy solo con `push` a `main`. Para relanzar se usa *Re-run jobs* sobre el run del push.
- **El smoke recibe argumentos:** `bash scripts/smoke.sh <PRODUCTION_URL> <SHA>`, con `GH_TOKEN` (`statuses: read`). Espera el status cuyo `context` empieza con `Vercel`, hasta 15 min. Se invoca con `bash`, así que no depende del bit de ejecución en Windows.

## Autorizaciones pendientes (EXECUTE)

Cada una se pide en su momento y por separado:

- [x] Conectar la carpeta local al remoto (2026-11-26)
- [ ] Commit y push de los archivos generados (por PR, con la clave Jira que corresponda)
- [x] Crear el proyecto Neon (Postgres 16, `aws-us-east-1`) y obtener las URLs con la CLI (2026-11-26)
- [x] Crear la rama Neon `pre-migrate-<sha>`, migrar (`prisma migrate deploy`) y correr el seed de demo (2026-11-26)
- [x] Crear la base Upstash (`free`, `us-east-1`) (2026-11-26)
- [x] Crear el proyecto Vercel con `framework=nextjs` y región `iad1`, `vercel link` y `vercel git connect` (2026-11-26)
- [x] Cargar las 7 variables de Production en Vercel, por tubería (2026-11-26)
- [x] Crear el Deploy Hook `ci-gate` y cargar `VERCEL_DEPLOY_HOOK_URL` y `PRODUCTION_URL` en GitHub (2026-11-26)
- [ ] Primer deploy (push a la rama de producción) y verificación
- [ ] Demo del gate en rojo y reversión
- [ ] Cualquier rollback, restore, rotación de secretos o limpieza de recursos

## Registro de ejecución y verificación

| Fecha | Acción | Resultado |
|---|---|---|
| 2026-11-22 | Ensayo completo en la rama `ensayo-s23` (ver `REPORTE-ensayo.md`) | Pipeline verde, gate en rojo verificado y todos los recursos borrados después |
| 2026-11-26 | `gh auth setup-git` (configuración global de git en la máquina local) | git usa las credenciales de la cuenta activa de `gh` (`adminoryslabs`) |
| 2026-11-26 | `git init -b main`, `remote add origin`, `fetch`, `reset origin/main` (sin tocar archivos) | Carpeta conectada a `origin/main` (`100485a`) |
| 2026-11-26 | `npm i -g vercel neon @upstash/cli` | Vercel CLI 67.0.0, Neon CLI 9.10.0 y Upstash CLI 1.8.0. Los MCP se dejaron fuera a propósito |
| 2026-11-26 | Login hecho por el usuario en los tres CLIs | Sesiones verificadas. No se creó ningún recurso |
| 2026-11-26 | `npm audit --omit=dev --audit-level=critical` | 0 críticas (5 high, 1 moderate): el gate pasa |
| 2026-11-26 | Plan aprobado por el usuario, con rama de producción `main` | Punto Abierto 13 resuelto |
| 2026-11-26 | GENERATE: `vercel.json`, `.github/workflows/ci-cd.yml`, `scripts/smoke.sh` y `engines` en `package.json` | Archivos en el working tree, sin commit ni push |
| 2026-11-26 | Verificación local: `npm ci`, `npx prisma generate`, `npm run typecheck`, `bash -n scripts/smoke.sh` y parseo de YAML/JSON | Typecheck en verde, y sintaxis del script, YAML y JSON válidas. El smoke y el workflow **no se ejecutaron** todavía |
| 2026-11-26 | Usuario autoriza crear la infraestructura (sin migración ni seed) | — |
| 2026-11-26 | `neon projects create --name reserva-canchas --region-id aws-us-east-1 --pg-version 16` | Proyecto `holy-cell-73043784`, Postgres 16. URLs armadas en un archivo temporal fuera del repo, entre comillas simples. Pooler: `sslmode=require&pgbouncer=true&connection_limit=1`; directa: `sslmode=require`. Se quitó `channel_binding=require`, que agrega Neon, para no arriesgar compatibilidad con Prisma 6 |
| 2026-11-26 | `upstash redis create --name reserva-canchas --region us-east-1` | Base `d994efe9-6175-4f62-9fa1-c19915cfde4a`, free, activa. `GET /ping` → 200 |
| 2026-11-26 | `vercel project create reserva-canchas` + PATCH `framework=nextjs`, `serverlessFunctionRegion=iad1`, `nodeVersion=22.x` | Proyecto `prj_CvSc93e1AeVM7kTKydOI0W2XRJUE` |
| 2026-11-26 | `vercel link` + `vercel git connect` | Conectado a `adminoryslabs/reserva-canchas` y rama de producción `main`, al primer intento. `.gitignore` sumó `.vercel` y `.env*` (pendiente de revisar en el commit) |
| 2026-11-26 | `vercel env add` ×7 en Production, por tubería | Secrets: `DATABASE_URL`, `DIRECT_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` y `UPSTASH_REDIS_REST_TOKEN`. Config: `UPSTASH_REDIS_REST_URL` y `COMPLEX_TIMEZONE`. No se definió `RATE_LIMIT_DISABLED` |
| 2026-11-26 | `vercel deploy-hooks create ci-gate --git-branch main`, con la URL por tubería a `gh secret set` | Hook `ci-gate@main`; secret `VERCEL_DEPLOY_HOOK_URL` cargado sin imprimirse |
| 2026-11-26 | `gh variable set PRODUCTION_URL` | `https://reserva-canchas-nu.vercel.app`. El dominio `reserva-canchas.vercel.app` ya estaba tomado y Vercel asignó `-nu` |

Recursos creados (para el rollback de fin de demo):

| Recurso | Dónde | Id | Cómo se borra |
|---|---|---|---|
| Proyecto `reserva-canchas` | Neon, org `org-lucky-wildflower-35809703` | `holy-cell-73043784` | `neon projects delete holy-cell-73043784` |
| Base `reserva-canchas` | Upstash | `d994efe9-6175-4f62-9fa1-c19915cfde4a` | `upstash redis delete` |
| Proyecto `reserva-canchas` (7 variables y hook `ci-gate`) | Vercel, `marioyahuars-projects` | `prj_CvSc93e1AeVM7kTKydOI0W2XRJUE` | `vercel project rm reserva-canchas` |
| Secret `VERCEL_DEPLOY_HOOK_URL` y variable `PRODUCTION_URL` | GitHub `adminoryslabs/reserva-canchas` | — | `gh secret delete` / `gh variable delete` |

| Fecha | Acción | Resultado |
|---|---|---|
| 2026-11-26 | Usuario autoriza migración y seed | — |
| 2026-11-26 | `neon branches create --name pre-migrate-100485a` | Rama `br-crimson-sunset-bbo1zjl7`, punto de restauración antes de migrar |
| 2026-11-26 | `npx prisma migrate deploy` contra Neon, con `DATABASE_URL` y `DIRECT_URL` cargadas desde el archivo temporal | Se aplicaron `20261014004656_init` y `20261014004700_indice_unico_parcial_reserva_activa` |
| 2026-11-26 | `npm run db:seed` | 3 canchas de ejemplo: Fulbito 1 (id 1), Fulbito 2 (id 2) y Vóley 1 (id 3) |
| 2026-11-26 | Verificación con consulta | Host `*.c-15.us-east-1.aws.neon.tech` (no localhost), Postgres 16.16, 2 migraciones `finished`, índice parcial `uniq_reserva_activa` presente |
| 2026-11-26 | Limpieza | Archivos temporales con las URLs y el token, borrados. Queda solo `admin-password.txt`, fuera del repo, para que el usuario la guarde |

Todavía no se desplegó nada. Siguiente paso: commit y push a `main` (primer deploy).
