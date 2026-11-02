import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ADR-0009: deny-by-default. Sin ADMIN_PASSWORD o ADMIN_SESSION_SECRET, lo admin nunca queda abierto.
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdmin && !(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET)) {
    const message = "el acceso de administración no está configurado";
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return new NextResponse(message, { status: 503 });
  }

  // requestId propagado a handlers y logs (TDD, "Logging").
  const headers = new Headers(req.headers);
  headers.set("x-request-id", crypto.randomUUID());
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/api/:path*", "/admin/:path*", "/admin"] };
