import { complexTimezone } from "./config";

// `fecha` y `hora_inicio` son hora local del complejo, sin conversión (TDD, "Zona horaria").
// Se representan como Date en UTC solo porque Prisma lo exige para DATE/TIME.
export function fechaToDate(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

export function horaToDate(hora: string): Date {
  return new Date(`1970-01-01T${hora}:00.000Z`);
}

export function dateToHora(d: Date): string {
  return d.toISOString().slice(11, 16);
}

export function dateToFecha(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Diferencia (ms) entre la hora local de la zona y UTC en un instante dado.
function offsetMs(instante: Date, timeZone: string): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(instante)
      .map((x) => [x.type, x.value]),
  );
  const local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return local - instante.getTime();
}

// Instante real en que empieza una reserva (fecha y hora locales del complejo, ADR-0011).
export function inicioReserva(fecha: Date, horaInicio: Date): Date {
  const local = Date.UTC(
    fecha.getUTCFullYear(),
    fecha.getUTCMonth(),
    fecha.getUTCDate(),
    horaInicio.getUTCHours(),
    horaInicio.getUTCMinutes(),
  );
  return new Date(local - offsetMs(new Date(local), complexTimezone()));
}

// Único lugar que necesita saber qué día es "hoy" (COMPLEX_TIMEZONE).
export function hoy(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: complexTimezone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
