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
- **Ciclo de vida del código:** el código **no se reutiliza nunca**, ni siquiera tras cancelar la
  reserva. `codigo_reserva` lleva un constraint `UNIQUE` común (sin cláusula `WHERE`) sobre toda la
  tabla. Razón: un código ya expuesto no puede ser adoptado por otra reserva futura; y el espacio
  de 10⁶ códigos alcanza de sobra para el volumen de un complejo (del orden de decenas de miles de
  reservas por año). Es el opuesto deliberado del índice parcial de ADR-0004: allí se necesita
  liberar el slot; aquí se necesita quemar el código.
- **Generación:** código aleatorio criptográficamente seguro (no secuencial), con reintento acotado
  (ej. 5 intentos) ante colisión del `UNIQUE`; si se agotan, la API responde 500 genérico.
- **Exposición:** la agenda del administrador (HU-04) **no muestra** el `codigo_reserva`; solo el
  jugador que reservó lo conoce. Esto reduce la superficie de enumeración (ver ADR-0010).
- Si 10⁶ deja de alcanzar (más canchas, más años), la migración natural es ampliar la longitud del
  código; los códigos viejos siguen siendo válidos.
- Como el PRD no confirmó este punto con negocio, esta decisión aplica solo al alcance de MVP/demo
  y debería revisarse antes de cualquier uso real.
