# Feature: Publicación y mejora visual responsive de IRID

- **Spec:** ../../docs/specifications/functional-spec.md; ../../docs/specifications/ux-decisions.md
- **Design:** ../../docs/design/baseline/; ../../docs/design/iteration-01.md
- **Approval:** approved

Autorización de Alejo el 15/11/2026: crear la carpeta del proyecto en Documentos, publicar la maqueta actual en AlejoPalavecino/Demo-Irid-v1.0, mejorar diseño/colores/espaciados/responsive y publicar de nuevo. Se conservan la identidad y los flujos acordados. La publicación autoriza commits y push a este remoto; no se solicitó despliegue.

## Tasks

### TASK-001 — Versión original recuperable en el remoto
- **State:** IN_PROGRESS
- **Depends on:** none
- **Owner:** root
- **Acceptance:** Repositorio local independiente, fuentes/activos/especificaciones/pruebas y demo original publicadas; build portable conserva el HTML y pasan pruebas.
- **Evidence:** none
- **Blocker:** none

### TASK-002 — Interfaz refinada y adaptable
- **State:** PLANNED
- **Depends on:** TASK-001
- **Owner:** root
- **Acceptance:** Identidad aprobada conservada; jerarquía, espaciado, navegación, formularios, listados y tablas adecuados a móvil, tablet y escritorio; sin cambios de reglas comerciales.
- **Evidence:** none
- **Blocker:** none

### TASK-003 — Calidad visual y funcionamiento comprobados
- **State:** PLANNED
- **Depends on:** TASK-002
- **Owner:** root
- **Acceptance:** Pruebas automáticas verdes y recorridos en navegador por perfiles; medidas y capturas representativas desde 320 px hasta escritorio amplio; controles de foco, textos largos y tablas.
- **Evidence:** none
- **Blocker:** none

### TASK-004 — Versión mejorada publicada
- **State:** PLANNED
- **Depends on:** TASK-003
- **Owner:** root
- **Acceptance:** Build, documentación y paquete actualizados, commit publicado en el remoto y HEAD local/remoto coincidentes.
- **Evidence:** none
- **Blocker:** none
