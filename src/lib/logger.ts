type Level = "info" | "warn" | "error";

export type LogFields = {
  requestId?: string | null;
  route?: string;
  status?: number;
  [key: string]: unknown;
};

// Log estructurado en JSON. NUNCA registrar la contraseña de admin ni el código de reserva completo.
export function log(level: Level, event: string, fields: LogFields = {}): void {
  const line = JSON.stringify({ level, event, ...fields });
  if (level === "error") console.error(line);
  else console.log(line);
}
