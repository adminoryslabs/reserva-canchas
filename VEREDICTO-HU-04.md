# VEREDICTO — HU-04 Agenda diaria del administrador

**Jira:** RCAN-5 · **Fecha:** 2026-11-22 · **Resultado:** ACEPTADA

| Escenario (Gherkin) | Prueba | Ejecutada | Resultado |
|---|---|---|---|
| 1 · Lista las reservas del día agrupadas por cancha y horario | `tests/hu-04-agenda.test.ts` · "Escenario 1" | sí | verde |
| 2 · Día sin reservas → agenda vacía | "Escenario 2" | sí | verde |

Acceso (ADR-0009), también probado: login correcto emite cookie `HttpOnly` y `SameSite=Lax` válida (204); contraseña incorrecta responde 401 sin cookie; sin configuración responde 503. Estas pruebas salieron rojas antes de crear `POST /api/admin/login` y verdes después.

## Comprobado a mano

Con `npm run dev` y una contraseña de prueba: `/admin` sin sesión muestra el formulario; con la contraseña correcta muestra "Fulbito 1 · 19:00 — reservado"; un día sin reservas muestra "No hay reservas para este día". La agenda no muestra el código de reserva (ADR-0002).

## NO VERIFICADO

- Límite de 5 intentos de login por minuto y su falla cerrada (ADR-0010): depende de Upstash; las pruebas lo desactivan.
- Atributo `Secure` de la cookie: solo se agrega en producción.
- El middleware solo bloquea `/admin` cuando falta configuración; la sesión la verifica la página en el servidor, como pide ADR-0009.
