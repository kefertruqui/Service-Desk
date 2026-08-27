# 04 · Interfaz y pantallas

> Cómo se llega a cada pantalla, quién la ve y qué contiene.
> La navegación la controla `App.tsx` (valor de `View`) y el menú lo pinta `Layout.tsx`.

## Mapa de pantallas (vistas de `View`)

| `View` | Componente | Rol que la ve | Cómo se llega |
|---|---|---|---|
| `login` | `LoginPage` | Todos (no autenticados) | Estado inicial; o al cerrar sesión |
| `new-request` | `NewRequest` | Usuario y admin | Menú "Nueva Solicitud" |
| `my-tickets` | `MyTickets` | Usuario y admin | Menú "Mis Tickets" (y aterrizaje tras login) |
| `ticket-detail` | `TicketDetail` | — | **No enlazada** (placeholder; ver pendientes) |
| `ticket-success` | `TicketSuccess` | Usuario | Tras enviar una solicitud (`handleFormSubmit`) |
| `admin` | `AdminDashboard` | Solo `role: 'admin'` | Menú "Panel Administración" (visible solo para admin) |
| `assigned-tickets` | `AssignedTickets` | Usuario y admin (menú base) | Menú "Tickets Asignados" (en el menú principal para todos) |
| `admin-ticket` | `TicketDetail` | — | **No enlazada** (placeholder; ver pendientes) |
| `knowledge-base` | `KnowledgeBase` | Usuario y admin | Menú "Base de Conocimiento" |
| `service-catalog` | `ServiceCatalog` | — | **No enlazada en el menú** (ver pendientes) |

### Layout común (`Layout.tsx`)

Casi todas las pantallas se muestran dentro de `Layout`, que dibuja:

- **Barra lateral izquierda** (azul `#005A7E`): menú principal + sección "Administración" si `user.role === 'admin'`.
- **Contenido principal** a la derecha (scroll propio), donde va el `children`.
- En móvil, la barra lateral se convierte en **overlay deslizable** con fondo oscuro.
- El ítem "Mis Tickets" muestra un **badge** con el número de tickets abiertos (`openTicketCount`, calculado en `App.tsx:76` como tickets cuyo estado no es `Cerrado` ni `Remitido a otra dependencia`).
- El ítem "Tickets Asignados" muestra un **badge** con el número de tickets que tienen al menos un responsable (`assignedTicketCount`, calculado en `App.tsx` como tickets con `technician` no vacío).

Menú visible para **todos** (menú principal): Nueva Solicitud · Mis Tickets · Tickets Asignados · Base de Conocimiento.
Menú visible solo para **admin** (se añade): sección "Administración" → Panel Administración.

> El ítem **"Tickets Asignados"** está en el menú principal para todos los usuarios (no solo admin). Solo muestra tickets cuyo responsable (`technician`) coincide con el usuario logueado, así que para un usuario normal generalmente estará vacío.

---

## 1. Login (`LoginPage`)

Login demo. Se pide usuario y contraseña; tras 1.2 s simula autenticación.

- Si el usuario contiene `admin` o `martinez` → entra como **admin** (`adminUser`).
- Cualquier otro → entra como **usuario** (`currentUser`).

Elementos: barra superior de marca (logo UA) con el botón **`ThemeToggle` (sol/luna)** para alternar el modo día/noche, tarjeta con icono de escudo, campos usuario/contraseña, botón "Iniciar sesión" con spinner, mensaje de error, aviso de demo y pie con copyright.

> El toggle de tema solo está visible en esta pantalla (Login). Una vez dentro, no hay control de tema en `Layout`. Ver `02-arquitectura.md` (sección `useTheme`).

---

## 2. Nueva Solicitud (`NewRequest`)

Formulario en un panel blanco. Estructura por secciones:

