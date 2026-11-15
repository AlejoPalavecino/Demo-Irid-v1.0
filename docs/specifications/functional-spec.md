IRID · Especificación funcional
Consolidación v0.1 · 15 de noviembre de 2026
Sistema interno de gestión de traslados y control de vehículos. Base documental consolidada con las 28 decisiones de la entrevista (D-001 a D-028) y las tres consultas pendientes de IRID (Q-001 a Q-003).
Estado: consolidado para revisión y preparación del plan. Las decisiones confirmadas se conservan; los puntos dependientes de IRID permanecen abiertos. Las entidades y la organización funcional orientan el diseño, pero no equivalen a un esquema de base de datos ni a pantallas aprobadas. Este documento no acredita firma, pagos o inicio contractual ni autoriza por sí mismo implementación o despliegue.
# 1. Idea del sistema y frontera
IRID necesita centralizar la planificación y ejecución de los traslados, preparar las liquidaciones y controlar el uso y los gastos de su flota. El sistema reemplaza registros dispersos en papel por información compartida según el rol, manteniendo el historial de servicios y correcciones.
Transp SERV define y comunica recorridos, pacientes, domicilios, días, horarios, kilómetros base y valores comerciales. IRID carga y valida esa información manualmente. El sistema conserva los datos, organiza la agenda y calcula referencias; las decisiones comerciales y operativas continúan a cargo de las personas responsables.
Circuito principal: condiciones de Transp SERV → carga y validación por IRID → planificación y asignación → apertura de turno y ejecución por el chofer → control administrativo → revisión y emisión de liquidaciones por Alejandro.
Cada Entrada y cada Salida es un viaje independiente, con hasta cuatro pacientes y posibilidad de choferes distintos. Un recorrido recurrente define la programación; un viaje es su ejecución en una fecha; un turno identifica el uso de un vehículo y puede agrupar varios viajes. Los kilómetros comerciales y el odómetro se registran por separado.
# 2. Roles y permisos
Una persona puede tener varios roles activos. Los permisos se aplican a pantallas, operaciones, consultas, exportaciones y fotografías. Ver importes de combustible o gastos de vehículos no habilita a consultar tarifas comerciales, remuneraciones o liquidaciones.

Rol | Funciones habilitadas | Límites principales
Administrador · Alejandro | Administra datos, cuentas y roles; planifica y asigna; corrige registros; gestiona valores comerciales, remuneraciones y liquidaciones; revisa combustible y gastos. | Las correcciones conservan los motivos e historial exigidos. También debe resolver viajes en curso antes de cerrar un turno.
Encargado · Walter | Planifica, asigna y reemplaza choferes; modifica recorridos y kilómetros comerciales; revisa odómetros; consulta combustible y registra gastos. Usa funciones de Chofer cuando conduce. | No accede a tarifas, remuneraciones o liquidaciones. Desde la primera liquidación emitida no corrige estado, kilómetros comerciales ni chofer ejecutor del viaje.
Chofer | Consulta sus viajes y pasajeros necesarios; abre/cierra turnos; inicia/finaliza viajes; registra pasajeros, novedades, combustible y boletas. | No consulta viajes ajenos ni datos comerciales. No modifica recorridos oficiales, asignaciones o estados finales ya registrados. Edita sus cargas sólo mientras no estén verificadas.
Secretaria | Consulta, verifica y corrige combustible con historial; registra y consulta gastos e intervenciones; ve datos de flota, choferes y kilometraje necesarios. | No planifica, asigna, modifica recorridos, corrige turnos ni consulta tarifas o liquidaciones.

