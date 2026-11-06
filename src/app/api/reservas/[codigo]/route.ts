import { revalidatePath } from "next/cache";
import { handle } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { codigoReservaSchema } from "@/lib/validation";
import { cancelarReserva } from "@/server/services/reservas";

export const DELETE = handle("DELETE /api/reservas/[codigo]", async (req, requestId) => {
  await enforceRateLimit(req, "cancelar", "fail-open", requestId);
  const codigo = codigoReservaSchema.parse(new URL(req.url).pathname.split("/").pop());
  await cancelarReserva(codigo);
  revalidatePath("/");
  revalidatePath("/admin");
  return new Response(null, { status: 204 });
});
