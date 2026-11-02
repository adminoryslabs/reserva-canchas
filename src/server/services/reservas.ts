import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { MAX_INTENTOS_CODIGO } from "@/lib/config";
import { prisma } from "@/lib/db";
import { fechaToDate, horaToDate } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import type { CrearReservaInput } from "@/lib/validation";

export function generarCodigo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function esViolacionUnicidad(e: unknown): e is Prisma.PrismaClientKnownRequestError {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

// La violación es del código (UNIQUE común) si el target menciona su columna/constraint.
function esColisionDeCodigo(e: Prisma.PrismaClientKnownRequestError): boolean {
  return JSON.stringify(e.meta?.target ?? "").includes("codigo_reserva");
}

export async function crearReserva(input: CrearReservaInput) {
  const cancha = await prisma.cancha.findUnique({ where: { id: input.canchaId } });
  if (!cancha) throw new AppError(400, "la cancha indicada no existe");

  for (let intento = 0; intento < MAX_INTENTOS_CODIGO; intento++) {
    try {
      const reserva = await prisma.reserva.create({
        data: {
          codigoReserva: generarCodigo(),
          canchaId: input.canchaId,
          fecha: fechaToDate(input.fecha),
          horaInicio: horaToDate(input.horaInicio),
        },
      });
      return { codigoReserva: reserva.codigoReserva, creadoEn: reserva.creadoEn };
    } catch (e) {
      if (!esViolacionUnicidad(e)) throw e;
      if (!esColisionDeCodigo(e)) {
        throw new AppError(409, "el horario ya no está disponible");
      }
      // Colisión de código: reintento acotado con un código nuevo (ADR-0002).
    }
  }
  throw new Error("no se pudo generar un código de reserva único");
}

export async function cancelarReserva(codigo: string): Promise<void> {
  const reserva = await prisma.reserva.findUnique({ where: { codigoReserva: codigo } });
  if (!reserva) throw new AppError(404, "código inválido o reserva no encontrada");
  if (reserva.estado === "cancelada") throw new AppError(410, "la reserva ya no está activa");

  // Condicionado a estado activa: ante dos cancelaciones concurrentes solo una modifica la fila.
  const { count } = await prisma.reserva.updateMany({
    where: { id: reserva.id, estado: "activa" },
    data: { estado: "cancelada" },
  });
  if (count === 0) throw new AppError(410, "la reserva ya no está activa");
}
