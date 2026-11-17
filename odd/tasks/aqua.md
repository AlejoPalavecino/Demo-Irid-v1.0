# Feature: Aqua en la maqueta de traslados

- **Spec:** docs/specifications/functional-spec.md
- **Design:** Aqua v1.0 entregado por Alejo el 17/11/2026, aplicado a los recorridos de docs/specifications/ux-decisions.md.
- **Approval:** approved

### TASK-001 — Acceso, navegación y lectura operativa
- **State:** DONE
- **Depends on:** none
- **Owner:** orquestador
- **Acceptance:** Paleta canónica, Poppins autónoma, panel continuo, navegación conectada y resumen basado en viajes de la maqueta.
- **Evidence:** docs/verification/aqua-resumen.png. Poppins cargada, unión lateral 0 px, contraste medido 4,68 y 4,95. Siete totales contrastados con viajes y acceso por Enter a Agenda.
- **Blocker:** none

### TASK-002 — Uso con teclado y pantallas angostas
- **State:** DONE
- **Depends on:** TASK-001
- **Owner:** orquestador
- **Acceptance:** Accesos por perfil, menú móvil y retorno de foco utilizables a 360 px. Generación autónoma y pruebas del repositorio exitosas.
- **Evidence:** docs/verification/aqua-jornada-360.png. Cuatro perfiles y 15 secciones administrativas a 360 px sin desborde de página. Escape devolvió foco a 360 y 768 px. npm test: 23/23. npm run build: correcto.
- **Blocker:** none
