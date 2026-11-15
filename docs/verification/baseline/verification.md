# IRID · Verificación de la maqueta

Fecha de entrega: 15/11/2026. Candidato: `IRID-maqueta-interactiva.html`, con datos ficticios del 16/11/2026. Entorno: Windows, Node 24.20.0, Python 3.12 y Ego Lite mediante ego-browser 2.2.1.

## Resultado

La maqueta integrada permite recorrer los cuatro perfiles, operar sobre datos de prueba y descargar Excel/PDF. **22 pruebas automáticas pasaron**. La revisión independiente de reglas y permisos simulados terminó sin bloqueantes después de corregir tres hallazgos.

## Comprobaciones realizadas

- Acceso rápido de los cuatro perfiles y pantallas iniciales correspondientes. Navegación de las 15 secciones de Alejandro sin errores de render. Walter conserva Mi jornada y no ve las secciones comerciales; Secretaria y Chofer tienen sus menús restringidos.
- Apertura de turno, inicio de viaje, estados de pasajeros y finalización. Un pasajero sin marcar bloquea finalizar. Un viaje en curso bloquea cerrar el turno y ofrece «Ir al viaje». Un recorrido con todos los pasajeros en «No viajó» puede confirmarse como Realizado.
- Carga de combustible sin foto, conservación entre perfiles, selección de PNG ficticio con vista previa, adjunto al registro existente y verificación explícita. Sin comprobante, verificar está bloqueado. Los totales separan pendientes, verificados y unidades.
- Cierre normal con distancia calculada, cierre por olvido con motivo y actor distinto del chofer, confirmación de diferencia positiva y corrección de referencia negativa conservando la lectura real.
- Generación de diciembre: 80 viajes nuevos; segunda vista previa: 0 nuevos y 80 conservados. Vistas diaria, semanal y mensual. Reprogramación con comparación, rechazo de asignación en conflicto con enlace al viaje y posterior asignación válida.
- Alta de paciente, formulario de recorrido con cuatro paradas ordenables, gasto desde ficha de vehículo registrado una sola vez y tarifa con vigencia futura sin reescribir el viaje anterior.
- Emisión Transp SERV de octubre: versión 1 por 60.000. Ajuste de un viaje, comparación de diferencia de 1.000 y emisión de versión 2 por 61.000. La versión 1 conservó sus 60.000. Noviembre muestra viajes sin resolver y no ofrece emitir.
- Descargas reales del navegador: XLSX con CRC y XML válidos; PDF leído con un parser estricto. Ambos conservan Transp SERV, versión y total de 60.000. Pruebas adicionales verificaron acentos y paginación de PDF con 90 filas.
- Alta de cuenta, contraseña temporal obligatoria, cambio y apertura del inicio correspondiente. La contraseña temporal anterior fue rechazada después del cambio.
- Formulario modificado: «Seguir editando» conservó el valor; «Salir sin guardar» descartó el borrador. Errores conservaron el formulario. Búsqueda sin resultados mostró explicación y «Limpiar filtros».
- Reinicio confirmado: volvió a los nueve viajes iniciales y retiró los datos creados en QA. No afectó los archivos descargados.

## Apariencia y uso

Se inspeccionaron capturas de ingreso y resumen en escritorio, y Mi jornada y Reportes a 390 px. Mi jornada también se midió a 320 px: sin desbordamiento horizontal. Se verificaron fuente Montserrat cargada, logo original, navegación móvil, formulario dentro del viewport, foco visible, Escape y retención del foco en un modal. Se amplió el campo de período en celular para evitar que el texto quedara cortado. Las tablas anchas usan desplazamiento dentro de su contenedor.

## Correcciones de la revisión independiente

1. La copia de datos de una pestaña podía revivir una cuenta dada de baja desde otra. Se sincroniza al recibir cambios y antes de mutar. Se comprobó con contextos separados y almacenamiento compartido.
2. Una revisión negativa pendiente podía eludirse volviendo a informar una lectura mayor. Ahora bloquea abrir el vehículo para cualquier chofer hasta una corrección compatible, sin reemplazar la lectura informada.
3. Una confirmación de emisión podía usar un total modificado desde otra pestaña. Se actualiza la vista previa y se rechaza confirmar si los datos cambiaron.

## Límites

Las pruebas cubren los recorridos descritos, no todas las combinaciones posibles. No se ejecutó una auditoría completa de accesibilidad con tecnología asistiva ni una matriz de todos los navegadores. La sincronización se probó con operaciones sucesivas y estado obsoleto; no constituye una garantía de concurrencia productiva.

No se validaron usuarios reales, volumen operativo, seguridad de servidor, respaldo/restauración ni despliegue. Todo el HTML es inspeccionable y sus permisos son una simulación. La validación de producto por IRID y Q-001 a Q-003 permanecen pendientes.
