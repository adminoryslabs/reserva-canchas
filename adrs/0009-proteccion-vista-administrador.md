# ADR 0009: Protección de la vista de administrador con contraseña única

## Estado

Aceptado

## Contexto

El PRD no define ningún mecanismo de acceso para la vista de agenda del administrador (HU-04).
Ninguna HU pide login de administrador, pero dejar esa ruta completamente pública expondría todas
las reservas del día a cualquiera que conociera la URL. Este vacío no fue un límite de alcance deliberado del PRD, sino una omisión que debía
resolverse antes de construir.

## Decisión

La vista de administrador (`/admin` o equivalente) se protege con una contraseña única compartida,
configurada como variable de entorno, sin sistema de usuarios ni roles. El administrador debe
ingresar esa contraseña para acceder a la agenda diaria.

Detalles de la decisión:

- **Variables de entorno requeridas:** `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET`. Si falta
  cualquiera, el acceso admin se deniega (deny-by-default): la ruta responde 503 con un mensaje
  claro y **nunca** queda abierta.
- **Validación:** `POST /api/admin/login` compara la contraseña con comparación de tiempo
  constante. Si es correcta, emite una cookie de sesión firmada (HMAC con `ADMIN_SESSION_SECRET`)
  con `HttpOnly`, `Secure`, `SameSite=Lax` y expiración de 8 horas. No se usa query string ni
  `localStorage`.
- **Verificación:** la página `/admin` (Server Component) y cualquier endpoint admin verifican la
  cookie en el servidor en cada request; sin cookie válida redirigen al formulario de contraseña
  (páginas) o responden 401 (API).
- **Rate limiting** sobre el login: ver ADR-0010.
- **Mutaciones admin:** hoy no existen (HU-04 es solo lectura). Si se agregan, requieren su
  propio ADR que cubra CSRF (la cookie `SameSite=Lax` no es suficiente por sí sola para
  mutaciones).
- **Datos expuestos:** la agenda lista cancha, horario y estado; **no muestra** el
  `codigo_reserva` (ADR-0002).

## Alternativas consideradas

- **Sin protección alguna (ruta pública)** — es lo que el PRD, leído literalmente, no impide, pero
  expone datos de reservas de todos los jugadores a cualquier visitante; se descarta por ser un
  riesgo de seguridad real, no por preferencia de diseño.

## Consecuencias

- Evita exponer públicamente el detalle de todas las reservas del día con un esfuerzo mínimo de
  implementación (una comparación de contraseña, sin tablas de usuarios).
- Trade-off: no hay múltiples administradores ni auditoría de quién accedió; si el negocio necesita
  eso a futuro, esta decisión debe revisarse y reemplazarse por un sistema de usuarios real.
- Este vacío no estaba contemplado en el PRD original; se recomienda reflejarlo en el PRD para que
  quede trazado como decisión de negocio, no solo como decisión técnica del Arquitecto.
