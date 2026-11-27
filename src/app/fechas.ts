const MS_DIA = 24 * 60 * 60 * 1000;

function aDate(fecha: string): Date {
  return new Date(`${fecha}T12:00:00.000Z`);
}

export function sumarDias(fecha: string, dias: number): string {
  return new Date(aDate(fecha).getTime() + dias * MS_DIA).toISOString().slice(0, 10);
}

export function diasDesde(fecha: string, cantidad: number): string[] {
  return Array.from({ length: cantidad }, (_, i) => sumarDias(fecha, i));
}

export function etiquetaLarga(fecha: string): string {
  const texto = new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(aDate(fecha));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function partesDia(fecha: string): { semana: string; dia: string; mes: string } {
  const d = aDate(fecha);
  const f = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es", { ...opts, timeZone: "UTC" }).format(d).replace(".", "");
  return { semana: f({ weekday: "short" }), dia: f({ day: "numeric" }), mes: f({ month: "short" }) };
}
