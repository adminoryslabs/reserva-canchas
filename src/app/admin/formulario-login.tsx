"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FormularioLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
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
    }
  }

  return (
    <form onSubmit={entrar}>
      <label>
        Contraseña{" "}
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>{" "}
      <button type="submit">Entrar</button>
      {mensaje && <p>{mensaje}</p>}
    </form>
  );
}
