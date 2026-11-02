import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { AppError } from "@/lib/errors";
import { handle, readJson } from "@/lib/http";
import { crearReservaSchema } from "@/lib/validation";
import { crearReserva } from "@/server/services/reservas";

function revalidarVistas() {
  revalidatePath("/");
  revalidatePath("/admin");
}

export const POST = handle("POST /api/reservas", async (req) => {
  const input = crearReservaSchema.parse(await readJson(req));
  try {
    const reserva = await crearReserva(input);
    revalidarVistas();
    return NextResponse.json(reserva, { status: 201 });
  } catch (e) {
    // Tras un 409 también se revalida para que el slot aparezca ocupado (ADR-0007/0008).
    if (e instanceof AppError && e.status === 409) revalidarVistas();
    throw e;
  }
});
