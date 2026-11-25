# VEREDICTO — SEC-02 Actualizar Next.js por avisos de seguridad

**Jira:** RCAN-9 · **Fecha:** 2026-11-24 · **Resultado:** ACEPTADO

Rama `fix/RCAN-9-SEC-02-actualizar-next`, commit `55e69d1` (solo `package.json` y `package-lock.json`). Versión instalada comprobada con `npm ls`: `next@15.5.29` (antes 15.5.27).

**Cambio de criterio (decisión del LEAD):** el encargo original pedía que `postcss` dejara de aparecer en `npm audit --omit=dev`. El LEAD decidió subir solo `next` dentro de 15.x. El criterio de auditoría pasó a ser que desaparezcan los 5 avisos propios de `next`. `postcss` queda pendiente en SEC-07 y no es motivo de rechazo.

| Comprobación | Comando / forma | Ejecutada | Resultado |
|---|---|---|---|
| Los 5 avisos de `next` ya no aparecen (GHSA-2464-fhr4-w9xw, GHSA-p3m5-59mp-jv5r, GHSA-7qx7-33qx-rqx2, GHSA-f3mh-rxg3-f5g2, GHSA-pc58-hwjq-p385) | `npm audit --omit=dev` y `npm audit --json` | sí | verde: ninguno aparece |
| Lo que queda en la auditoría | `npm audit` completo | sí | 6 avisos (1 moderado, 5 altos): `postcss`, `next` (moderado, solo porque depende de `postcss`), `deepmerge-ts`, `effect`, `@prisma/config` y `prisma`. Todos pertenecen a SEC-07 |
| Tipos | `npm run typecheck` | sí | verde (sin errores) |
| Base local | `npm run db:up` | sí | verde (contenedor `test-project-db-1` en marcha) |
| Pruebas automáticas | `npm run test` | sí | verde: 4 archivos, 17 pruebas |
| Login de administrador y cookie | a mano, ver abajo | sí | verde |
| Reservar un horario libre de un día futuro | a mano, ver abajo | sí | verde |
| Cancelar con el código libera el horario | a mano, ver abajo | sí | verde |

## Comprobado a mano

Con `npx next dev -p 3100` (Next.js 15.5.29):

- **Contraseña de administrador:** no se usó la de `.env`, porque los permisos de la sesión no permiten leer ese archivo. Se usaron `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` de prueba, pasadas como variables del proceso solo para esta corrida (las variables del proceso tienen prioridad sobre `.env`).
- **Sin Upstash:** `.env` no tiene las variables de Upstash, así que `POST /api/admin/login` respondió **503** `{"error":"servicio no disponible, intentar nuevamente"}`. Es la falla cerrada que pide ADR-0010. Se reinició el servidor con `RATE_LIMIT_DISABLED=true`, solo en desarrollo.
- **`/admin`:** con una contraseña incorrecta respondió 401 `contraseña incorrecta` y no emitió cookie. Con la contraseña correcta respondió 204 y la cookie `admin_session=...; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`. Sin la cookie, `/admin` muestra el formulario; con la cookie, muestra la agenda ("No hay reservas para este día").
- **`/`** (navegador real), día 2026-11-27, Fulbito 1 a las 19:00: aparece el cuadro de confirmación y al aceptar se muestra "Reserva confirmada. Tu código es 897269: guárdalo, lo necesitas para cancelar." Después de eso, `GET /api/disponibilidad` marca ese horario como ocupado (`"libre":false`). La agenda de ese día muestra "Fulbito 1 · 19:00 — reservado" y no muestra el código (ADR-0002).
- **`/cancelar`** (navegador real) con el código 897269: muestra "Reserva cancelada. El horario quedó libre." `GET /api/disponibilidad` vuelve a marcar las 19:00 como libre (`"libre":true`).

## NO VERIFICADO

- **Login con la contraseña real de `.env`:** se probó con una contraseña de prueba (ver arriba).
- **Límite de 5 intentos por minuto (ADR-0010):** no se probó, porque no hay Upstash configurado. Solo se comprobó la falla cerrada (503) cuando falta.
- **Atributo `Secure` de la cookie:** solo se agrega en producción.
- **`npm run build`:** lo informó en verde el DEV. El TESTER no lo volvió a correr.
- **`postcss` 8.4.31 (avisos altos GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849):** sigue apareciendo porque `next` 15.x fija esa versión, y solo se resuelve con `next` 16. Queda pendiente en SEC-07 por decisión del LEAD.
- **Avisos de `prisma` (`deepmerge-ts`, `effect`, `@prisma/config`):** quedan en SEC-07, fuera de alcance. Llama la atención que aparecen incluso con `--omit=dev`.

## Hallazgo nuevo (no lo causa este cambio)

**El middleware no se ejecuta.** `.next/server/middleware-manifest.json` quedó vacío (`"middleware": {}`), y los logs muestran `"requestId": null` en todas las rutas de `/api/*` (por ejemplo, `admin_login_failed` y `request_rejected`). La causa probable es la ubicación: `middleware.ts` está en la raíz del proyecto, pero la aplicación usa `src/app`, y en ese caso Next.js busca el middleware en `src/middleware.ts`.

Consecuencias:

- La primera barrera de ADR-0009 (devolver 503 en `/admin` y `/api/admin` si falta configuración) no actúa. Hoy lo cubren igual la ruta de login (`src/app/api/admin/login/route.ts:11`) y la verificación de sesión de la página.
- El `requestId` no llega a los logs.
- La sección "Fortalezas" de `SECURITY-REPORT.md` y el análisis de SEC-02 sobre el runtime Edge suponen que el middleware corre.

El commit `55e69d1` no toca `middleware.ts`, así que no es motivo de rechazo de RCAN-9. No se comprobó con `next` 15.5.27, porque eso exigía reinstalar dependencias en la carpeta compartida. Se deriva al LEAD para que decida cómo tratarlo.
