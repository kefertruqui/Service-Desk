# 05 · Procesos y flujos

## Flujo de vida del ticket

```
Registrado → Clasificado → Asignado → En atención → Resuelto → Cerrado
Remitido a otra dependencia  (estado terminal especial)
```

Estado actual en cada paso:

| Estado | Quién lo provoca | Cómo se llega |
|---|---|---|
| `Registrado` | Usuario | Al enviar una solicitud nueva (tipo `Sin Clasificar`) |
| `Clasificado` | Admin | Al guardar tipo + prioridad en el panel (desde `Sin Clasificar`) |
| `Asignado` | Admin | Al guardar con responsable(s) asignados y el ticket ya clasificado |
| `En atención` | Técnico | Al pulsar "Iniciar atención" o "Reanudar" desde `AssignedTickets` |
| `Resuelto` | Técnico | Al registrar la solución (obligatoria) desde `AssignedTickets` |
| `Cerrado` | Técnico | Al cerrar un ticket `Resuelto` con código de cierre desde `AssignedTickets` |
| `Remitido a otra dependencia` | Admin | Al remitir (solo desde tickets `Sin Clasificar`) |

> **Nota:** el estado **no se elige manualmente**: el sistema lo deriva de la acción guardada (asignar → `Asignado`, iniciar atención → `En atención`, resolver → `Resuelto`, cerrar → `Cerrado`). Las transiciones se registran en `Ticket.activities`.

## Registrar una solicitud (usuario)

1. Usuario entra a **Nueva Solicitud**.
2. Selecciona categoría y subcategoría, completa ubicación, título, descripción (y opcionalmente adjuntos y teléfono).
3. Al enviar, `App.handleFormSubmit` (`src/App.tsx:58`) crea el ticket:
   - `type: 'Sin Clasificar'`, `status: 'Registrado'`, `priority: 'Sin asignar'`, `slaHours: 0`.
   - Número `TK-XXXX` autogenerado (el siguiente con 8 tickets mock es `TK-0909`).
   - Actividad inicial "Solicitud registrada".
4. Navega a `ticket-success` con la confirmación y la vista previa del correo.

## Clasificación, prioridad y SLA (admin)

Flujo en el panel lateral de gestión de `AdminDashboard`:

1. Abrir el ticket (botón **Clasificar** si está `Sin Clasificar`).
2. Elegir **Tipo** (`Incidente | Solicitud | Problema`) y **Prioridad/SLA** (`Crítica | Alta | Media | Baja`).
   - Al elegir prioridad se asigna `slaHours` según `SLA_HOURS_BY_PRIORITY` (Crítica 1h, Alta 3h, Media 6h, Baja 12h).
3. Guardar → estado pasa a `Clasificado` (o `Asignado` si además hay responsables y el ticket estaba antes de `Asignado`).
4. El cronómetro del SLA (`slaStartedAt`) **se activa al pasar a un estado en `slaRunningStatuses`** (Asignado, En atención, Remitido a otra dependencia) si aún no estaba activo.

Reglas extra de la clasificación:

- Volver a `Sin Clasificar` revierte el ticket a `Registrado` y borra el SLA previo en la UI.
- Un ticket **sin clasificar** no puede asignar responsables (la sección "Asignar responsables" solo aparece clasificado).
- La clasificación genera actividades ("Solicitud clasificada como X", "Prioridad establecida como Y · SLA Nh").

### Indicadores visuales en el panel de gestión

### Indicadores visuales en la cola de tickets

La cola de tickets del admin usa **tarjetas individuales** con semáforos visuales:

| Elemento visual | Significado |
|---|---|
| Borde lateral verde | SLA en tiempo |
| Borde lateral amarillo | SLA por vencer (≥80% del tiempo) |
| Borde lateral rojo | SLA vencido |
| Borde lateral gris | Remitido a otra dependencia |
| Fondo de tarjeta | Color claro según estado SLA |

