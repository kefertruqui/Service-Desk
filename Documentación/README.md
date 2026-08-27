# Mesa de Servicios OATI – Documentación

Documentación del proyecto **Mesa de Servicios OATI** (Universidad de la Amazonia): portal único de contacto (Service Desk) entre la comunidad universitaria y la Oficina Asesora de Tecnologías de la Información (OATI).

## Estado del proyecto

| Aspecto | Estado |
|---|---|
| Stack | React 19 · Vite 8 · TypeScript 5.7 · Tailwind CSS v4 |
| Backend | **No existe todavía.** Todo funciona con datos mock en memoria (`src/data/mockData.ts`) |
| Persistencia | Ninguna. El estado vive en memoria de la app (`useState` en `src/App.tsx`); al recargar se reinicia |
| Autenticación | Simulada (login demo). No hay LDAP/Active Directory real |
| Alcance actual | Portal del usuario + Panel de administración (clasificación, asignación, SLA, remisión, cierre) + Tickets Asignados (flujo técnico ITIL 4: causa raíz, workaround, escalamiento, cierre) + tema claro/oscuro |

> Algunas piezas están a medio construir. Ver [08-pendientes-y-brechas.md](./08-pendientes-y-brechas.md).

## Índice de documentos

| # | Documento | Qué responde |
|---|---|---|
| — | [README.md](./README.md) | Índice y estado general (este archivo) |
| 01 | [01-vision-general.md](./01-vision-general.md) | ¿Qué es este sistema? ¿Para quién? ¿Qué alcance tiene? |
| 02 | [02-arquitectura.md](./02-arquitectura.md) | ¿Cómo está estructurado el código y cómo se conectan las piezas? |
| 03 | [03-modelo-de-datos.md](./03-modelo-de-datos.md) | ¿Qué objetos y tipos de datos existen? ¿Cómo se consultan y modifican hoy? |
| 03b | [03b-esquema-sql-oracle.md](./03b-esquema-sql-oracle.md) | Esquema relacional propuesto (SQL Oracle) + mapeo a tipos TS. Diseño: [`database/schema.dbml`](../database/schema.dbml) |
| 04 | [04-interfaz-y-pantallas.md](./04-interfaz-y-pantallas.md) | ¿Qué pantallas hay y qué elementos tiene cada una? |
| 05 | [05-procesos-y-flujos.md](./05-procesos-y-flujos.md) | ¿Qué procesos y flujos existen? (vida del ticket, SLA, remisión, encuesta…) |
| 06 | [06-casos-de-uso.md](./06-casos-de-uso.md) | Casos de uso por actor con pasos y precondiciones |
| 07 | [07-glosario.md](./07-glosario.md) | Términos y conceptos usados en el proyecto |
| 08 | [08-pendientes-y-brechas.md](./08-pendientes-y-brechas.md) | Partes a medio construir y datos sin usar |

## Rutas de lectura recomendadas

- **Quiero entender qué hace el sistema:** 01 → 04 → 05 → 06.
- **Quiero tocar código y datos:** 02 → 03 → 04 → 05.
- **Voy a entregar el proyecto a otro desarrollador:** todo, en orden.

## Convención de mantenimiento

> **Regla: se documenta por hitos, no en cada micro-ajuste.**
>
> La documentación se actualiza cuando una funcionalidad o cambio queda **completa y estable** (un hito), no en cada iteración rápida de la UI. Si en un hito tocas varios temas, actualiza los documentos que correspondan:
>
> - Si cambian tipos, objetos o la forma de consultar datos → actualizar `03-modelo-de-datos.md`.
> - Si cambia una pantalla, sus elementos o su navegación → actualizar `04-interfaz-y-pantallas.md`.
> - Si cambia un estado, un flujo, el SLA o las notificaciones → actualizar `05-procesos-y-flujos.md`.
> - Si cambia el comportamiento observable → revisar y actualizar `06-casos-de-uso.md`.
> - Si algo queda sin terminar o deja de usarse → moverlo a `08-pendientes-y-brechas.md`.
> - Si se añade una palabra con significado específico del dominio → actualizar `07-glosario.md`.
> - Si cambia la arquitectura o el stack → actualizar `01` y `02`.
>
> Regla práctica: al terminar un hito, hacer una pasada de sincronización de `Documentación/` en el mismo commit. En iteración rápida de detalles menores, no es obligatorio documentar en cada paso.

Esta misma regla está fijada en `../AGENTS.md` para que cualquier agente o persona que trabaje en el repositorio la siga automáticamente.
