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
    <main>
      <h1>Cancelar reserva</h1>
      <p className="sub">Escribe el código de 6 dígitos que recibiste al reservar.</p>
      <section className="card">
        <form onSubmit={cancelar}>
          <label className="campo">
            <span>Código de reserva</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
              placeholder="Los 6 dígitos de tu reserva"
              required
            />
          </label>
          <button type="submit" disabled={enviando}>
            {enviando ? "Cancelando…" : "Cancelar reserva"}
          </button>
        </form>
        {mensaje && (
          <p role="status" className={`mensaje-estado ${esError ? "error" : "ok"}`}>
            {mensaje}
          </p>
        )}
      </section>
      <p className="pie">
        <Link href="/">Volver a reservas</Link>
      </p>
    </main>
  );
}
