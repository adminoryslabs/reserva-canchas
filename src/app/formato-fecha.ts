// Fechas YYYY-MM-DD en hora local del complejo; se formatean en UTC para no desplazar el día.
function aDate(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

export function sumarDias(fecha: string, dias: number): string {
  const d = aDate(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// «Miércoles, 7 de agosto»
export function tituloFecha(fecha: string): string {
  const texto = new Intl.DateTimeFormat("es-PE", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(aDate(fecha));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Partes para la franja de días: «mié», «7», «ago».
export function partesDia(fecha: string): { semana: string; numero: string; mes: string } {
  const f = (opciones: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-PE", { timeZone: "UTC", ...opciones })
      .format(aDate(fecha))
      .replace(/\.$/, "");
  return {
    semana: f({ weekday: "short" }),
    numero: f({ day: "numeric" }),
    mes: f({ month: "short" }),
  };
}
