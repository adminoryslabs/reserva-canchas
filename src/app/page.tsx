import Link from "next/link";
import { hoy } from "@/lib/dates";
import { fechaSchema } from "@/lib/validation";
import { disponibilidadDelDia } from "@/server/services/disponibilidad";
import { BotonReservar } from "./boton-reservar";

export const dynamic = "force-dynamic";

// HU-01 y HU-02: el jugador ve la disponibilidad del día y reserva un horario libre.
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
      <form>
        <label>
          Día <input type="date" name="fecha" defaultValue={fecha} />
        </label>{" "}
        <button type="submit">Ver disponibilidad</button>
      </form>

      {!dia.hayLibres && <p>No hay horarios disponibles para este día.</p>}

      {dia.canchas.map((cancha) => (
        <section key={cancha.id}>
          <h2>{cancha.nombre}</h2>
          <ul>
            {cancha.slots.map((slot) => (
              <li key={slot.horaInicio}>
                {slot.horaInicio} —{" "}
                {slot.libre ? (
                  <>
                    libre{" "}
                    <BotonReservar canchaId={cancha.id} fecha={fecha} horaInicio={slot.horaInicio} />
                  </>
                ) : (
                  "ocupado"
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p>
        <Link href="/cancelar">Cancelar una reserva</Link>
      </p>
    </main>
  );
}
