import { beforeEach, describe, expect, it } from "vitest";
import { HORAS_INICIO } from "@/lib/config";
import { disponibilidadDelDia } from "@/server/services/disponibilidad";
import { crearReserva } from "@/server/services/reservas";
import { baseLimpia } from "./helpers";

const fecha = "2026-09-20";

describe("HU-01 · Ver disponibilidad de canchas por día y horario", () => {
  beforeEach(baseLimpia);

  it("Escenario 1: muestra, por cancha, los horarios libres y los ocupados", async () => {
    await crearReserva({ canchaId: 1, fecha, horaInicio: "19:00" });
    const dia = await disponibilidadDelDia(fecha);

    expect(dia.canchas.map((c) => c.nombre)).toEqual(["Fulbito 1", "Fulbito 2", "Vóley 1"]);
    const fulbito1 = dia.canchas[0].slots;
    expect(fulbito1.find((s) => s.horaInicio === "19:00")?.libre).toBe(false);
    expect(fulbito1.find((s) => s.horaInicio === "18:00")?.libre).toBe(true);
    expect(dia.hayLibres).toBe(true);
  });

  it("Escenario 2: un día sin horarios libres lo indica", async () => {
    for (const canchaId of [1, 2, 3]) {
      for (const horaInicio of HORAS_INICIO) {
        await crearReserva({ canchaId, fecha, horaInicio });
      }
    }
    const dia = await disponibilidadDelDia(fecha);
    expect(dia.hayLibres).toBe(false);
  });
});
