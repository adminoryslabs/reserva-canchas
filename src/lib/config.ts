// SUPUESTO (no confirmado por el PRD): rango operativo 08:00-22:00, slots de 1 hora.
// El último slot comienza a las 21:00 y termina a las 22:00 (ADR-0004).
export const HORA_APERTURA = 8;
export const HORA_CIERRE = 22;

export const HORAS_INICIO: string[] = Array.from(
  { length: HORA_CIERRE - HORA_APERTURA },
  (_, i) => `${String(HORA_APERTURA + i).padStart(2, "0")}:00`,
);

export const MAX_INTENTOS_CODIGO = 5;
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
export const ADMIN_COOKIE_NAME = "admin_session";

export function complexTimezone(): string {
  return process.env.COMPLEX_TIMEZONE || "UTC";
}