El botón de acción por tarjeta varía según el estado:
- **Clasificar** (naranja): tickets `Sin Clasificar`
- **Seguimiento** (azul): tickets clasificados
- **Ver detalle** (gris): tickets `Remitido a otra dependencia` (estado terminal, ya no se cierra)

La tarjeta completa es clickeable y abre el panel de gestión.

## SLA (Acuerdo de Nivel de Servicio)

Toda la lógica vive en `src/utils/sla.ts`.

### Horas por prioridad

| Prioridad | Horas SLA |
|---|---|
| Crítica | 1 h |
| Alta | 3 h |
| Media | 6 h |
| Baja | 12 h |
| Sin asignar | 0 h (sin SLA) |

### Estados donde corre el reloj (`slaRunningStatuses`)

`Asignado`, `En atención`, `Remitido a otra dependencia`.

Requisito para correr: estado en la lista **y** `ticket.slaStartedAt` definido.

### Cálculo y estados del SLA

- `getSlaState(ticket, now)` → `sin_iniciar | ok | warning | expired`.
- Razones: `expired` cuando el tiempo transcurrido ≥ `slaHours`; `warning` cuando va ≥ 80 % del tiempo; si no, `ok`.
- `getSlaRemainingHours` → horas restantes (0 si vencido).
- La UI muestra etiquetas con color: verde (En tiempo), naranja (Por vencer), rojo (Vencido).

### Impacto en la cola del admin

`AdminDashboard` reordena automáticamente la cola por urgencia:

1. Primero los `Remitido a otra dependencia`.
2. Luego los `Sin Clasificar` (por fecha más antigua).
3. Luego por SLA: vencidos → por vencer → resto, y dentro por horas restantes.

Además genera **notificaciones dinámicas** (`sla-warning` / `sla-expired`) y la **alarma SLA** en banner superior.

## Asignación de responsables (admin)

- Lista fija de técnicos (constante `technicians` en `AdminDashboard.tsx:22`): Carlos Gómez, Sandra Ríos, Luis Perdomo, Diana Morales, Julián Torres.
- Se permite asignar **varios** (se guardan en `ticket.technician` separados por `", "`).
- Al asignar se registra actividad "Responsable asignado" / "Responsables asignados".
- Si el ticket está clasificado y pasa de `Clasificado` a `Asignado`, se activa el SLA.

## Seguimiento de tickets asignados — `AssignedTickets`

Vista de **soporte ITIL 4** de la Mesa de Servicios, en el menú principal. Solo muestra los tickets cuyo responsable (`technician`) coincide con el usuario logueado. Diseño **minimalista**: un solo botón de acción por ticket que abre un panel unificado con todo el proceso de soporte.

### Flujo del técnico

1. El técnico ve sus tickets agrupados por responsable, ordenados por cantidad de tickets.
2. Cada ticket tiene **un solo botón** según su estado:
   - **"Iniciar atención"** (naranja) si está `Asignado` → lo pasa a `En atención` (`handleStartWork`, `AssignedTickets.tsx:387`).
   - **"Resolver"** / **"Registrar solución"** si está `En atención` → lo pasa a `Resuelto` (`handleResolve`, `AssignedTickets.tsx:325`).
   - **"Cerrar"** si está `Resuelto` → lo pasa a `Cerrado` con código de cierre `resuelto` (`handleClose`, `AssignedTickets.tsx:376`).
   - Ninguno para `Cerrado` o `Remitido a otra dependencia`.
3. Al hacer clic en "Iniciar atención" o abrir el panel de un ticket en atención, se muestra el **panel unificado** con el proceso completo:
   - **Descripción del problema** (colapsable): datos del solicitante, categoría, adjuntos, responsable(s).
   - **Diagnóstico**: causa raíz (opcional) + solución temporal/workaround (opcional).
   - **Pasos de diagnóstico**: lista de pasos predefinidos según categoría + pasos personalizados. Cada paso permite registrar el resultado: ✅ Correcto, ⚠️ Inconveniente, ℹ️ Requiere información, con campo de nota.
   - **Solicitar información** (discreto): enlace que despliega un textarea para pedir datos al solicitante.
   - **Solución descriptiva** (obligatoria): textarea visible al solicitante como comentario público.
   - **Evidencia** (opcional): zona de arrastrar/soltar o selector de archivos.
   - **Escalar ticket** (enlace): ver más abajo la sección "Escalamiento / reasignación".