- **Encabezado:** título "Nueva Solicitud" + descripción y fecha/hora actual.
- **Tarjeta del usuario (no editable):** avatar (iniciales + punto verde), nombre, cargo, email, dependencia y sede — autocompletados desde `user`.
- **Paso 1 · Categoría:** lista de botones con las 7 categorías de `categoryTree`.
- **Paso 2 · Subcategoría** (aparece al elegir categoría): chips seleccionables con las subcategorías de esa categoría.
- **Paso 3 · Información de la solicitud:**
  - Ubicación (obligatoria).
  - Teléfono de contacto (opcional).
  - Título (obligatorio).
  - Descripción detallada (obligatoria).
  - **Adjuntos (opcional):** zona de arrastrar/soltar o selector de archivos; muestra chips con nombre y tamaño; se puede quitar cada uno.
- **Barra de acciones:** "Cancelar" (va a `my-tickets`) y "Enviar Solicitud".

Validación: categoría, subcategoría, título y descripción obligatorios (mensajes en rojo bajo el campo).

> El formulario es **genérico** (no cambia según la categoría). La especificación original pedía plantillas por categoría; ver `08-pendientes-y-brechas.md`.

---

## 3. Mis Tickets (`MyTickets`)

Listado con panel slide-in de detalle. Secciones:

- **Encabezado:** título + botón "Nueva Solicitud".
- **Filtros:** buscador (número, título o categoría), selector de **estado** y selector de **tipo**.
- **Aviso ámbar** si hay tickets cerrados sin calificar ("X solicitudes por calificar").
- **Lista de tickets (8 por página), tarjetas clickeables:** cada tarjeta muestra número, pill ámbar "Calificar" si aplica, título, categoría · subcategoría, fecha, `StatusBadge` y flecha →. Clic abre el **panel slide-in** de detalle.
- **Panel slide-in** (mismo diseño que el panel administrador):
  - **Cabecera azul `#005A7E`:** número, título truncado, badge de estado, badge de prioridad (si aplica), fecha de creación, botón cerrar ×.
  - **Encuesta** (solo Cerrado / Remitido): overlay en tarjeta con calificación de 1 a 5 estrellas. Al calificar se guarda `rating`, se muestra "¡Gracias!" y el ticket se cierra (Remitido → Cerrado). Animación `ticket-leaving` en el listado.
  - **Seguimiento:** card con `StatusStepper mode="timeline"` (barra de progreso + lista vertical cronológica con estados, autores y fechas; estrellas en "Cerrado" si hay calificación).
  - **Solicitud:** card con avatar del solicitante, grid de datos (categoría, subcategoría, tipo, ubicación, fecha de registro, contacto), descripción y adjuntos.
- **Paginación:** "Mostrando X–Y de N tickets" + controles ‹ › con numeración compacta (…).

Datos: recibe `tickets` por props; busca/filtra/ordena localmente. Ordena primero los tickets cerrados pendientes de calificación.

---

## 4. Detalle del Ticket (`TicketDetail`) — PLACEHOLDER

Solo muestra encabezado + resumen del ticket (número, tipo, estado, prioridad, título, fechas, técnico asignado y barra de SLA si hay `slaRemaining`) y un cuadro punteado con el texto *"Las próximas secciones aparecerán aquí…"*.

No está enlazada desde ningún menú ni acción. Ver `08-pendientes-y-brechas.md`.

---

## 5. Éxito al registrar (`TicketSuccess`)

Pantalla de confirmación tras crear un ticket:

- Icono de éxito verde + "Solicitud registrada exitosamente".
- Número del ticket (recuadro azul).
- Tarjeta "Estado inicial: Registrado" y "Próximo paso: Clasificación OATI".
- Lista de pasos siguientes (confirmación por correo, clasificación, seguimiento, notificaciones).
- Acciones: "Ver mis tickets" y "Crear nueva solicitud".
- **Vista previa del correo de confirmación** (asunto `[OATI] Recepción de solicitud – {número}` y cuerpo simulado).

---

## 6. Panel de Administración (`AdminDashboard`)

Solo visible para `role: 'admin'`. Estructura:

