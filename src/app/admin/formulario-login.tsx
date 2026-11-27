"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FormularioLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setMensaje("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const body = await res.json().catch(() => null);
        setMensaje(body?.error ?? "No se pudo ingresar.");
      }
    } catch {
      setMensaje("No se pudo conectar. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={entrar}>
      <label className="campo">
        <span>Contraseña</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </label>
      <button type="submit" className="boton bloque" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
      {mensaje && (
        <p role="alert" className="alerta error">
          {mensaje}
        </p>
      )}
    </form>
  );
}
