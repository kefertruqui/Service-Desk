# 03 · Modelo de datos

> **Fuente de verdad:** `src/types.ts`. Toda interfaz y unión de tipos vive ahí.
> **Datos de ejemplo:** `src/data/mockData.ts`.
> **Modelo relacional propuesto (SQL Oracle):** [03b-esquema-sql-oracle.md](./03b-esquema-sql-oracle.md) + [`../database/schema.dbml`](../database/schema.dbml). El proyecto aún **no tiene base de datos**; el SQL es el diseño de la futura persistencia.

## Enums / uniones de tipos

### `View` (pantallas)

```ts
type View =
  | 'login' | 'new-request' | 'my-tickets' | 'ticket-detail'
  | 'admin' | 'assigned-tickets' | 'admin-ticket' | 'knowledge-base'
  | 'service-catalog' | 'ticket-success';
```

(Son 10 valores; la fuente de verdad es `src/types.ts:1`.)

Valores **alcanzables** hoy desde la UI: `login`, `new-request`, `my-tickets`, `ticket-success`, `admin`, `assigned-tickets`, `knowledge-base`.

Valores **sin enlazar/pendientes**: `ticket-detail`, `admin-ticket`, `service-catalog` (ver `08-pendientes-y-brechas.md`).

### `TicketStatus` (estados del ticket)

`'Registrado' | 'Clasificado' | 'Asignado' | 'En atención' | 'Resuelto' | 'Cerrado' | 'Remitido a otra dependencia'`

- Los estados están en **español con acentos** y se usan como string.
- El flujo canónico (timeline de `MyTickets`) es: `Registrado → Clasificado → Asignado → En atención → Resuelto → Cerrado`.
- `Remitido a otra dependencia` se trata como estado terminal especial (no sigue el flujo de atención OATI).

### `TicketPriority` (prioridad)

`'Crítica' | 'Alta' | 'Media' | 'Baja' | 'Sin asignar'`

Cada prioridad mapea a horas de SLA en `src/utils/sla.ts` (`SLA_HOURS_BY_PRIORITY`): Crítica 1h, Alta 3h, Media 6h, Baja 12h, Sin asignar 0.

### `TicketType` (tipo)

`'Incidente' | 'Solicitud' | 'Problema' | 'Sin Clasificar'`

Los tickets nuevos llegan siempre como `'Sin Clasificar'`; el administrador los clasifica en el panel.

### `AdminNotificationType`

`sla-warning | sla-expired | new-ticket | info`

## Interfaces

### `UserInfo`

```ts
interface UserInfo {
  name: string;        // nombre completo
  email: string;       // correo institucional @uniamazonia.edu.co
  dependencia: string; // dependencia/facultad
  cargo: string;       // cargo del usuario
  sede: string;        // sede/ubicación (ej. 'Florencia - Caquetá')
  role: 'user' | 'admin' | 'technician';
  avatar: string;      // iniciales para el círculo de avatar (ej. 'KF')
}
```

- `role: 'technician'` está definido pero **no se usa** en la UI actual.
- El usuario queda **embebido** en cada `Ticket` (`ticket.user`), no referenciado por id.

### `Ticket` (objeto principal)

```ts
interface Ticket {
  id: string;            // identificador interno (hoy '1'..'8', luego '1', '2'…)
  number: string;        // número legible 'TK-2025-XXXX'
  title: string;         // título de la solicitud
  type: TicketType;      // Incidente | Solicitud | Problema | Sin Clasificar
  category: string;      // categoría (del árbol de categorías)
  subcategory: string;   // subcategoría ('' si no aplica)
  status: TicketStatus;  // estado actual del ciclo de vida
  priority: TicketPriority;
  rating?: number;       // 1..5, asignado por el usuario al cerrar (encuesta)
  description: string;   // descripción del solicitante
  createdAt: string;     // ISO 8601
  updatedAt: string;     // ISO 8601 (App.tsx lo refresca en cada update)
  assignedTo?: string;   // área (ej. 'Área de Soporte') — en uso en mock, poco usado en flujo real
  technician?: string;   // nombre(s) del/los responsable(s) (varios separados por ', ')
  slaHours: number;      // horas de SLA asignadas (según prioridad)
  slaRemaining?: number; // horas restantes (obsoleto: el cálculo real es dinámico en sla.ts)
  slaStartedAt?: string; // ISO: cuándo arrancó el cronómetro del SLA
  location: string;      // ubicación física del reporte
  phone: string;         // teléfono de contacto
  user: UserInfo;        // solicitante (embebido)
  comments: TicketComment[];
  activities: TicketActivity[];
  attachments: string[]; // nombres de archivos adjuntos (de la solicitud)
  solutionEvidence?: string[]; // evidencia de la solución (nombres, cargada al resolver)
  solutionStages?: SolutionStage[]; // pasos de solución (paso a paso) con estado done
  rootCause?: string;    // causa raíz (ITIL 4, ingresa el técnico al resolver)
  workaround?: string;   // solución de contingencia / workaround (ITIL 4)
  closureCode?: ClosureCode; // código de cierre al cerrar
  remittedEmail?: string; // correo destino al remitir a otra dependencia
}
```

### `ClosureCode` (código de cierre)

```ts
type ClosureCode =
  | 'resuelto' | 'resuelto_con_workaround' | 'no_resuelto'
  | 'duplicado' | 'cancelado';
```

Se asigna al cerrar un ticket (solución del ticket).

### `SolutionStage` (paso de solución)

