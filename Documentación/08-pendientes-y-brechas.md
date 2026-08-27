# 08 · Pendientes y brechas

Estado del proyecto: **frontend funcional con datos mock**. Esta lista reúne lo que está a medio construir, sin usar o frágil, para que la persona que reciba el proyecto sepa por dónde seguir.

## Vistas y navegación

| Brecha | Detalle | Archivos |
|---|---|---|
| `TicketDetail` es un placeholder | Solo muestra encabezado + resumen y un cuadro con "Las próximas secciones aparecerán aquí" (detalle del problema, comunicaciones, historial, encuesta). No está enlazada desde ninguna acción: al hacer clic en un ticket en `MyTickets` se usa el timeline inline, no esta vista | `src/components/TicketDetail.tsx` |
| `service-catalog` no está enlazada | La vista existe en `App.tsx` y el componente está completo, pero no hay ítem de menú ni botón que navegue a `service-catalog` | `src/components/ServiceCatalog.tsx`, `src/components/Layout.tsx` |
| `admin-ticket` no está enlazada | Valor de `View` reservado, renderiza `TicketDetail`, sin acceso desde la UI (el admin usa el panel lateral de `AdminDashboard`) | `src/App.tsx`, `src/components/Layout.tsx` |
| `ticket-detail` / `admin-ticket` duplican | Dos vistas apuntan al mismo componente placeholder | `src/App.tsx` |

## Datos exportados sin usar en `src/data/mockData.ts`

| Export | Previsto para | Estado |
|---|---|---|
| `categories` | Lista plana de categorías | Sin uso |
| `institutionalSystems` | 42 sistemas institucionales (para seleccionar en una categoría "Desarrollos Institucionales") | Sin uso |
| `serviceCategories` | Catálogo con iconos, servicios y SLA por categoría | Sin uso (el catálogo usa `categoryTree` + `categoryIcons` propio en el componente) |

## Funcionalidad prevista en la especificación pero no implementada

Fuente de requisitos: `src/imports/pasted_text/oati-service-desk.md` y `oati-service-desk-1.md`.

- **Formulario dinámico por categoría:** la especificación pide plantillas de ayuda según la categoría (ej. correo: "¿qué error presenta?…"; copia de seguridad: sistema, fecha, motivo). Hoy el formulario es genérico.
- **Categoría "Desarrollos Institucionales" con selección de sistema:** la lista `institutionalSystems` no está conectada al formulario.
- **Prioridad calculada automáticamente:** hoy la define el admin en el panel, no el sistema.
- **Dashboard del usuario con KPIs:** tarjetas de tickets abiertos/en atención/pendientes/resueltos/cerrados y acceso rápido (especificado, no implementado).
- **Portal del técnico:** rol `technician` definido en `UserInfo.role` pero sin UI ni flujo propio.
- **Escalamiento por niveles** (admin → área → jefe → técnico): **parcial**. Existe una **reasignación** simple desde `AssignedTickets` (enlace "Escalar ticket" → nuevo responsable + motivo), pero no hay escalamiento **jerárquico por niveles** con reglas de umbral ni historial de escalones.
- ~~**Acciones administrativas fuera de `AssignedTickets`:**~~ **Resuelto:** desde el 20/08/2026 la vista "Tickets Asignados" se reestructuró como flujo ITIL 4 completo. Ahora incluye: Iniciar atención, Solicitar información, Reanudar, Reasignar, Nota interna, Resolver (con causa raíz, workaround y código de cierre) y Cerrar ticket.
- **Encuesta completa al cierre:** encuesta de solo estrellas (1–5) implementada en MyTickets para tickets Cerrado/Remitido.
- **Notificación por correo real** en cada cambio de estado (hoy solo vista previa/aviso en pantalla).
- **Persistencia de artículos y encuestas** (los botones "Útil/No útil" y las vistas de la base de conocimiento son visuales).

## Deuda técnica y puntos frágiles

