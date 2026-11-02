import { createHmac, timingSafeEqual } from "node:crypto";
import { ADMIN_SESSION_TTL_SECONDS } from "./config";

// ADR-0009: ambas variables son requeridas; si falta alguna el acceso admin se deniega.
export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

function sign(payload: string): string {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "")
    .update(payload)
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// Comparación de tiempo constante: se comparan digests del mismo largo.
export function passwordMatches(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  const h = (s: string) => createHmac("sha256", "pw").update(s).digest();
  return expected.length > 0 && timingSafeEqual(h(candidate), h(expected));
}

export function createSessionValue(now: number = Date.now()): string {
  const expiresAt = now + ADMIN_SESSION_TTL_SECONDS * 1000;
  return `${expiresAt}.${sign(String(expiresAt))}`;
}

export function verifySessionValue(value: string | undefined, now: number = Date.now()): boolean {
  if (!value || !adminConfigured()) return false;
  const [expiresAt, signature] = value.split(".");
  if (!expiresAt || !signature) return false;
  if (!safeEqual(signature, sign(expiresAt))) return false;
  return Number(expiresAt) > now;
}
