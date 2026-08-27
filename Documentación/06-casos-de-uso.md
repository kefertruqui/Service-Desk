# 06 · Casos de uso

> Actor principal: **usuario final** (rol `user`) y **administrador** (rol `admin`). Sistema: Mesa de Servicios OATI.

## Actor: Usuario final (docente / funcionario)

### CU-01 · Iniciar sesión
**Precondición:** tener credenciales institucionales (demo: cualquier usuario).  
**Flujo:** abre la app → ingresa usuario y contraseña → el sistema simula autenticación (1.2 s) → aterriza en "Mis Tickets".  
**Alternativa:** si el usuario contiene `admin`/`martinez`, entra como administrador.  
**Postcondición:** sesión iniciada con rol `user` o `admin`.

### CU-02 · Registrar una nueva solicitud
**Precondición:** sesión iniciada.  
**Flujo:** menú "Nueva Solicitud" → selecciona categoría → selecciona subcategoría → completa ubicación, título, descripción (y opcional: teléfono, adjuntos) → "Enviar Solicitud".  
**Alternativa:** campos obligatorios vacíos → mensajes de error en rojo, no envía.  
**Postcondición:** ticket creado con estado `Registrado`, tipo `Sin Clasificar`, prioridad `Sin asignar`; se muestra `TicketSuccess` con número de ticket y vista previa de correo.

### CU-03 · Consultar mis tickets
**Precondición:** sesión iniciada.  
**Flujo:** menú "Mis Tickets" → ve la lista con número, título, categoría, fecha y estado → puede buscar por texto, filtrar por estado/tipo y paginar.  
**Postcondición:** lista de tickets filtrada/ordenada en pantalla.

### CU-04 · Ver el seguimiento de un ticket
**Precondición:** sesión iniciada, ticket visible.  
**Flujo:** hacer clic sobre la tarjeta del ticket → se abre un **panel slide-in** desde la derecha (mismo diseño que el panel administrador) con: cabecera azul (número, título, badge estado, prioridad), card "Seguimiento" con `StatusStepper mode="timeline"`, card "Solicitud" con datos completos del ticket. Botón × para cerrar.  
**Postcondición:** usuario ve el avance del ticket en panel dedicado.

### CU-05 · Calificar un ticket cerrado
**Precondición:** existe un ticket en estado `Cerrado` o `Remitido a otra dependencia` sin `rating`.  
**Flujo:** el ticket pendiente aparece primero, resaltado con borde ámbar y pill "Calificar" → al pasar el mouse sobre la tarjeta aparece el overlay de encuesta con calificación de 1 a 5 estrellas → aparece "¡Gracias!" → si era Remitido pasa a Cerrado → el ticket desaparece del listado con animación `ticket-leaving`.  
**Postcondición:** el ticket guarda `rating` (1–5) y ya no pide calificación.

### CU-06 · Consultar la base de conocimiento
**Precondición:** sesión iniciada.  
**Flujo:** menú "Base de Conocimiento" → busca o filtra por categoría → abre un artículo → lee pasos y recomendaciones.  
**Postcondición:** información de autoayuda mostrada. (Los botones "Útil/No útil" son visuales, sin persistencia.)

### CU-07 · Solicitar servicio desde el catálogo
**Precondición:** sesión iniciada (la pantalla de catálogo **no está enlazada** en el menú hoy — ver pendientes).  
**Flujo previsto:** consultar categorías/subcategorías del catálogo y pulsar "Solicitar servicio" → salta a Nueva Solicitud.  
**Estado actual:** la vista existe en `App.tsx` pero no hay forma de navegar a ella.

## Actor: Administrador (Mesa de Servicios OATI)

### CU-08 · Ver la cola de tickets
**Precondición:** sesión iniciada con rol `admin`.  
**Flujo:** menú "Panel Administración" → tabla de tickets con solicitante, título, estado, prioridad, SLA, asignado y acciones. Filtros por búsqueda/estado/tipo/prioridad.  
**Regla:** la cola se ordena automáticamente: remitidos → sin clasificar (por antigüedad) → por urgencia de SLA.  
**Postcondición:** cola priorizada mostrada.

### CU-09 · Revisar notificaciones
**Precondición:** rol admin.  
**Flujo:** campana en el encabezado → dropdown con notificaciones (nuevas solicitudes, SLA por vencer/vencido) → clic abre el ticket en el panel de gestión.  
**Postcondición:** notificaciones marcadas como leídas (en memoria).

### CU-10 · Clasificar y priorizar un ticket
**Precondición:** rol admin, ticket `Sin Clasificar`.  
**Flujo:** botón "Clasificar" → panel de gestión → elegir tipo (Incidente/Solicitud/Problema) y prioridad (Crítica/Alta/Media/Baja) → "Guardar clasificación".  
**Regla:** sin tipo y prioridad válidos el botón queda deshabilitado; el SLA se arma con las horas de la prioridad.  
**Postcondición:** ticket `Clasificado` con `type` y `priority` definidos y `slaHours` asignado.

