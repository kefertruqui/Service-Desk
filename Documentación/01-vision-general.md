# 01 · Visión general

## Qué es

La **Mesa de Servicios OATI** es una aplicación web institucional de la **Universidad de la Amazonia** (Florencia, Caquetá – Colombia) que funciona como el único punto de contacto (Service Desk) entre la comunidad universitaria y la **Oficina Asesora de Tecnologías de la Información (OATI)**.

Permite a los usuarios registrar incidentes y solicitudes de servicio TI, seguirlos (consulta de estado, avance y calificación al cierre) y consultar recursos de autoayuda (Base de Conocimiento y Catálogo de Servicios). Al administrador (Mesa de Servicios) le permite clasificar, priorizar, asignar técnicos, gestionar SLA, remitir a otras dependencias y cerrar tickets.

El diseño sigue buenas prácticas de **ITIL 4** (incidentes, solicitudes de servicio, SLA) y la filosofía de plataformas como Jira Service Management, Freshservice o Zendesk.

## Contexto institucional

- **Institución:** Universidad de la Amazonia.
- **Área responsable:** OATI – Oficina Asesora de Tecnologías de la Información.
- **Usuarios:** personal administrativo, docentes y funcionarios autenticados con credenciales institucionales (directorio activo LDAP/Active Directory).
- **Sede principal:** Florencia, Caquetá.

## Objetivos

1. Único punto de contacto para reportar incidentes y solicitar servicios TI.
2. Trazabilidad completa del ticket: registro → clasificación → asignación → atención → cierre → encuesta.
3. Cumplimiento de Acuerdos de Nivel de Servicio (SLA) por prioridad.
4. Autoservicio: Base de Conocimiento y Catálogo de Servicios para reducir tickets.
5. Retroalimentación del usuario mediante encuesta de calificación al cierre.

## Alcance actual (implementado)

- **Portal del usuario:** formulario de nueva solicitud, listado y seguimiento de tickets, calificación con estrellas, base de conocimiento y catálogo de servicios.
- **Panel de administración:** cola de tickets con filtros y priorización SLA, clasificación (tipo + prioridad), asignación de responsables, notas internas, remisión a otra dependencia, cierre, notificaciones y alarmas de SLA, y exportación de reportes a CSV.
- **Tickets Asignados (flujo técnico / soporte ITIL 4):** atención del técnico con causa raíz, workaround, pasos de diagnóstico, solución descriptiva, evidencia, escalamiento (reasignación) y cierre con código.
- **SLA:** horas por prioridad y estados que corren el cronómetro (ver `05-procesos-y-flujos.md`).
- **Tema claro/oscuro:** modo día/noche con `useTheme` y botón `ThemeToggle` en el login.

## Lo que NO está implementado (clave)

- **No hay backend ni API.** Todo son datos mock en memoria.
- **No hay autenticación real** (LDAP/AD simulado con login demo).
- **No hay persistencia:** los datos se pierden al recargar la página.
- **El envío de correos es simulado** (vistas previas y notificaciones en pantalla).
- La vista `TicketDetail` está como placeholder y la pantalla `service-catalog` aún no está enlazada en el menú (ver `08-pendientes-y-brechas.md`).

## Stack tecnológico

- **Frontend:** React 19, TypeScript 5.7.
- **Build:** Vite 8.
- **Estilos:** Tailwind CSS v4 (plugin `@tailwindcss/vite`, tema en `src/index.css`).
- **Formateo:** oxfmt.
- **Gestor de paquetes:** pnpm (se usa `pnpm-lock.yaml`).

## Roles del sistema

| Rol | Descripción | Usuario demo |
|---|---|---|
| `user` | Usuario final (docente/funcionario). Ve Nueva Solicitud, Mis Tickets, **Tickets Asignados** (normalmente vacío para un usuario), Base de Conocimiento y Catálogo. | `currentUser` (Keiny F. Trujillo Q.) |
| `admin` | Mesa de Servicios OATI. Añade el Panel de Administración al menú; gestiona la cola, clasificación, asignación, remisión y cierre. | `adminUser` (Andrés F. Martínez C.) |
| `technician` | Definido en el tipo `UserInfo.role` pero **no usado** actualmente como rol de UI. Los técnicos se modelan como **texto** en `Ticket.technician`, y el flujo de atención se opera desde la vista "Tickets Asignados". | — |

Ver `07-glosario.md` para el resto de términos.
