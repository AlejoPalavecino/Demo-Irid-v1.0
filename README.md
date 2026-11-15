# IRID · Maqueta interactiva

Prototipo para validar con IRID los flujos de traslados, flota y administración. Incluye accesos rápidos de Alejandro, Walter, Secretaria y Chofer, datos ficticios, acciones simuladas, historial, liquidaciones versionadas y descargas Excel/PDF.

## Abrir la demo

Abrí [`index.html`](index.html) en un navegador actual. No requiere instalación ni conexión. El logo y Montserrat están incrustados. Para compartirla, descargá el paquete de [`releases/`](releases/).

Los cambios se guardan en el navegador usado. «Cambiar de perfil» los conserva y «Reiniciar datos» restaura los ejemplos. El día simulado es el 16/11/2026. Las cuentas iniciales `alejandro`, `walter`, `secretaria` y `diego` usan `demo123`; son credenciales ficticias y no representan seguridad productiva.

Consultá la [guía de presentación](docs/guia-demo.md). Podés usar el [comprobante ficticio](tests/fixtures/comprobante-ficticio.png) para probar los adjuntos.

## Desarrollo

Node.js 22 o posterior, sin paquetes externos ni instalación de dependencias:

```sh
npm test
npm run build
```

Editá `src/`. El build genera `index.html` y una copia en `dist/IRID-maqueta-interactiva.html`; ambos son autónomos. `index.html` se versiona para que se pueda abrir después de clonar o descargar el repositorio.

## Contenido

| Ruta | Contenido |
| --- | --- |
| `src/` | Motor de reglas, pantallas, estilos y plantilla. |
| `assets/` | Logo original, Montserrat y su licencia. |
| `tests/` | Reglas, permisos simulados, reportes y exportaciones. |
| `docs/specifications/` | Especificación funcional y decisiones UX confirmadas. |
| `docs/verification/` | Evidencia de pruebas y límites de cada versión. |
| `docs/design/` | Referencias y evolución visual. |
| `odd/tasks/` | Registro del trabajo y sus verificaciones. |
| `releases/` | Paquetes descargables de la maqueta. |

## Límites y pendientes

Es una demo local: no tiene backend, autenticación segura, almacenamiento privado, respaldos ni despliegue. No ingreses información sensible ni claves reales. La validación con el cliente está pendiente.

- Q-001: importe y aplicación del mínimo mensual garantizado.
- Q-002: volumen aproximado de traslados diarios.
- Q-003: significado de los horarios de Entrada/Salida.

Estas preguntas siguen abiertas y visibles en la guía de la demo. El prototipo no sustituye sus respuestas ni el plan de implementación productiva.

Montserrat se distribuye con [SIL Open Font License](assets/fonts/OFL.txt). El logo de IRID fue aportado para esta maqueta; no se concede una licencia general sobre la identidad de la institución.
