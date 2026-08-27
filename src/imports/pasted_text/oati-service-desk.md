Diseña una aplicación web moderna, institucional y profesional para la Universidad de la Amazonia denominada "Mesa de Servicios OATI", completamente alineada con las buenas prácticas de ITIL 4.

La aplicación será utilizada únicamente por usuarios autenticados mediante el directorio institucional de la Universidad de la Amazonia (LDAP/Active Directory), por lo tanto NO debe existir registro de usuarios. Toda la información básica del usuario (nombre, correo institucional, dependencia, cargo y sede) será obtenida automáticamente al iniciar sesión.

El sistema funcionará como el único punto de contacto (Service Desk) entre la comunidad universitaria y la Oficina Asesora de Tecnologías de la Información (OATI).

El diseño debe ser minimalista, moderno, altamente usable, accesible (WCAG 2.1 AA), responsive y orientado a una excelente experiencia de usuario.

=========================
MÓDULOS PRINCIPALES
=========================

1. DASHBOARD DEL USUARIO

Diseñar una pantalla principal donde el usuario visualice:

• Botón "Registrar Incidencia"
• Botón "Solicitar Servicio"
• Historial de solicitudes
• Estado de los tickets
• Últimos comunicados tecnológicos
• Acceso rápido a la Base de Conocimiento
• Acceso al Catálogo de Servicios

Mostrar tarjetas con:

Mis Tickets Abiertos

En Atención

Pendientes

Resueltos

Cerrados

=========================
REGISTRO DE INCIDENTE
=========================

Crear un formulario muy amigable.

Los datos del usuario deben aparecer automáticamente:

Nombre

Dependencia

Correo institucional

Cargo

Sede

Campos del formulario:

Categoría

Subcategoría

Servicio afectado

Prioridad (calculada automáticamente)

Título del incidente

Descripción

Adjuntar imágenes

Adjuntar documentos

Adjuntar video (opcional)

Fecha y hora automática

Ubicación

Número telefónico

La categoría seleccionada debe cambiar dinámicamente el formulario.

Ejemplo:

Si selecciona:

Correo Institucional

mostrar una plantilla de ayuda como:

¿Qué error presenta?

¿Desde cuándo ocurre?

¿Adjunta captura del error?

¿Sucede con otros usuarios?

Si selecciona:

Solicitud de Copia de Seguridad

mostrar:

Sistema

Base de datos

Fecha requerida

Motivo

Si selecciona:

Sistema Académico

mostrar preguntas específicas.

El objetivo es ayudar al usuario a redactar correctamente el incidente.

=========================
CATEGORÍAS
=========================

Diseñar un catálogo amplio para incidentes tecnológicos.

Debe existir una categoría denominada:

Desarrollos Institucionales

Dentro de ella permitir seleccionar cualquiera de los 42 sistemas institucionales.

También incluir categorías como:

Correo Institucional

Portal Web

Red

Internet

Wifi

Hardware

Impresoras

Telefonía

Videoconferencia

Equipos de Cómputo

Software Institucional

Software Ofimático

Accesos

Contraseñas

Bases de Datos

Copias de Seguridad

Infraestructura

Virtualización

Otros

=========================
AL ENVIAR EL TICKET
=========================

Mostrar una pantalla de éxito.

Mensaje:

Su solicitud fue registrada exitosamente.

Número del Ticket

Estado:

Registrado

Tiempo estimado de atención según el SLA.

Mensaje:

La Mesa de Servicios de la OATI ha recibido su solicitud.

Será revisada y atendida dentro de los tiempos definidos por los Acuerdos de Nivel de Servicio (SLA).

Recibirá notificaciones por correo electrónico durante todo el proceso.

No indicar "3 días por norma".

=========================
CORREO AUTOMÁTICO
=========================

Diseñar la plantilla del correo institucional.

Asunto:

Recepción de solicitud

Contenido:

Número del ticket

Resumen

Fecha

Estado

Tiempo estimado

Enlace para consultar el ticket.

=========================
HISTORIAL DEL USUARIO
=========================

Diseñar una tabla elegante.