- **Encabezado:** título + campana de **notificaciones** (dropdown con contador de no leídas; al abrir se marcan todas como leídas en un `Set` local) + botón **"Descargar reporte"** (exporta a CSV).
- **Exportar reporte CSV** (`exportReport`, `AdminDashboard.tsx:520`): descarga un archivo `reporte-tickets-YYYY-MM-DD.csv` con una fila por ticket (Número, Título, Tipo, Estado, Prioridad, Solicitante, Responsable, Categoría, Subcategoría, Fecha de creación, SLA (horas), Ubicación). Incluye BOM (`\uFEFF`) y usa `;` como separador para abrir bien en Excel.
- **Alarma SLA** (si hay tickets en `warning`/`expired`): banner rojo o naranja con el resumen "X vencidas y Y por vencer".
- **Cola de tickets (tarjetas):** diseño de tarjetas individuales donde cada ticket se muestra como una card:
  - **Borde lateral de color** según estado SLA (verde/amarillo/rojo/gris)
  - **Fondo de tarjeta** con color claro según SLA
  - **Contenido:** número + fecha + responsable, título truncado, categoría/subcategoría
  - **Barra de progreso del ciclo de vida** (`StatusStepper mode="compact"`): barra horizontal segmentada que muestra visualmente el avance del ticket (verde = completado, gris = pendiente), con una fracción numérica (ej: `3/7`) a la derecha.
  - **Botón de acción** a la derecha que cambia según el estado:
    - **"Clasificar"** (naranja): tickets `Sin Clasificar`
    - **"Seguimiento"** (azul): tickets clasificados
    - **"Ver detalle"** (gris): tickets `Remitido a otra dependencia` (ya no se cierra, se queda en Remitido)
  - La tarjeta completa es clickeable y abre el panel de gestión
  - **Tiempo restante SLA** visible junto al botón cuando hay SLA activo
  - Filtros: buscar, estado, tipo, prioridad.
  - **Ordenación automática** de la cola: primero tickets `Remitido a otra dependencia`, luego `Sin Clasificar` (por fecha más antigua), luego por SLA (vencidos → por vencer → resto, y dentro por horas restantes).
  - Paginación adaptativa (3–8 tarjetas según altura de pantalla) con badges naranjas de "pendientes por clasificar" en cada página.

### Panel lateral de gestión (slide-in)

Al pulsar Clasificar/Gestionar/Seguimiento se abre un panel desde la derecha con:

- **Cabecera azul** con número del ticket, `StatusBadge`, `PriorityBadge` (oculto si remitido), y fecha de creación (sin "Actualizado"). Botón × para cerrar.
- **Tarjeta "Seguimiento"** (unifica avance + actividad):
  - Barra de progreso continua con estado actual y progreso (`X/Y`).
  - Lista vertical cronológica (`StatusStepper mode="timeline"`): cada paso muestra nombre del estado, autor que ejecutó la acción, descripción de la actividad y fecha. Pasos completados en verde (✓), actual en azul (● pulsante), pasos no aplicados en gris con borde punteado y "No Aplica".
  - Si el ticket fue remitido, el flujo muestra: Registrado → Remitido a otra dependencia → Cerrado (Cerrado pendiente, se completa al calificar).
  - Si el ticket está cerrado y tiene calificación, junto a "Cerrado" aparecen las **estrellas** con la nota.
- **Datos de la solicitud** (compacto): solicitante (avatar pequeño, nombre, cargo, dependencia), categoría/subcategoría, tipo (oculto si remitido), ubicación, fecha de registro, contacto, descripción (max 4 líneas) y adjuntos.
- **Tarjeta "Gestión del ticket"** (oculta si el ticket está remitido o cerrado) con tres secciones internas:
  - **Remitir** (solo tickets `Sin Clasificar`): bloque ámbar compacto con botón Remitir/Cancelar/Editar.
  - **Clasificación** (contenedor `rounded-lg border`): selectores de Tipo y Prioridad/SLA. Muestra horas de SLA al seleccionar prioridad.
  - **Responsables** (solo tickets clasificados): buscador + checkboxes, con chips de asignados debajo.
- **Tarjeta "Nota interna"** (oculta si sin clasificar, remitido o cerrado): textarea de gestión interna.
- **Diagnóstico del técnico** (solo si el técnico registró información): causa raíz, solución temporal y pasos de diagnóstico ejecutados con sus estados.
- **Barra inferior** (oculta si remitido o cerrado): pista de validación, "Cancelar" y botón de acción.

