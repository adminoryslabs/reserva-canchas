# ADR 0004: Horarios como slots fijos de 1 hora

## Estado

Aceptado

## Contexto

Los ejemplos de HU-01 y HU-02 usan horas redondas ("19:00") y hablan de "horarios libres/ocupados"
por cancha y día, sin ningún escenario que pida duración variable de partido. El criterio de éxito
clave del PRD es que "el sistema nunca permite dos reservas para la misma cancha en el mismo
horario", lo que exige un mecanismo de exclusión mutua simple y confiable.

## Decisión

Los horarios se modelan como slots fijos de 1 hora, predefinidos junto con el seed de canchas (ADR
0003) para un rango horario del complejo (ej. 08:00 a 22:00). Una `Reserva` referencia un slot
puntual mediante `cancha_id` + `fecha` + `hora_inicio` (de la lista cerrada de horas en punto). La
unicidad de `(cancha_id, fecha, hora_inicio)` para reservas activas se garantiza con un **índice
único parcial** a nivel de base de datos en Neon, no con lógica de aplicación:

```sql
CREATE UNIQUE INDEX uniq_reserva_activa
  ON "Reserva" (cancha_id, fecha, hora_inicio)
  WHERE estado = 'activa';
```

Un `UNIQUE` común sobre esas tres columnas **no sirve**: aplicaría también a filas `cancelada` y
dejaría el slot bloqueado para siempre tras la primera cancelación. Prisma no soporta `WHERE` en
`@@unique`, por lo que este índice se crea con SQL crudo dentro de una migración de Prisma
(migración "custom", `prisma migrate dev --create-only` y edición del `.sql`). El `schema.prisma`
**no** debe declarar `@@unique([canchaId, fecha, horaInicio])`.

La unicidad se declara sobre `hora_inicio` como `TIME` y `fecha` como `DATE`, sin zona horaria (ver
"Zona horaria" en el TDD).

## Alternativas consideradas

- **Reservas por rango libre de horas** (`hora_inicio`/`hora_fin` arbitrarios) — descartada: ningún
  escenario de las HU pide duración variable, y hubiera exigido lógica de detección de solapamiento
  de rangos, más compleja de implementar y de probar correctamente bajo concurrencia para un MVP.

## Consecuencias

- El conflicto de doble reserva se previene con un constraint de unicidad en la base de datos, lo
  que lo hace correcto incluso ante dos solicitudes concurrentes (la base rechaza la segunda
  inserción, no depende de un chequeo previo en la aplicación que podría tener condiciones de
  carrera).
- Costo asumido: el índice parcial vive en SQL crudo dentro de una migración, fuera del modelo
  declarativo de Prisma. Debe haber un test de integración que cancele una reserva y vuelva a
  reservar el mismo slot, para detectar si alguien lo reemplaza por un `@@unique` común.
- Simplifica la UI de disponibilidad: se listan slots fijos por cancha/día, marcados libre/ocupado.
- Trade-off: no soporta partidos de duración distinta a 1 hora (ej. 30 minutos o 1.5 horas); si el
  negocio lo pidiera a futuro, requeriría remodelar horarios como rango libre y agregar lógica de
  solapamiento.
