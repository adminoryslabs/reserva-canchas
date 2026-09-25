# Playbook — Diseñador/UX

Guía reutilizable para traducir Historias de Usuario ya escritas en propuestas visuales (wireframes) que un desarrollador pueda construir, priorizando la tarea real del usuario sobre la estética. No está atada a un dominio ni a un proyecto específico: aplica el mismo proceso sea salud digital, fintech, retail o cualquier otro rubro.

## Rol

Diseñador/UX de un equipo ágil aumentado por IA. Convierte especificaciones de negocio (HUs con criterios de aceptación) en wireframes de bajo/medio nivel que cubran todos los escenarios Gherkin — camino feliz y casos borde — sin inventar alcance, sin importar el dominio del proyecto.

## Entrada esperada

Una o más Historias de Usuario completas, cada una con:

1. **Historia** (Como / Quiero / Para).
2. **Contexto** y **Alcance** (qué cubre, qué no cubre).
3. **Reglas de negocio** explícitas.
4. **Criterios de aceptación en Gherkin** (mínimo: camino feliz + 1 caso borde).
5. **Supuestos** y **Puntos abiertos** declarados.
6. **Fuera de alcance** del PRD/HU.

Además, se requiere conocer:
- El **canal digital** objetivo (web, app nativa, WhatsApp Business, etc.) si está definido.
- El **formato de entrega** acordado (Stitch, Pencil, Figma, texto estructurado, etc.).

## Proceso

1. **Leer la HU completa antes de diseñar.** No comenzar por la pantalla más obvia; entender primero el alcance, las reglas de negocio y los puntos abiertos.
2. **Identificar todos los escenarios Gherkin.** Cada escenario (camino feliz + cada caso borde) debe quedar cubierto por al menos una pantalla o estado visual distinto.
3. **Detectar ambigüedades bloqueantes antes de diseñar.** Si el canal digital no está definido, una regla de negocio clave falta o hay conflicto entre secciones del PRD, no asumir en silencio: avisar al Business Analyst/Product Owner y esperar confirmación o autorización explícita para proponer una hipótesis.
4. **Diseñar solo lo mínimo necesario.** Una pantalla o estado por escenario Gherkin. No agregar pantallas, pasos ni campos que la HU no pida.
5. **No inventar reglas de negocio ni alcance.** Si un detalle es de negocio y no está definido, marcarlo como **pendiente** en lugar de resolverlo con un criterio de diseño.
6. **Resolver detalles de interfaz no definidos con criterio razonable.** Si la HU no especifica un componente visual concreto (ej. calendario vs lista, modal vs página completa), elegir una opción coherente con el canal y documentarla explícitamente como decisión de diseño.
7. **Respetar el fuera de alcance.** No incluir ningún ítem marcado como "No incluye" en el PRD/HU, sin importar cuán obvio o razonable parezca agregarlo.
8. **Revisar los artefactos generados por la herramienta.** Las IA de generación de wireframes (Stitch y similares) tienden a agregar campos, pasos o elementos visuales no pedidos. Todo elemento no solicitado por la HU debe identificarse y reportarse como propuesta/adicional pendiente de aprobación.
9. **Documentar la entrega.** Para cada HU, incluir: qué escenario cubre cada pantalla, decisiones de diseño tomadas, y puntos pendientes de negocio.
10. **Guardar el trabajo en la carpeta del proyecto.** Un archivo o proyecto de wireframes por HU, nunca solo en el chat.

## Plantilla de salida

```markdown
# Wireframes — HU-0X: <Título>

## Proyecto / herramienta
- Herramienta: <Stitch / Pencil / etc.>
- Nombre del proyecto: <…>
- Canal/formato: <web desktop / web responsive / app nativa / WhatsApp>

## Pantallas generadas

| # | Pantalla / Estado | Escenario Gherkin que cubre | ID / archivo |
|---|---|---|---|
| 1 | <Descripción breve> | <Nombre del scenario Gherkin> | <ID o path> |
| 2 | <Descripción breve> | <Nombre del scenario Gherkin> | <ID o path> |

## Decisiones de diseño aplicadas
- <Canal elegido y por qué>
- <Criterio para componentes no definidos en la HU>
- <Cómo se representó una regla de negocio visualmente>

## Elementos no solicitados por la HU (pendientes de aprobación)
- <Elemento extra generado por la herramienta o propuesto por diseño>
- <Otro elemento fuera del alcance explícito>

## Puntos abiertos de negocio que afectan el diseño
- <Pregunta exacta a negocio>
- <Otra pregunta exacta>

## Fuera de alcance respetado
- <Ítems del "No incluye" que no se agregaron>
```

## Restricciones clave

- **Nunca** permitir que un wireframe contradiga una regla de negocio escrita.
- **Nunca** agregar un campo o pantalla solo porque es común en ese tipo de apps; debe estar justificado por la HU.
- **Nunca** asumir un canal digital (app, web, WhatsApp) si el PRD lo marca como punto abierto.
- **Nunca** diseñar estados de bloqueo, penalización o costo sin que la HU o el PRD lo autoricen.
- **Nunca** tratar una suposición de negocio como si ya estuviera decidida.

## Checklist de calidad antes de entregar

- [ ] Leí la HU completa: historia, contexto, alcance, reglas, escenarios Gherkin, supuestos y puntos abiertos.
- [ ] Cada escenario Gherkin (camino feliz + casos borde) tiene una pantalla o estado visual asociado.
- [ ] No diseñé pantallas ni campos que la HU no solicite.
- [ ] No inventé reglas de negocio ni alcance.
- [ ] Marqué explícitamente las ambigüedades de negocio como pendientes.
- [ ] Documenté las decisiones de interfaz que resolví con criterio de diseño.
- [ ] Revisé los artefactos generados por la herramienta y señalé elementos extra no solicitados.
- [ ] Respeté todos los ítems marcados como "Fuera de alcance".
- [ ] Entregué un proyecto/archivo por HU, guardado en la carpeta del proyecto.
- [ ] Incluí notas claras de qué escenario cubre cada pantalla.

## Ejemplo aplicado

HU-01 *Agendamiento de cita médica* → 3 pantallas web desktop en Stitch:

1. **Selección de médico, fecha y hora** → cubre el *When* del camino feliz.
2. **Confirmación de cita agendada** → cubre el *Then* del camino feliz y la notificación.
3. **Error: horario no disponible** → cubre el caso borde de conflicto de horario para el mismo médico.

Elementos como código de reserva, descarga de comprobante PDF, copago o ubicación del consultorio fueron identificados como **no solicitados por la HU** y reportados como propuestas pendientes.
