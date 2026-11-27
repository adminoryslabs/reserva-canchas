import Link from "next/link";
import { hoy } from "@/lib/dates";
import { fechaSchema } from "@/lib/validation";
import { disponibilidadDelDia } from "@/server/services/disponibilidad";
import { BotonReservar } from "./boton-reservar";

export const dynamic = "force-dynamic";

export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha: pedida } = await searchParams;
  const fecha = fechaSchema.safeParse(pedida).success ? pedida! : hoy();
  const dia = await disponibilidadDelDia(fecha);

  return (
    <main>
      <h1>Reserva de canchas</h1>
      <p className="sub">Elige un día y reserva un horario libre. Si no puedes ir, cancela con tu código.</p>

      <section className="card">
        <form className="barra">
          <label className="campo">
            <span>Día</span>
            <input type="date" name="fecha" defaultValue={fecha} />
          </label>
          <button type="submit">Ver disponibilidad</button>
        </form>

        {!dia.hayLibres && <p className="vacio">No hay horarios disponibles para este día.</p>}
      </section>

      {dia.canchas.map((cancha) => (
        <section key={cancha.id} className="card">
          <h2>{cancha.nombre}</h2>
          <ul className="fichas lista">
            {cancha.slots.map((slot) => (
              <li key={slot.horaInicio} className={slot.libre ? "ficha-fila" : "ficha-fila ocupado"}>
                <span>
                  {slot.horaInicio} — {slot.libre ? "libre" : "ocupado"}
                </span>
                {slot.libre && (
                  <BotonReservar canchaId={cancha.id} fecha={fecha} horaInicio={slot.horaInicio} />
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="pie">
        <Link href="/cancelar">Cancelar una reserva</Link> · <Link href="/admin">Administración</Link>
      </p>
    </main>
  );
}
