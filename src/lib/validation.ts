import { z } from "zod";
import { HORAS_INICIO } from "./config";

export const codigoReservaSchema = z
  .string()
  .regex(/^\d{6}$/, "el código debe tener 6 dígitos");

export const fechaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "fecha inválida (YYYY-MM-DD)")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00.000Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, "fecha inválida");

export const horaInicioSchema = z
  .string()
  .refine((h) => HORAS_INICIO.includes(h), "horario fuera del rango operativo");

export const canchaIdSchema = z.coerce.number().int().positive();

export const crearReservaSchema = z.object({
  canchaId: canchaIdSchema,
  fecha: fechaSchema,
  horaInicio: horaInicioSchema,
});

export const disponibilidadQuerySchema = z.object({
  canchaId: canchaIdSchema,
  fecha: fechaSchema,
});

export const loginSchema = z.object({ password: z.string().min(1) });

export type CrearReservaInput = z.infer<typeof crearReservaSchema>;