Columnas:

Ticket

Categoría

Fecha

Estado

Responsable

Última actualización

Tiempo transcurrido

Al ingresar al ticket mostrar:

Historial completo

Comentarios

Archivos

Seguimiento

Respuesta

Adjuntos

=========================
MESA DE SERVICIOS
=========================

Diseñar el panel del administrador.

Dashboard con:

Tickets Nuevos

Tickets Asignados

Tickets por vencer

SLA

Indicadores

Filtros

=========================
CLASIFICACIÓN
=========================

El administrador debe poder:

Clasificar

Categorizar

Priorizar

Asignar

Escalar

Agregar comentarios internos

Adjuntar archivos

Cambiar estado

Estados:

Registrado

Clasificado

Asignado

En Atención

Pendiente Usuario

Pendiente Tercero

Resuelto

Cerrado

=========================
ESCALAMIENTO
=========================

Diseñar un flujo interno.

Administrador

↓

Área Desarrollo

↓

Jefe Desarrollo

↓

Desarrollador

o

Administrador

↓

Área Hardware y Comunicaciones

↓

Jefe Hardware

↓

Técnico

Cada responsable podrá:

Agregar comentarios

Adjuntar fotografías

Adjuntar documentos

Registrar actividades

Registrar solución

Actualizar estado

Registrar tiempo invertido

=========================
REMITIR A OTRA DEPENDENCIA
=========================

Cuando el incidente no sea competencia de la OATI.

Agregar botón:

Remitir a otra dependencia.

Solicitar:

Correo destino

Asunto

Mensaje

El sistema debe generar automáticamente un correo institucional muy profesional explicando:

Descripción del caso.

Usuario afectado.

Datos del contacto.

Adjuntos.

Número del ticket.

Una vez enviado:

El ticket quedará cerrado con estado:

Remitido a otra dependencia.

No continuará el seguimiento interno.

=========================
CIERRE
=========================

Cuando el técnico registre la solución.

Mostrar:

Descripción de la solución.

Evidencias.

Fecha.

Tiempo invertido.

El usuario recibirá un correo.

=========================
ENCUESTA
=========================

Después del cierre.

Mostrar encuesta corta.

Califique de 1 a 5 estrellas.

¿El problema fue solucionado?

Tiempo de atención

Calidad de la atención

Comentarios

=========================
BASE DE CONOCIMIENTO
=========================

Diseñar una biblioteca.

Buscar artículos.

Preguntas frecuentes.

Manual de usuario.

Tutoriales.

=========================
ESTILO VISUAL
=========================

Inspirarse en:

Jira Service Management

Freshservice

Zendesk

GLPI

Microsoft Fluent Design

Material Design 3

Utilizar:

Mucho espacio en blanco

Tarjetas modernas

Íconos lineales

Colores institucionales de la Universidad de la Amazonia

Gráficos

Timeline para el seguimiento del ticket

Etiquetas de estado

Indicadores SLA

Diseñar todas las pantallas con alto nivel de detalle, mostrando una experiencia de usuario intuitiva, moderna, profesional y alineada con ITIL 4.
Mi recomendación adicional

Yo iría un paso más allá y aprovecharía que este será un desarrollo institucional para diseñarlo como una plataforma completa de gestión de servicios TI, no solo como un módulo de incidencias. Es decir, construirlo desde el inicio pensando en cuatro componentes:

Portal del Usuario: registro y consulta de incidentes y solicitudes.
Mesa de Servicios (Service Desk): recepción, clasificación, asignación y seguimiento.
Portal del Técnico: atención de casos, registro de actividades, evidencias y soluciones.
Portal del Administrador: configuración de categorías, SLA, grupos de soporte, indicadores, encuestas y reportes.

Esta arquitectura refleja mucho mejor la filosofía de ITIL 4 y permitirá que el sistema crezca en el futuro sin necesidad de rediseñar la base funcional. Además, facilitará incorporar posteriormente prácticas como Gestión de Problemas, Gestión de Cambios y Gestión de Activos, manteniendo una estructura coherente desde la primera versión.