-- ADR-0004: unicidad de slot SOLO para reservas activas (índice único parcial).
-- Prisma no soporta WHERE en @@unique; no borrar ni recrear el historial sin reaplicar esto.
CREATE UNIQUE INDEX uniq_reserva_activa
  ON "Reserva" (cancha_id, fecha, hora_inicio)
  WHERE estado = 'activa';
