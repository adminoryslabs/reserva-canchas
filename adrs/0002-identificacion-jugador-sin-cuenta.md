# ADR 0002: Identificación del jugador por código de reserva, sin cuenta

## Estado

Aceptado

## Contexto

El PRD deja "Identificación del jugador" como Punto Abierto #2 (no confirmado por negocio). Sin
embargo, HU-02 (reservar) y HU-03 (cancelar una reserva propia) no se pueden modelar ni construir
sin definir a quién pertenece cada reserva y cómo se valida que una modificación es legítima. Para
el alcance de este MVP de demostración, se necesita una decisión concreta que permita avanzar,
dejando explícito que sigue siendo un punto que el negocio debería confirmar en una versión no-demo.

## Decisión

El jugador reserva sin registrarse ni loguearse. Al confirmar una reserva, el sistema genera un
código de reserva único (token corto, ej. 6 dígitos numéricos) y lo muestra en pantalla. Ese código
es el único dato que identifica la reserva para cualquier operación posterior sobre ella
(consultarla, cancelarla): el jugador debe ingresar ese mismo código para cancelar. No se guarda ni
se pide dato de contacto personal (nombre/teléfono/email) para esta validación.

## Alternativas consideradas

- **Dato de contacto libre (nombre + teléfono/email) sin verificación** — descartada: cualquiera
  que conociera o adivinara el dato de contacto podía cancelar la reserva de otro jugador sin
  ningún control adicional; el código de reserva generado por el sistema (no elegido por el
  usuario ni public) da una protección real, aunque liviana, sin agregar pantallas de login.
- **Login simple con proveedor gratuito (ej. Auth.js con magic link)** — da identidad real y
  permite validar "propia" de forma confiable, pero agrega pantallas de registro/login y gestión
  de sesión que el PRD no pide explícitamente; para una demo de MVP es más superficie de la
  necesaria.
- **Identificador de dispositivo/sesión anónima (cookie/localStorage)** — no requiere pantallas de
  login, pero la reserva se pierde si el jugador cambia de navegador/dispositivo, y no hay forma de
  recuperarla desde otro lugar — peor experiencia que un código de reserva.

## Consecuencias

- Cero fricción para reservar: no hay pantalla de login/registro, y el jugador solo necesita
  guardar/recordar un código corto para gestionar su reserva — encaja con el alcance mínimo del MVP.
- Protección razonable para un MVP: el código no es adivinable a simple vista como sí lo sería un
  dato de contacto conocido, y no requiere que el jugador comparta datos personales.
- Trade-off real: si el jugador pierde el código, no hay forma de recuperar ni cancelar la reserva
  (no hay dato de contacto asociado para identificarlo por otra vía). Esto es aceptable para una
  demo, pero debe quedar señalado como riesgo pendiente si el proyecto pasa a producción (ver
  Riesgos técnicos abiertos en el TDD).
- El código debe ser único por reserva activa (constraint de unicidad en la base) para evitar
  colisiones que permitan operar sobre la reserva de otro jugador.
- Como el PRD no confirmó este punto con negocio, esta decisión aplica solo al alcance de MVP/demo
  y debería revisarse antes de cualquier uso real.
