# VEREDICTO — HU-01 Ver disponibilidad de canchas por día y horario

**Jira:** RCAN-2 · **Fecha:** 2026-11-22 · **Resultado:** ACEPTADA

| Escenario (Gherkin) | Prueba | Ejecutada | Resultado |
|---|---|---|---|
| 1 · Muestra, por cancha, los horarios libres y ocupados | `tests/hu-01-disponibilidad.test.ts` · "Escenario 1" | sí | rojo antes de construir `disponibilidadDelDia`, verde después |
| 2 · Día sin horarios libres → lo indica | "Escenario 2" | sí | rojo antes, verde después |

## Comprobado a mano

Con `npm run dev`, la pantalla `/` muestra las tres canchas con sus horarios del día elegido. Después de reservar las 19:00 de "Fulbito 1", ese horario aparece como "ocupado".

## NO VERIFICADO

- Que en un día sin horarios libres la pantalla no muestre ningún botón "Reservar": se deduce del código (solo los horarios libres tienen botón), pero no hay prueba de pantalla.