## Cuentas, acceso y recuperación
Sólo Alejandro, como Administrador, crea cuentas y asigna o retira roles. No existe registro público ni modificación de privilegios por otros usuarios (D-026). El ingreso utiliza usuario y contraseña con almacenamiento seguro de esta última.
Aclaración funcional confirmada el 15 de noviembre de 2026 (UX-042): el alta de una cuenta solicita nombre, nombre de usuario y uno o varios roles. Al crearla se genera una contraseña temporal que debe cambiarse en el primer ingreso, antes de utilizar las funciones habituales. El cambio es obligatorio y, una vez completado, la contraseña temporal deja de permitir el acceso. Este requisito se aplica también a cuentas nuevas, además de la recuperación ya definida en D-027.
Alejandro restablece el acceso mediante una contraseña temporal. En el siguiente ingreso, el usuario debe cambiarla antes de usar las funciones habituales; después del cambio, la contraseña temporal deja de permitir el acceso (D-027).
Dar de baja al chofer retira el rol Chofer y conserva sus otros roles activos. Si no queda ninguno, no puede ingresar ni continuar operando desde una sesión abierta. La cuenta y el historial se conservan (D-022).
# 3. Secciones funcionales
Agrupación para organizar el alcance; los nombres y la navegación definitiva se resolverán en el diseño UX/UI.
Acceso y administración de usuarios: ingreso, cambio obligatorio de contraseña, altas de cuentas y roles.
Pacientes y recorridos: datos operativos, paradas, días, horarios, kilómetros base, vigencias y estado.
Agenda y viajes: generación mensual, asignaciones, pendientes de revisión, ejecución, pasajeros y novedades. Para el Chofer, vista de sus propios viajes.
Vehículos y turnos: ficha de flota, apertura/cierre, lecturas, diferencias e historial.
Combustible y comprobantes: cargas, fotos, pendientes, verificación, correcciones y totales.
Gastos e intervenciones: un registro por gasto o intervención y consulta del historial del vehículo.
Tarifas y liquidaciones: valores comerciales, remuneraciones, revisión, emisión, versiones y exportación; acceso exclusivo del Administrador.
Consultas e historial: filtros y exportaciones permitidas por rol, con trazabilidad de cambios relevantes.
# 4. Datos maestros y bajas
Pacientes: nombre, domicilio, estado y relación con los recorridos. Choferes: datos básicos, estado y cuenta asociada. Vehículos: alias, patente, capacidad y estado. Recorridos: días, horarios de Entrada/Salida, pacientes, orden de paradas, destino, kilómetros base y valor informado, con acceso económico restringido.
La carga inicial usa información vigente proporcionada y validada por IRID. No incluye transcripción masiva ni migración de cuadernos, planillas o boletas históricas.
Pacientes, choferes, vehículos y recorridos con actividad se dan de baja como Inactivos; no se borran definitivamente desde el uso habitual. Se mantienen sus relaciones, viajes, turnos, gastos y liquidaciones históricos (D-020). Esta regla no fija un plazo legal de conservación.
Al dar de baja un chofer, sus viajes futuros todavía no iniciados se conservan, quedan Sin asignar y señalados para reemplazo manual por Walter o Alejandro. No se cancelan ni se marcan No realizado automáticamente. Los viajes en curso quedan fuera de esa desasignación (D-021); el acceso se trata según D-022.
Al dar de baja un paciente o recorrido, los viajes futuros ya generados conservan su programación, pasajeros, asignaciones y estados. Quedan señalados para que Walter o Alejandro decidan qué modificar o cancelar; la baja no aplica esos cambios automáticamente (D-023).
Aclaración funcional confirmada el 15 de noviembre de 2026 (UX-055): cada viaje pendiente de revisión muestra el motivo del aviso. Walter o Alejandro pueden marcarlo como «Revisado» después de corregirlo o confirmar que no necesita cambios, registrando quién realizó la revisión y su resultado y conservando el historial del aviso. La marca resuelve la revisión tratada; por sí sola no cambia el estado de ejecución, no asigna chofer ni resuelve otros pendientes. Las correcciones realizadas mantienen sus propios permisos, motivos e historial.
# 5. Agenda y ejecución de viajes
## Generación y asignación
Al cargar el mes, se selecciona el grupo lunes-miércoles-viernes o martes-jueves-sábado y se generan los viajes sobre las fechas reales del calendario. No se utiliza una cantidad fija de trece días. Los recorridos pueden mantenerse o cambiar de un mes a otro.
Aclaración funcional confirmada el 15 de noviembre de 2026 (UX-024): al repetir la generación de un mes, se crean únicamente los viajes que faltan y se conservan sin cambios los existentes. La repetición no duplica viajes ni sobrescribe sus datos, asignaciones, estados o historial; los cambios sobre viajes existentes utilizan las operaciones de modificación y corrección previstas.
Walter y Alejandro pueden modificar una fecha puntual o las fechas restantes del mes y asignar o reemplazar manualmente al conductor. La indisponibilidad del chofer se comunica fuera del sistema. Los viajes programados se cubren también en feriados y fines de semana, sin recargo; esto no agrega domingos a los patrones definidos.
Aclaración funcional confirmada el 15 de noviembre de 2026 (UX-026): los cambios de programación sobre varias fechas sólo afectan a viajes todavía sin iniciar y sin estado final. Los viajes en curso, Realizado o No realizado quedan fuera de esa modificación y conservan sus datos e historial. Esta restricción se aplica a la operación en bloque; las correcciones individuales mantienen sus reglas y permisos.
Se bloquea asignar o reasignar dos viajes distintos al mismo chofer con exactamente la misma fecha y hora programada, sin posibilidad de aceptar sólo una advertencia (D-025). No se calculan duraciones ni superposiciones estimadas. Q-003 debe resolver qué representa el horario informado antes de cerrar los campos y la comparación.
No se preasigna vehículo a cada viaje. El vehículo efectivamente utilizado se toma del turno abierto por el chofer.
## Inicio, pasajeros y finalización
El chofer consulta sus viajes y los nombres, domicilios, días y horarios necesarios. Registra inicio, novedades y finalización. Cada pasajero previsto debe quedar expresamente como Recogido o No viajó; un pasajero sin estado bloquea la finalización y no se interpreta como ausente (D-017).
Al finalizar, el viaje queda directamente Realizado, sin aprobación previa por viaje de Walter o Alejandro. Alejandro revisa la liquidación antes de emitirla (D-001). Si el recorrido previsto se efectuó, se registra Realizado y se liquida aunque todos los pasajeros estén como No viajó (D-018).
El chofer asignado, Walter o Alejandro pueden registrar inicialmente No realizado, siempre con motivo. Otro chofer no puede hacerlo sobre ese viaje (D-002 y D-003).
La ausencia parcial de pasajeros no cambia el pago si se mantiene la distancia comercial. Si reduce esa distancia, Walter o Alejandro registran el ajuste manual correspondiente, respetando D-019 después de la emisión. El odómetro no produce ese ajuste.
## Estados y correcciones
La asignación y la ejecución son dimensiones distintas: Sin asignar no significa No realizado. El flujo operativo distingue viaje programado/no iniciado, viaje en curso y estados finales Realizado o No realizado. Las etiquetas técnicas definitivas no alterarán estas reglas.
Mientras ninguna liquidación correspondiente esté emitida, sólo Walter y Alejandro corrigen un estado final registrado por error (D-004). Desde la emisión de cualquiera de las dos liquidaciones —Transp SERV o chofer— sólo Alejandro puede corregirlo, aunque la otra no esté emitida (D-006 y D-008).
Toda corrección de estado exige motivo e historial, antes y después de la emisión (D-007). El motivo de corregir el registro se distingue del motivo de no haber realizado el servicio. Las correcciones económicas posteriores siguen el versionado de la sección 6.
# 6. Kilómetros comerciales y liquidaciones
## Valores y cálculos
Se registran tarifas y fechas de vigencia. Un cambio posterior de tarifa no modifica los importes de viajes anteriores. Sólo Alejandro consulta y modifica valores comerciales, porcentajes de remuneración, importes y liquidaciones.
Una modificación excepcional de kilómetros comerciales de un viaje calcula esta referencia: precio nuevo = precio base × kilómetros nuevos ÷ kilómetros base. Alejandro puede ajustar el importe final y su redondeo hacia arriba o hacia abajo. No se aplica automáticamente a otros viajes.
La remuneración de referencia del chofer es el 14 % del valor de cada viaje, con ajuste manual por Alejandro. Combustible y mantenimiento no se descuentan automáticamente. Los detalles de precisión, redondeo y validación de bases de cálculo se concretarán en el diseño técnico sin inventar reglas comerciales.
Existe un mínimo mensual garantizado: si la liquidación por viajes realizados queda por debajo por viajes no realizados, se paga el mínimo. No se ha confirmado el importe, si es común o individual ni su aplicación a Walter con doble rol (Q-001). Esto no define un pago por cada viaje cancelado ni una fórmula completa para todos los casos.
## Revisión, emisión y exportaciones
Las dos liquidaciones utilizan los viajes del sistema sin volver a cargarlos. Sólo Realizado se cuenta como servicio ejecutado; el mínimo mensual es una regla separada. Antes de emitir, todos los viajes correspondientes al período y alcance de esa liquidación deben estar Realizado o No realizado. Un viaje sin resolver bloquea la emisión y no se completa automáticamente (D-009). Alejandro revisa antes de emitir.
Transp SERV: resumen por período, servicios realizados, Entradas y Salidas, cantidades, importes y separación de grupos de días cuando corresponda. Se admite formato propio con exportación a Excel y PDF; ambos deben reflejar la misma liquidación y versión. Las columnas y presentación concretas se diseñarán para revisión (D-024).
Chofer: consulta por conductor y período de sus servicios, referencia del 14 % o importe ajustado, totales y exportaciones acordadas. La aplicación del mínimo mensual permanece condicionada a Q-001.
## Correcciones después de emitir
Un error se corrige emitiendo una nueva versión del mismo período, conservando la anterior consultable y con los datos originales; no se sobrescribe ni se traslada la corrección al período siguiente por defecto (D-005).
Desde la emisión de cualquiera de las liquidaciones del viaje, sólo Alejandro puede corregir sus kilómetros comerciales o el chofer que lo realizó, con motivo obligatorio e historial (D-019). Las liquidaciones afectadas se corrigen mediante versiones. La restricción no bloquea por sí misma asignaciones futuras de otros viajes no liquidados.
# 7. Turnos y odómetro
El chofer abre el turno seleccionando vehículo/patente, fecha, hora y lectura inicial. Al entregarlo registra fecha, hora y lectura final. Los kilómetros registrados son la diferencia entre ambas lecturas. Un turno puede comprender varios viajes; no se exige odómetro por cada viaje.
Si cambia de vehículo, cierra un turno y abre otro sin mezclar lecturas. No se estableció un límite de un turno por día. Se controlan cierres inferiores a la apertura y aperturas incompatibles del mismo vehículo.
Lectura de apertura mayor al último cierre del mismo vehículo: se permite abrir con la lectura real; la diferencia queda pendiente de revisión por Walter o Alejandro, sin corrección automática (D-011).
Aclaración funcional confirmada el 15 de noviembre de 2026 (UX-047): ante una lectura superior al último cierre, Walter o Alejandro pueden «Confirmar diferencia» o «Corregir registro», con motivo obligatorio en ambos casos. Confirmar conserva ambas lecturas y resuelve la revisión, registrando quién la realizó, el motivo y el resultado. Corregir conserva los valores anterior y nuevo, el motivo y el historial. Confirmar una diferencia no habilita eludir el bloqueo por lectura real inferior de D-012.
Lectura real confirmada menor al último cierre: se bloquea la apertura hasta que Walter o Alejandro revisen y corrijan el registro incorrecto. Se conserva la lectura real, sin sustituirla por una ficticia para igualar el historial (D-012).
Olvido del chofer: Walter o Alejandro pueden cerrar el turno con kilometraje final y motivo, conservando el chofer original y la identificación de quien efectuó el cierre (D-010).
Viaje en curso: se bloquea el cierre para todos, incluidos Walter y Alejandro. Los viajes iniciados del turno deben quedar Realizado o No realizado; no afecta viajes futuros no iniciados de la agenda ni los finaliza automáticamente (D-013).
Walter y Alejandro corrigen errores de odómetro conservando valor anterior, valor nuevo, motivo e historial. Estas lecturas controlan la flota; no sustituyen los kilómetros comerciales.
# 8. Combustible y comprobantes
Cada carga manual registra fecha/hora, vehículo y usuario vinculados al turno, tipo, cantidad, unidad, importe, odómetro exacto al cargar y foto de la boleta. Se contempla GNC en m³ y nafta en litros; también se incorporó gasoil en la entrevista. El detalle del formulario debe reflejarlo sin agregar campos obligatorios no acordados.
Se puede guardar con los demás datos completos como Pendiente de comprobante y adjuntar la foto después al mismo registro. Subir una foto no implica verificación administrativa ni lectura automática (D-014).
Aclaración funcional confirmada el 15 de noviembre de 2026 (UX-018): una carga sin foto no puede marcarse como verificada y muestra «Falta adjuntar el comprobante». La condición se aplica a cualquier usuario con permiso de verificar, tanto en la pantalla como en las operaciones del sistema. Adjuntar la fotografía elimina ese impedimento, pero no verifica automáticamente la carga.
El chofer puede corregir sus propias cargas mientras no estén verificadas. Después de verificadas, sólo Secretaria o Alejandro pueden corregirlas, conservando el historial. El permiso del chofer no se extiende a cargas ajenas (D-015).
Los totales incluyen todas las cargas registradas, con subtotales separados de verificadas y pendientes; las pendientes de comprobante integran lo pendiente. Se conservan filtros y permisos y se separan cantidades por combustible y unidad. Verificar una carga cambia su subtotal, sin duplicarla ni alterar por sí solo el total general (D-016).
Las fotografías tienen acceso restringido y se incluyen en los respaldos diarios. Las comparaciones de cargas, gastos y kilometraje no prueban consumo exacto por chofer ni distribución de kilómetros entre combustibles.
# 9. Gastos, historial y reportes
Walter y Secretaria registran gastos e intervenciones en una misma sección; Alejandro los administra/revisa según sus permisos. Categorías: Seguro, GPS, Mantenimiento, Cubiertas y Reparaciones. Datos: vehículo, fecha, categoría, descripción, importe y, cuando corresponda, kilometraje y taller/proveedor.
Cada mantenimiento o reparación se carga una sola vez y alimenta tanto el historial del vehículo como los totales. GPS representa un gasto, no rastreo. Seguro no incorpora gestión de pólizas o siniestros.
Consultas y exportaciones básicas Excel/PDF con filtros por período, chofer, vehículo y categoría según corresponda: viajes, kilómetros por turno/vehículo, combustible por tipo y unidad, importes de cargas, gastos e historial de flota. Los reportes económicos comerciales están reservados al Administrador.
Las modificaciones relevantes conservan historial. En particular, las correcciones de estado y de registros posteriores a liquidación guardan motivo; las de odómetro guardan además valores anterior y nuevo. El diseño de auditoría debe permitir identificar el cambio, su responsable y su momento sin exponer datos a roles no autorizados.
# 10. Entidades conceptuales
Modelo derivado para conversar el diseño y preparar dependencias; no es un esquema físico aprobado. La lista no agrega pantallas, campos obligatorios ni permisos distintos de los definidos arriba.