### Reglas de habilitación del botón Guardar

- Sin clasificar → exige **tipo ≠ 'Sin Clasificar'** y **prioridad ≠ 'Sin asignar'**.
- Clasificado → exige tipo ≠ 'Sin Clasificar' (puede reclasificar).
- Remisión → exige correo destino no vacío (la clasificación y el SLA quedan bloqueados).

---

## 6.5 Tickets Asignados (`AssignedTickets`)

Vista de **soporte ITIL 4** de la Mesa de Servicios. Aparece en el menú principal (para todos), aunque solo muestra los tickets cuyo responsable (`technician`) coincide con el usuario logueado (los técnicos no tienen un rol de UI propio, se modelan como texto en `Ticket.technician`). Diseño **minimalista**: un solo botón de acción por ticket.

### Estructura principal

- **Encabezado:** título "Tickets Asignados" + subtítulo "Seguimiento de solicitudes por responsable asignado".
- **KPIs (4 tarjetas):** Tickets asignados (total con `technician`), En atención, Por vencer, Resueltos / Cerrados.
- **Filtros:** buscador (número o título), responsable y estado.
- **Contenido agrupado por responsable:** una tarjeta por técnico (avatar de iniciales, nombre, nº de tickets), ordenada por cantidad de tickets.
- Cada ticket muestra número + título en una sola línea (sin recortar), fecha + categoría, badges de estado/prioridad y **un solo botón de acción**:
  - **"Iniciar atención"** (naranja) para tickets `Asignado`.
  - **"Resolver"** (azul) para tickets `En atención`.
  - **"Cerrar"** (gris) para tickets `Resuelto`.
  - Ningún botón para tickets `Cerrado` o `Remitido`.
- El botón **"Cerrar"** (`handleClose`, `AssignedTickets.tsx:376`) cierra el ticket con **código de cierre `resuelto`** y registra la actividad "Ticket cerrado".

### Panel unificado de resolución (slide-in)

Al pulsar "Resolver" se abre un panel desde la derecha con **todo el proceso de soporte**:

| Sección | Contenido | Obligatorio |
|---|---|---|
| Descripción del problema | Avatar, nombre, cargo, dependencia, categoría, teléfono, ubicación, descripción, adjuntos, responsable(s). Colapsable con `<details>`. | Solo lectura |
| Diagnóstico | Causa raíz (textarea) + solución temporal/workaround (textarea) | No |
| Pasos de diagnóstico | Lista de pasos predefinidos según categoría + pasos personalizados. Cada paso tiene 3 botones de estado (✅ Correcto / ⚠️ Inconveniente / ℹ️ Requiere info) y campo de nota. | No |
| Solicitar información | Enlace discreto que despliega textarea para pedir datos al solicitante. Se agrega como comentario público sin cambiar el estado. | No |
| Solución descriptiva | Textarea obligatorio. Visible al solicitante como comentario público. | **Sí** |
| Evidencia | Zona de arrastrar/soltar o selector de archivos. Chips con nombre y tamaño. | No |

### Botones del panel

- **Cancelar** (gris): cierra el panel sin guardar.
- **Registrar solución** (verde): guarda todo y pasa el ticket a `Resuelto`. Deshabilitado si falta la solución descriptiva.
- **Iniciar atención** (naranja, si el ticket está `Asignado`): pasa el ticket a `En atención` y arranca/retoma el cronómetro de SLA (`handleStartWork`).

### Transiciones de estado (técnico)

- **`Asignado` → `En atención`**: al pulsar **"Iniciar atención"** desde el listado o el panel (`handleStartWork`). Registra actividad "Estado cambiado" y pone `slaStartedAt` si no lo tenía.
- **`En atención` → `Resuelto`**: al guardar la solución (`handleResolve`). Si el ticket venía de `Asignado`, primero registra el paso intermedio a `En atención` en el historial. Requiere solución descriptiva + al menos un paso de diagnóstico.
- **`Resuelto` → `Cerrado`**: al pulsar **"Cerrar"** (`handleClose`), con código de cierre `resuelto`.

