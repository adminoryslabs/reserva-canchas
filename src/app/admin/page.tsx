import Link from "next/link";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "@/lib/config";
import { verifySessionValue } from "@/lib/admin-session";
import { hoy } from "@/lib/dates";
import { fechaSchema } from "@/lib/validation";
import { listarAgenda } from "@/server/services/agenda";
import { FormularioLogin } from "./formulario-login";

export const dynamic = "force-dynamic";

// HU-04: agenda del día. La cookie se verifica en el servidor en cada request (ADR-0009).
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const sesion = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionValue(sesion)) {
    return (
      <main>
        <h1>Agenda del administrador</h1>
        <section className="card">
          <h2>Acceso de administración</h2>
          <FormularioLogin />
        </section>
        <p className="pie">
          <Link href="/">Volver a reservas</Link>
        </p>
      </main>
    );
  }

  const { fecha: pedida } = await searchParams;
  const fecha = fechaSchema.safeParse(pedida).success ? pedida! : hoy();
  const agenda = await listarAgenda(fecha);
  const porCancha = Map.groupBy(agenda, (r) => r.cancha);

  return (
    <main>
      <h1>Agenda del administrador</h1>
      <p className="sub">Reservas activas por cancha y horario.</p>
      <section className="card">
        <form className="barra">
          <label className="campo">
            <span>Día</span>
            <input type="date" name="fecha" defaultValue={fecha} />
          </label>
          <button type="submit">Ver agenda</button>
        </form>

        {agenda.length === 0 ? (
          <p className="vacio">No hay reservas para este día.</p>
        ) : (
          [...porCancha].map(([cancha, reservas]) => (
            <div key={cancha} className="grupo">
              <h2>{cancha}</h2>
              <ul>
                {reservas.map((r) => (
                  <li key={r.horaInicio}>{r.horaInicio}</li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
      <p className="pie">
        <Link href="/">Volver a reservas</Link>
      </p>
    </main>
  );
}
