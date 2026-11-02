import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// SUPUESTO (PRD, Punto Abierto #5): cantidad y nombres de canchas no confirmados por negocio.
// Datos de ejemplo; editar y volver a correr el seed (ADR-0003).
const CANCHAS = [
  { nombre: "Fulbito 1", tipo: "fulbito" as const },
  { nombre: "Fulbito 2", tipo: "fulbito" as const },
  { nombre: "Vóley 1", tipo: "voley" as const },
];

async function main() {
  for (const c of CANCHAS) {
    await prisma.cancha.upsert({ where: { nombre: c.nombre }, update: { tipo: c.tipo }, create: c });
  }
}

main().finally(() => prisma.$disconnect());
