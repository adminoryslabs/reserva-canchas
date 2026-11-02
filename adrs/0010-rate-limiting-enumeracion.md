# ADR 0010: Rate limiting y mitigación de enumeración en endpoints sensibles

## Estado

Aceptado

## Contexto

El código de reserva (ADR 0002) tiene 6 dígitos (10⁶ combinaciones) y es el único secreto que
protege la cancelación; el acceso admin (ADR 0009) depende de una contraseña única. Sin ningún
límite de intentos, ambos endpoints pueden ser atacados por fuerza bruta con un simple script. La
revisión adversarial señaló que dejarlo como "revisar antes de un uso real" no es una decisión: es
posponerla. Este ADR la toma.

## Decisión

Se aplica rate limiting por IP a los endpoints sensibles, con **Upstash Ratelimit** (Redis
serverless, tier gratuito) y algoritmo de ventana deslizante:

| Endpoint | Límite |
|---|---|
| `DELETE /api/reservas/[codigo]` (cancelar) | 5 intentos por minuto por IP |
| `POST /api/admin/login` | 5 intentos por minuto por IP |

- Al excederse, la API responde **429** con cabecera `Retry-After` (ADR 0008).
- Si el servicio de rate limiting no responde: el login admin **falla cerrado** (deniega); la
  cancelación **falla abierta** (permite el intento, registrando el fallo en el log), para que una
  caída de Upstash no deje a los jugadores sin poder cancelar.
- Variables de entorno: `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.
- Los intentos fallidos y los 429 se registran en el log estructurado (ver TDD, "Logging").
- Los valores (5/min) son una configuración inicial razonable, no un requisito de negocio; se
  ajustan por variable de entorno sin cambiar la arquitectura.

## Alternativas consideradas

- **Vercel Firewall / reglas de rate limit de la plataforma** — no agrega dependencia ni código,
  pero la disponibilidad y los límites de reglas personalizadas en el plan gratuito deben
  verificarse contra la documentación vigente de Vercel, y la regla queda fuera del repositorio
  (no versionada ni testeable). Queda como alternativa si se confirma que cubre el caso.
- **Contador de intentos en Postgres (Neon)** — evita un servicio extra, pero convierte cada
  intento (incluidos los de un atacante) en escrituras a la base de datos y suma carga al límite
  de conexiones del plan gratuito.
- **Aceptar el riesgo sin mitigación** — descartada: la superficie existe desde el primer día y la
  mitigación cuesta pocas líneas.

## Consecuencias

- La enumeración de códigos pasa de "cuestión de horas" a inviable en la práctica desde una sola IP.
- Complementa la decisión de ADR 0002 de no mostrar el código en la agenda admin: ambas reducen la
  superficie de adivinación.
- Trade-off: un servicio externo más (Upstash) y dos variables de entorno adicionales. Un atacante
  con muchas IPs distribuidas no queda cubierto por este límite; es aceptable para el alcance de
  demo y debe reevaluarse antes de un uso real.
- Usuarios detrás de una misma IP compartida (NAT de un complejo) comparten el límite; 5/min es
  holgado para uso legítimo.
