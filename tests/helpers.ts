import { prisma } from "@/lib/db";

// Deja la base con las tres canchas de ejemplo y sin reservas.
export async function baseLimpia() {
  await prisma.reserva.deleteMany();
  await prisma.cancha.deleteMany();
  await prisma.cancha.createMany({
    data: [
      { id: 1, nombre: "Fulbito 1", tipo: "fulbito" },
      { id: 2, nombre: "Fulbito 2", tipo: "fulbito" },
      { id: 3, nombre: "Vóley 1", tipo: "voley" },
    ],
  });
}
