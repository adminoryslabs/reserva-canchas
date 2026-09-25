# ADR 0009: Protección de la vista de administrador con contraseña única

## Estado

Aceptado

## Contexto

El PRD no define ningún mecanismo de acceso para la vista de agenda del administrador (HU-04).
Ninguna HU pide login de administrador, pero dejar esa ruta completamente pública expondría todas
las reservas del día (incluyendo el código de reserva de cada jugador) a cualquiera que conociera la
URL. Este vacío no fue un límite de alcance deliberado del PRD, sino una omisión que debía
resolverse antes de construir.

## Decisión

La vista de administrador (`/admin` o equivalente) se protege con una contraseña única compartida,
configurada como variable de entorno, sin sistema de usuarios ni roles. El administrador debe
ingresar esa contraseña para acceder a la agenda diaria.

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
