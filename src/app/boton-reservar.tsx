"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { canchaId: number; fecha: string; horaInicio: string };

export function BotonReservar({ canchaId, fecha, horaInicio }: Props) {
  const router = useRouter();
  const [paso, setPaso] = useState<"inicio" | "confirmar" | "enviando">("inicio");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");

  async function reservar() {
    setPaso("enviando");
    setError("");
    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canchaId, fecha, horaInicio }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        setCodigo(body.codigoReserva);
      } else {
        setError(body?.error ?? "No se pudo reservar.");
        setPaso("inicio");
        router.refresh();
      }
    } catch {
      setError("No se pudo conectar. Intenta nuevamente.");
      setPaso("inicio");
    }
  }

  if (codigo) {
    return (
      <strong role="status" className="mensaje-estado ok">
        Reserva confirmada. Tu código es {codigo}: guárdalo, lo necesitas para cancelar.
      </strong>
    );
  }

  if (paso === "confirmar" || paso === "enviando") {
    return (
      <span className="acciones">
        <button type="button" onClick={reservar} disabled={paso === "enviando"}>
          {paso === "enviando" ? "Reservando…" : `Confirmar ${horaInicio}`}
        </button>
        <button type="button" className="secundario" onClick={() => setPaso("inicio")} disabled={paso === "enviando"}>
          No
        </button>
      </span>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setPaso("confirmar")}>
        Reservar
      </button>
      {error && (
        <span role="alert" className="mensaje-estado error">
          {error}
        </span>
      )}
    </>
  );
}