### Escalamiento / reasignación

- Dentro del panel hay un enlace **"Escalar ticket"** que despliega un formulario de escalamiento (`AssignedTickets.tsx:87-89`, `302-323`):
  - **Buscador + lista de técnicos** para elegir un nuevo responsable (`escalateSearch` / `escalateTo`).
  - Campo **"Motivo de escalación"** (opcional).
  - Al confirmar, se reasigna el `technician` al técnico elegido y se registran las actividades "Ticket escalado" (con técnico de origen → destino) y, si hay motivo, "Motivo: …". El estado del ticket no cambia.
  - El botón se deshabilita si no hay técnico elegido.

---

## 7. Base de Conocimiento (`KnowledgeBase`)

Dos estados internos:

**Listado:**
- Encabezado + buscador (título/resumen) + filtro por categoría (chips).
- Tarjetas de artículos: categoría, nº de vistas 👁, título, resumen (2 líneas), tags y % útil.
- CTA inferior "¿No encontró solución?" → Registrar Solicitud.
- Estado vacío con enlace a nueva solicitud.

**Detalle de artículo** (al hacer clic):
- Botón "Volver", categoría, título, resumen.
- Si el artículo tiene `steps`/`tips` muestra Introducción + Pasos + Recomendaciones; si no, muestra un procedimiento genérico.
- Pie: vistas, % útil, botones "👍 Útil" / "👎 No útil" (visuales, sin lógica de persistencia).

---

## 8. Catálogo de Servicios (`ServiceCatalog`) — sin enlazar

No aparece en el menú (solo existe la vista en `App.tsx`). Si se navegara a `service-catalog` mostraría:

- Encabezado + aviso informativo.
- Grilla de tarjetas por categoría (de `categoryTree`) con subcategorías (3 visibles, botón "Ver más (N)" para expandir) y botón "Solicitar servicio".
- Pie con datos de contacto: teléfono, correo soporte y horario.

Usa su propio mapa de emojis `categoryIcons` (no coincide con la lista de iconos de otras partes).

---

## Otros componentes

- **`StatusBadge` / `PriorityBadge`** (`StatusBadge.tsx`): chips reutilizados en MyTickets, TicketDetail, AdminDashboard y AssignedTickets.
- **`StatusStepper`** (`StatusStepper.tsx`): stepper reutilizable del ciclo de vida del ticket con tres modos:
  - `compact`: barra horizontal segmentada con fracción numérica (ej: `3/7`). Usado en tarjetas del AdminDashboard.
  - `timeline`: barra de progreso continua + lista vertical cronológica con autor, acción y fecha por paso. Usado en el panel lateral de gestión del AdminDashboard, en MyTickets y en AssignedTickets.
  - `full`: stepper vertical con etiquetas, fechas y estrellas de calificación (es el **default** del componente, pero en la UI principal se usa `compact` y `timeline`).
  - Lógica centralizada: `getFlow()` determina la secuencia de estados (remitido → Registrado/Remitido/Cerrado), `getStatusDates()` extrae fechas, `getFlowActivities()` mapea cada estado a su activity correspondiente. En modo timeline marca pasos "No Aplica" cuando se saltea un estado (remisión).
- **`ThemeToggle`** (`ThemeToggle.tsx`): botón sol/luna que alterna el modo día/noche; recibe `theme` y `onToggle` por props. Usado en `LoginPage`.
- **`Layout`** (`Layout.tsx`): contenedor + navegación descrita arriba.

## Nota sobre estilos

Los colores de marca son `#005A7E` (azul), `#34AB1E` (verde), `#EDB02E` (dorado), `#E47113` (naranja), `#A6141D` (rojo). Están definidos como tokens `ua-*` en `src/index.css` (Tailwind v4 `@theme`), pero **la mayoría de componentes los aplica con inline styles hardcodeados**. El **modo día/noche** opera con tokens semánticos (`--bg`, `--surface`, `--accent`, etc.) activados por `[data-theme='dark']` en `<html>`, y se controla con `useTheme` (ver `02-arquitectura.md`). Ver `08-pendientes-y-brechas.md`.
