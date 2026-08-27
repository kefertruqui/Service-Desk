# 02 · Arquitectura

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 19 (componentes funcionales + hooks, sin librerías de estado externas) |
| Lenguaje | TypeScript 5.7 (tipos centralizados en `src/types.ts`) |
| Build | Vite 8 (fichero `vite.config.ts` con plugins del kit **Figma Make** y `@tailwindcss/vite`; alias `@` → `src`, puerto 8443) |
| Estilos | Tailwind CSS v4 vía plugin `@tailwindcss/vite`; tema en `src/index.css` |
| Formato | oxfmt (`npm run format`) |

No hay router. La navegación es un **switch de vista en estado local** (`View`) dentro de `App.tsx`.

## Estructura de carpetas

```
MESADESERVICIOS/
├── index.html                  # Shell HTML, monta #root y carga /src/main.tsx
├── package.json                # Dependencias y scripts
├── vite.config.ts              # Config Vite (React, Tailwind v4, alias @ -> src)
├── tsconfig.json
├── .mise.toml                  # Versiones de Node/pnpm
├── AGENTS.md                   # Guía de trabajo del repositorio (leer antes de tocar código)
├── Documentación/              # Documentación del proyecto (este índice en README.md)
├── database/
│   └── schema.dbml             # Modelo relacional propuesto (DBML; ver 03b para el DDL Oracle)
└── src/
    ├── main.tsx                # Punto de entrada: monta <App/> en #root
    ├── index.css               # Import Tailwind v4 + @theme + estilos globales
    ├── App.tsx                 # Estado global y enrutado por vista (núcleo)
    ├── types.ts                # Interfaces y uniones de tipos (fuente de verdad de datos)
    ├── utils/
    │   └── sla.ts              # Lógica de SLA (cálculo, colores, etiquetas)
    ├── hooks/
    │   └── useTheme.ts         # Tema claro/oscuro (modo día/noche)
    ├── data/
    │   └── mockData.ts         # Datos mock (usuarios, tickets, catálogos, artículos, notifs)
    └── components/
        ├── LoginPage.tsx       # Login demo (+ ThemeToggle del modo día/noche)
        ├── Layout.tsx          # Barra lateral + área de contenido
        ├── NewRequest.tsx      # Formulario nueva solicitud
        ├── MyTickets.tsx       # Listado + seguimiento + encuesta de estrellas
        ├── TicketDetail.tsx    # Detalle del ticket (PLACEHOLDER, sin terminar)
        ├── TicketSuccess.tsx   # Confirmación tras registrar + vista previa de correo
        ├── AdminDashboard.tsx  # Panel de administración (cola, panel de gestión, remisión, export CSV)
        ├── AssignedTickets.tsx # Seguimiento de tickets por responsable (técnico): solución, escalamiento, cierre
        ├── KnowledgeBase.tsx   # Base de conocimiento (listado + artículo)
        ├── ServiceCatalog.tsx  # Catálogo de servicios (sin enlazar en el menú)
        ├── StatusBadge.tsx     # Badges de estado y prioridad (reutilizables)
        ├── StatusStepper.tsx   # Stepper de progreso del ticket (compact/timeline/full)
        └── ThemeToggle.tsx     # Botón sol/luna del tema claro/oscuro
```

> Detalles de cada componente y del esqueleto Vite: ver `AGENTS.md` en la raíz.

## Núcleo: `src/App.tsx`

`App` mantiene **todo el estado global** y decide qué pantalla se muestra.

```ts
const [view, setView] = useState<View>('login');        // pantalla actual
const [user, setUser] = useState<UserInfo | null>(null); // usuario logueado
const [tickets, setTickets] = useState<Ticket[]>(mockTickets); // "base de datos" en memoria
const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
const [lastTicketNumber, setLastTicketNumber] = useState('');
const [blockedNewRequest, setBlockedNewRequest] = useState(false); // bloqueo por encuesta pendiente
const { theme, toggleTheme } = useTheme();              // tema claro/oscuro
```

### Funciones clave

| Función | Propósito |
|---|---|
| `navigate(nextView, ticketId?)` | Cambia de vista, opcionalmente recuerda el ticket seleccionado y hace scroll arriba. **Bloquea** `new-request` si hay encuestas pendientes de calificar |
| `handleLogin(user)` | Guarda el usuario y va a `my-tickets` |
| `handleLogout()` | Limpia usuario y vuelve a `login` |
| `handleFormSubmit(data)` | Crea un ticket nuevo (número `TK-XXXX`, estado `Registrado`, tipo `Sin Clasificar`) y va a `ticket-success` |
| `handleUpdateTicket(id, updates)` | Actualiza parcialmente un ticket y refresca `updatedAt`. **Es el único punto de escritura de tickets** |

### Enrutado por vista

