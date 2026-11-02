import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";
import { log } from "./logger";

type Handler = (req: Request, requestId: string | null) => Promise<Response>;

// Contrato de errores (ADR-0008): siempre { "error": "<mensaje>" }; nunca errores crudos ni stack traces.
export function errorResponse(status: number, message: string, headers: Record<string, string> = {}) {
  return NextResponse.json({ error: message }, { status, headers });
}

export function handle(route: string, handler: Handler) {
  return async (req: Request): Promise<Response> => {
    const requestId = req.headers.get("x-request-id");
    try {
      return await handler(req, requestId);
    } catch (e) {
      if (e instanceof ZodError) {
        return errorResponse(400, e.issues[0]?.message ?? "entrada inválida");
      }
      if (e instanceof AppError) {
        if (e.status === 409 || e.status === 404 || e.status === 410) {
          log("warn", "request_rejected", { requestId, route, status: e.status });
        }
        return errorResponse(e.status, e.message, e.headers);
      }
      log("error", "unhandled_error", {
        requestId,
        route,
        status: 500,
        name: e instanceof Error ? e.name : "unknown",
      });
      return errorResponse(500, "no se pudo procesar la solicitud, intentar nuevamente");
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new AppError(400, "el cuerpo debe ser JSON válido");
  }
}
