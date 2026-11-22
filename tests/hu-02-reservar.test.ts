import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { crearReserva } from "@/server/services/reservas";
import { baseLimpia } from "./helpers";

const reserva = { canchaId: 1, fecha: "2026-09-20", horaInicio: "19:00" };

describe("HU-02 · Reservar un horario de cancha", () => {
  beforeEach(baseLimpia);

  it("Escenario 1: registra la reserva y devuelve un código de 6 dígitos", async () => {
    const { codigoReserva } = await crearReserva(reserva);
    expect(codigoReserva).toMatch(/^\d{6}$/);
    expect(await prisma.reserva.count({ where: { estado: "activa" } })).toBe(1);
  });

  it("Escenario 2: rechaza un horario ya tomado con 409 y no duplica", async () => {
    await crearReserva(reserva);
    await expect(crearReserva(reserva)).rejects.toMatchObject({
      status: 409,
      message: "el horario ya no está disponible",
    });
    expect(await prisma.reserva.count()).toBe(1);
  });

  it("RCAN-8: dos reservas simultáneas del mismo horario → una entra y la otra recibe 409", async () => {
    const resultados = await Promise.allSettled([crearReserva(reserva), crearReserva(reserva)]);
    const ok = resultados.filter((r) => r.status === "fulfilled");
    const rechazadas = resultados.filter((r) => r.status === "rejected");
    expect(ok).toHaveLength(1);
    expect(rechazadas).toHaveLength(1);
    expect((rechazadas[0] as PromiseRejectedResult).reason).toMatchObject({ status: 409 });
    expect(await prisma.reserva.count()).toBe(1);
  });

  it("una cancha que no existe responde 400", async () => {
    await expect(crearReserva({ ...reserva, canchaId: 99 })).rejects.toMatchObject({ status: 400 });
  });
});
