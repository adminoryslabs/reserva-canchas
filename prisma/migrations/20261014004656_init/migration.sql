-- CreateEnum
CREATE TYPE "TipoCancha" AS ENUM ('fulbito', 'voley');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('activa', 'cancelada');

-- CreateTable
CREATE TABLE "Cancha" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCancha" NOT NULL,

    CONSTRAINT "Cancha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" SERIAL NOT NULL,
    "codigo_reserva" CHAR(6) NOT NULL,
    "cancha_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME(0) NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'activa',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cancha_nombre_key" ON "Cancha"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Reserva_codigo_reserva_key" ON "Reserva"("codigo_reserva");

-- CreateIndex
CREATE INDEX "Reserva_fecha_idx" ON "Reserva"("fecha");

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_cancha_id_fkey" FOREIGN KEY ("cancha_id") REFERENCES "Cancha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