Entidad o relación | Propósito y relaciones principales
Usuario y roles activos | Cuenta de acceso con uno o varios roles. Se relaciona con el chofer cuando corresponda; la baja operativa no elimina la cuenta histórica.
Chofer | Conductor asociado a viajes y turnos; puede quedar inactivo manteniendo sus antecedentes.
Paciente | Datos operativos de la persona trasladada y su participación en recorridos/viajes. Sin historia clínica.
Vehículo | Patente, alias, capacidad y estado; reúne turnos, cargas, gastos e historial.
Recorrido recurrente y paradas | Patrón de días, horarios, destino, kilómetros y pacientes ordenados; origen de viajes fechados.
Programación mensual y viaje | Generación sobre calendario. Cada viaje tiene fecha, tipo Entrada/Salida, asignación y ejecución; se vincula al turno utilizado.
Pasajero del viaje | Relación entre paciente y viaje con registro explícito Recogido o No viajó.
Turno de vehículo | Uso de un vehículo por un chofer: apertura, cierre y odómetros; agrupa viajes y cargas.
Tarifa vigente y valores aplicados | Referencia comercial y remuneración aplicada al servicio, preservando importes históricos. Mínimo mensual pendiente de Q-001.
Liquidación, detalle y versión | Resultado por tipo y período, servicios incluidos y versiones emitidas preservadas.
Carga de combustible y comprobante | Datos de abastecimiento, vínculo al turno, foto privada y situación de comprobante/verificación.
Gasto o intervención | Registro único por vehículo y categoría que alimenta historial y totales.
Novedad y evento de historial | Información operativa y trazabilidad de modificaciones relevantes, según el permiso de consulta.