### CU-11 · Asignar responsables
**Precondición:** rol admin, ticket clasificado.  
**Flujo:** en el panel de gestión → buscar y marcar uno o más técnicos → "Guardar cambios".  
**Postcondición:** `ticket.technician` con los nombres; si estaba antes de `Asignado`, pasa a `Asignado` y se activa el SLA (`slaStartedAt`).

### CU-12 · Iniciar atención y resolver un ticket asignado
**Precondición:** rol admin, ticket asignado a un responsable.  
**Flujo:** en "Tickets Asignados" → si el ticket está `Asignado`, el botón es **"Iniciar atención"** (lo pasa a `En atención`); si está `En atención`, el botón es **"Resolver"** → panel unificado → registrar **causa raíz** y **workaround** (opcionales), **pasos de diagnóstico**, y la **solución descriptiva** (obligatoria) + opcional **evidencia** → "Registrar solución".  
**Regla:** el estado pasa a `Resuelto` (derivado de la acción); si el ticket venía de `Asignado`, el historial registra el paso `En atención`. El SLA se detiene, la solución queda como **comentario público** y la evidencia en `Ticket.solutionEvidence`.  
**Postcondición:** ticket `Resuelto` con actividades "Estado cambiado" y la solución registrada.

> **Nota:** al abrir el panel de un ticket `Asignado` se pulsa **"Iniciar atención"** (botón explícito) para pasar a `En atención`; solo entonces aparecen los pasos de diagnóstico y el botón "Registrar solución".

### CU-12b · Cerrar un ticket resuelto
**Precondición:** rol admin, ticket `Resuelto`.  
**Flujo:** botón **"Cerrar"** en "Tickets Asignados" → se cierra con **código de cierre `resuelto`** (`handleClose`, `AssignedTickets.tsx:376`).  
**Postcondición:** ticket `Cerrado`, con actividad "Ticket cerrado" y `closureCode: 'resuelto'`.

### CU-12c · Escalar / reasignar un ticket
**Precondición:** rol admin, ticket con responsable (estado activo).  
**Flujo:** en el panel del ticket → enlace **"Escalar ticket"** → buscar y elegir un nuevo responsable + **motivo de escalación** (opcional) → confirmar.  
**Postcondición:** `ticket.technician` reasignado al nuevo responsable; actividades "Ticket escalado" (origen → destino) y, si hay motivo, "Motivo: …". El estado no cambia.

### CU-13 · Agregar nota interna
**Precondición:** rol admin, ticket clasificado.  
**Flujo:** panel de gestión → escribir en "Nota interna" → guardar.  
**Postcondición:** comentario con `isInternal: true` añadido al ticket.

### CU-14 · Remitir a otra dependencia
**Precondición:** rol admin, ticket `Sin Clasificar`.  
**Flujo:** bloque "¿La solicitud no corresponde a la OATI?" → "Remitir" → completar correo destino y revisar mensaje automático → "Confirmar remisión" → "Remitir solicitud".  
**Regla:** con remisión activa, la clasificación y el SLA quedan bloqueados.  
**Postcondición:** ticket `Remitido a otra dependencia`, con mensaje automático como comentario público y sin SLA.

### CU-15 · Ver detalle de ticket remitido
**Precondición:** rol admin, ticket `Remitido a otra dependencia` (estado terminal).  
**Flujo:** botón "Ver detalle" en la cola del Panel de Administración → abre panel de gestión en modo solo lectura.  
**Postcondición:** el ticket permanece en estado `Remitido a otra dependencia` (no se cierra).

### CU-16 · Exportar reporte de tickets a CSV
**Precondición:** rol admin.  
**Flujo:** en el encabezado del Panel de Administración → botón **"Descargar reporte"** → se descarga `reporte-tickets-YYYY-MM-DD.csv` con una fila por ticket (Número, Título, Tipo, Estado, Prioridad, Solicitante, Responsable, Categoría, Subcategoría, Fecha de creación, SLA (horas), Ubicación).  
**Regla:** el CSV incluye BOM (`\uFEFF`) y usa `;` como separador para abrir correctamente en Excel. Usa los tickets de la cola actual (ordenados).  
**Postcondición:** archivo CSV descargado (`AdminDashboard.tsx:520`).

## Reglas transversales

- **Sin clasificar ≠ gestionable:** los tickets `Sin Clasificar` no permiten asignar responsables ni avanzar de estado hasta clasificarlos.
- **SLA solo con prioridad:** `Sin asignar` ⇒ `slaHours = 0` ⇒ SLA `sin_iniciar`.
- **Cronómetro:** se activa al pasar a `Asignado` (u otro estado de `slaRunningStatuses`) si no estaba activo.
- **Tickets abiertos (badge del menú):** estados distintos de `Cerrado` y `Remitido a otra dependencia`.
- **Calificación única:** los tickets cerrados con `rating` desaparecen del listado (no se pueden recalificar desde la UI).
