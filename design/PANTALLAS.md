# Pantallas · especificación para construir

Para quien construya la interfaz (persona o agente): abrir `design/index.html` en el navegador, ver cada pantalla y seguir esta especificación. El diseño no cambia la lógica: el backend, las rutas y las pruebas existentes se mantienen.

## Cómo usar este diseño
1. Leer `SISTEMA-DE-DISENO.md` (reglas y tokens).
2. Copiar `design/estilos.css` a `src/app/globals.css` y asegurarse de importarlo en `src/app/layout.tsx`. Para que TypeScript 6 acepte el import de CSS, agregar `src/css.d.ts` con `declare module "*.css";`.
3. Copiar las ilustraciones de `design/assets/` o convertirlas en componentes.
4. Construir cada pantalla de la tabla, reutilizando el HTML y las clases de `design/pantallas/`.
5. No cambiar `src/app/api/`, `src/server/`, `src/lib/` ni `tests/`. Verificar con `npm run typecheck` y `npm run test` (deben seguir en verde).

## Mapa
| Archivo de referencia | Ruta en la app | Archivo a crear o editar |
|---|---|---|
| `01-inicio.html`, `09-inicio-sin-horarios.html` | `/` | `src/app/page.tsx` (Server Component) |
| `02-seleccion-reserva.html`, `03-reserva-confirmada.html`, `10-inicio-error-reserva.html` | `/` | Componente cliente nuevo, por ejemplo `src/app/reservador.tsx`, que reemplaza a `boton-reservar.tsx` |
| `04-cancelar.html`, `05-cancelar-estados.html` | `/cancelar` | `src/app/cancelar/page.tsx` (cliente) |
| `06-admin-login.html`, `06b-admin-login-error.html` | `/admin` sin sesión | `src/app/admin/page.tsx` + `formulario-login.tsx` |
| `07-admin-agenda.html`, `08-admin-agenda-vacia.html` | `/admin` con sesión | `src/app/admin/page.tsx` |
| `11-movil.html` | todas | responsive, un punto de corte a 640 px |
| (cabecera y pie de todas) | todas | `src/app/layout.tsx` |

## Inicio `/`
- **Datos:** `disponibilidadDelDia(fecha)` devuelve las canchas con `id`, `nombre`, `tipo` (`fulbito` o `voley`) y sus `slots` (`horaInicio`, `libre`). Parámetros de URL: `?fecha=YYYY-MM-DD` (por defecto `hoy()`) y `?deporte=todos|fulbito|voley`.
- **Franja de días:** 14 días desde `hoy()` (zona del complejo, `America/Lima`). Si `fecha` está fuera de la franja, se antepone como día activo. Cada día es un enlace que conserva el deporte.
- **Filtro:** filtra las canchas por `tipo` en el servidor.
- **Selector de fecha:** formulario GET con `name="fecha"` (y el deporte en un campo oculto).
- **Etiqueta de cancha:** «N libres» si hay alguna libre; «Completa» si no. El texto «No hay horarios disponibles para este día.» aparece cuando `hayLibres` es falso.
- **Reservar (cliente):** `POST /api/reservas` con `{ canchaId, fecha, horaInicio }`. Éxito `201` con `{ codigoReserva, creadoEn }`. Errores con cuerpo `{ error }`: `400` datos inválidos, `409` «el horario ya no está disponible». Tras un error se llama a `router.refresh()`; tras cerrar el modal también.
- **Importante:** no refrescar justo al recibir el éxito, o el modal se desmonta antes de mostrarse.

## Cancelar `/cancelar`
- `DELETE /api/reservas/{codigo}`. Éxito `204` sin cuerpo.
- Estados a diseñar (todos en `05-cancelar-estados.html`):

| Caso | Origen | Mensaje |
|---|---|---|
| Éxito | `204` | «Reserva cancelada. El horario quedó libre.» |
| Formato inválido | validación en el cliente | «El código debe tener 6 dígitos.» |
| No existe | `404` | el `error` de la API |
| Ya cancelada | `410` | el `error` de la API |
| Fuera de plazo (menos de 2 horas) | `409` | el `error` de la API |
| Demasiados intentos | `429` | el `error` de la API |
| Sin conexión | excepción de red | «No se pudo conectar. Intenta nuevamente.» |

## Administración `/admin`
- **Sesión:** la cookie se verifica en el servidor (`verifySessionValue`). Sin sesión se muestra el login; con sesión, la agenda.
- **Login:** `POST /api/admin/login` con `{ password }`. Éxito `204` y `router.refresh()`. Errores: `401` «contraseña incorrecta», `429`, `503` si el acceso no está configurado.
- **Agenda:** `listarAgenda(fecha)` devuelve `{ canchaId, cancha, horaInicio }` de las reservas activas, **sin el código de reserva** (ADR-0002: la agenda nunca debe mostrarlo). Las canchas salen de `listarCanchas()`.
- **Resumen:** reservas = longitud de la agenda; canchas con reservas = canchas distintas; ocupación = reservas / (canchas × 14 horas), redondeado.
- **Navegación de día:** ← y → son enlaces a `/admin?fecha=` con el día anterior o siguiente.
- **Día sin reservas:** mostrar «No hay reservas para este día.» además del calendario vacío.

## Criterios de aceptación de la interfaz
- [ ] Las 11 pantallas de `design/pantallas/` se ven igual (misma estructura y clases) en la app.
- [ ] Reservar una hora libre muestra el modal con el código; al cerrarlo, la hora aparece ocupada.
- [ ] Reservar una hora ya tomada muestra la alerta del `409` y la hora pasa a ocupada.
- [ ] Cancelar muestra cada uno de los 7 estados de la tabla.
- [ ] La agenda del administrador no muestra nunca el código de reserva.
- [ ] A 390 px no hay scroll horizontal en ninguna pantalla.
- [ ] `npm run typecheck` y `npm run test` siguen en verde; no se modificó nada fuera de `src/app/`.
