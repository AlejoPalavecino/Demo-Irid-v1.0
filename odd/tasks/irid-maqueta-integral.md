# Feature: Maqueta integral IRID

- **Spec:** ../../docs/specifications/functional-spec.md; ../../docs/prototype-contract.md; https://docs.google.com/document/d/1SzC_KHvpzqOAO3R4vuUFue63WCJLDAb9-GzHirPRdgU
- **Design:** ../../docs/specifications/ux-decisions.md; UX-061 base visual, UX-062 organización Mi jornada, UX-063 maqueta integral; https://docs.google.com/document/d/1CCW-PWDkwVXg6GZMeP_Gq6-V_o6_nptBCVfeP6qjbkY
- **Approval:** approved

Autorización: Alejo, 2026-11-15: construir maqueta completa con perfiles, datos de prueba y funciones simuladas para validar con cliente. Sólo prototipo, sin producción ni despliegue.

## Tasks

### TASK-001 — Alcance y contrato recuperables
- **State:** DONE
- **Depends on:** none
- **Owner:** root
- **Acceptance:** Fuentes vigentes recuperadas, módulos y contratos comunes definidos, pendientes Q001-003 preservados y últimas aprobaciones registradas.
- **Evidence:** reference/spec.md, reference/ux.md, contract.md; lectura nativa y readback UX062/063; autorización del usuario en chat.
- **Blocker:** none

### TASK-002 — Reglas y datos de prueba coherentes
- **State:** DONE
- **Depends on:** TASK-001
- **Owner:** domain
- **Acceptance:** Motor puro cubre reglas y permisos simulados, casos negativos y versiones inmutables; pruebas RED/GREEN.
- **Evidence:** domain.js, tests/domain.test.js, tests/domain-evidence.md; npm test final: 22/22 (18 dominio y 4 export/reportes); tests/independent-review.md verifica escenarios negativos y snapshots.
- **Blocker:** none

### TASK-003 — Navegación y módulos operativos utilizables
- **State:** DONE
- **Depends on:** TASK-001
- **Owner:** root, operations, management
- **Acceptance:** Cuatro accesos rápidos y menús por roles; tareas de jornada, agenda, maestros, combustible, gastos y usuarios ejecutables con datos ficticios.
- **Evidence:** operations.js, management.js y main.js integrados; browser/round-08 a round-35: cuatro perfiles, jornada, combustible con PNG, gasto, contraseña temporal, agenda, lecturas y maestros. Quince secciones de administrador renderizadas sin errores.
- **Blocker:** none

### TASK-004 — Finanzas y reportes simulados
- **State:** DONE
- **Depends on:** TASK-001
- **Owner:** finance
- **Acceptance:** Tarifas, liquidaciones con versiones y correcciones, reportes y archivos Excel/PDF consistentes con datos seleccionados; pendiente mínimo explícito.
- **Evidence:** finance.js y tests/exports.test.js; browser/round-22 a round-28: emisión 60.000, corrección 61.000, versión anterior conservada; downloads reales tests/browser-exports validados por validate-browser-exports.py; bloqueo noviembre comprobado.
- **Blocker:** none

### TASK-005 — Integración y verificación de la demo
- **State:** DONE
- **Depends on:** TASK-002, TASK-003, TASK-004
- **Owner:** root, quality_reviewer
- **Acceptance:** Escenarios por rol, bloqueos relevantes, formularios, exportaciones y responsive verificados; hallazgos bloqueantes resueltos y límites documentados.
- **Evidence:** tests/independent-review.md: tres hallazgos corregidos y cuatro sondas independientes; outputs/IRID-verificacion.md; round-33 y round-36 responsive 390/320, teclado y reinicio; suite final22/22. Ver límites de cobertura en informe.
- **Blocker:** none

### TASK-006 — Entrega para presentar al cliente
- **State:** DONE
- **Depends on:** TASK-005
- **Owner:** root
- **Acceptance:** HTML autónomo y guía bajo outputs, referencias de decisiones actualizadas; apertura sin instalación, reinicio y límites claros.
- **Evidence:** outputs/IRID-maqueta-interactiva.html y outputs/IRID-demo-completa.zip, guía, verificación, boleta ficticia y licencia. package-delivery.py verificó CRC y contenido del ZIP. delivery-evidence.json guarda tamaños y hashes. Registro nativo actualizado y readback UX062/063 + ocho bloques + entrega.
- **Blocker:** none

## Cierre

Candidato HTML: `6db9b38525cf59264669066a4a4e227fc662b58adc7d36dde6d854b04d2671dc`. Entrega local completa. La validación con IRID y el desarrollo productivo siguen pendientes. Q001, Q002 y Q003 no se resolvieron por suposición.
