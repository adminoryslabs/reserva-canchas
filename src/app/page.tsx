import Link from "next/link";
import { hoy } from "@/lib/dates";
import { fechaSchema } from "@/lib/validation";
import { disponibilidadDelDia } from "@/server/services/disponibilidad";
import { partesDia, sumarDias, tituloFecha } from "./formato-fecha";
import { Reservador } from "./reservador";

export const dynamic = "force-dynamic";

const DEPORTES = [
  { valor: "todos", texto: "Todas" },
  { valor: "fulbito", texto: "Fulbito" },
  { valor: "voley", texto: "Vóley" },
] as const;
type Deporte = (typeof DEPORTES)[number]["valor"];

function enlace(fecha: string, deporte: Deporte): string {
  const params = new URLSearchParams({ fecha });
  if (deporte !== "todos") params.set("deporte", deporte);
  return `/?${params}`;
}

// HU-01 y HU-02: el jugador ve la disponibilidad del día y reserva un horario libre.
export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; deporte?: string }>;
}) {
  const { fecha: pedida, deporte: deportePedido } = await searchParams;
  const fecha = fechaSchema.safeParse(pedida).success ? pedida! : hoy();
  const deporte: Deporte = DEPORTES.some((d) => d.valor === deportePedido)
    ? (deportePedido as Deporte)
    : "todos";

  const dia = await disponibilidadDelDia(fecha);
  const canchas = dia.canchas
    .filter((c) => deporte === "todos" || c.tipo === deporte)
    .map((c) => ({ id: c.id, nombre: c.nombre, tipo: c.tipo, slots: c.slots }));

  const inicio = hoy();
  const franja = Array.from({ length: 14 }, (_, i) => sumarDias(inicio, i));
  if (!franja.includes(fecha)) franja.unshift(fecha);
  const titulo = tituloFecha(fecha);

  return (
    <>
      <section className="portada">
        <div className="contenedor">
          <h1>Reserva tu cancha en un minuto</h1>
          <p>Elige el día, el deporte y un horario libre. Recibes un código para cancelar cuando quieras.</p>
        </div>
      </section>
      <main className="contenedor principal">
        <section className="panel" aria-label="Día">
          <div className="panel-cabecera">
            <h2>{titulo}</h2>
            <form className="selector-fecha">
              <label>
                <span className="visualmente-oculto">Día</span>
                <input type="date" name="fecha" defaultValue={fecha} />
              </label>
              {deporte !== "todos" && <input type="hidden" name="deporte" value={deporte} />}
              <button type="submit" className="boton secundario chico">
                Ver disponibilidad
              </button>
            </form>
          </div>
          <div className="franja" role="list">
            {franja.map((f) => {
              const p = partesDia(f);
              const activo = f === fecha;
              return (
                <Link
                  key={f}
                  role="listitem"
                  href={enlace(f, deporte)}
                  className={activo ? "dia activo" : "dia"}
                  aria-current={activo ? "date" : undefined}
                >
                  <small>{p.semana}</small>
                  <strong>{p.numero}</strong>
                  <small>{p.mes}</small>
                </Link>
              );
            })}
          </div>
          <div className="filtros" role="group" aria-label="Deporte">
            {DEPORTES.map((d) => {
              const activo = d.valor === deporte;
              return (
                <Link
                  key={d.valor}
                  href={enlace(fecha, d.valor)}
                  className={activo ? "filtro activo" : "filtro"}
                  aria-current={activo ? "true" : undefined}
                >
                  {d.texto}
                </Link>
              );
            })}
          </div>
        </section>
        {!dia.hayLibres && <p className="vacio">No hay horarios disponibles para este día.</p>}
        <Reservador key={`${fecha}-${deporte}`} fecha={fecha} tituloFecha={titulo} canchas={canchas} />
      </main>
    </>
  );
}
