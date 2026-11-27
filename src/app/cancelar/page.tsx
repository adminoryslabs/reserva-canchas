"use client";

import Link from "next/link";
import { useState } from "react";

export default function CancelarPage() {
  const [codigo, setCodigo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function cancelar(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(codigo)) {
      setMensaje("El código debe tener 6 dígitos.");
      setEsError(true);
      return;
    }
    setEnviando(true);
    setMensaje("");
    try {
      const res = await fetch(`/api/reservas/${encodeURIComponent(codigo)}`, { method: "DELETE" });
      if (res.ok) {
        setMensaje("Reserva cancelada. El horario quedó libre.");
        setEsError(false);
        setCodigo("");
      } else {
        const body = await res.json().catch(() => null);
        setMensaje(body?.error ?? "No se pudo cancelar la reserva.");
        setEsError(true);
      }
    } catch {
      setMensaje("No se pudo conectar. Intenta nuevamente.");
      setEsError(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="contenedor angosto">
      <div className="ticket">
        <h1>Cancelar mi reserva</h1>
        <p className="sub">Escribe el código de 6 dígitos que te mostramos al reservar. Tu horario volverá a quedar libre.</p>
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
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              required
            />
          </label>
          <button type="submit" className="boton peligro bloque" disabled={enviando}>
            {enviando ? "Cancelando…" : "Cancelar reserva"}
          </button>
        </form>
        {mensaje && (
          <p role="status" className={`alerta ${esError ? "error" : "exito"}`}>
            {mensaje}
          </p>
        )}
      </div>
      <p className="pie">
        <Link href="/">← Volver a reservar</Link>
      </p>
    </main>
  );
}
