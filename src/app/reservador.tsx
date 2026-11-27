"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CanchaFulbito, CanchaVoley } from "./ilustraciones";

type Slot = { horaInicio: string; libre: boolean };
type Cancha = { id: number; nombre: string; tipo: "fulbito" | "voley"; slots: Slot[] };
type Seleccion = { canchaId: number; cancha: string; horaInicio: string };
type Confirmada = Seleccion & { codigo: string };

type Props = { fecha: string; tituloFecha: string; canchas: Cancha[] };

// HU-02: elegir hora, confirmar y mostrar el código que el jugador debe guardar (ADR-0002).
export function Reservador({ fecha, tituloFecha, canchas }: Props) {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [confirmada, setConfirmada] = useState<Confirmada | null>(null);
  const [copiado, setCopiado] = useState(false);

  function elegir(s: Seleccion) {
    setError("");
    setSeleccion(s);
  }

  async function confirmar() {
    if (!seleccion) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canchaId: seleccion.canchaId, fecha, horaInicio: seleccion.horaInicio }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        // No refrescar aquí: el modal se desmontaría antes de mostrarse.
        setConfirmada({ ...seleccion, codigo: body.codigoReserva });
        setSeleccion(null);
      } else {
        setError(body?.error ?? "No se pudo reservar.");
        setSeleccion(null);
        router.refresh();
      }
    } catch {
      setError("No se pudo conectar. Intenta nuevamente.");
      setSeleccion(null);
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  async function copiar() {
    if (!confirmada) return;
    try {
      await navigator.clipboard.writeText(confirmada.codigo);
      setCopiado(true);
    } catch {
      // Sin permiso de portapapeles: el código sigue visible en pantalla.
    }
  }

  function cerrarModal() {
    setConfirmada(null);
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
        {canchas.map((cancha) => {
          const libres = cancha.slots.filter((s) => s.libre).length;
          return (
            <article key={cancha.id} className="tarjeta-cancha" aria-label={cancha.nombre}>
              {cancha.tipo === "voley" ? <CanchaVoley /> : <CanchaFulbito />}
              <div className="tarjeta-cuerpo">
                <div className="tarjeta-titulo">
                  <h3>{cancha.nombre}</h3>
                  {libres > 0 ? (
                    <span className="etiqueta ok">{libres} libres</span>
                  ) : (
                    <span className="etiqueta">Completa</span>
                  )}
                </div>
                <p className="deporte">{cancha.tipo === "voley" ? "Vóley" : "Fulbito"} · turnos de 1 hora</p>
                <div className="horas">
                  {cancha.slots.map((slot) => {
                    if (!slot.libre) {
                      return (
                        <button
                          key={slot.horaInicio}
                          type="button"
                          className="hora ocupada"
                          disabled
                          aria-label={`${slot.horaInicio} ocupado`}
                        >
                          {slot.horaInicio}
                        </button>
                      );
                    }
                    const activa =
                      seleccion?.canchaId === cancha.id && seleccion.horaInicio === slot.horaInicio;
                    return (
                      <button
                        key={slot.horaInicio}
                        type="button"
                        className={activa ? "hora libre activa" : "hora libre"}
                        aria-pressed={activa}
                        aria-label={`${slot.horaInicio} libre`}
                        onClick={() =>
                          elegir({ canchaId: cancha.id, cancha: cancha.nombre, horaInicio: slot.horaInicio })
                        }
                      >
                        {slot.horaInicio}
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
            <strong>{seleccion.cancha}</strong>
            <span>
              {tituloFecha} · {seleccion.horaInicio}
            </span>
          </div>
          <div className="barra-acciones">
            <button
              type="button"
              className="boton secundario claro"
              onClick={() => setSeleccion(null)}
              disabled={enviando}
            >
              Cambiar
            </button>
            <button type="button" className="boton" onClick={confirmar} disabled={enviando}>
              {enviando ? "Reservando…" : "Confirmar reserva"}
            </button>
          </div>
        </div>
      )}

      {confirmada && (
        <div className="velo">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-codigo">
            <div className="modal-icono" aria-hidden="true">
              ✓
            </div>
            <h2 id="titulo-codigo">Reserva confirmada</h2>
            <p className="modal-detalle">
              {confirmada.cancha} · {tituloFecha} · {confirmada.horaInicio}
            </p>
            <p className="modal-etiqueta">Tu código es</p>
            <p className="codigo-grande" role="status">
              {confirmada.codigo}
            </p>
            <p className="modal-nota">Guárdalo: lo necesitas para cancelar.</p>
            <div className="modal-acciones">
              <button type="button" className="boton secundario" onClick={copiar}>
                {copiado ? "Copiado" : "Copiar código"}
              </button>
              <button type="button" className="boton" onClick={cerrarModal} autoFocus>
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