| Tema | Detalle |
|---|---|
| **Números de ticket frágiles** | `App.tsx` (`handleFormSubmit`) genera `TK-{(tickets.length + 1 + 900)}` → con 8 tickets iniciales sale `TK-0909`. Si la lista cambia de tamaño puede duplicar o saltar números. Convendría un contador/ID real (ej. basado en el último número, no en la longitud) |
| **Estado "En clasificación" sin uso real** | ~~Existe en tipos, timeline y filtros, pero el flujo salta de `Registrado` a `Clasificado`~~ → **Resuelto:** estado eliminado del modelo (ver `03-modelo-de-datos.md`). Los estados solo se derivan de acciones, no se eligen a mano |
| **`slaRemaining` semántica obsoleta** | Campo del tipo usado solo en `TicketDetail`; el cálculo real es dinámico en `src/utils/sla.ts`. Decidir si se elimina o se unifica |
| **`assignedTo` (área) vs `technician` (personas)** | Campo `assignedTo` presente en mocks pero no mantenido por el panel admin, que trabaja con `technician`. Unificar el modelo |
| **IDs de actividad/comentario por timestamp** | Se generan `a-${Date.now()}-s`, `c-${Date.now()}`, etc. Con acciones rápidas pueden colisionar (dos clics en el mismo milisegundo) |
| **Estilos inline hardcodeados** | La mayoría de colores de marca están repetidos como inline styles; existen tokens `ua-*` en `index.css` (`@theme`) que casi no se usan. Migración a clases/utilities o tokens para consistencia |
| **Tema oscuro incompleto** | El modo día/noche (`useTheme` + `ThemeToggle`) existe, pero el toggle **solo está en el login** (no hay control de tema dentro de `Layout`). Además, muchos colores de marca están hardcodeados como inline styles de día y **no se adaptan al modo oscuro**; por ahora el `[data-theme='dark']` solo afecta a los tokens semánticos y a los componentes que los usan |
| **`LoginPage` sin enlace a layout** | El login está fuera de `Layout` (por diseño), pero los colores/estilos del header de marca están duplicados en varias cabeceras de pantalla |
| **`relTime` y utilidades duplicadas** | Formateos de fecha y texto relativo se repiten entre `MyTickets`, `AdminDashboard` y `TicketDetail`; podrían centralizarse |
| **`categories` y `categoryTree` duplican conceptos** | Dos estructuras de categorías distintas (`categories` plana vs `categoryTree` jerárquica); mantener solo la que se use |
| **Notificaciones "leídas" en memoria** | `readIds` es un `Set` local en `AdminDashboard`; se pierde al recargar y no persiste por usuario |

## Pendientes de integración (backend)

> **El diseño de la base de datos ya existe (propuesto, sin desplegar):** esquema Oracle en `03b-esquema-sql-oracle.md` y diseño visual en `database/schema.dbml`. Falta crear las tablas en una base real y la API que las consuma.

Cuando exista backend, sustituir:

1. `useState(mockTickets)` → consulta a API (GET/POST/PATCH de tickets).
2. `handleFormSubmit` → crear ticket en servidor.
3. `handleUpdateTicket` → actualizar ticket en servidor.
4. `mockNotifications` → notificaciones desde servidor (o WebSocket).
5. Login demo → autenticación LDAP/Active Directory real (obtener nombre, correo, dependencia, cargo y sede automáticamente).
6. Adjuntos y evidencia (solo nombres hoy: `Ticket.attachments` y `Ticket.solutionEvidence`) → subida de archivos real y URLs (tabla `archivos_adjuntos` con `tipo`).
7. Correos → integración con servicio de correo institucional (confirmación, cambios de estado, remisión).

## Pendientes de "docu" colaterales

- El archivo raíz `Categorias y subcategorias.docx` (listado de categorías) no está versionado en `Documentación/`; si es fuente oficial de categorías, conviene convertirlo a Markdown y referenciarlo desde `03-modelo-de-datos.md`.
- Los textos de requisitos viven en `src/imports/pasted_text/*.md`; considerarlos como anexo de especificación.