# 11. Tecnología, seguridad y operación

Componente | Tecnología o condición documentada
Interfaz | React + TypeScript; web responsive para computadora, tablet y celular, con Internet.
Backend | NestJS + TypeScript.
Base de datos | PostgreSQL.
Infraestructura | VPS HostGator; dominio .com.ar sujeto a disponibilidad; HTTPS/SSL.
Archivos y respaldos | Fotografías privadas y copias automáticas diarias de base de datos y fotografías (D-028).

Se mantienen las tecnologías previstas en la documentación de origen. Versiones, librerías, persistencia de archivos, autenticación concreta y topología de despliegue se definirán en el diseño técnico; no se da por aprobado un ORM, proveedor adicional o arquitectura distinta.
La seguridad debe cubrir contraseñas almacenadas de forma segura, autorización en las operaciones y separación de información económica y operativa, además de fotografías no públicas. La baja de permisos debe surtir efecto también en sesiones existentes conforme a D-022.
Respaldos: ejecución automática diaria de ambos conjuntos, base de datos y fotos (D-028). En el diseño técnico se concretarán destino, retención, capacidad, comprobación de resultados y procedimiento de restauración. La verificación incluirá recuperar datos y fotos de prueba. La frecuencia diaria no establece por sí sola una garantía de disponibilidad o tiempo de recuperación.
El alcance contempla hosting y dominio durante los primeros doce meses desde su contratación, con renovaciones posteriores a cargo de IRID. No incluye almacenamiento ilimitado, monitoreo permanente ni soporte continuo indefinido.
# 12. Criterios de aceptación
Resultados para comprobar durante la implementación con datos de prueba. No son pruebas ejecutadas ni certifican un sistema existente. Complementan las nueve pautas del Anexo I, sección A.12, y trazan las decisiones de esta entrevista.
## Base funcional del Anexo I
CA-B01 · Un usuario ve y opera únicamente lo permitido por sus roles. Walter, Chofer y Secretaria no obtienen tarifas, remuneraciones o liquidaciones por pantalla, consulta, exportación o acceso directo.
CA-B02 · Un recorrido admite hasta cuatro pacientes, genera Entradas y Salidas sobre el calendario mensual y permite conductores distintos. Las modificaciones puntuales no alteran otros viajes automáticamente.
CA-B03 · Un chofer ve sus viajes, abre un turno con patente/odómetro y registra la ejecución. El viaje usa el vehículo del turno y conserva sus novedades.
CA-B04 · Un cambio comercial calcula el proporcional; Alejandro puede ajustar el resultado. Cambiar odómetro o una tarifa posterior no reescribe importes históricos.
CA-B05 · Ambas liquidaciones reutilizan servicios realizados, respetan datos y agrupaciones aplicables y exportan resultados. La del chofer aplica el 14 % o ajuste; el mínimo se valida cuando se resuelva Q-001.
CA-B06 · Una diferencia de odómetro es visible y una corrección autorizada conserva valores y motivo, aplicando los controles específicos CA-07 a CA-10.
CA-B07 · Se registra combustible con su unidad, importe, odómetro y comprobante o pendiente permitido; Secretaria puede verificar/corregir con trazabilidad.
CA-B08 · Un gasto registrado por Walter o Secretaria aparece una sola vez en historial y totales del vehículo, con filtros adecuados.
CA-B09 · La entrega completa permite acceso por roles bajo dominio y HTTPS, incluye respaldos configurados, código, documentación, accesos y capacitación acordados.
## Decisiones de la entrevista
CA-01 · Finalizar un viaje válido desde el Chofer lo deja Realizado sin aprobación por viaje; Alejandro revisa antes de emitir la liquidación (D-001).
CA-02 · El chofer asignado, Walter y Alejandro pueden registrar No realizado con motivo. Otro chofer o un motivo vacío impiden guardar (D-002, D-003).
CA-03 · Antes de cualquier emisión, Walter/Alejandro corrigen estado con motivo; Chofer solo no puede. Después de emitir Transp SERV, chofer o ambas, únicamente Alejandro puede; se conserva historial y no se admite motivo vacío (D-004, D-006, D-007, D-008).
CA-04 · Una corrección posterior produce otra versión del mismo período y la anterior permanece consultable sin cambios (D-005).
CA-05 · Un viaje correspondiente sin resolver impide emitir; todos Realizado/No realizado satisfacen esta condición, sin cambios automáticos de estado (D-009).
CA-06 · Tras cualquiera de las emisiones, Walter no corrige kilómetros comerciales o chofer ejecutor; Alejandro sí, con motivo e historial, y se versionan las liquidaciones afectadas (D-019).
CA-07 · Walter o Alejandro cierran un turno olvidado con lectura final y motivo, manteniendo el chofer original y el autor del cierre (D-010).
CA-08 · Si el último cierre fue 50.000 km y la apertura real es 50.020 km, se permite abrir y quedan 20 km pendientes de revisión, sin reescribir lecturas (D-011).
CA-09 · Una lectura real inferior al último cierre bloquea abrir hasta la corrección supervisada del registro incorrecto; no se fuerza un valor ficticio (D-012).
CA-10 · Con un viaje iniciado sin resolver, nadie puede cerrar el turno, tampoco mediante cierre por olvido. Un viaje futuro no iniciado no activa ese bloqueo (D-013).
CA-11 · Una carga sin foto se guarda Pendiente de comprobante y la foto posterior se incorpora al mismo registro; no la verifica automáticamente (D-014).
CA-12 · El chofer corrige su carga no verificada, no una ajena. Tras verificar, la corrección se permite sólo a Secretaria/Alejandro y conserva historial (D-015).
CA-13 · El total incluye cargas verificadas y pendientes con subtotales separados. Verificar no duplica importes; no se suman cantidades de unidades diferentes (D-016).
CA-14 · Un pasajero sin estado bloquea finalizar. Si todos están definidos y el recorrido se hizo, puede quedar Realizado aun con todos No viajó, e integrar la liquidación (D-017, D-018).
CA-15 · Dar de baja pacientes, choferes, vehículos o recorridos con actividad conserva historial y relaciones; el uso habitual no ofrece borrado definitivo (D-020).
CA-16 · La baja del chofer deja sus viajes futuros sin iniciar Sin asignar y señalados para reemplazo, sin cancelarlos. Retira Chofer de sesiones nuevas y abiertas, conservando otros roles activos; sin roles no puede operar (D-021, D-022).
CA-17 · La baja del paciente o recorrido mantiene los viajes futuros generados sin cambios automáticos y los señala para revisión de Walter/Alejandro (D-023).
CA-18 · La liquidación Transp SERV se exporta en formato propio a Excel y PDF; ambos representan exactamente los datos de la versión seleccionada (D-024).
CA-19 · Asignar o reasignar al mismo chofer dos viajes distintos con igual fecha/hora se rechaza. La interpretación del campo se valida tras resolver Q-003; no se presume control de solapamientos por duración (D-025).
CA-20 · Sólo Alejandro crea cuentas o cambia roles; no hay alta pública ni elevación de permisos por otro rol (D-026).
CA-21 · La contraseña temporal obliga al cambio antes del uso normal, no admite omitirlo y deja de funcionar después. Otros roles no restablecen credenciales ajenas (D-027).
CA-22 · La configuración ejecuta respaldos automáticos diarios de base y fotos; se conserva evidencia del resultado y se comprueba la recuperación de datos y fotografías de prueba (D-028).
CA-23 · Sin foto, la carga permanece pendiente y se impide marcarla como verificada, mostrando «Falta adjuntar el comprobante». Tras adjuntar la foto, un usuario autorizado puede verificarla expresamente; adjuntarla no cambia por sí sola su estado de verificación (UX-018).
CA-24 · Repetir la generación de una programación mensual completa no crea duplicados ni modifica viajes existentes. Si faltan viajes dentro de la selección, se crean sólo los faltantes y se conservan los datos, asignaciones, estados e historial de los existentes (UX-024).
CA-25 · Un cambio de programación sobre varias fechas sólo modifica viajes sin iniciar y sin estado final. Si la selección también incluye viajes en curso, Realizado o No realizado, ninguno de éstos se modifica por esa operación y su historial se conserva (UX-026).
CA-26 · Alejandro crea una cuenta indicando nombre, nombre de usuario y uno o varios roles, y el sistema genera una contraseña temporal. En el primer ingreso se exige cambiarla antes de usar las funciones habituales; no se puede omitir ese paso y, tras el cambio, la contraseña temporal deja de permitir el acceso (UX-042).
CA-27 · Ante una diferencia positiva, Walter o Alejandro pueden confirmarla como válida o corregir el registro incorrecto; ambas acciones se impiden si falta el motivo. Confirmar conserva las lecturas y resuelve la revisión dejando responsable, motivo y resultado. Corregir conserva el valor anterior, el nuevo, el motivo y el historial. Los demás roles no resuelven la revisión (UX-047).
CA-28 · Un viaje pendiente de revisión muestra el motivo del aviso y sólo Walter o Alejandro pueden resolver la revisión tras corregirlo o confirmar que no requiere cambios. La revisión resuelta conserva responsable, resultado e historial del aviso. Marcar «Revisado» no altera por sí mismo el estado de ejecución ni la asignación del chofer, y mantiene los demás pendientes que correspondan (UX-055).
# 13. Tres preguntas pendientes de IRID
Estado de las tres: Pendiente de confirmar con IRID. No se adopta una respuesta por defecto. El registro separado conserva su origen y seguimiento.

