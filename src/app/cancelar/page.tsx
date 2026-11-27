"use client";

import { useState } from "react";
import Link from "next/link";

type Mensaje = { tipo: "exito" | "error"; texto: string } | null;

// HU-03: cancelar con el código de 6 dígitos; los errores de la API se muestran tal cual.
export default function CancelarPage() {
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje>(null);

  async function cancelar(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(codigo)) {
      setMensaje({ tipo: "error", texto: "El código debe tener 6 dígitos." });
      return;
    }
    setMensaje(null);
    setEnviando(true);
    try {
      const res = await fetch(`/api/reservas/${encodeURIComponent(codigo)}`, { method: "DELETE" });
      if (res.ok) {
        setMensaje({ tipo: "exito", texto: "Reserva cancelada. El horario quedó libre." });
        setCodigo("");
      } else {
        const body = await res.json().catch(() => null);
        setMensaje({ tipo: "error", texto: body?.error ?? "No se pudo cancelar la reserva." });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No se pudo conectar. Intenta nuevamente." });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="contenedor angosto">
      <div className="ticket">
        <h1>Cancelar mi reserva</h1>
        <p className="sub">
          Escribe el código de 6 dígitos que te mostramos al reservar. Tu horario volverá a quedar libre.
        </p>
        <form onSubmit={cancelar}>
          <label className="campo">
            <span>Código de reserva</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              className="entrada-codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
            />
          </label>
          <button type="submit" className="boton peligro bloque" disabled={enviando}>
            {enviando ? "Cancelando…" : "Cancelar reserva"}
          </button>
        </form>
        {mensaje && (
          <p role="status" className={`alerta ${mensaje.tipo}`}>
            {mensaje.texto}
          </p>
        )}
      </div>
      <p className="pie">
        <Link href="/">← Volver a reservar</Link>
      </p>
    </main>
  );
}
