import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { listarCanchas } from "@/server/services/disponibilidad";

export const GET = handle("GET /api/canchas", async () => {
  const canchas = await listarCanchas();
  return NextResponse.json({ canchas });
});
