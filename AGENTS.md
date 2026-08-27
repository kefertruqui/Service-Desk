# Mesa de Servicios OATI

Aplicación web de la **Universidad de la Amazonia**: portal único de contacto (Service Desk) entre la comunidad universitaria y la **OATI** (Oficina Asesora de Tecnologías de la Información).

React + Vite + Tailwind CSS v4, **sin backend** (datos mock en memoria).

> **LEER PRIMERO:** La documentación del proyecto vive en [`Documentación/`](./Documentación/README.md) (índice, arquitectura, modelo de datos, pantallas, flujos, casos de uso, glosario y pendientes).

## Desarrollo

Un servidor Vite ya está corriendo en `$PORT` (default 8443). No hace falta iniciarlo.

- Vista previa: por el panel de preview.
- Hot reload: los cambios a fuentes se reflejan al instante.

## Resumen funcional

- **Roles:** `user` (usuario final) y `admin` (Mesa de Servicios). Login demo: cualquier usuario entra como user; incluir `admin` o `martinez` en el usuario entra como admin.
- **Portal del usuario:** Nueva Solicitud (categoría/subcategoría + datos), Mis Tickets (filtros, búsqueda, paginación, timeline de seguimiento), Base de Conocimiento, encuesta de 1–5 estrellas al cerrar.
- **Panel de administración:** cola de tickets priorizada por SLA, clasificación (tipo + prioridad), asignación de responsables, notas internas, remisión a otra dependencia, cierre, notificaciones y alarmas de SLA.
- **SLA:** horas por prioridad (Crítica 1h, Alta 3h, Media 6h, Baja 12h) y cronómetro activo en los estados `Asignado`, `En atención`, `Pendiente de información`, `Remitido a otra dependencia`. Lógica en `src/utils/sla.ts`.
- **Datos:** todo en memoria (`src/data/mockData.ts`) + estado de `src/App.tsx` (`useState`). No hay persistencia ni API; al recargar se reinicia.

## Project Structure

Esta es la estructura canónica. Empieza por los archivos relevantes a la tarea. Solo sigue imports o inspecciona otros archivos cuando sea necesario, cuando falte una ruta documentada, o cuando el repositorio contradiga esta guía.

- `src/main.tsx` - React entrypoint; imports `src/index.css` y monta `src/App.tsx` en `#root`
- `src/App.tsx` - Componente principal, estado global y enrutado por vista (`View`). Punto de partida habitual para trabajo de UI
- `src/types.ts` - Todas las interfaces y enums (`Ticket`, `UserInfo`, `View`, estados, prioridades…). Fuente de verdad de datos
- `src/utils/sla.ts` - Lógica de SLA (cálculo, colores, etiquetas)
- `src/data/mockData.ts` - Datos mock: usuarios, tickets, categorías (`categoryTree`), artículos de conocimiento, notificaciones
- `src/components/` - Pantallas y componentes: `LoginPage`, `Layout`, `NewRequest`, `MyTickets`, `TicketDetail` (placeholder), `TicketSuccess`, `AdminDashboard`, `KnowledgeBase`, `ServiceCatalog`, `StatusBadge`
- `src/index.css` - Import Tailwind v4 + `@theme` con paleta institucional `ua-*`
- `index.html` - Shell HTML con `#root`
- `package.json` - Dependencias y scripts (dev, build, preview, format)
- `vite.config.ts` - Config Vite (React, Tailwind v4, plugin Figma Make, alias `@` -> `src`)
- `.mise.toml` - Versiones de Node.js y pnpm
- `Documentación/` - Documentación del proyecto (ver índice `Documentación/README.md`)
- `database/schema.dbml` - Diseño del modelo de datos relacional propuesto (DBML, visualizable en dbdiagram.io; DDL Oracle en `Documentación/03b-esquema-sql-oracle.md`)

## Dependencies

- Runtime: React 19 y React DOM 19
- Styling: Tailwind CSS v4 con el plugin `@tailwindcss/vite`
- Build tooling: Vite 8, TypeScript 5.7, `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

Este proyecto usa **Tailwind CSS v4** mediante el plugin `@tailwindcss/vite` configurado en `vite.config.ts`. `src/index.css` importa Tailwind con `@import 'tailwindcss';`. Usa utilidades de Tailwind directamente en el JSX y pon el CSS global o la personalización del tema en `src/index.css`. Este scaffold no necesita archivo de configuración de Tailwind ni PostCSS.

`src/main.tsx` importa `src/index.css`, por lo que el cableado de fuentes globales va en `src/index.css`. Mantén los `@import` de CSS al principio, luego `@font-face` y los defaults de font-family ahí.

> Nota: muchos componentes usan **inline styles** con colores de marca hardcodeados (`#005A7E`, `#e8f4f9`, etc.) en lugar de los tokens `ua-*` de `index.css`. No los reemplaces de golpe sin revisar el impacto visual; esto está listado en `Documentación/08-pendientes-y-brechas.md`.

## Code quality

- Usa comillas dobles para strings que contengan apóstrofes (`"We're here to help"`), o escápalos en strings de comillas simples. Un apóstrofe sin escapar en una string de comillas simples rompe el build.
- Asegura que los tags JSX estén cerrados y las llaves balanceadas.
- Exporta los componentes como default exports.

## Regla de documentación

> **Se documenta por hitos, no en cada micro-ajuste.** La documentación se actualiza cuando una funcionalidad o cambio queda **completa y estable**, no en cada iteración rápida de la UI. Al terminar un hito, incluye en el mismo commit la pasada de sincronización de `Documentación/`.

Mapeo de qué documento tocar según el tipo de cambio:

| Si cambias… | Actualiza |
|---|---|
| Tipos, interfaces, enums, `mockData.ts`, forma de consultar datos | `Documentación/03-modelo-de-datos.md` (y si cambia el modelo relacional: `Documentación/03b-esquema-sql-oracle.md` + `database/schema.dbml`) |
| Pantallas, componentes, secciones, navegación, menú (`Layout`) | `Documentación/04-interfaz-y-pantallas.md` |
| Estados, transiciones, SLA, notificaciones, flujos, remisión, encuesta | `Documentación/05-procesos-y-flujos.md` |
| Comportamiento observable del sistema | Revisa y actualiza `Documentación/06-casos-de-uso.md` |
| Arquitectura, stack, estructura de carpetas | `Documentación/01-vision-general.md` y `Documentación/02-arquitectura.md` |
| Un término con significado de dominio | `Documentación/07-glosario.md` |
| Dejas algo sin terminar, sin usar o con deuda técnica | `Documentación/08-pendientes-y-brechas.md` |

Regla práctica: si tu tarea toca el comportamiento o los datos, incluye en el mismo commit/cambio la actualización de `Documentación/`. Cuando dudes, actualiza de más, no de menos.