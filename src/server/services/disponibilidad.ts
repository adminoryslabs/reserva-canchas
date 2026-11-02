import { HORAS_INICIO } from "@/lib/config";
import { prisma } from "@/lib/db";
import { dateToHora, fechaToDate } from "@/lib/dates";

export type Slot = { horaInicio: string; libre: boolean };

export function listarCanchas() {
  return prisma.cancha.findMany({ orderBy: { id: "asc" } });
}

export async function obtenerDisponibilidad(
  canchaId: number,
  fecha: string,
): Promise<Slot[]> {
  const ocupadas = await prisma.reserva.findMany({
    where: { canchaId, fecha: fechaToDate(fecha), estado: "activa" },
    select: { horaInicio: true },
  });
  const ocupadasSet = new Set(ocupadas.map((r) => dateToHora(r.horaInicio)));
  return HORAS_INICIO.map((horaInicio) => ({
    horaInicio,
    libre: !ocupadasSet.has(horaInicio),
  }));
}
