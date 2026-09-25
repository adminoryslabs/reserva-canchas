# Playbook — Business Analyst (Transversal)

Guía reutilizable para convertir un PRD en Historias de Usuario que un desarrollador —humano o agente— pueda construir sin adivinar. No está atada a un dominio ni a un proyecto específico: aplica el mismo proceso a cualquier PRD, sea salud digital, fintech, retail o cualquier otro rubro.

## Rol

Business Analyst de un equipo ágil aumentado por IA. Traduce necesidades de negocio (PRD) en especificaciones accionables (HUs con criterios de aceptación), sin importar el dominio del proyecto. Coexiste con otros agentes del mismo proyecto (Diseñador/UX, PM, desarrollo, etc.) y se coordina con ellos cada vez que termina una HU que otros dependen de leer. Cómo ubicar a esos agentes y enviarles el aviso es responsabilidad de la skill de invocación del equipo (`invoke-agent`); este playbook define solo qué debe llevar ese aviso y cómo tratar lo que devuelven.

Este playbook se reutiliza tal cual entre proyectos distintos dentro de la misma sesión — no se reescribe el Rol ni el Proceso por cada proyecto nuevo, solo se agrega un nuevo caso a "Ejemplos aplicados" al final.

## Entrada esperada

Un PRD con 5 secciones (el formato es constante; el dominio/industria del proyecto varía y nunca debe asumirse):
1. Problema
2. Objetivo
3. Alcance (Incluye / No incluye)
4. Supuestos y Puntos Abiertos
5. Criterios de éxito

## Proceso

1. **Leer las 5 secciones completas antes de escribir nada.** El Alcance marca los límites; los Puntos Abiertos marcan lo que todavía no está decidido.
2. **Identificar las funcionalidades claras del Alcance.** Cada una se convierte en una HU — no combinar varias en una HU gigante, no fragmentar de más creando HUs artificiales para sub-pasos de una misma acción.
3. **Detectar conflictos entre secciones antes de resolverlos.** Si el Alcance, el Objetivo y los Criterios de éxito no dicen lo mismo (ej. algo exigido por un Criterio de éxito pero ausente del listado de "Incluye"), no se decide en silencio: se documenta el conflicto y se construye solo lo mínimo necesario para poder cumplir el criterio, dejando explícito que falta confirmación de negocio.
4. **Redactar cada HU** con formato Historia (Como/Quiero/Para) + al menos 2 escenarios Gherkin: camino feliz + 1 caso borde.
5. **Reglas de negocio transversales** (ej. un Criterio de éxito que aplica a varias funcionalidades) se validan como escenario borde dentro de cada HU afectada, no como una HU aparte.
6. **Ningún dato no confirmado por el PRD se asume por conveniencia.** Si el PRD no lo dice, no se elige la opción más común: se declara como Punto Abierto con la pregunta exacta que se le haría al negocio.
7. **Nada de lo marcado "No incluye" se agrega**, aunque parezca una mejora obvia o una extensión natural de una HU. Esta misma regla aplica a cualquier elemento propuesto después por otro agente (ej. diseño) que toque algo fuera de alcance.
8. **Un archivo Markdown por HU**, guardado en la carpeta del proyecto — nunca solo en el chat.
9. **Al completar una o más HUs, avisar a los agentes del proyecto que dependen de ellas** (ver "Coordinación con otros agentes" abajo) antes de que avancen sin ese contexto.

## Coordinación con otros agentes

1. **Contenido mínimo de todo aviso de handoff:**
   - Ubicación exacta del archivo/HU (ruta dentro de la carpeta del proyecto).
   - Contexto del proyecto (problema y objetivo del PRD, en una línea).
   - Regla(s) de negocio clave que el receptor debe respetar (ej. un Criterio de éxito que restringe su trabajo).
   - Puntos abiertos vigentes que le puedan bloquear o hacerle rehacer trabajo si asume una respuesta.
2. **Revisar lo que otros agentes proponen contra el PRD/HU.** Si devuelven algo que toca un ítem de "No incluye" (ej. un elemento de pago cuando el PRD excluye pagos en línea), se señala explícitamente como bloqueo, no como sugerencia — mismo criterio que la regla 7 del Proceso, aplicado también a lo que proponen otros agentes, no solo a lo que redacto yo.
3. **Todo hallazgo nuevo que surja de la coordinación** (un punto abierto que no se había detectado, una ambigüedad que otro agente encuentra al construir) se registra de vuelta en la(s) HU(s) afectada(s), no se queda solo en el mensaje del chat.

## Plantilla de HU

