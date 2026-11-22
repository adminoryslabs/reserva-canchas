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

// Vista del jugador (HU-01): todas las canchas de un día y si queda algún horario libre.
export async function disponibilidadDelDia(fecha: string) {
  const canchas = await listarCanchas();
  const conSlots = await Promise.all(
    canchas.map(async (c) => ({ ...c, slots: await obtenerDisponibilidad(c.id, fecha) })),
  );
  return { canchas: conSlots, hayLibres: conSlots.some((c) => c.slots.some((s) => s.libre)) };
}