ID y tema | Pregunta pendiente | Dependencia
Q-001 · Mínimo mensual | ¿Es igual para todos los choferes o individual? ¿Cómo aplica a quien también es encargado, como Walter? El importe tampoco está confirmado. | Configuración y cálculo completo de remuneración mensual; aceptación de la liquidación del chofer.
Q-002 · Volumen diario | ¿Cuántos traslados se esperan en un día habitual, contando Entrada y Salida como viajes separados? | Dimensionamiento, datos de prueba e infraestructura. No se fija capacidad ni límite por suposición.
Q-003 · Horarios | ¿Indican inicio del recorrido o llegada/salida de la institución? | Campos y presentación de agenda; significado de la coincidencia exacta de fecha/hora en D-025.

Q-001 se registró el 2 de noviembre y se mantuvo pendiente el 15 de noviembre de 2026. Q-002 y Q-003 se registraron el 15 de noviembre. Las respuestas futuras deberán indicar fuente y actualizar de forma coherente esta especificación y el registro de preguntas.
# 14. Límites, entrega y siguiente etapa
## Fuera del alcance
Cuenta, API o importación automática de Transp SERV; decisiones comerciales o de recorridos tomadas automáticamente.
Asignación automática, mapas, optimización de rutas, cálculo de distancias por mapas, GPS en tiempo real o lectura automática de odómetros.
Aplicación móvil nativa, funcionamiento sin Internet/sincronización offline, WhatsApp u otras integraciones no especificadas; migración histórica.
Facturación electrónica, cobros online, bancos, cuentas corrientes o contabilidad general.
OCR de boletas, consumo exacto por chofer, detección automática de uso indebido, pólizas/siniestros, inventario, compras, alertas de vencimiento o mantenimiento programado.
Historia clínica, diagnósticos, tratamientos y datos médicos ajenos a la operación de traslados.
Pago de combustible, seguros, GPS, repuestos y demás gastos de IRID; almacenamiento ilimitado o soporte/monitoreo permanente.
## Entrega prevista
Una puesta en producción final del sistema completo, con demostraciones funcionales intermedias. La entrega incluye código fuente, configuración no secreta, esquema/scripts de datos, instrucciones técnicas y de uso, accesos y capacitación inicial. El mes calendario de ajustes y corrección de bugs se cuenta desde la puesta en marcha efectiva, según el acuerdo.
Esta consolidación no modifica precio, pagos o condiciones contractuales ni constituye una reestimación del esfuerzo. Las referencias originales de 290 horas y 11–14 semanas deben tratarse como estimaciones documentales, no como un calendario activo confirmado.
## Preparación del plan de implementación
Antes de cerrar tareas dependientes se deben incorporar las respuestas Q-001 a Q-003. En paralelo, la siguiente etapa puede desarrollar y presentar para aprobación los flujos y pantallas, el modelo de datos detallado y el diseño técnico sobre el stack documentado.
Aspectos a concretar en ese diseño: matriz de operaciones detallada, validaciones de formularios y cálculos, transiciones excepcionales, estructura del historial y versiones, formatos de exportación, almacenamiento privado y recuperación de accesos, destino/retención de respaldos y restauración. Son detalles de diseño por resolver, no nuevas respuestas atribuidas a IRID.
Los riesgos principales son acceso indebido a información económica, correcciones que alteren historia emitida, inconsistencias entre viaje/turno/liquidación y respaldo incompleto de archivos. Los criterios anteriores orientan las verificaciones de esos puntos. La capacidad y las métricas de rendimiento dependen del volumen por confirmar.
Con las decisiones y diseños necesarios aprobados, el plan podrá dividirse por resultados verificables y dependencias: acceso y datos base; agenda y viajes; turnos y combustible; tarifas/liquidaciones; gastos/reportes; integración, recuperación y entrega. No se fijan aquí fechas ni se autoriza comenzar a implementar.
# 15. Fuentes y mantenimiento
Las decisiones vigentes de la entrevista precisan la base funcional del Anexo I. D-001 a D-028 se conservan en el registro de continuidad, con reglas y comprobaciones esperadas; Q-001 a Q-003 permanecen abiertas. Si una respuesta futura cambia una regla, deberá registrarse y actualizar los criterios afectados.
Registro de definiciones y continuidad
Registro de preguntas pendientes
Acuerdo de desarrollo y Anexo I — alcance y pautas de aceptación
Propuesta y presupuesto — descripción técnica ampliada
Propuesta de implementación y pagos por etapas
