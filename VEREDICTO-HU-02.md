# VEREDICTO — HU-02 Reservar un horario de cancha

**Jira:** RCAN-3 (incluye RCAN-8) · **Fecha:** 2026-11-22 · **Resultado:** ACEPTADA

| Escenario (Gherkin) | Prueba | Ejecutada | Resultado |
|---|---|---|---|
| 1 · Registra la reserva y la confirma con un código | `tests/hu-02-reservar.test.ts` · "Escenario 1" | sí | verde |
| 2 · Horario ya tomado → 409 y sin duplicado | "Escenario 2" | sí | verde |
| RCAN-8 · Dos reservas simultáneas → una entra, la otra 409 | "RCAN-8" | sí | verde |

Las pruebas salieron verdes desde el primer intento: la lógica ya existía. No se vieron en rojo, así que se confirma que el código actual cumple, no que la prueba detecte una regresión. Para verla fallar habría que quitar el índice único parcial en una base local: la prueba de RCAN-8 debería pasar a rojo (**NO VERIFICADO**: no se hizo).

## Comprobado a mano

Con `npm run dev`, el botón "Reservar" pide confirmación, crea la reserva y muestra el código de 6 dígitos con el aviso de guardarlo (ADR-0002). `POST /api/reservas` respondió 201.

## NO VERIFICADO

- Que la pantalla se actualice sola tras un 409 (usa `router.refresh()`); no hay prueba de pantalla.
