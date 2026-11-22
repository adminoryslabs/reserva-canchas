"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { canchaId: number; fecha: string; horaInicio: string };

// HU-02: confirma la reserva y muestra el código que el jugador debe guardar (ADR-0002).
export function BotonReservar({ canchaId, fecha, horaInicio }: Props) {
  const router = useRouter();
  const [mensaje, setMensaje] = useState("");

  async function reservar() {
    if (!confirm(`¿Confirmas la reserva para el ${fecha} a las ${horaInicio}?`)) return;
    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canchaId, fecha, horaInicio }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        setMensaje(
          `Reserva confirmada. Tu código es ${body.codigoReserva}: guárdalo, lo necesitas para cancelar.`,
        );
      } else {
        setMensaje(body?.error ?? "No se pudo reservar.");
        router.refresh(); // si el horario ya fue tomado, la vista lo muestra ocupado
      }
    } catch {
      setMensaje("No se pudo conectar. Intenta nuevamente.");
    }
  }

  if (mensaje) return <strong role="status">{mensaje}</strong>;
  return (
    <button type="button" onClick={reservar}>
      Reservar
    </button>
  );
}
