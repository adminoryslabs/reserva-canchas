import Link from "next/link";
import { hoy } from "@/lib/dates";
import { fechaSchema } from "@/lib/validation";
import { disponibilidadDelDia } from "@/server/services/disponibilidad";
import { diasDesde, etiquetaLarga, partesDia } from "./fechas";
import { Reservador } from "./reservador";

export const dynamic = "force-dynamic";

const DEPORTES = [
  { valor: "todos", nombre: "Todas" },
  { valor: "fulbito", nombre: "Fulbito" },
  { valor: "voley", nombre: "Vóley" },
];

export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; deporte?: string }>;
}) {
  const { fecha: pedida, deporte: pedido } = await searchParams;
  const hoyLocal = hoy();
  const fecha = fechaSchema.safeParse(pedida).success ? pedida! : hoyLocal;
  const deporte = DEPORTES.some((d) => d.valor === pedido) ? pedido! : "todos";
  const dia = await disponibilidadDelDia(fecha);
  const canchas = dia.canchas.filter((c) => deporte === "todos" || c.tipo === deporte);
  const dias = diasDesde(hoyLocal, 14);
  const enLaFranja = dias.includes(fecha);
  const href = (f: string, d: string) => `/?fecha=${f}${d === "todos" ? "" : `&deporte=${d}`}`;

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
            <h2>{etiquetaLarga(fecha)}</h2>
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
            {!enLaFranja && (
              <Link role="listitem" href={href(fecha, deporte)} className="dia activo" aria-current="date">
                <small>{partesDia(fecha).semana}</small>
                <strong>{partesDia(fecha).dia}</strong>
                <small>{partesDia(fecha).mes}</small>
              </Link>
            )}
            {dias.map((f) => {
              const p = partesDia(f);
              return (
                <Link
                  key={f}
                  role="listitem"
                  href={href(f, deporte)}
                  className={f === fecha ? "dia activo" : "dia"}
                  aria-current={f === fecha ? "date" : undefined}
                >
                  <small>{p.semana}</small>
                  <strong>{p.dia}</strong>
                  <small>{p.mes}</small>
                </Link>
              );
            })}
          </div>
          <div className="filtros" role="group" aria-label="Deporte">
            {DEPORTES.map((d) => (
              <Link
                key={d.valor}
                href={href(fecha, d.valor)}
                className={d.valor === deporte ? "filtro activo" : "filtro"}
                aria-current={d.valor === deporte ? "true" : undefined}
              >
                {d.nombre}
              </Link>
            ))}
          </div>
        </section>

        {!dia.hayLibres && <p className="vacio">No hay horarios disponibles para este día.</p>}

        <Reservador canchas={canchas} fecha={fecha} etiquetaFecha={etiquetaLarga(fecha)} />
      </main>
    </>
  );
}
