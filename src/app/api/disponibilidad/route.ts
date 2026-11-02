import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { disponibilidadQuerySchema } from "@/lib/validation";
import { obtenerDisponibilidad } from "@/server/services/disponibilidad";

export const GET = handle("GET /api/disponibilidad", async (req) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const { canchaId, fecha } = disponibilidadQuerySchema.parse(params);
  const slots = await obtenerDisponibilidad(canchaId, fecha);
  return NextResponse.json({ canchaId, fecha, slots });
});
