# IRID v1.1 · Verificación visual y funcional

Fecha: 15/11/2026. Base publicada: `250191d24f34f500b6698a0c39e9281af7d3db81`. Datos ficticios, sin servicios productivos.

## Resultado

Se refinaron tipografía, jerarquía, bordes, colores semánticos, espacios y controles. Se conservaron el logo original, Montserrat y el bordó. La navegación usa un panel desplegable hasta 1100 px. Los maestros, combustible y usuarios muestran fichas en móvil; las tablas financieras mantienen desplazamiento propio. Los diálogos se adaptan a una columna y, con poca altura, pueden desplazarse completos.

Las reglas del dominio y los cálculos financieros no se modificaron. Las tres definiciones Q-001, Q-002 y Q-003 siguen pendientes.

## Evidencia

- `npm test`: 22/22 pruebas de reglas, permisos simulados, reportes, versionado y exportaciones.
- `npm run build`: HTML autónomo con fuente y logo incrustados. SHA del entregable en `build-manifest.json`.
- `viewport-matrix.json`: 15 secciones de Alejandro × 6 anchos (320, 390, 768, 1024, 1440 y 1920). 90 casos sin desbordamiento horizontal del documento, errores de render ni excepciones. Las tablas que requieren scroll tuvieron región enfocables y aviso.
- `final-interactions.json`: inicio de sesión en esos 6 anchos, cuatro perfiles visibles y scroll habilitado; restauración de foco y valor después de Escape en confirmación de descarte; descargas reales y desplazamiento de tabla con teclado.
- `review-fixes.json`: cambio de perfil desde menú móvil libera scroll; escribir en login y pasar 1101→1100 conserva texto y formulario abierto; apertura de turno real en la demo y foco devuelto al contenido.
- `driver-journey.json`: a 320 px, abrir turno, iniciar viaje, finalizar bloqueado hasta resolver pasajeros y confirmar Realizado con los tres pasajeros en No viajó.
- `walter-short-viewport.json`: inicio de Walter en agenda, contraste del día 16, formulario de generación a 390×220, error por no seleccionar recorridos, corrección y acceso a la vista previa.
- `secretary-and-focus.json`: inicio de Secretaria en pendientes, revisión y verificación del comprobante; activador del menú al pasar a escritorio devuelve foco al contenido.
- `liquidacion-octubre.xlsx` y `.pdf`: emitidos desde Alejandro por $60.000,00 para Transp SERV, octubre 2026; descargados desde la interfaz. Pruebas estructurales y de contenido en `export-check.json`.
- Capturas: escritorio, agenda en tablet, jornada, fichas, comprobante, revisión de liquidación y formulario en móvil. Las capturas muestran distintos momentos de la prueba, con datos ficticios que cambian durante el recorrido.

## Revisión independiente

Un revisor de solo lectura revisó las fuentes contra la base. Detectó y se corrigieron: bloqueo de scroll al salir por menú móvil, pérdida de formularios al cruzar el breakpoint, pérdida del contraste del día actual, falta de scroll en diálogos muy bajos y recuperación del foco. Comprobó etiquetas y encabezados en 87 filas de 31 tablas de 40 combinaciones de vistas/perfil. Ejecutó también las 22 pruebas; no utilizó navegador.

El orquestador confirmó en navegador los casos corregidos. La última comprobación visual de `comprobante-390.png` mostró acciones de cabecera demasiado estrechas. Se añadió después una base flexible mínima de 160 px: a 320 px cada acción ocupa una fila; a 390 px caben dos y la tercera ocupa la siguiente. Este ajuste final de CSS se comprobó por la regla de distribución y el build, sin una nueva captura de navegador. Esa captura conserva la evidencia del hallazgo, no el aspecto final de esos botones.

## Límites

Navegador Ego Lite/Chromium en Windows, con tamaños de viewport emulados. No equivale a una certificación de todos los dispositivos, Safari, Firefox, lectores de pantalla o teclados virtuales reales. Se comprobaron teclado, foco, formularios, estados y navegación en los escenarios descritos. La prueba de poco alto simula espacio reducido; no simula un teclado de iOS/Android.

No se desplegó un sitio ni se implementaron autenticación o permisos productivos. La revisión con IRID y el plan de implementación siguen pendientes.