```ts
interface SolutionStage {
  id: string;        // identificador del paso
  description: string; // texto del paso
  done: boolean;     // si el paso se completó
  doneAt?: string;   // ISO de cuándo se marcó como completado
}
```


Notas de comportamiento:

- `slaRemaining` existe en el tipo y se usa en `TicketDetail` (placeholder), pero el cálculo real de SLA usa `slaHours` + `slaStartedAt` + la hora actual vía `src/utils/sla.ts`. Al guardar desde el panel admin **no** se escribe `slaRemaining`.
- `assignedTo` (área) existe en los mocks pero el panel admin trabaja con `technician` (personas) y no mantiene `assignedTo`. Quedan como campo informativo.
- `attachments` es un array de **nombres** de archivo (string). En `NewRequest` los archivos se capturan en estado local y solo se guardan sus nombres como texto.
- Los campos ITIL 4 (`rootCause`, `workaround`, `solutionStages`, `closureCode`, `solutionEvidence`) los escribe el **técnico** al resolver/cerrar desde `AssignedTickets`. El panel admin (que gestiona clasificación, asignación, remisión y notas) **no** los toca.
- `remittedEmail` lo escribe el admin al **remitir a otra dependencia**.

### `TicketComment`

```ts
interface TicketComment {
  id: string;
  author: string;   // nombre del autor
  role: string;     // rol/área (ej. 'Técnico OATI', 'Mesa de Servicios')
  content: string;  // texto del comentario
  timestamp: string; // ISO
  isInternal: boolean; // true = nota interna, no visible al usuario
}
```

### `TicketActivity` (historial)

```ts
interface TicketActivity {
  id: string;
  action: string;     // texto libre (ej. 'Estado cambiado', 'Asignado a técnico')
  author: string;     // quién ejecutó la acción (o 'Sistema')
  timestamp: string;  // ISO
  from?: string;      // valor anterior (ej. estado previo)
  to?: string;        // valor nuevo (ej. estado nuevo o correo de remisión)
}
```

### `AdminNotification`

```ts
interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  ticketId?: string;     // ticket al que abre al hacer clic
  ticketNumber?: string;
  timestamp: string;
  read: boolean;         // hoy el "leído" se maneja con un Set local en AdminDashboard
}
```

## Capa de "consultas" hoy (sin backend)

No hay API, ni fetch, ni base de datos. Las "consultas" son:

| Operación | Dónde vive | Cómo se hace |
|---|---|---|
| Leer todos los tickets | `App.tsx:18` | `useState<Ticket[]>(mockTickets)` |
| Leer datos para una vista | Componentes | Reciben `tickets`/`user` por **props** y filtran localmente con `.filter()`, `.sort()`, `.slice()` |
| Crear ticket | `App.tsx:58` `handleFormSubmit` | Construye un objeto `Ticket` y hace `setTickets(prev => [newTicket, ...prev])` |
| Actualizar ticket | `App.tsx:92` `handleUpdateTicket` | `setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: ... } : t))` |
| Notificaciones | `AdminDashboard.tsx` | `mockNotifications` + notificaciones dinámicas de SLA calculadas en cada render |
| Búsqueda/filtros | `MyTickets`/`AdminDashboard` | Filtro + orden + paginación **en memoria** dentro del componente |

## `src/data/mockData.ts` – inventario

| Export | Usado por | Descripción |
|---|---|---|
| `currentUser` | `LoginPage` | Usuario demo (rol `user`) |
| `adminUser` | `LoginPage` | Usuario demo (rol `admin`) |
| `mockTickets` | `App` | 8 tickets de ejemplo en distintos estados |
| `mockNotifications` | `AdminDashboard` | 3 notificaciones base |
| `categoryTree` | `NewRequest`, `ServiceCatalog` | 7 categorías con subcategorías (fuente real del formulario) |
| `knowledgeArticles` | `KnowledgeBase` | 7 artículos (uno con pasos/tips detallados) |
| `categories` | — | Lista plana de categorías. **Sin uso** |
| `institutionalSystems` | — | 42 sistemas institucionales. **Sin uso** |
| `serviceCategories` | — | Catálogo con SLA por servicio. **Sin uso** |

> Los tres export "sin uso" están pensados para funciones previstas (formulario dinámico por categoría, selección de sistema, catálogo con SLA). Ver `08-pendientes-y-brechas.md`.

### Nota sobre números de ticket

En `App.tsx` (`handleFormSubmit`), el ticket nuevo se genera como:

```ts
const num = `TK-${String(tickets.length + 1 + 900).padStart(4, '0')}`;
const newTicket = { ... id: String(tickets.length + 1), number: num, ... };
```

Es decir, con 8 tickets iniciales el siguiente es `TK-0909`. **Es una heurística frágil** (depende de cuántos tickets haya): si la lista crece o se reordena puede generar duplicados. (Ver `08-pendientes-y-brechas.md`.)

## Reglas para editar datos (qué tocar si cambio algo)

1. **Nuevo campo en un objeto** → editarlo en `src/types.ts` **y** en todos los objetos de `mockData.ts` que lo requieran.
2. **Nuevo estado/prioridad/tipo** → `types.ts` + `StatusBadge.tsx` (colores) + `sla.ts` (si afecta SLA) + filtros (`MyTickets`, `AdminDashboard`).
3. **Nueva categoría/subcategoría** → solo `categoryTree` en `mockData.ts`.
4. **Nuevo artículo de conocimiento** → `knowledgeArticles` en `mockData.ts`.
5. **Nueva pantalla** → añadir el valor a `View` y el bloque de render en `App.tsx` (y enlazarla en `Layout.tsx` si va al menú).