`App` renderiza `Layout` con el contenido según `view`. Tabla completa en `04-interfaz-y-pantallas.md`.

### Flujo de datos (hoy, sin backend)

```
┌──────────────────────────────────────────────────────────────┐
│  src/data/mockData.ts (datos iniciales)                      │
│      mockTickets, currentUser, adminUser, ...                │
└──────────────────────────┬───────────────────────────────────┘
                           │ import
                           ▼
   App.tsx  ──useState──►  tickets (estado en memoria)
      │                        ▲
      │  pasa por props        │ setTickets (mutaciones)
      ▼                        │
   Componentes de pantalla ────┘
      (MyTickets, AdminDashboard, AssignedTickets, NewRequest…)
```

- **Lectura de datos:** los componentes reciben `tickets` por props y filtran/ordenan localmente (búsqueda, filtros, paginación).
- **Escritura de datos:** los componentes llaman `onUpdateTicket(id, updates)` (admin) o `onSubmit(data)` (nueva solicitud), y `App` hace `setTickets`.

### ¿Dónde conectaría una API en el futuro?

El patrón de sustitución es directo:

1. `useState(mockTickets)` → un hook de datos (fetch a una API REST).
2. `handleFormSubmit` → `POST /api/tickets`.
3. `handleUpdateTicket` → `PATCH /api/tickets/:id`.
4. `mockNotifications` → endpoints de notificaciones o WebSocket.
5. Login → flujo real de LDAP/Active Directory (hoy `LoginPage` simula con `setTimeout`).

## `src/utils/sla.ts`

Lógica pura de SLA (sin UI). Exposiciones principales:

| Export | Descripción |
|---|---|
| `SLA_HOURS_BY_PRIORITY` | Horas de SLA por prioridad (Crítica 1, Alta 3, Media 6, Baja 12, Sin asignar 0) |
| `slaRunningStatuses` | Estados donde corre el cronómetro |
| `isSlaRunning(ticket)` | ¿El SLA está corriendo? |
| `getSlaState(ticket, now)` | `sin_iniciar` \| `ok` \| `warning` \| `expired` |
| `getSlaRemainingHours(ticket, now)` | Horas restantes |
| `getSlaRatio(ticket, now)` | Proporción 0–1 |
| `formatSlaRemaining(hours)` | Texto corto (ej. `2d`, `3h`, `45 min`, `Vencido`) |
| `slaTimeLabel(hours)` | Etiqueta (ej. `1 hora`, `6 horas`) |
| `SLA_COLORS` / `SLA_LABELS` | Colores y etiquetas por estado |

Reglas de negocio del SLA en `05-procesos-y-flujos.md`.

## `src/components/StatusBadge.tsx`

Exporta dos componentes reutilizables:

- `StatusBadge` — badge de estado con color y punto (`src/components/StatusBadge.tsx:23`). El mapa de colores por estado vive aquí (`statusConfig`).
- `PriorityBadge` — badge de prioridad con borde de color (`src/components/StatusBadge.tsx:36`).

> Los colores de estado/prioridad están **hardcodeados en estos mapas**, no vienen de Tailwind. Si cambia un color de estado, cambiarlo aquí.

## `src/hooks/useTheme.ts` — tema claro/oscuro

Hook que gestiona el **modo día / modo noche** de toda la app:

- Estado `theme: 'light' | 'dark'` (inicia siempre en `light`).
- Un `useEffect` escribe `document.documentElement.dataset.theme`, que es el disparador del tema en CSS.
- Expone `{ theme, toggleTheme }`.

Se consume en `App.tsx` (`useTheme()`) y el `theme`/`toggleTheme` se pasan a `LoginPage`, que muestra el botón **`ThemeToggle`** (sol/luna). El toggle por ahora solo está visible en la pantalla de login.

## Estilos globales (`src/index.css`)

- `@import 'tailwindcss'` + `@theme` con la paleta institucional (`--color-ua-*`: azul, teal, verde, dorado, naranja, rojo).
- **Tema claro/oscuro** con tokens semánticos en `:root` (por defecto claro) y variante `[data-theme='dark']` (modo noche). Se activa vía `document.documentElement.dataset.theme` (ver `useTheme.ts`).
- Fuente Poppins (Google Fonts) y estilos base de `body`.
- Animaciones `.rating-thanks` y `.ticket-leaving` (encuesta al cerrar ticket).
- Scrollbar y focus ring globales.

> Nota: gran parte del estilo de los componentes está en **inline styles** (objetos `style={{...}}` con colores hardcodeados) en lugar de clases Tailwind o de los tokens semánticos. No hay un sistema único de tokens; los colores `#005A7E`, `#e8f4f9`, etc. aparecen repetidos. (Ver `08-pendientes-y-brechas.md`.)
