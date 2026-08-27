# 03b · Esquema relacional (SQL Oracle)

> **Diseño propuesto de persistencia.** El proyecto hoy es frontend sin backend (datos mock en memoria). Este documento define cómo se modelarían los datos en una base de datos **Oracle** (12c+) para cuando se implemente el backend.
>
> - Fuente de diseño: [`../database/schema.dbml`](../database/schema.dbml) (se visualiza en [dbdiagram.io](https://dbdiagram.io)).
> - El esquema traduce 1:1 el modelo TypeScript de `src/types.ts` y los datos de `src/data/mockData.ts` (ver `03-modelo-de-datos.md`).
> - No está desplegado: ver `08-pendientes-y-brechas.md` (integración de backend).

## Mapeo tipos TypeScript → tablas

| Tipo / dato TS | Tabla(s) SQL | Notas |
|---|---|---|
| `UserInfo` | `usuarios` | `rol` es CHECK con `user \| admin \| technician` |
| `Ticket` | `tickets` | FK a `usuarios`, `categorias`, `subcategorias` |
| `Ticket.technician` (varios, separados por ", ") | `tecnicos` + `tickets_tecnicos` | Relación **N:M** normalizada |
| `Ticket.assignedTo` (área) | `tickets.area_asignada` | Campo legacy (ver pendientes) |
| `Ticket.rating` | `tickets.calificacion` | CHECK 1..5, NULL si no hay encuesta |
| `Ticket.slaRemaining` | — (no se almacena) | Se **calcula** con `sla_horas` + `sla_iniciado_en` (como en `src/utils/sla.ts`) |
| `Ticket.slaStartedAt` | `tickets.sla_iniciado_en` | |
| `Ticket.rootCause` | `tickets.causa_raiz` | Causa raíz ITIL 4 (técnico) |
| `Ticket.workaround` | `tickets.workaround` | Solución temporal / workaround ITIL 4 |
| `Ticket.closureCode` | `tickets.codigo_cierre` | CHECK: resuelto, resuelto_con_workaround, no_resuelto, duplicado, cancelado |
| `Ticket.remittedEmail` | `tickets.correo_remision` | Correo destino al remitir a otra dependencia |
| `Ticket.solutionStages` | `etapas_solucion_ticket` | Pasos de solución (1:N con `completado`, `completado_en`, `orden`) |
| `Ticket.attachments` / `Ticket.solutionEvidence` | `archivos_adjuntos` | Hoy solo nombres; futuro BLOB/URL. La columna `tipo` distingue `solicitud` (adjuntos) vs `solucion` (evidencia) |
| `TicketComment` | `comentarios_ticket` | `es_interna` = `isInternal` |
| `TicketActivity` | `actividades_ticket` | `estado_desde`/`estado_hasta` = `from`/`to` |
| `AdminNotification` | `notificaciones` | `leida` = `read` |
| `categoryTree` | `categorias` + `subcategorias` | Jerárquico |
| `categories` (plana) | `categorias` | Export sin uso; unificar con `categoryTree` |
| `knowledgeArticles` | `articulos_conocimiento` + `pasos_articulo` + `consejos_articulo` + `etiquetas_articulo` | Pasos/tips/tags normalizados |
| `institutionalSystems` | `sistemas_institucionales` | Export sin uso (42 sistemas) |
| `serviceCategories` | `categorias_servicio` + `servicios_categoria` | Export sin uso |

## Catálogo de tablas

| Tabla | Descripción |
|---|---|
| `usuarios` | Usuarios (solicitantes y administradores). `rol` enum |
| `tecnicos` | Responsables de atención (catálogo) |
| `categorias` / `subcategorias` | Árbol de categorías del formulario (`categoryTree`) |
| `tickets` | Objeto principal: solicitudes/incidentes con su SLA, estado, prioridad, calificación y campos ITIL 4 (causa raíz, workaround, código de cierre, correo de remisión) |
| `tickets_tecnicos` | Relación N:M tickets ↔ técnicos |
| `comentarios_ticket` | Comentarios (públicos e internos) |
| `actividades_ticket` | Historial de actividades (timeline) |
| `archivos_adjuntos` | Adjuntos del ticket |
| `notificaciones` | Notificaciones del panel admin |
| `articulos_conocimiento` / `pasos_articulo` / `consejos_articulo` / `etiquetas_articulo` | Base de conocimiento (artículos, pasos, recomendaciones, tags) |
| `sistemas_institucionales` | 42 sistemas institucionales (sin uso en UI hoy) |
| `categorias_servicio` / `servicios_categoria` | Catálogo de servicios con SLA (sin uso en UI hoy) |

## Diagrama de relaciones

```
usuarios 1 ── ∞ tickets
categorias 1 ── ∞ subcategorias
tickets ∞ ── 1 categorias
tickets ∞ ── 1 subcategorias
tickets ∞ ── ∞ tecnicos            (vía tickets_tecnicos)
tickets 1 ── ∞ comentarios_ticket
tickets 1 ── ∞ actividades_ticket
tickets 1 ── ∞ archivos_adjuntos
tickets 1 ── 0..1 notificaciones   (notificaciones.ticket_id opcional)
articulos_conocimiento 1 ── ∞ pasos_articulo / consejos_articulo / etiquetas_articulo
categorias_servicio 1 ── ∞ servicios_categoria
```

## DDL Oracle

```sql
-- =============================================================
-- Mesa de Servicios OATI – Esquema relacional (Oracle 12c+)
-- Traduce src/types.ts y src/data/mockData.ts
-- =============================================================

-- -------------------------------------------------------------
-- CATÁLOGOS
-- -------------------------------------------------------------

CREATE TABLE usuarios (
  id              NUMBER GENERATED ALWAYS AS IDENTITY,
  nombre          VARCHAR2(200) NOT NULL,
  correo          VARCHAR2(200) NOT NULL,
  dependencia     VARCHAR2(200),
  cargo           VARCHAR2(200),
  sede            VARCHAR2(200),
  rol             VARCHAR2(20)  NOT NULL,
  avatar          VARCHAR2(10),
  fecha_creacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuarios PRIMARY KEY (id),
  CONSTRAINT uq_usuarios_correo UNIQUE (correo),
  CONSTRAINT ck_usuarios_rol CHECK (rol IN ('user','admin','technician'))
);

CREATE TABLE tecnicos (
  id     NUMBER GENERATED ALWAYS AS IDENTITY,
  nombre VARCHAR2(200) NOT NULL,
  CONSTRAINT pk_tecnicos PRIMARY KEY (id),
  CONSTRAINT uq_tecnicos_nombre UNIQUE (nombre)
);

CREATE TABLE categorias (
  id     NUMBER GENERATED ALWAYS AS IDENTITY,
  nombre VARCHAR2(200) NOT NULL,
  orden  NUMBER(3) DEFAULT 0,
  CONSTRAINT pk_categorias PRIMARY KEY (id),
  CONSTRAINT uq_categorias_nombre UNIQUE (nombre)
);

CREATE TABLE subcategorias (
  id           NUMBER GENERATED ALWAYS AS IDENTITY,
  categoria_id NUMBER NOT NULL,
  nombre       VARCHAR2(200) NOT NULL,
  orden        NUMBER(3) DEFAULT 0,
  CONSTRAINT pk_subcategorias PRIMARY KEY (id),
  CONSTRAINT fk_sub_categoria FOREIGN KEY (categoria_id)
    REFERENCES categorias (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- TICKETS
-- -------------------------------------------------------------

CREATE TABLE tickets (
  id                 NUMBER GENERATED ALWAYS AS IDENTITY,
  numero             VARCHAR2(20) NOT NULL,
  usuario_id         NUMBER NOT NULL,
  titulo             VARCHAR2(500) NOT NULL,
  tipo               VARCHAR2(20) NOT NULL,
  categoria_id       NUMBER,
  subcategoria_id    NUMBER,
  estado             VARCHAR2(40) NOT NULL,
  prioridad          VARCHAR2(20) NOT NULL,
  calificacion       NUMBER(1),
  descripcion        CLOB,
  area_asignada      VARCHAR2(200),
  sla_horas          NUMBER(5,2) DEFAULT 0,
  sla_iniciado_en    TIMESTAMP,
  causa_raiz         CLOB,
  workaround         CLOB,
  codigo_cierre      VARCHAR2(40),
  correo_remision    VARCHAR2(500),
  ubicacion          VARCHAR2(300),
  telefono           VARCHAR2(50),
  fecha_creacion     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_tickets PRIMARY KEY (id),
  CONSTRAINT uq_tickets_numero UNIQUE (numero),
  CONSTRAINT fk_tickets_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id),
  CONSTRAINT fk_tickets_categoria FOREIGN KEY (categoria_id)
    REFERENCES categorias (id),
  CONSTRAINT fk_tickets_subcategoria FOREIGN KEY (subcategoria_id)
    REFERENCES subcategorias (id),
  CONSTRAINT ck_tickets_tipo CHECK (tipo IN
    ('Incidente','Solicitud','Problema','Sin Clasificar')),
  CONSTRAINT ck_tickets_estado CHECK (estado IN
    ('Registrado','Clasificado','Asignado','En atención',
     'Resuelto','Cerrado','Remitido a otra dependencia')),
  CONSTRAINT ck_tickets_prioridad CHECK (prioridad IN
    ('Crítica','Alta','Media','Baja','Sin asignar')),
  CONSTRAINT ck_tickets_calificacion CHECK
    (calificacion IS NULL OR calificacion BETWEEN 1 AND 5),
  CONSTRAINT ck_tickets_cierre CHECK (codigo_cierre IS NULL OR
    codigo_cierre IN ('resuelto','resuelto_con_workaround',
      'no_resuelto','duplicado','cancelado'))
);

CREATE TABLE etapas_solucion_ticket (
  id         NUMBER GENERATED ALWAYS AS IDENTITY,
  ticket_id  NUMBER NOT NULL,
  descripcion VARCHAR2(1000) NOT NULL,
  completado NUMBER(1) DEFAULT 0,
  completado_en TIMESTAMP,
  orden      NUMBER(3) DEFAULT 0,
  CONSTRAINT pk_etapas_sol PRIMARY KEY (id),
  CONSTRAINT fk_etapas_sol_ticket FOREIGN KEY (ticket_id)
    REFERENCES tickets (id) ON DELETE CASCADE
);

CREATE TABLE tickets_tecnicos (
  ticket_id  NUMBER NOT NULL,
  tecnico_id NUMBER NOT NULL,
  CONSTRAINT pk_tickets_tecnicos PRIMARY KEY (ticket_id, tecnico_id),
  CONSTRAINT fk_tt_ticket FOREIGN KEY (ticket_id)
    REFERENCES tickets (id) ON DELETE CASCADE,
  CONSTRAINT fk_tt_tecnico FOREIGN KEY (tecnico_id)
    REFERENCES tecnicos (id) ON DELETE CASCADE
);

CREATE TABLE comentarios_ticket (
  id             NUMBER GENERATED ALWAYS AS IDENTITY,
  ticket_id      NUMBER NOT NULL,
  autor          VARCHAR2(200),
  rol            VARCHAR2(100),
  contenido      CLOB NOT NULL,
  es_interna     NUMBER(1) DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_comentarios_ticket PRIMARY KEY (id),
  CONSTRAINT fk_ct_ticket FOREIGN KEY (ticket_id)
    REFERENCES tickets (id) ON DELETE CASCADE,
  CONSTRAINT ck_ct_interna CHECK (es_interna IN (0,1))
);

CREATE TABLE actividades_ticket (
  id             NUMBER GENERATED ALWAYS AS IDENTITY,
  ticket_id      NUMBER NOT NULL,
  accion         VARCHAR2(300) NOT NULL,
  autor          VARCHAR2(200),
  estado_desde   VARCHAR2(40),
  estado_hasta   VARCHAR2(40),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_actividades_ticket PRIMARY KEY (id),
  CONSTRAINT fk_at_ticket FOREIGN KEY (ticket_id)
    REFERENCES tickets (id) ON DELETE CASCADE
);

CREATE TABLE archivos_adjuntos (
  id             NUMBER GENERATED ALWAYS AS IDENTITY,
  ticket_id      NUMBER NOT NULL,
  tipo           VARCHAR2(20) DEFAULT 'solicitud' NOT NULL, -- 'solicitud' | 'solucion'
  nombre_archivo VARCHAR2(500) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_archivos_adjuntos PRIMARY KEY (id),
  CONSTRAINT fk_aa_ticket FOREIGN KEY (ticket_id)
    REFERENCES tickets (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- NOTIFICACIONES
-- -------------------------------------------------------------

CREATE TABLE notificaciones (
  id             NUMBER GENERATED ALWAYS AS IDENTITY,
  tipo           VARCHAR2(20) NOT NULL,
  titulo         VARCHAR2(300),
  mensaje        VARCHAR2(2000),
  ticket_id      NUMBER,
  numero_ticket  VARCHAR2(20),
  leida          NUMBER(1) DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_notificaciones PRIMARY KEY (id),
  CONSTRAINT fk_notif_ticket FOREIGN KEY (ticket_id)
    REFERENCES tickets (id) ON DELETE SET NULL,
  CONSTRAINT ck_notif_tipo CHECK (tipo IN
    ('sla-warning','sla-expired','new-ticket','info')),
  CONSTRAINT ck_notif_leida CHECK (leida IN (0,1))
);

-- -------------------------------------------------------------
-- BASE DE CONOCIMIENTO
-- -------------------------------------------------------------

CREATE TABLE articulos_conocimiento (
  id             NUMBER GENERATED ALWAYS AS IDENTITY,
  titulo         VARCHAR2(500) NOT NULL,
  categoria      VARCHAR2(200),
  vistas         NUMBER DEFAULT 0,
  utilidad       NUMBER(3),
  resumen        VARCHAR2(2000),
  introduccion   CLOB,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_articulos_conocimiento PRIMARY KEY (id),
  CONSTRAINT ck_art_utilidad CHECK
    (utilidad IS NULL OR utilidad BETWEEN 0 AND 100)
);

CREATE TABLE pasos_articulo (
  id          NUMBER GENERATED ALWAYS AS IDENTITY,
  articulo_id NUMBER NOT NULL,
  posicion    NUMBER(3) NOT NULL,
  paso        VARCHAR2(2000) NOT NULL,
  CONSTRAINT pk_pasos_articulo PRIMARY KEY (id),
  CONSTRAINT fk_pa_articulo FOREIGN KEY (articulo_id)
    REFERENCES articulos_conocimiento (id) ON DELETE CASCADE
);

CREATE TABLE consejos_articulo (
  id          NUMBER GENERATED ALWAYS AS IDENTITY,
  articulo_id NUMBER NOT NULL,
  posicion    NUMBER(3) NOT NULL,
  consejo     VARCHAR2(2000) NOT NULL,
  CONSTRAINT pk_consejos_articulo PRIMARY KEY (id),
  CONSTRAINT fk_ca_articulo FOREIGN KEY (articulo_id)
    REFERENCES articulos_conocimiento (id) ON DELETE CASCADE
);

CREATE TABLE etiquetas_articulo (
  id          NUMBER GENERATED ALWAYS AS IDENTITY,
  articulo_id NUMBER NOT NULL,
  etiqueta    VARCHAR2(100) NOT NULL,
  CONSTRAINT pk_etiquetas_articulo PRIMARY KEY (id),
  CONSTRAINT fk_ea_articulo FOREIGN KEY (articulo_id)
    REFERENCES articulos_conocimiento (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- CATÁLOGOS SIN USO EN LA UI (ver 08-pendientes-y-brechas.md)
-- -------------------------------------------------------------

CREATE TABLE sistemas_institucionales (
  id     NUMBER GENERATED ALWAYS AS IDENTITY,
  nombre VARCHAR2(300) NOT NULL,
  CONSTRAINT pk_sistemas_institucionales PRIMARY KEY (id),
  CONSTRAINT uq_si_nombre UNIQUE (nombre)
);

CREATE TABLE categorias_servicio (
  id     NUMBER GENERATED ALWAYS AS IDENTITY,
  icono  VARCHAR2(20),
  nombre VARCHAR2(200) NOT NULL,
  sla    VARCHAR2(50),
  color  VARCHAR2(50),
  CONSTRAINT pk_categorias_servicio PRIMARY KEY (id)
);

CREATE TABLE servicios_categoria (
  id                    NUMBER GENERATED ALWAYS AS IDENTITY,
  categoria_servicio_id NUMBER NOT NULL,
  nombre                VARCHAR2(300) NOT NULL,
  CONSTRAINT pk_servicios_categoria PRIMARY KEY (id),
  CONSTRAINT fk_sc_categoria FOREIGN KEY (categoria_servicio_id)
    REFERENCES categorias_servicio (id) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- ÍNDICES (FK y campos de filtro/orden más usados)
-- -------------------------------------------------------------

CREATE INDEX ix_tickets_usuario       ON tickets (usuario_id);
CREATE INDEX ix_tickets_estado        ON tickets (estado);
CREATE INDEX ix_tickets_prioridad     ON tickets (prioridad);
CREATE INDEX ix_tickets_fecha_creacion ON tickets (fecha_creacion);
CREATE INDEX ix_sub_categoria_id      ON subcategorias (categoria_id);
CREATE INDEX ix_ct_ticket_id          ON comentarios_ticket (ticket_id);
CREATE INDEX ix_at_ticket_id          ON actividades_ticket (ticket_id);
CREATE INDEX ix_aa_ticket_id          ON archivos_adjuntos (ticket_id);
CREATE INDEX ix_tt_ticket_id          ON tickets_tecnicos (ticket_id);
CREATE INDEX ix_notif_ticket_id       ON notificaciones (ticket_id);
CREATE INDEX ix_pa_articulo           ON pasos_articulo (articulo_id);
CREATE INDEX ix_ca_articulo           ON consejos_articulo (articulo_id);
CREATE INDEX ix_ea_articulo           ON etiquetas_articulo (articulo_id);
CREATE INDEX ix_sc_categoria          ON servicios_categoria (categoria_servicio_id);
CREATE INDEX ix_est_ticket_id         ON etapas_solucion_ticket (ticket_id);

-- -------------------------------------------------------------
-- COMENTARIOS DE DOCUMENTACIÓN (Oracle)
-- -------------------------------------------------------------

COMMENT ON TABLE usuarios IS 'Usuarios del sistema (rol: user | admin | technician)';
COMMENT ON TABLE tickets IS 'Solicitudes e incidentes con su ciclo de vida y SLA';
COMMENT ON TABLE tickets_tecnicos IS 'Relación N:M entre tickets y técnicos responsables';
COMMENT ON TABLE comentarios_ticket IS 'Comentarios del ticket; es_interna = 1 no visible al usuario';
COMMENT ON TABLE actividades_ticket IS 'Historial/timeline de transiciones del ticket';
COMMENT ON TABLE notificaciones IS 'Notificaciones del panel de administración';

COMMENT ON COLUMN tickets.numero IS 'Número legible, ej. TK-0847';
COMMENT ON COLUMN tickets.sla_horas IS 'Horas de SLA según prioridad (Crítica 1, Alta 3, Media 6, Baja 12)';
COMMENT ON COLUMN tickets.sla_iniciado_en IS 'Momento en que arranca el cronómetro del SLA';
COMMENT ON COLUMN tickets.calificacion IS 'Encuesta del usuario al cerrar: 1..5, NULL sin calificar';
COMMENT ON COLUMN actividades_ticket.estado_hasta IS 'Nuevo estado o, en remisión, el correo destino';
```

## Semillas de ejemplo (desde `mockData.ts`)

```sql
-- Usuarios demo (currentUser / adminUser)
INSERT INTO usuarios (nombre, correo, dependencia, cargo, sede, rol, avatar) VALUES
  ('Keiny Fernanda Trujillo Quiroz', 'mflopez@uniamazonia.edu.co',
   'Facultad de Ciencias de la Educación', 'Funcionaria', 'Florencia - Caquetá', 'user', 'KF');
INSERT INTO usuarios (nombre, correo, dependencia, cargo, sede, rol, avatar) VALUES
  ('Andrés Felipe Martínez Cano', 'afmartinez@uniamazonia.edu.co',
   'Oficina Asesora de Tecnologías de la Información – OATI',
   'Coordinador Mesa de Servicios', 'Florencia - Caquetá', 'admin', 'AF');

-- Técnicos (constante technicians en AdminDashboard.tsx)
INSERT INTO tecnicos (nombre) VALUES
  ('Carlos Gómez'), ('Sandra Ríos'), ('Luis Perdomo'), ('Diana Morales'), ('Julián Torres');

-- Categorías del formulario (categoryTree). Las subcategorías se insertan
-- con categoria_id de la fila padre recién creada.
INSERT INTO categorias (nombre) VALUES ('Sistema Misional Chaira');
INSERT INTO categorias (nombre) VALUES ('Plataformas Institucionales');
INSERT INTO categorias (nombre) VALUES ('Correo Institucional');
INSERT INTO categorias (nombre) VALUES ('Conectividad');
INSERT INTO categorias (nombre) VALUES ('Equipos y Periféricos');
INSERT INTO categorias (nombre) VALUES ('Software');
INSERT INTO categorias (nombre) VALUES ('Solicitudes de Servicio');

INSERT INTO subcategorias (categoria_id, nombre) VALUES (1, 'Académico');
INSERT INTO subcategorias (categoria_id, nombre) VALUES (1, 'Biblioteca');
-- ... el resto de subcategorías se deriva de categoryTree en mockData.ts
```

### Mapeo de un ticket mock → filas

Ejemplo para `mockTickets[1]` (TK-0847, estado `En atención`, prioridad `Alta`, técnico `Carlos Gómez`):

1. `tickets`: `numero='TK-0847'`, `usuario_id=1`, `tipo='Incidente'`, `categoria_id`(Correo Institucional), `subcategoria_id`(Configuración de cliente), `estado='En atención'`, `prioridad='Alta'`, `sla_horas=3`, `sla_iniciado_en=<slaStartedAt>`, `descripcion`, `ubicacion`, `telefono`, `fecha_creacion`/`fecha_actualizacion`.
2. `tickets_tecnicos`: `(ticket_id, tecnico_id)` con `tecnico_id` = Carlos Gómez.
3. `comentarios_ticket`: el comentario de `comments` (con `es_interna=0`).
4. `actividades_ticket`: cada elemento de `activities` (mapeando `from`→`estado_desde`, `to`→`estado_hasta`).
5. `archivos_adjuntos`: `nombre_archivo='captura_error.png'`.
6. `etapas_solucion_ticket` (si el ticket tuvo solución): un `SolutionStage` por fila con `descripcion`, `completado` y `completado_en`.

## Decisiones de diseño

- **`technician` normalizado:** en TS es texto separado por `", "`; en SQL se modela como relación N:M (`tickets_tecnicos` + `tecnicos`).
- **`slaRemaining` no se almacena:** se calcula igual que en `src/utils/sla.ts` (`sla_horas` − transcurrido desde `sla_iniciado_en`). Evita datos obsoletos.
- **`area_asignada` (legacy):** mantiene `Ticket.assignedTo` tal cual existe en los mocks, aunque el flujo real usa técnicos.
- **Enums como CHECK:** los estados/prioridades/tipos en español se validan con `CHECK` (coherentes con los valores de `src/types.ts`).
- **Booleanos como `NUMBER(1)`:** Oracle no tiene `BOOLEAN` en tablas; se usa 0/1.
- **Nombres en español** (dominio de la app) y se evitan palabras reservadas de Oracle: `usuarios` (no `user`), `numero` (no `number`), `estado_desde/estado_hasta` (no `from/to`), `leida` (no `read`), `rol` (no `role`).
- **`notificaciones.numero_ticket` denormalizado:** permite mostrar el número en la lista sin JOIN (igual que `AdminNotification.ticketNumber`).
- **Adjuntos:** hoy solo nombres de archivo. Si se suben archivos reales, añadir columna de contenido (BLOB) o URL/llave de almacenamiento.
