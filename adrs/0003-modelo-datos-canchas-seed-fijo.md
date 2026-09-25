# ADR 0003: Canchas como dato semilla fijo, sin gestión desde la app

## Estado

Aceptado

## Contexto

El PRD deja dos puntos abiertos que afectan directamente el modelo de datos: Punto Abierto #5
("alcance de cancha": ¿una sede o varias?, ¿cuántas canchas hay?) y Punto Abierto #1 (¿el admin
gestiona canchas desde la app o es configuración fija?). Ninguna de las 4 HU actuales (HU-01 a
HU-04) pide una pantalla de alta/edición/baja de canchas — todas asumen que las canchas ya existen
como dato de entrada.

## Decisión

Las canchas se modelan como dato semilla fijo (seed), precargado directamente en la base de datos
(Neon) vía script de seed, sin tabla de `Sede` (una sola sede implícita) y sin CRUD de canchas
desde la app. Si hace falta agregar/quitar una cancha, se edita el seed y se vuelve a correr.

## Alternativas consideradas

- **`Cancha` como entidad completa con CRUD para el administrador** — cubriría la lectura "el
  admin gestiona canchas" del Punto Abierto #1, pero ninguna HU actual pide esa pantalla; construir
  el CRUD ahora sería agregar alcance que el BA no definió en las HU, no una interpretación
  razonable del PRD.
- **Modelar `Sede` desde ya junto con `Cancha` fija** — mismo esfuerzo de seed que la decisión
  tomada, más una tabla sin ningún caso de uso actual (el PRD no menciona más de un complejo).

## Consecuencias

- El modelo de datos queda mínimo: sin tabla `Sede`, sin endpoints de gestión de canchas, lo que
  reduce el esfuerzo de construcción del MVP al alcance exacto de las 4 HU existentes.
- Trade-off: si en el futuro el negocio confirma que el admin sí necesita gestionar canchas desde
  la app (Punto Abierto #1) o que hay múltiples sedes (Punto Abierto #5), esta decisión se revierte
  y hace falta una HU nueva de gestión de canchas más el trabajo de modelo/API correspondiente —
  no es una decisión que escale sola.