4. Al "Registrar solución": el ticket pasa a `Resuelto` automáticamente (y se agrega la solución como comentario público).
5. El botón "Cerrar" aparece solo para tickets `Resuelto`.

### Estados internos

El sistema gestiona los estados automáticamente a partir de la acción del técnico:
- `Asignado` → `En atención`: al pulsar **"Iniciar atención"** (botón explícito, no oculto). Registra actividad "Estado cambiado" y pone `slaStartedAt` si no lo tenía.
- `En atención` → `Resuelto`: al guardar solución. Si el ticket venía de `Asignado`, el historial registra el paso intermedio a `En atención`.
- `Resuelto` → `Cerrado`: al pulsar **"Cerrar"**, con código de cierre `resuelto`.

### Escalamiento / reasignación

- Enlace **"Escalar ticket"** dentro del panel (`AssignedTickets.tsx`). Despliega un formulario con:
  - **Buscador + lista de técnicos** para elegir el nuevo responsable (`escalateSearch` / `escalateTo`, `AssignedTickets.tsx:87-89`).
  - Campo **"Motivo de escalación"** (opcional).
  - Al confirmar (`handleEscalate`, `AssignedTickets.tsx:301`): se reasigna `ticket.technician` al nuevo responsable y se registran las actividades "Ticket escalado" (origen → destino) y, si hay motivo, "Motivo: …". El estado no cambia.
  - El botón se deshabilita si no hay técnico elegido.

### Panel unificado de resolución

Secciones del panel (orden de arriba a abajo):

| Sección | Contenido | Obligatorio |
|---|---|---|
| Descripción del problema | Datos del solicitante, categoría, teléfono, ubicación, descripción, adjuntos, responsable(s) | Solo lectura |
| Diagnóstico | Causa raíz + solución temporal (workaround) | No |
| Pasos de diagnóstico | Lista predefinida por categoría + pasos personalizados | No |
| Solicitar información | Textarea discreto para pedir datos al solicitante (se agrega como comentario público sin cambiar el estado) | No |
| Solución descriptiva | Textarea visible al solicitante como comentario público | **Sí** |
| Evidencia | Zona de arrastrar/soltar o selector de archivos | No |

### Pasos de solución por categoría

El sistema carga pasos predefinidos según `ticket.category`:

| Categoría | Pasos predefinidos |
|---|---|
| Correo Institucional | Verificar credenciales → Validar configuración cliente → Probar acceso web → Restablecer contraseña → Confirmar envío/recepción |
| Conectividad | Verificar equipo red → Validar IP/DNS → Probar ping → Reiniciar servicios → Confirmar acceso |
| Equipos y Periféricos | Diagnosticar hardware → Verificar conexiones → Instalar drivers → Probar funcionamiento → Documentar configuración |
| Software | Verificar requisitos → Validar licenciamiento → Instalar/actualizar → Configurar → Probar con usuario |
| Solicitudes de Servicio | Validar autorización → Ejecutar solicitud → Verificar resultado → Confirmar con usuario |
| Plataformas Institucionales | Verificar acceso → Validar permisos → Configurar acceso → Probar funcionalidad → Confirmar con usuario |
| *Cualquier otra* | Diagnosticar → Aplicar solución → Verificar resultado → Confirmar con usuario |

El técnico puede:
1. **Registrar el resultado** de cada paso ejecutando el botón de estado correspondiente (✅ Correcto / ⚠️ Inconveniente / ℹ️ Requiere información).
2. **Agregar notas** a cada paso con el detalle del resultado (campo de texto que aparece al seleccionar un estado).
3. **Agregar pasos personalizados** si el caso lo requiere (campo de texto + Enter o botón "Agregar").
4. **Eliminar** pasos personalizados (botón × al pasar el ratón).
5. Los pasos se guardan en `ticket.solutionStages` como array de `SolutionStage`.

