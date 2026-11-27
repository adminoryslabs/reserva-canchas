# Sistema de diseño · Reserva de canchas

Reglas visuales y de interacción de la aplicación. Las pantallas de referencia están en `design/pantallas/` y el catálogo de componentes en `design/componentes.html`. Todo el CSS está en `design/estilos.css`: puede copiarse tal cual a `src/app/globals.css`.

## Principios
1. **Reservar en menos de un minuto.** Día, cancha y hora son visibles a la vez; no hay pasos intermedios ni formularios largos.
2. **El estado se ve sin leer.** Libre, ocupado y seleccionado se distinguen por forma y color, y también por texto accesible (`aria-label`).
3. **Un solo botón principal por pantalla.** Naranja = la acción que avanza (Confirmar reserva). Rojo = destructiva (Cancelar reserva). Verde con contorno = secundaria.
4. **Los mensajes del sistema se muestran tal cual llegan de la API** (ya están en español y sin datos sensibles). No se reescriben ni se traducen.
5. **Móvil primero.** Todo funciona a 390 px sin scroll horizontal.

## Tokens
Definidos como variables CSS en `:root` de `estilos.css`.

| Token | Valor | Uso |
|---|---|---|
| `--verde` | `#0f8a4f` | Acción principal, hora activa, día activo, celdas reservadas |
| `--verde-oscuro` | `#0b5d34` | Marca, títulos de énfasis, enlaces |
| `--verde-claro` | `#e6f5ec` | Fondo de éxito, hover de hora libre, etiqueta «libres» |
| `--naranja` | `#b85c00` | Botón principal (reservar / confirmar) |
| `--tinta` | `#14211a` | Texto principal, barra de reserva, filtro activo |
| `--gris` | `#5a6a61` | Texto secundario y etiquetas de campo |
| `--borde` | `#dbe5df` | Contornos y separadores |
| `--fondo` | `#f4f7f5` | Fondo de página |
| `--rojo` / `--rojo-claro` | `#c5221f` / `#fdecea` | Errores y acciones destructivas |
| `--radio` | `14px` | Tarjetas y paneles (botones 12px, horas y campos 10px) |
| `--sombra` | ver CSS | Tarjetas elevadas |

**Tipografía:** pila del sistema (`-apple-system, Segoe UI, Helvetica, Arial`). Titular de portada 42/800 (fluido desde 28), título de página 26–28/800, sección 20–22/700, texto 16/400, secundario 14, etiquetas de campo 12–13 en mayúsculas con espaciado. Los códigos usan cifras tabulares.

**Espaciado:** múltiplos de 4 px; separación entre bloques 20 px; relleno de paneles 20 px; ancho máximo del contenido 1120 px (520 px en pantallas de formulario).

**Puntos de corte:** un solo punto, `640px`. Por debajo: canchas en una columna, la marca de la cabecera pierde el texto y el resumen del admin pasa a una columna.

## Componentes
Cada uno está demostrado en `componentes.html`.

| Componente | Clases | Notas |
|---|---|---|
| Cabecera | `.cabecera`, `.marca`, `nav` | Fija arriba. Tres enlaces: Reservar, Mi reserva, Administración |
| Portada | `.portada` | Solo en el inicio. Degradado verde y círculo decorativo |
| Panel | `.panel` | Contenedor blanco con sombra |
| Franja de días | `.franja`, `.dia`, `.dia.activo` | 14 días desde hoy, desplazable en horizontal. El día activo lleva `aria-current="date"` |
| Filtro | `.filtros`, `.filtro`, `.filtro.activo` | Todas / Fulbito / Vóley. Son enlaces, no botones |
| Tarjeta de cancha | `.tarjeta-cancha`, `.ilustracion`, `.etiqueta` | Ilustración según tipo (`assets/`), nombre, etiqueta «N libres» o «Completa» |
| Hora | `.hora.libre`, `.hora.activa`, `.hora.ocupada` | Botón. Ocupada: deshabilitada y tachada. `aria-pressed` en las libres |
| Barra de reserva | `.barra-reserva` | Fija abajo y centrada. Solo existe mientras hay una hora seleccionada |
| Modal de código | `.velo`, `.modal`, `.codigo-grande` | `role="dialog"`. El código va en `role="status"` |
| Botones | `.boton`, `.secundario`, `.peligro`, `.chico`, `.bloque` | Naranja por defecto |
| Campo | `.campo`, `.entrada-codigo` | Etiqueta arriba en mayúsculas. El código: 30 px, centrado, espaciado de 10 px |
| Alerta | `.alerta.exito`, `.alerta.error` | Errores con `role="alert"`; éxitos con `role="status"` |
| Vacío | `.vacio` | Caja punteada con el mensaje |
| Ticket | `.ticket` | Tarjeta de formulario con borde superior verde (cancelar y login) |
| Resumen | `.resumen`, `.dato` | Tres cifras del día en la agenda |
| Calendario | `.tabla-agenda`, `.celda`, `.celda.reservada` | Tabla cancha × hora (08–21). Celda reservada en verde con la hora |

## Interacción
- **Elegir hora:** al pulsar una hora libre pasa a activa y aparece la barra de reserva. Pulsar otra la reemplaza. «Cambiar» limpia la selección.
- **Confirmar:** el botón pasa a «Reservando…» y se deshabilita. Éxito: se abre el modal con el código. Error: se cierra la selección, se muestra una alerta roja sobre las tarjetas y se refresca la disponibilidad.
- **Cerrar el modal («Listo»):** refresca la disponibilidad; la hora reservada queda ocupada.
- **Copiar código:** el botón cambia a «Copiar» → «Copiado».
- **Cancelar:** el campo solo acepta dígitos (6). Se valida el formato antes de enviar. Mientras envía: «Cancelando…». Tras el éxito se vacía el campo.
- **Admin:** las flechas ← → cambian de día; el selector de fecha y «Ver agenda» saltan a un día concreto.

## Accesibilidad
- Contraste (calculado, WCAG): blanco sobre naranja 4.6:1, sobre verde 4.4:1 y sobre rojo 5.8:1; rojo sobre su fondo de error 5.1:1; gris de texto sobre blanco 5.7:1. El texto blanco sobre verde (4.4:1) queda justo por debajo de 4.5:1 en tamaño normal; va siempre en negrita. Las horas ocupadas están deshabilitadas, por lo que no se les exige contraste.
- Foco visible en todo elemento interactivo (anillo verde de 3 px).
- Las horas tienen `aria-label` con estado («19:00 libre», «19:00 ocupado»).
- El modal usa `role="dialog"` y `aria-modal`; la franja usa `role="list"`.
- Objetivos táctiles mínimos de 40 px de alto.

## Voz y tono
Español neutro, tuteo, frases cortas y verbos de acción: «Reserva tu cancha en un minuto», «Guárdalo: lo necesitas para cancelar». Sin tecnicismos ni jerga. Los mensajes de error de la API no se modifican.

## Lo que no define este diseño
- Marca, logotipo propio y fotografías: el balón y las canchas son ilustraciones provisionales.
- Modo oscuro.
- Cierre de sesión del administrador: el backend actual no tiene ruta para ello.
- Pasos de HU-05 (recordatorio por correo): no hay pantalla.
