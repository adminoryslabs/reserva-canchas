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

// Único lugar que necesita saber qué día es "hoy" (COMPLEX_TIMEZONE).
export function hoy(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: complexTimezone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
