import Link from "next/link";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, HORAS_INICIO } from "@/lib/config";
import { verifySessionValue } from "@/lib/admin-session";
import { hoy } from "@/lib/dates";
import { fechaSchema } from "@/lib/validation";
import { listarAgenda } from "@/server/services/agenda";
import { listarCanchas } from "@/server/services/disponibilidad";
import { etiquetaLarga, sumarDias } from "../fechas";
import { FormularioLogin } from "./formulario-login";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const sesion = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionValue(sesion)) {
    return (
      <main className="contenedor angosto">
        <div className="ticket">
          <h1>Administración</h1>
          <p className="sub">Ingresa la contraseña para ver la agenda del complejo.</p>
          <FormularioLogin />
        </div>
        <p className="pie">
          <Link href="/">← Volver a reservar</Link>
        </p>
      </main>
    );
  }

  const { fecha: pedida } = await searchParams;
  const fecha = fechaSchema.safeParse(pedida).success ? pedida! : hoy();
  const [agenda, canchas] = await Promise.all([listarAgenda(fecha), listarCanchas()]);
  const ocupadas = new Set(agenda.map((r) => `${r.canchaId}|${r.horaInicio}`));
  const totalHoras = canchas.length * HORAS_INICIO.length;
  const porcentaje = totalHoras === 0 ? 0 : Math.round((agenda.length / totalHoras) * 100);
  const canchasConReservas = new Set(agenda.map((r) => r.canchaId)).size;

  return (
    <main className="contenedor principal">
      <div className="admin-cabecera">
        <div>
          <h1>Agenda del administrador</h1>
          <p className="sub">{etiquetaLarga(fecha)}</p>
        </div>
        <div className="navegador-dia">
          <Link className="boton secundario chico" href={`/admin?fecha=${sumarDias(fecha, -1)}`} aria-label="Día anterior">
            ←
          </Link>
          <form>
            <label>
              <span className="visualmente-oculto">Día</span>
              <input type="date" name="fecha" defaultValue={fecha} />
            </label>
            <button type="submit" className="boton secundario chico">
              Ver agenda
            </button>
          </form>
          <Link className="boton secundario chico" href={`/admin?fecha=${sumarDias(fecha, 1)}`} aria-label="Día siguiente">
            →
          </Link>
        </div>
      </div>

      <div className="resumen">
        <div className="dato">
          <strong>{agenda.length}</strong>
          <span>reservas</span>
        </div>
        <div className="dato">
          <strong>{canchasConReservas}</strong>
          <span>canchas con reservas</span>
        </div>
        <div className="dato">
          <strong>{porcentaje}%</strong>
          <span>de ocupación</span>
        </div>
      </div>

      {agenda.length === 0 && <p className="vacio">No hay reservas para este día.</p>}

      <section className="panel tabla-agenda" aria-label="Calendario del día">
        <div className="desplazable">
          <table>
            <thead>
              <tr>
                <th scope="col">Cancha</th>
                {HORAS_INICIO.map((h) => (
                  <th key={h} scope="col">
                    {h.slice(0, 2)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {canchas.map((c) => (
                <tr key={c.id}>
                  <th scope="row">{c.nombre}</th>
                  {HORAS_INICIO.map((h) => {
                    const reservada = ocupadas.has(`${c.id}|${h}`);
                    return (
                      <td key={h} className={reservada ? "celda reservada" : "celda"}>
                        {reservada ? <span title={`${c.nombre} ${h}`}>{h}</span> : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="leyenda">
          <span className="muestra reservada" /> Reservado <span className="muestra" /> Libre
        </p>
      </section>

      <p className="pie">
        <Link href="/">← Volver a reservar</Link>
      </p>
    </main>
  );
}