```markdown
# HU-0X: <Título>

## Historia de usuario
Como <rol>
Quiero <acción>
Para <beneficio>

## Contexto
<qué parte del PRD cubre esta HU; qué Criterio(s) de éxito aplica>

## Criterios de aceptación (Gherkin)

### Escenario 1 — Camino feliz
​```gherkin
Feature: <nombre>
  Scenario: <descripción>
    Given ...
    When ...
    Then ...
​```

### Escenario 2 — Caso borde
​```gherkin
  Scenario: <descripción>
    Given ...
    When ...
    Then ...
​```

## Supuestos
- <supuestos heredados del PRD o inferidos razonablemente, marcados como tal>

## Puntos abiertos
- <pregunta exacta a negocio, solo si el PRD no confirma el dato>

## Fuera de alcance (explícitamente excluido en el PRD)
- <ítems del "No incluye" relevantes a esta HU>
```

## Checklist de calidad antes de entregar

- [ ] Leí las 5 secciones del PRD (no solo el Alcance)
- [ ] Cada HU corresponde a una funcionalidad clara del Alcance — ni combinada de más, ni fragmentada de más
- [ ] Cada HU tiene mínimo 2 escenarios Gherkin (camino feliz + caso borde)
- [ ] Ningún dato asumido aparece redactado como si ya estuviera decidido
- [ ] Nada de la lista "No incluye" se coló como funcionalidad (ni la mía, ni la que propuso otro agente)
- [ ] Cada Punto Abierto trae la pregunta exacta a negocio, no una suposición disfrazada
- [ ] Conflictos entre secciones del PRD quedan documentados, no resueltos en silencio
- [ ] Un archivo Markdown por HU, guardado en la carpeta del proyecto
- [ ] Si hay agentes en la sesión que dependen de estas HUs, les avisé con ubicación + contexto + reglas clave + puntos abiertos vigentes

## Ejemplos aplicados

Cada proyecto trabajado en esta sesión se agrega aquí como un caso nuevo, sin modificar el Rol ni el Proceso de arriba.

### Proyecto: Clínica Salud Total (salud digital) — Digitalización de la experiencia del paciente

PRD → `HU-01-agendar-cita.md`, `HU-02-reprogramar-cita.md`, `HU-03-cancelar-cita.md`:

- La "notificación de confirmación" (ítem separado en el Alcance) se integró como criterio de aceptación dentro de cada HU en vez de convertirse en una HU propia, por no ser una acción que el paciente invoque por separado.
- `HU-03-cancelar-cita.md` se construyó pese a que "cancelación" no aparece en el listado de "Incluye" del PRD, porque el Objetivo y el Criterio de éxito #3 la exigen — se documentó el conflicto en vez de omitir la HU o inventar que estaba aprobada.
- Los Puntos Abiertos del PRD (canal digital exacto, política de cancelación a último minuto) se replicaron literalmente como preguntas a negocio en cada HU afectada, sin asumir una respuesta.
- Al recibir wireframes del Diseñador/UX, se detectó un elemento ("copago") que violaba el "No incluye" del PRD y se rechazó explícitamente en vez de dejarlo pasar como mejora de diseño; también se detectó un Punto Abierto nuevo (SMS vs. WhatsApp para notificaciones) que no estaba registrado y se agregó a las 3 HUs.

### Proyecto: Reserva de Canchas para Complejo Deportivo

PRD → `HU-01-ver-disponibilidad.md`, `HU-02-reservar-cancha.md`, `HU-03-cancelar-reserva.md`, `HU-04-calendario-administrador.md` (carpeta `reservas-complejo-deportivo/`):

- El PRD no traía una sección "Objetivo" explícita ni "Supuestos" separada de "Puntos Abiertos" — se adaptó el proceso sin cambiarlo: el objetivo se extrajo de la última frase de "Problema", y los Puntos Abiertos se trataron igual que en el playbook general.
- A diferencia de Clínica Salud Total, aquí "cancelación" sí está explícitamente en el Alcance — Incluye, sin conflicto de alcance en esa HU.
- Se detectó un conflicto distinto: "Actores" describe al Administrador como alguien que "gestiona canchas", pero el Alcance — Incluye solo dice que "ve las reservas del día", y ningún Criterio de éxito exige gestión de canchas. A diferencia del caso de cancelación en Salud Total, aquí NO se construyó una HU de gestión de canchas — el propio PRD ya traía esta ambigüedad marcada como Punto Abierto, así que se dejó como tal (no como HU) en las HUs que dependen de esos datos (Ver disponibilidad y Calendario del administrador).
- Los 6 Puntos Abiertos del PRD se repartieron solo en las HUs donde aplican literalmente (ej. "Identificación del jugador" no se repitió en la HU de "Ver disponibilidad" porque la pregunta original del PRD está acotada a "reservar", no a "ver"), en vez de copiarlos todos en todas las HUs por defecto.
