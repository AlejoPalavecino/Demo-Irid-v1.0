# Feature: Hoja de ruta IRID

- **Spec:** docs/specifications/functional-spec.md
- **Design:** Dirección aprobada de agenda operativa. Acceso por tarea y rol, agenda y pendientes antes del gráfico, itinerario móvil, Montserrat y bordó puntual sobre papel. Selectores con teclado y movimiento reducido.
- **Approval:** approved
- **Evidence mode:** candidate-v1

### TASK-001 — Entrar con un perfil y resolver la tarea del día
- **State:** DONE
- **Depends on:** none
- **Owner:** orquestador
- **Acceptance:** Ingreso rápido y por cuenta, asignación desde el resumen, jornada y selectores utilizables en celular. Carga vinculada al estado real y transiciones que respetan movimiento reducido.
- **Scope:** ["src/main.js","src/operations.js","src/management.js","src/styles.css","scripts/build.mjs","index.html"]
- **Evidence:** {"command": "npm test; Ego Lite (1440 y 360 px)", "result": "24 pruebas aprobadas. Ingreso por cuenta y perfil, asignación con teclado, viaje finalizado, siguiente viaje correcto, movimiento reducido y carga/verificación de foto. Comparativas en docs/verification/comparacion-operacion.png y comparacion-jornada.png.", "candidate": "sha256:441fed611f951a8cef7cb87bea6da086939a4ff6f9030b525ada58d67680decc"}
- **Blocker:** none
