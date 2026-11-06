"use client";

import { useState } from "react";

export default function CancelarPage() {
  const [codigo, setCodigo] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function cancelar(e: React.FormEvent) {
    e.preventDefault();
    setMensaje("Cancelando...");
    try {
      const res = await fetch(`/api/reservas/${encodeURIComponent(codigo)}`, { method: "DELETE" });
      if (res.ok) {
        setMensaje("Reserva cancelada. El horario quedó libre.");
      } else {
        const body = await res.json().catch(() => null);
        setMensaje(body?.error ?? "No se pudo cancelar la reserva.");
      }
    } catch {
      setMensaje("No se pudo conectar. Intentá nuevamente.");
    }
  }

  return (
    <main>
      <h1>Cancelar reserva</h1>
      <form onSubmit={cancelar}>
        <label>
          Código de reserva{" "}
          <input value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
        </label>{" "}
        <button type="submit">Cancelar reserva</button>
      </form>
      {mensaje && <p>{mensaje}</p>}
    </main>
  );
}
