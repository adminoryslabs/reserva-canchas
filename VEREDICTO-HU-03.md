# VEREDICTO — HU-03 Cancelar una reserva propia

**Jira:** RCAN-4 · **Contrato:** `CONTRATO-HU-03.md` v2 · **Fecha:** 2026-11-22 · **Resultado:** ACEPTADA

| Escenario (Gherkin) | Prueba | Ejecutada | Resultado |
|---|---|---|---|
| 1 · Cancela una reserva vigente y libera el horario | `tests/hu-03-cancelar.test.ts` · "Escenario 1" | sí | verde |
| 2 · Reserva ya cancelada → 410 sin cambios | "Escenario 2" | sí | verde |
| 3 · Menos de 2 horas → 409, sigue activa | "Escenario 3" (17:01 para una reserva de las 19:00) | sí | rojo antes de la corrección, verde después |
| 4 · Exactamente 2 horas → se cancela | "Escenario 4" (17:00 para las 19:00) | sí | verde |

Casos del contrato cubiertos además: 404 (código inexistente) y "cancelada fuera de plazo responde 410, no 409".

## NO VERIFICADO

- 429 por exceso de intentos: depende de Upstash; no hay prueba automática.
- 400 por formato de código: lo valida la ruta antes del servicio; no hay prueba automática.

## Cómo se comprobó

`npm run db:up` y `npm run test`. Las pruebas corren contra el Postgres de `docker-compose` y fijan la hora actual y la zona `America/Lima`.