### Campos ITIL 4 en el ticket

| Campo | Tipo | Propósito |
|---|---|---|
| `rootCause` | string | Causa raíz identificada por el técnico |
| `workaround` | string | Solución temporal mientras se resuelve la causa raíz |
| `closureCode` | enum | Código de cierre estandarizado (resuelto, resuelto_con_workaround, no_resuelto, duplicado, cancelado) |
| `solutionStages` | SolutionStage[] | Pasos de solución ejecutados (predefinidos por categoría + personalizados) |

> Estos campos se registran en la resolución del ticket y quedan disponibles para reporting y base de conocimiento.

## Nota interna (admin)

El campo "Nota interna" añade un `TicketComment` con `isInternal: true`. La UI de usuario no muestra comentarios actualmente, pero la intención es que `isInternal` marque lo que solo ve la mesa.

## Remitir a otra dependencia (admin)

Solo disponible para tickets `Sin Clasificar` (bloque ámbar en el panel de gestión):

1. Activar **Remitir**.
2. Completar **correo destino** y revisar/editar el **mensaje automático** (se rellena con plantilla: "Su solicitud fue remitida a la dependencia responsable…").
3. Confirmar → el ticket queda:
   - `status: 'Remitido a otra dependencia'`.
   - Sin SLA (no se activa), sin clasificar.
   - Con un comentario público (el mensaje automático) y una actividad "Solicitud remitida a {correo}".
4. En la cola, el ticket remitido se atenúa y su botón de acción cambia a **"Ver detalle"**. El cierre del remitido lo hace el propio usuario al calificarlo en "Mis Tickets" (Remitido → Cerrado).

## Cierre y encuesta (usuario)

1. El técnico cierra un ticket desde `AssignedTickets` (botón "Cerrar ticket" cuando el estado es `Resuelto`).
2. Al cerrar, se selecciona un **código de cierre**: Resuelto, Resuelto con workaround, No resuelto, Duplicado o Cancelado.
3. El ticket pasa a `status: 'Cerrado'`.
4. En **Mis Tickets**, los tickets `Cerrado` y `Remitido a otra dependencia` muestran un **overlay de encuesta** al pasar el mouse sobre la tarjeta: calificación de 1 a 5 estrellas.
   - > **Nota:** La encuesta solo es de estrellas (no incluye pregunta de "¿Se resolvió?").
5. Al calificar: se guarda `rating` (1–5) vía `onUpdateTicket`, se muestra "¡Gracias!" y el ticket **desaparece** del listado con animación. Si era `Remitido a otra dependencia`, pasa a `Cerrado`.
6. Los tickets cerrados sin calificar se ordenan primero y generan el aviso ámbar "X solicitudes por calificar".

## Notificaciones (admin)

- **Estáticas:** `mockNotifications` (`src/data/mockData.ts:260`) — "nueva solicitud por clasificar" e "info".
- **Dinámicas:** se calculan en cada render desde los tickets con SLA en `warning`/`expired` (prefijos `slaw-` / `slae-`).
- Campana con contador de no leídas; al abrir el dropdown se marcan todas como leídas (Set local, no persiste).
- Al hacer clic en una notificación con `ticketId`, abre el panel de gestión de ese ticket.

## Login (demo)

`LoginPage` simula autenticación LDAP con `setTimeout(1200ms)`:

- Usuario que contenga `admin` o `martinez` → `adminUser` (rol admin).
- Cualquier otro → `currentUser` (rol user).

No hay registro de usuarios (por diseño): la información del usuario vendría del directorio activo.

## Envío de correos (simulado)

No hay envío real. Existen:

- Vista previa del correo de confirmación en `TicketSuccess`.
- Mensaje automático de remisión editable en el flujo de remisión.
- Textos que avisan "recibirá confirmación a su correo institucional".
