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
        <FormularioLogin />
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
      <form>
        <label>
          Día <input type="date" name="fecha" defaultValue={fecha} />
        </label>{" "}
        <button type="submit">Ver agenda</button>
      </form>

      {agenda.length === 0 ? (
        <p>No hay reservas para este día.</p>
      ) : (
        [...porCancha].map(([cancha, reservas]) => (
          <section key={cancha}>
            <h2>{cancha}</h2>
            <ul>
              {reservas.map((r) => (
                <li key={r.horaInicio}>{r.horaInicio} — reservado</li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
