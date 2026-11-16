# IRID · Guía de la maqueta interactiva

Esta demo permite revisar con el cliente los flujos acordados antes de implementar el sistema real. Usa bordó, fondos claros, Montserrat y el logo original de IRID.

## Abrir y compartir

Abrí `IRID-maqueta-interactiva.html` con Chrome, Edge o un navegador actual. No requiere instalación ni conexión: el logo, la tipografía y los módulos están dentro del archivo. Para compartirla, enviá el HTML o el ZIP de entrega; no publiques datos reales en la demo.

En el repositorio, el mismo archivo se llama `index.html`. El paquete actualizado es `releases/IRID-demo-v1.2.zip`. En tablet y celular, el botón de menú abre las secciones del perfil; en listados administrativos cada registro se presenta como una ficha. En liquidaciones y reportes, deslizá la tabla cuando aparezca el aviso de columnas adicionales. Dentro de la app, la sección «Guía de la demo» incluye accesos directos para saltar a cada paso del recorrido durante la reunión.

Para probar el adjunto de una boleta, usá `IRID-comprobante-ficticio.png`, incluido en esta entrega.

Los accesos rápidos permiten ingresar como Alejandro, Walter, Secretaria o Chofer. Los cambios se guardan en el navegador usado y se comparten entre esos perfiles de prueba. «Cambiar de perfil» conserva los cambios. «Reiniciar datos» los reemplaza por los ejemplos iniciales, con confirmación.

El día de la demo es el **lunes 16 de noviembre de 2026**. Las fechas e importes son ficticios. Abrir el archivo desde otra ubicación o navegador puede crear una demo independiente.

## Recorrido sugerido para la reunión

1. **Chofer:** entrar a «Mi jornada», abrir un turno con Móvil 01 y una lectura de 50.000 km; abrir el viaje de las 08:00, iniciarlo, registrar pasajeros y finalizarlo. Probar también un pasajero sin marcar para ver el bloqueo. Registrar combustible y dejar una carga sin comprobante. Cerrar el turno después de resolver el viaje.
2. **Walter:** recorrer las vistas de día, semana y mes; asignar un viaje sin chofer, probar una coincidencia exacta de fecha/hora, generar un mes y repetir la generación. Revisar una reprogramación con viajes excluidos. Resolver diferencias de odómetro y probar el cierre por olvido. Walter conserva «Mi jornada» porque también tiene rol Chofer.
3. **Secretaria:** revisar la carga sin comprobante, comprobar que no puede verificarla, adjuntar una imagen ficticia y verificarla expresamente. Registrar un gasto desde la ficha de un vehículo y comprobar su historial y total.
4. **Alejandro:** revisar el resumen y sus pendientes, crear o editar maestros, consultar tarifas e historial. Preparar **Transp SERV de octubre de 2026**, emitir y descargar Excel/PDF. Corregir un viaje y preparar una nueva versión conservando la anterior. Noviembre tiene viajes sin resolver para mostrar el bloqueo de emisión.
5. **Usuarios:** crear una cuenta de prueba, copiar la contraseña temporal e ingresar con ella; cambiarla obligatoriamente. Revisar qué accesos se agregan o quitan al editar roles. La baja de un chofer conserva otros roles y deja sus viajes futuros sin asignar.
6. **Reportes:** elegir tipo y período, revisar resultados y totales y descargar. Cambiar de perfil para comprobar que la información comercial está reservada a Alejandro.

Las cuentas iniciales son `alejandro`, `walter`, `secretaria` y `diego`, con contraseña ficticia `demo123`. Después de un restablecimiento, usá la nueva contraseña temporal. Los accesos rápidos son atajos de demostración y no representan un mecanismo de autenticación real.

## Qué observar con el cliente

- ¿Cada persona encuentra lo que necesita al ingresar?
- ¿Los nombres de pantallas, botones, estados y avisos coinciden con su trabajo?
- ¿Los datos visibles alcanzan para asignar, conducir, revisar y liquidar?
- ¿Las confirmaciones explican el efecto de una baja o corrección?
- ¿Los formatos de liquidación y reporte resultan útiles?

Anotá cada ajuste con el perfil, pantalla, situación observada y resultado esperado. La validación del cliente todavía no está realizada por abrir o probar técnicamente esta maqueta.

## Las tres definiciones pendientes de IRID

| Pregunta | Falta confirmar | Efecto en la demo |
| --- | --- | --- |
| Q-001 · Mínimo mensual garantizado | Importe, si es común o individual y aplicación a Walter con doble rol. | La liquidación de chofer muestra el subtotal por servicios y avisa que no calcula el mínimo. |
| Q-002 · Volumen de traslados | Cantidad aproximada diaria, contando Entrada y Salida por separado. | Los datos no representan una validación de capacidad o rendimiento real. |
| Q-003 · Horarios | Si indican inicio del recorrido o llegada/salida institucional. | Los horarios son ilustrativos; se conserva el bloqueo por coincidencia exacta sin definir su significado. |

## Alcance y límites

La maqueta simula las reglas, los permisos por pantalla, el historial y las versiones, y genera descargas locales de prueba. Los archivos exportados se identifican como demostración. Una liquidación emitida conserva una copia de sus datos aunque después cambie un viaje.

No tiene servidor, base de datos productiva, autenticación segura, usuarios reales ni comprobantes privados. Las contraseñas de ejemplo y los registros están en el navegador: no cargues información sensible. No hay envíos, pagos ni integraciones externas. Tampoco se configuraron copias de seguridad diarias; siguen siendo un requisito del futuro sistema.

Esta entrega autoriza y ejecuta el prototipo. Las tecnologías productivas, el diseño técnico, los detalles pendientes y el plan de implementación se trabajan después de revisar la demo con el cliente.

Tipografía: Montserrat, incluida bajo SIL Open Font License. Logo original aportado por el usuario.
