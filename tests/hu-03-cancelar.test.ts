import { beforeEach, describe, expect, it } from "vitest";
import { crearReserva, cancelarReserva } from "@/server/services/reservas";
import { prisma } from "@/lib/db";
import { baseLimpia } from "./helpers";

// La reserva es el 2026-09-20 a las 19:00, hora de Lima (UTC-5) = 2026-09-21T00:00:00Z.
const reserva = { canchaId: 1, fecha: "2026-09-20", horaInicio: "19:00" };
const lima = (hora: string) => new Date(`2026-09-20T${hora}:00-05:00`);

async function estado(codigo: string) {
  const r = await prisma.reserva.findUnique({ where: { codigoReserva: codigo } });
  return r?.estado;
}

describe("HU-03 · Cancelar una reserva propia", () => {
  beforeEach(async () => {
    process.env.COMPLEX_TIMEZONE = "America/Lima"; // el contrato fija la hora de Lima
    await baseLimpia();
  });

  it("Escenario 1: cancela una reserva vigente y libera el horario", async () => {
    const { codigoReserva } = await crearReserva(reserva);
    await cancelarReserva(codigoReserva, lima("12:00"));
    expect(await estado(codigoReserva)).toBe("cancelada");
    // El horario quedó libre: se puede volver a reservar.
    await expect(crearReserva(reserva)).resolves.toHaveProperty("codigoReserva");
  });

  it("Escenario 2: una reserva ya cancelada responde 410 y no cambia nada", async () => {
    const { codigoReserva } = await crearReserva(reserva);
    await cancelarReserva(codigoReserva, lima("12:00"));
    await expect(cancelarReserva(codigoReserva, lima("12:00"))).rejects.toMatchObject({
      status: 410,
      message: "la reserva ya no está activa",
    });
  });

  it("Escenario 3: con menos de 2 horas responde 409 y la reserva sigue activa", async () => {
    const { codigoReserva } = await crearReserva(reserva);
    await expect(cancelarReserva(codigoReserva, lima("17:01"))).rejects.toMatchObject({
      status: 409,
      message: "ya no se puede cancelar: faltan menos de 2 horas para el horario reservado",
    });
    expect(await estado(codigoReserva)).toBe("activa");
  });

  it("Escenario 4: faltando exactamente 2 horas todavía se puede cancelar", async () => {
    const { codigoReserva } = await crearReserva(reserva);
    await cancelarReserva(codigoReserva, lima("17:00"));
    expect(await estado(codigoReserva)).toBe("cancelada");
  });

  it("un código que no existe responde 404", async () => {
    await expect(cancelarReserva("000000", lima("12:00"))).rejects.toMatchObject({ status: 404 });
  });

  it("una reserva cancelada fuera de plazo responde 410, no 409", async () => {
    const { codigoReserva } = await crearReserva(reserva);
    await cancelarReserva(codigoReserva, lima("12:00"));
    await expect(cancelarReserva(codigoReserva, lima("18:00"))).rejects.toMatchObject({ status: 410 });
  });
});
