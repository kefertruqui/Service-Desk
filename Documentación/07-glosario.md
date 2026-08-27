# 07 · Glosario

| Término | Definición en este proyecto |
|---|---|
| **Ticket** | Registro de una solicitud o incidente con su ciclo de vida completo (objeto `Ticket`). Se identifica por un número `TK-XXXX` |
| **Incidente** | Interrupción o falla de un servicio TI (tipo `Incidente`) |
| **Solicitud** | Petición de un servicio o recurso (tipo `Solicitud`) |
| **Problema** | Causa raíz que genera uno o más incidentes (tipo `Problema`; en la UI solo es un tipo seleccionable, sin gestión de problemas ITIL) |
| **Sin Clasificar** | Estado inicial de tipo: todo ticket nuevo llega así hasta que el admin lo clasifica |
| **SLA** | Acuerdo de Nivel de Servicio: horas máximas de atención según prioridad (Crítica 1h, Alta 3h, Media 6h, Baja 12h) |
| **SLA vencido / expired** | El tiempo transcurrido igualó o superó las horas de SLA |
| **SLA por vencer / warning** | Se consumió ≥ 80 % de las horas de SLA |
| **SLA sin iniciar** | El reloj aún no corre (estado no contemplado o sin `slaStartedAt`) |
| **slaStartedAt** | Marca de tiempo (ISO) en la que se activa el cronómetro del SLA |
| **OATI** | Oficina Asesora de Tecnologías de la Información (dependencia de la Universidad de la Amazonia) |
| **Mesa de Servicios** | Punto único de contacto / Service Desk; rol `admin` en la app |
| **Service Desk** | Centro de servicio al usuario (ITIL): recibe, clasifica y gestiona incidentes y solicitudes |
| **ITIL 4** | Marco de buenas prácticas de gestión de servicios de TI que inspira el diseño |
| **Estado** | Posición del ticket en su ciclo de vida (`Registrado`…`Cerrado`, `Remitido a otra dependencia`) |
| **Prioridad** | Nivel de urgencia (`Crítica`, `Alta`, `Media`, `Baja`, `Sin asignar`) que define el SLA |
| **Clasificación** | Acción del admin de definir tipo + prioridad de un ticket (y con ello su SLA) |
| **Asignación** | Vincular uno o varios responsables (`technician`) a un ticket |
| **Remitido a otra dependencia** | Estado terminal usado cuando la solicitud no compete a OATI y se envía a otra dependencia |
| **Encuesta** | Calificación de 1 a 5 estrellas que el usuario asigna al cerrar un ticket (campo `rating`) |
| **Base de Conocimiento** | Biblioteca de artículos/guías de autoayuda (`knowledgeArticles`) |
| **Catálogo de Servicios** | Listado de servicios TI disponibles (`categoryTree` / `serviceCategories`) |
| **Nota interna** | Comentario de gestión con `isInternal: true`, pensado para no mostrarse al usuario |
| **Actividad** | Evento del historial del ticket (`TicketActivity`) con acción, autor, fecha y transición `from → to` |
| **Adjunto** | Archivo asociado al ticket. Hoy solo se guarda el **nombre** como texto en `attachments` |
| **Usuario demo** | `currentUser` (rol user) y `adminUser` (rol admin), definidos en `mockData.ts` |
| **Directorios / LDAP / AD** | Sistema institucional de autenticación previsto (simulado en el login demo) |
| **Vista (`View`)** | Pantalla actual de la app controlada por el estado en `App.tsx` |
| **Código de cierre (`closureCode`)** | Clasificación estándar al cerrar un ticket: `resuelto`, `resuelto_con_workaround`, `no_resuelto`, `duplicado` o `cancelado`. Hoy el cierre desde `AssignedTickets` usa siempre `resuelto` |
| **Causa raíz (`rootCause`)** | Origen del problema identificado por el técnico al resolver (ITIL 4) |
| **Workaround (solución temporal)** | Mitigación provisional mientras se corrige la causa raíz (`ticket.workaround`, ITIL 4) |
| **Pasos de diagnóstico (`solutionStages`)** | Pasos de solución ejecutados por el técnico (predefinidos por categoría + personalizados), cada uno con estado `done` |
| **Escalamiento** | Reasignación de un ticket a otro responsable (con buscador + motivo) desde `AssignedTickets`. Reemplaza al responsable actual sin cambiar el estado |
| **Responsable / Técnico (`technician`)** | Persona(s) de la OATI a la(s) que se asigna un ticket. Se modelan como **texto** en `ticket.technician` (no hay rol `technician` funcional de UI) |
| **Iniciar atención** | Acción del técnico que pasa un ticket `Asignado` a `En atención` y arranca el cronómetro de SLA |
| **Modo día / noche (tema)** | Sistema de tema claro/oscuro gestionado por `useTheme` y el botón `ThemeToggle`; la variante oscura se activa con `[data-theme='dark']` en `<html>` |
| **Export CSV / Reporte** | Descarga de un archivo `reporte-tickets-*.csv` con el detalle de los tickets desde el Panel de Administración |
