# Feature: Jornada guiada del chofer
- **Spec:** docs/specifications/functional-spec.md
- **Design:** Mi jornada conserva Aqua. La primera sección pasa de abrir turno a iniciar el próximo viaje, marcar pasajeros, finalizar y continuar con el siguiente. Combustible, comprobantes y otros viajes siguen disponibles. La finalización requiere confirmación.
- **Approval:** approved

### TASK-001 — Guiar al chofer desde el turno hasta el próximo viaje
- **State:** DONE
- **Depends on:** none
- **Owner:** orquestador
- **Acceptance:** La acción prioritaria cambia según el estado real. Se conserva la asistencia individual, el bloqueo por pasajeros pendientes y el acceso a tareas secundarias.
- **Evidence:** tests/journey.test.js falló primero por ausencia de la acción guiada. npm test pasó 24/24 después de implementar la secuencia.
- **Blocker:** none

### TASK-002 — Completar la jornada en un celular de prueba
- **State:** DONE
- **Depends on:** TASK-001
- **Owner:** orquestador
- **Acceptance:** Probar turno, viaje, pasajeros y siguiente viaje en el HTML generado a 360 px.
- **Evidence:** Ego Lite a 360 px, HTML autónomo con datos de prueba aislados. Tres viajes completados. Se verificó corregir una marca después de cancelar la finalización, devolución del foco, siguiente viaje de las 12:00 y cierre del turno a 50.125 km. Captura: docs/verification/jornada-guiada-360.png.
- **Blocker:** none
