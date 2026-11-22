import { ADMIN_COOKIE_NAME, ADMIN_SESSION_TTL_SECONDS } from "@/lib/config";
import { adminConfigured, createSessionValue, passwordMatches } from "@/lib/admin-session";
import { AppError } from "@/lib/errors";
import { handle, readJson } from "@/lib/http";
import { log } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

// ADR-0009: contraseña única, cookie firmada HttpOnly/Secure/SameSite=Lax de 8 h. ADR-0010: falla cerrado.
export const POST = handle("POST /api/admin/login", async (req, requestId) => {
  if (!adminConfigured()) throw new AppError(503, "el acceso de administración no está configurado");
  await enforceRateLimit(req, "admin-login", "fail-closed", requestId);
  const { password } = loginSchema.parse(await readJson(req));

  if (!passwordMatches(password)) {
    log("warn", "admin_login_failed", { requestId, route: "POST /api/admin/login", status: 401 });
    throw new AppError(401, "contraseña incorrecta");
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": `${ADMIN_COOKIE_NAME}=${encodeURIComponent(createSessionValue())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ADMIN_SESSION_TTL_SECONDS}${secure}`,
    },
  });
});
