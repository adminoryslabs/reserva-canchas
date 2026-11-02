import { prisma } from "@/lib/db";
import { dateToHora, fechaToDate } from "@/lib/dates";

export type EntradaAgenda = { canchaId: number; cancha: string; horaInicio: string };

// Select explícito: la agenda NUNCA expone el codigo_reserva (ADR-0002).
export async function listarAgenda(fecha: string): Promise<EntradaAgenda[]> {
  const reservas = await prisma.reserva.findMany({
    where: { fecha: fechaToDate(fecha), estado: "activa" },
    select: { horaInicio: true, cancha: { select: { id: true, nombre: true } } },
    orderBy: [{ cancha: { id: "asc" } }, { horaInicio: "asc" }],
  });
  return reservas.map((r) => ({
    canchaId: r.cancha.id,
    cancha: r.cancha.nombre,
    horaInicio: dateToHora(r.horaInicio),
  }));
}
