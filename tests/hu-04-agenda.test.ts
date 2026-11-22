import { beforeEach, describe, expect, it } from "vitest";
import { listarAgenda } from "@/server/services/agenda";
import { crearReserva } from "@/server/services/reservas";
import { verifySessionValue } from "@/lib/admin-session";
import { POST as login } from "@/app/api/admin/login/route";
import { baseLimpia } from "./helpers";

const fecha = "2026-09-20";

function pedirLogin(password: string) {
  return login(
    new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }),
  );
}

describe("HU-04 · Agenda diaria del administrador", () => {
  beforeEach(async () => {
    process.env.ADMIN_PASSWORD = "clave-de-prueba";
    process.env.ADMIN_SESSION_SECRET = "secreto-de-prueba";
    process.env.RATE_LIMIT_DISABLED = "1";
    await baseLimpia();
  });

  it("Escenario 1: lista las reservas del día agrupadas por cancha y horario, sin el código", async () => {
    await crearReserva({ canchaId: 2, fecha, horaInicio: "10:00" });
    await crearReserva({ canchaId: 1, fecha, horaInicio: "19:00" });
    await crearReserva({ canchaId: 1, fecha, horaInicio: "09:00" });

    const agenda = await listarAgenda(fecha);
    expect(agenda).toEqual([
      { canchaId: 1, cancha: "Fulbito 1", horaInicio: "09:00" },
      { canchaId: 1, cancha: "Fulbito 1", horaInicio: "19:00" },
      { canchaId: 2, cancha: "Fulbito 2", horaInicio: "10:00" },
    ]);
  });

  it("Escenario 2: un día sin reservas devuelve la agenda vacía", async () => {
    expect(await listarAgenda("2026-09-21")).toEqual([]);
  });

  it("login con la contraseña correcta emite una cookie de sesión válida", async () => {
    const res = await pedirLogin("clave-de-prueba");
    expect(res.status).toBe(204);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/admin_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    const valor = decodeURIComponent(cookie.split(";")[0].split("=")[1]);
    expect(verifySessionValue(valor)).toBe(true);
  });

  it("login con una contraseña incorrecta responde 401 y no emite cookie", async () => {
    const res = await pedirLogin("otra");
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("sin configuración de administrador el login responde 503", async () => {
    delete process.env.ADMIN_PASSWORD;
    const res = await pedirLogin("clave-de-prueba");
    expect(res.status).toBe(503);
  });
});
