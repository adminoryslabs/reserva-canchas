"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CanchaFulbito, CanchaVoley } from "./ilustraciones";

type Slot = { horaInicio: string; libre: boolean };
type Cancha = { id: number; nombre: string; tipo: string; slots: Slot[] };
type Seleccion = { canchaId: number; nombre: string; horaInicio: string };

type Props = { canchas: Cancha[]; fecha: string; etiquetaFecha: string };

export function Reservador({ canchas, fecha, etiquetaFecha }: Props) {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [codigo, setCodigo] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [resumen, setResumen] = useState<Seleccion | null>(null);

  async function confirmar() {
    if (!seleccion) return;
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canchaId: seleccion.canchaId, fecha, horaInicio: seleccion.horaInicio }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        setCodigo(body.codigoReserva);
        setResumen(seleccion);
        setSeleccion(null);
      } else {
        setError(body?.error ?? "No se pudo reservar.");
        setSeleccion(null);
        router.refresh();
      }
    } catch {
      setError("No se pudo conectar. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  function cerrarCodigo() {
    setCodigo("");
    setResumen(null);
    setCopiado(false);
    router.refresh();
  }

  return (
    <>
      {error && (
        <p role="alert" className="alerta error">
          {error}
        </p>
      )}

      <div className="rejilla-canchas">
        {canchas.map((c) => {
          const libres = c.slots.filter((s) => s.libre).length;
          return (
            <article key={c.id} className="tarjeta-cancha" aria-label={c.nombre}>
              {c.tipo === "voley" ? <CanchaVoley /> : <CanchaFulbito />}
              <div className="tarjeta-cuerpo">
                <div className="tarjeta-titulo">
                  <h3>{c.nombre}</h3>
                  <span className={libres > 0 ? "etiqueta ok" : "etiqueta"}>
                    {libres > 0 ? `${libres} libres` : "Completa"}
                  </span>
                </div>
                <p className="deporte">{c.tipo === "voley" ? "Vóley" : "Fulbito"} · turnos de 1 hora</p>
                <div className="horas">
                  {c.slots.map((s) => {
                    const activo = seleccion?.canchaId === c.id && seleccion.horaInicio === s.horaInicio;
                    return (
                      <button
                        key={s.horaInicio}
                        type="button"
                        className={`hora ${s.libre ? "libre" : "ocupada"} ${activo ? "activa" : ""}`}
                        disabled={!s.libre}
                        aria-pressed={activo}
                        aria-label={`${s.horaInicio} ${s.libre ? "libre" : "ocupado"}`}
                        onClick={() => {
                          setError("");
                          setSeleccion({ canchaId: c.id, nombre: c.nombre, horaInicio: s.horaInicio });
                        }}
                      >
                        {s.horaInicio}
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {seleccion && (
        <div className="barra-reserva" role="region" aria-label="Tu selección">
          <div>
            <strong>{seleccion.nombre}</strong>
            <span>
              {etiquetaFecha} · {seleccion.horaInicio}
            </span>
          </div>
          <div className="barra-acciones">
            <button type="button" className="boton secundario claro" onClick={() => setSeleccion(null)} disabled={enviando}>
              Cambiar
            </button>
            <button type="button" className="boton" onClick={confirmar} disabled={enviando}>
              {enviando ? "Reservando…" : "Confirmar reserva"}
            </button>
          </div>
        </div>
      )}

      {codigo && resumen && (
        <div className="velo">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-codigo">
            <div className="modal-icono" aria-hidden="true">✓</div>
            <h2 id="titulo-codigo">Reserva confirmada</h2>
            <p className="modal-detalle">
              {resumen.nombre} · {etiquetaFecha} · {resumen.horaInicio}
            </p>
            <p className="modal-etiqueta">Tu código es</p>
            <p className="codigo-grande" role="status">
              {codigo}
            </p>
            <p className="modal-nota">Guárdalo: lo necesitas para cancelar.</p>
            <div className="modal-acciones">
              <button type="button" className="boton secundario" onClick={copiar}>
                {copiado ? "Copiado" : "Copiar código"}
              </button>
              <button type="button" className="boton" onClick={cerrarCodigo}>
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
