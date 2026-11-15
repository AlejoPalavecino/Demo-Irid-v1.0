# Feature: Publicación y mejora visual responsive de IRID

- **Spec:** ../../docs/specifications/functional-spec.md; ../../docs/specifications/ux-decisions.md
- **Design:** ../../docs/design/baseline/; ../../docs/design/iteration-01.md
- **Approval:** approved

Autorización de Alejo el 15/11/2026: crear la carpeta del proyecto en Documentos, publicar la maqueta actual en AlejoPalavecino/Demo-Irid-v1.0, mejorar diseño/colores/espaciados/responsive y publicar de nuevo. Se conservan la identidad y los flujos acordados. La publicación autoriza commits y push a este remoto; no se solicitó despliegue.

## Tasks

### TASK-001 — Versión original recuperable en el remoto
- **State:** DONE
- **Depends on:** none
- **Owner:** root
- **Acceptance:** Repositorio local independiente, fuentes/activos/especificaciones/pruebas y demo original publicadas; build portable conserva el HTML y pasan pruebas.
- **Evidence:** Commit 250191d24f34f500b6698a0c39e9281af7d3db81 publicado en main; HEAD remoto comprobado con git ls-remote. npm test: 22/22. npm run build conserva el HTML original tras normalizar saltos de línea.
- **Blocker:** none

### TASK-002 — Interfaz refinada y adaptable
- **State:** DONE
- **Depends on:** TASK-001
- **Owner:** root
- **Acceptance:** Identidad aprobada conservada; jerarquía, espaciado, navegación, formularios, listados y tablas adecuados a móvil, tablet y escritorio; sin cambios de reglas comerciales.
- **Evidence:** src/styles.css y presentación de main/management/operations; capturas y medidas en docs/verification/responsive-v1-1. Bordó, Montserrat y logo conservados. Navegación sin perder formularios, fichas móviles, tablas con scroll y diálogos con poca altura. Ajuste final de base de botones documentado con su límite de verificación visual.
- **Blocker:** none

### TASK-003 — Calidad visual y funcionamiento comprobados
- **State:** DONE
- **Depends on:** TASK-002
- **Owner:** root
- **Acceptance:** Pruebas automáticas verdes y recorridos en navegador por perfiles; medidas y capturas representativas desde 320 px hasta escritorio amplio; controles de foco, textos largos y tablas.
- **Evidence:** npm test 22/22; 90 comprobaciones de secciones y 6 de login sin overflow; cuatro perfiles, errores, descarte, foco, calendario, recorrido sin pasajeros, combustible y emisión/descarga. Revisión independiente: 31 tablas/87 filas. Detalle y límites en docs/verification/responsive-v1-1/verification.md.
- **Blocker:** none

### TASK-004 — Versión mejorada publicada
- **State:** IN_PROGRESS
- **Depends on:** TASK-003
- **Owner:** root
- **Acceptance:** Build, documentación y paquete actualizados, commit publicado en el remoto y HEAD local/remoto coincidentes.
- **Evidence:** none
- **Blocker:** none
