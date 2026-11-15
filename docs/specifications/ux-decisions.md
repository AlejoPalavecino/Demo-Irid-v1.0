Sistema de Gestión de Traslados IRID
Registro de definiciones y punto de continuidad
Entrevista inicial: 2 de noviembre de 2026 · Actualización: 15 de noviembre de 2026 · Versión 2
Este documento conserva lo definido con Alejo para organizar la documentación del sistema. Reúne la base de los documentos existentes y las aclaraciones de la entrevista, sin convertir interpretaciones o temas todavía no conversados en decisiones confirmadas.
Estado actual: especificación funcional consolidada v0.1 disponible, con 28 decisiones confirmadas (D-001 a D-028) y tres preguntas pendientes de IRID (Q-001 a Q-003). El 15 de noviembre de 2026 Alejo solicitó avanzar con pantallas y flujos de uso mediante preguntas de a una. La continuación vigente se encuentra en la sección 10.
# 1 Base documental y alcance
El Acuerdo de desarrollo e implementación y su Anexo I son la referencia funcional de partida. La propuesta y el documento de etapas complementan esa base. Este registro documenta aclaraciones; no sustituye esos archivos ni acredita firma, pago, inicio del proyecto o cambios contractuales.
La base existente contempla gestión de pacientes y recorridos, agenda y ejecución de viajes, liquidaciones, turnos de vehículos, kilometraje, combustible, comprobantes, gastos e intervenciones. Cada Entrada y cada Salida es un traslado individual y puede tener un chofer distinto. El Anexo I prevé hasta cuatro pacientes por viaje.
El sistema será web adaptable a computadoras, tablets y celulares, con conexión a Internet. La tecnología documentada es React con TypeScript, NestJS con TypeScript y PostgreSQL; la infraestructura prevista es un VPS HostGator. Se contempla una puesta en producción final del sistema completo, no publicaciones independientes por cada etapa.
## Límites que se conservan
Transp SERV comunica la información y IRID la carga y valida. No se incorpora una cuenta externa, API, importación automática, optimización de rutas, GPS en tiempo real, OCR de boletas, aplicación móvil nativa, funcionamiento offline ni historia clínica. El sistema registra la operación; no decide por sí mismo recorridos, personal ni condiciones comerciales.

# 2 Roles y responsabilidades
Se mantiene la separación entre información operativa, gastos de vehículos y datos económicos comerciales. Que un usuario registre combustible no le permite ver tarifas ni remuneraciones.
## Administrador Alejandro
Administra los datos del sistema, planifica, asigna y reasigna choferes. Puede modificar recorridos y corregir kilómetros comerciales y lecturas del vehículo. Es el único que carga o modifica montos comerciales y visualiza cuánto se paga por viaje y cuánto cobrará cada chofer, incluido el mínimo mensual. Revisa combustible, comprobantes y gastos según el Anexo I.
## Encargado y chofer Walter
Organiza recorridos y asignaciones, registra modificaciones operativas y puede corregir kilómetros comerciales. La entrevista aclara que esta facultad no es exclusiva suya: Alejandro también la tiene. Según la base documental, revisa y corrige lecturas de turnos con historial, consulta combustible y registra gastos. Cuando conduce, utiliza las funciones de Chofer. No ve tarifas comerciales ni liquidaciones. Aclaración del 15 de noviembre de 2026: D-019 reserva a Alejandro las correcciones de kilómetros comerciales o del chofer que realizó el viaje desde que se emita alguna de sus liquidaciones.
## Chofer
Consulta sus viajes asignados y la información de pasajeros necesaria para realizarlos. Abre y cierra el turno del vehículo, registra el inicio y el final de los viajes y sus cargas de combustible. No modifica recorridos oficiales ni asignaciones. Si no puede realizar un viaje, lo avisa por fuera del sistema.
## Secretaria
Según el Anexo I, consulta y verifica combustible y fotos de boletas, corrige esos registros con historial y registra o consulta gastos e intervenciones de vehículos. No planifica viajes, asigna choferes, modifica recorridos, corrige turnos ni accede a tarifas comerciales o liquidaciones.
## Correcciones e historial
La base documental pide conservar las modificaciones relevantes. En lecturas de kilometraje se mantienen valor anterior, valor nuevo y motivo. La definición detallada de campos y permisos por operación deberá desarrollarse al continuar la especificación; no se agrega aquí una nueva regla de autorización.

# 3 Agenda mensual y ejecución de viajes
## Cómo se organiza el mes
Al principio de cada mes, la institución con la que trabaja IRID envía los recorridos establecidos. Se organizan en dos grupos: lunes, miércoles y viernes; o martes, jueves y sábado. Permanecen fijos durante el mes, aunque pueden modificarse. El mes siguiente pueden mantenerse o variar.
Se carga el mes y se selecciona el grupo de días. El sistema genera automáticamente los viajes para las fechas correspondientes del calendario. No se carga cada día por separado ni se utiliza una cantidad fija de trece días mensuales.
## Cambios durante el mes
Walter o Alejandro pueden modificar una fecha puntual o las fechas restantes del mes. Esta regla corresponde a la agenda; no determina cómo se corrige una liquidación ya emitida. Ambos pueden asignar un reemplazo si el chofer no puede realizar el traslado. El aviso de indisponibilidad ocurre fuera del sistema y la reasignación la realizan Walter o Alejandro.
## Continuidad del servicio
Los traslados programados se realizan también en feriados y fines de semana, sin recargo por ese motivo. Si el conductor asignado no puede, se debe cubrir el viaje con otro chofer. Esto no implica asignación automática, agregar domingos a los patrones definidos ni considerar que cada pasajero tiene un traslado diario.
## Registro por el chofer
El chofer marca el inicio y la finalización de cada viaje.
En el recorrido debe poder ver nombre y apellido de cada pasajero y marcar que lo recogió, según lo solicitado en la entrevista. Aclaración del 15 de noviembre de 2026: D-017 exige indicar «Recogido» o «No viajó» para cada pasajero previsto antes de finalizar el viaje.
El vehículo utilizado se obtiene del turno abierto por el chofer; no se asigna anticipadamente un vehículo a cada viaje.
## Si falta un pasajero
El recorrido se realiza con quienes sí viajan. Si la ausencia no reduce la distancia del recorrido, se mantiene el pago. Si reduce los kilómetros, se registra la reducción y se ajusta la liquidación. Walter o Alejandro ingresan esa corrección comercial manualmente; no se toma automáticamente del odómetro. Aclaración del 15 de noviembre de 2026: D-018 establece que, si el chofer hizo el recorrido previsto, se registra como realizado y se liquida aunque no haya viajado ningún pasajero.
Ejemplo conversado: en un recorrido de 68 km con pasajeros A, B, C y D, la ausencia de uno no modifica el pago si de todos modos se recorren los mismos 68 km. Si reduce la distancia comercial, corresponde ajustar el cálculo. Los nombres del ejemplo no representan personas reales.

# 4 Kilómetros y remuneración
## Dos medidas diferentes
Los kilómetros comerciales sirven para valorar los traslados. Las lecturas del tablero registran el uso del vehículo. No deben confundirse: el odómetro no recalcula automáticamente tarifas ni liquidaciones, y las cargas de combustible tampoco descuentan importes de la remuneración.
## Referencia económica ya documentada
El Anexo I establece como cálculo proporcional de referencia: precio nuevo = precio base × kilómetros nuevos ÷ kilómetros base. Alejandro puede revisar el resultado, ajustarlo y definir el redondeo. También establece una remuneración de referencia del 14 % del valor del viaje, con ajuste manual por el Administrador. Son reglas de la base documental, no fórmulas nuevas acordadas en esta entrevista.
Los cambios posteriores de tarifa no deben modificar importes de viajes anteriores. Las liquidaciones se construyen con servicios registrados como realizados, no con viajes solamente programados. Esto no establece por sí solo un bloqueo de períodos cerrados.
## Mínimo mensual garantizado confirmado
Existe un monto base mensual para los choferes. Si la liquidación por viajes realizados queda por debajo de ese monto por viajes no realizados, igualmente se paga el mínimo mensual. No se acordó un pago individual por cada viaje cancelado ni se completaron todas las condiciones del mínimo.
## Q-001 — Mínimo mensual garantizado pendiente
¿El mínimo mensual garantizado es igual para todos los choferes o se define individualmente? ¿Cómo aplica a quien también es encargado, como Walter?
Alejo indicó que no está seguro y pidió dejarlo como pregunta. Se conserva en el documento separado de preguntas pendientes, con estado Pendiente de confirmar con IRID. El importe no fue confirmado. No se debe elegir una respuesta por defecto.
# 5 Turnos del vehículo
El chofer selecciona el vehículo y su patente, registra el odómetro al tomarlo y vuelve a registrarlo al terminar su jornada con ese vehículo. Un turno puede incluir varios viajes. No se exige odómetro inicial y final en cada traslado.
Si cambia de vehículo, cierra ese turno y abre otro con el nuevo, como establece el Anexo I. No quedó definida una limitación de un único turno por chofer por día. Las diferencias frente al cierre anterior y las correcciones se tratan según los controles e historial previstos en la base documental.

# 6 Combustible y comprobantes
Cada vez que carga combustible, el chofer registra el tipo de combustible, el importe, el kilometraje exacto del tablero en ese momento y una foto de la factura o comprobante. En la entrevista se mencionaron gas, nafta y gasoil. Este odómetro es adicional al de apertura y cierre del turno. Aclaración del 15 de noviembre de 2026: D-014 permite guardar la carga pendiente de comprobante y adjuntar la foto posteriormente.
El Anexo I ya contempla fecha y hora, vinculación con vehículo y usuario del turno, cantidad y unidad. Especifica GNC en m³ y nafta en litros, sin sumar unidades diferentes. La incorporación de gasoil expresada en la entrevista debe reflejarse al detallar el formulario, sin inventar otros campos, como un número de factura obligatorio.
La carga es manual: subir una foto no implica lectura automática del comprobante. Tampoco permite inferir consumo exacto por chofer. Los comprobantes del sistema deben tener acceso restringido según los permisos previstos.
# 7 Punto de continuidad al 2 de noviembre de 2026
La conversación se detuvo después de aclarar el registro de odómetro por turno de vehículo y los datos de combustible. La agenda mensual, los responsables de reemplazos, las ausencias parciales y el mínimo mensual ya fueron conversados; no corresponde volver a presentarlos como preguntas sin responder.
Pauta acordada para retomar: leer este registro y Q-001, avanzar con una pregunta concreta por vez y mantener separados agenda, ejecución y liquidación. Añadir al registro de preguntas únicamente aquellas que Alejo diga que no puede responder o que necesita confirmar. La entrevista se retomó el 15 de noviembre de 2026, como consta en la sección 9.
Como organización propuesta, aún no desarrollada, el trabajo posterior puede ordenar la especificación funcional y sus excepciones; luego modelo de datos y pantallas, diseño técnico y API, backlog y pruebas. Debe aprovechar las nueve comprobaciones del Anexo I y no rehacer el presupuesto ni suponer decisiones de implementación.
# 8 Documentos de referencia
Acuerdo de desarrollo e implementación y Anexo I
Propuesta y presupuesto del sistema
Propuesta de implementación y pagos por etapas
Registro de preguntas pendientes con Q 001
Las fotografías aportadas se usaron para comprender la organización de las planillas. Este registro no reproduce imágenes, identidades, domicilios ni otros datos reales de pasajeros.
# 9 Cierre progresivo de la especificación — 15 de noviembre de 2026
Alejo solicitó continuar la definición funcional de IRID mediante preguntas de a una y registrar lo acordado para preparar posteriormente el plan de implementación.
Las respuestas confirmadas se incorporarán a este registro, distinguiendo reglas acordadas, propuestas y decisiones aún abiertas. El registro separado de preguntas pendientes conservará únicamente las dudas que Alejo indique que no puede responder o que necesita confirmar.
Q-001, sobre el mínimo mensual garantizado, continúa pendiente de confirmar con IRID; no se adopta una respuesta por defecto.
## D-001 — Finalización del viaje y revisión de la liquidación
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: cuando el chofer marca «Finalizar viaje», el traslado queda directamente como realizado para incluirlo en la liquidación. No requiere una aprobación previa de Walter o Alejandro para considerarse realizado. Alejandro revisa la liquidación antes de emitirla.
Comprobación esperada: finalizar un traslado desde la cuenta del chofer lo registra como realizado y lo deja disponible para la liquidación; la revisión de Alejandro se realiza sobre la liquidación antes de su emisión.
## D-002 — Personas autorizadas para registrar un viaje no realizado
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: el chofer asignado al viaje, Walter y Alejandro pueden marcar ese traslado como «No realizado». El permiso del chofer se limita a sus propios viajes asignados; no habilita modificar viajes ajenos.
Comprobación esperada: el chofer asignado, Walter y Alejandro pueden registrar un viaje no realizado; otro chofer no puede hacerlo sobre ese viaje. Esta definición establece los responsables del registro inicial. La corrección de estados antes de emitir la liquidación se rige por D-004; el permiso para corregir estados después de la emisión se rige por D-006. D-005 establece el tratamiento de las versiones de la liquidación.
## D-003 — Motivo obligatorio para viajes no realizados
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: al marcar un viaje como «No realizado», es obligatorio indicar el motivo. La obligación se aplica a cualquiera de los responsables autorizados en D-002: el chofer asignado, Walter o Alejandro.
Comprobación esperada: el sistema impide guardar el estado «No realizado» sin motivo; al indicarlo, conserva el motivo asociado al viaje junto con el estado registrado. El formato de captura del motivo aún no se ha definido.
## D-004 — Corrección del estado del viaje antes de emitir la liquidación
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: antes de emitir la liquidación, únicamente Walter y Alejandro pueden corregir el estado de un viaje marcado por error como «Realizado» o «No realizado». El rol Chofer no habilita esa corrección, aunque el viaje esté asignado a ese conductor. Walter conserva esta facultad como Encargado cuando también conduce.
Comprobación esperada: antes de la emisión, Walter o Alejandro pueden corregir el estado registrado; un usuario que sólo tiene el rol Chofer no puede hacerlo. Se mantiene la obligación de indicar motivo al establecer «No realizado» (D-003). D-005 establece el tratamiento de las versiones de una liquidación emitida; el permiso para corregir estados después de la emisión se rige por D-006.
## D-005 — Versión corregida de una liquidación emitida
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: si se detecta un error después de emitir una liquidación, se emite una versión corregida correspondiente al mismo período y se conserva la versión anterior en el historial. La nueva versión no sobrescribe la anterior.
Comprobación esperada: al emitir una corrección, se dispone de la versión corregida del mismo período y continúa siendo consultable la versión anterior con los datos con los que fue emitida. La decisión define el tratamiento de las versiones; D-006 establece quién puede corregir el estado de un viaje después de la emisión.
## D-006 — Corrección del estado del viaje después de emitir la liquidación
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: una vez emitida la liquidación, únicamente Alejandro puede corregir el estado del viaje. Walter y los usuarios con rol Chofer no pueden efectuar esa corrección después de la emisión. Para las correcciones anteriores a la emisión se mantiene D-004. D-008 precisa que la restricción se activa con la emisión de cualquiera de las dos liquidaciones correspondientes al viaje.
Comprobación esperada: después de emitir la liquidación, Alejandro puede corregir el estado del viaje y la operación se impide a Walter y a los choferes. La corrección de la liquidación se realiza mediante una nueva versión del mismo período, conservando la anterior en el historial, conforme a D-005.
## D-007 — Motivo obligatorio para toda corrección del estado del viaje
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: toda corrección del estado de un viaje exige indicar el motivo de la corrección, tanto antes como después de emitir la liquidación. Se mantienen los responsables definidos en D-004 y D-006. Este motivo explica por qué se cambia el registro anterior y se distingue del motivo de que el viaje no se haya realizado, previsto en D-003.
Comprobación esperada: el sistema impide aplicar una corrección de estado sin motivo; al realizarla con un motivo, conserva esa explicación asociada a la corrección en el historial. La exigencia se comprueba tanto antes como después de la emisión de la liquidación.
## D-008 — La primera liquidación emitida activa la restricción de corrección
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: la corrección del estado del viaje queda reservada a Alejandro desde que se emite cualquiera de las dos liquidaciones que corresponden a ese viaje y período: la de Transp SERV o la del chofer correspondiente. La restricción se aplica aunque la otra liquidación todavía no esté emitida. Esta decisión precisa el momento de aplicación de D-006.
Comprobación esperada: si sólo está emitida la liquidación de Transp SERV, si sólo está emitida la del chofer o si ambas están emitidas, únicamente Alejandro puede corregir el estado del viaje. Mientras ninguna esté emitida, se mantiene D-004. En todos los casos se exige el motivo de corrección definido en D-007.
## D-009 — Todos los viajes deben estar resueltos antes de emitir la liquidación
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: antes de emitir una liquidación, todos los viajes correspondientes a esa liquidación y período deben estar marcados como «Realizado» o «No realizado». Si queda algún viaje correspondiente sin uno de esos estados, no se permite emitirla. El requisito se aplica a la liquidación de Transp SERV y a la de cada chofer dentro del alcance de viajes que corresponda a cada una.
Comprobación esperada: la emisión se impide si existe un viaje correspondiente sin resolver; cuando todos están marcados como «Realizado» o «No realizado», esta condición deja de impedir la emisión. Se mantiene la regla de que sólo los viajes realizados se liquidan como servicios ejecutados. No se asignan estados automáticamente para habilitar la emisión.
## D-010 — Cierre de turnos por olvido del chofer
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: si el chofer se olvida de cerrar su turno, Walter o Alejandro pueden cerrarlo en su nombre. Para ese cierre deben registrar el kilometraje final y el motivo. Se conserva la asociación del turno con el chofer que utilizó el vehículo y la trazabilidad de quién efectuó el cierre.
Comprobación esperada: Walter y Alejandro pueden cerrar un turno que el chofer dejó abierto, aportando kilometraje final y motivo. El cierre por ellos no se admite si falta alguno de esos datos. Se mantienen los controles de lecturas y el historial previstos en la base documental. D-013 también impide este cierre mientras exista un viaje en curso.
## D-011 — Apertura de turno con una diferencia positiva de kilometraje
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: si el odómetro marca más kilómetros que el último cierre registrado del mismo vehículo, el chofer puede abrir el turno con esa lectura. La diferencia queda señalada como pendiente de revisión por Walter o Alejandro. La diferencia positiva no bloquea por sí sola la apertura ni provoca una modificación automática de las lecturas.
Comprobación esperada: con un último cierre de 50.000 km y una apertura de 50.020 km, el turno puede abrirse conservando ambas lecturas y una diferencia de 20 km pendiente de revisión. Se mantienen los demás controles de apertura previstos. El tratamiento de una lectura inferior al último cierre se rige por D-012.
## D-012 — Bloqueo de apertura ante una lectura inferior al último cierre
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: si el chofer confirma que la lectura real del odómetro es menor que el último cierre registrado del mismo vehículo, se bloquea la apertura del turno hasta que Walter o Alejandro revisen y corrijan el registro incorrecto. Se conserva la lectura real del vehículo; no se la sustituye por un valor artificial para hacerla coincidir con el historial.
Comprobación esperada: una lectura real inferior al cierre anterior impide abrir el turno. Walter o Alejandro deben resolver la inconsistencia mediante la corrección del registro incorrecto, conservando el historial, los valores anterior y nuevo y el motivo previstos en la base documental. La apertura sólo podrá continuar cuando se haya resuelto esa inconsistencia y se cumplan los demás controles aplicables.
## D-013 — Bloqueo del cierre de turno mientras existan viajes en curso
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: se bloquea el cierre de un turno mientras tenga algún viaje en curso. Para cerrarlo, todos los viajes iniciados y vinculados a ese turno deben haber quedado como «Realizado» o «No realizado». La restricción se aplica al chofer, a Walter y a Alejandro, incluidos los cierres por olvido contemplados en D-010.
Comprobación esperada: ninguno de los responsables autorizados puede cerrar un turno con un viaje todavía en curso. Una vez resueltos esos viajes, esta condición deja de impedir el cierre, sujeto a los demás controles. La condición no alcanza a viajes futuros de la agenda que no hayan sido iniciados y vinculados al turno. El cierre no cambia automáticamente el estado de los viajes.
## D-014 — Cargas de combustible pendientes de comprobante
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: si el chofer todavía no tiene disponible la foto de la boleta, puede guardar la carga de combustible como «Pendiente de comprobante» y adjuntar la fotografía después al mismo registro. La falta inicial de la foto no impide guardar la carga con los demás datos requeridos.
Comprobación esperada: una carga sin foto se guarda y queda identificada como «Pendiente de comprobante». Posteriormente, el chofer puede adjuntar la boleta a esa misma carga, sin duplicar el registro. La verificación administrativa sigue siendo una operación distinta de adjuntar la fotografía, conforme al control de comprobantes previsto.
## D-015 — Corrección de cargas de combustible antes y después de verificarlas
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: el chofer puede corregir sus propias cargas de combustible mientras no estén verificadas. Una vez verificadas, sólo la Secretaria o Alejandro pueden corregirlas, conservando el historial. El permiso del chofer no se extiende a cargas de otros conductores.
Comprobación esperada: un chofer puede corregir una carga propia no verificada, pero no una ajena. Después de la verificación, la corrección se impide al chofer y queda disponible únicamente para la Secretaria o Alejandro. Las correcciones conservan trazabilidad y no eliminan el historial del registro.
## D-016 — Totales de combustible con separación entre verificado y pendiente
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: los totales de combustible incluyen todas las cargas registradas y muestran por separado los subtotales de cargas verificadas y pendientes de verificación, respetando los filtros y permisos de consulta. Las cargas pendientes de comprobante de D-014 forman parte de las pendientes. Se mantiene la separación de cantidades por tipo de combustible y unidad; no se suman unidades diferentes.
Comprobación esperada: una carga registrada no verificada se refleja en el total y en el subtotal pendiente. Al verificarla sin modificar su importe, pasa al subtotal verificado y deja de integrar el pendiente, sin duplicarse ni alterar el total registrado por ese solo cambio de estado. Los usuarios sólo acceden a las cargas e importes que permiten sus roles.
## D-017 — Estado de todos los pasajeros requerido para finalizar el viaje
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: para finalizar un viaje, todos los pasajeros previstos deben estar marcados como «Recogido» o «No viajó». Si queda algún pasajero sin uno de esos estados, se impide finalizar el viaje. La falta de registro no se interpreta automáticamente como ausencia.
Comprobación esperada: un pasajero previsto sin estado impide finalizar el viaje; cuando todos tienen registrado «Recogido» o «No viajó», esta condición deja de impedir la finalización. La regla exige completar la información de pasajeros. D-018 establece el tratamiento del recorrido previsto que efectivamente se realizó aunque no viajara ningún pasajero.
## D-018 — Liquidación del recorrido previsto aunque no viaje ningún pasajero
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: si el chofer hizo el recorrido previsto, el viaje se registra como «Realizado» y se liquida aunque no haya viajado ningún pasajero. Los pasajeros que no viajaron se registran como «No viajó», conforme a D-017. La ausencia de todos los pasajeros no excluye por sí sola ese servicio realizado de la liquidación.
Comprobación esperada: un viaje cuyo recorrido previsto fue efectuado puede finalizarse como «Realizado» con todos sus pasajeros marcados «No viajó» y se incluye en las liquidaciones correspondientes, sujeto a las reglas comerciales y de revisión ya definidas. Se mantiene la separación entre kilómetros comerciales y lecturas del odómetro; esta decisión no autoriza a considerar realizado un recorrido que no se efectuó.
## D-019 — Correcciones de kilómetros comerciales y chofer después de la emisión
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: una vez emitida cualquiera de las liquidaciones correspondientes al viaje, únicamente Alejandro puede corregir los kilómetros comerciales o el chofer que realizó ese viaje. Toda corrección de estos datos después de la emisión exige indicar el motivo y conservar el historial. Se aplica el mismo momento de restricción definido en D-008, aunque la otra liquidación todavía no esté emitida.
Comprobación esperada: tras la primera liquidación emitida, Walter y los demás roles no pueden corregir esos datos del viaje. Alejandro puede hacerlo con motivo e historial; la operación se impide si falta el motivo. Las liquidaciones afectadas se corrigen mediante versiones del mismo período que conservan las anteriores, conforme a D-005. Esta regla no restringe por sí misma las asignaciones futuras de otros viajes que no tengan liquidaciones emitidas.
## D-020 — Baja como inactivos de los registros con actividad
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: los pacientes, choferes, vehículos y recorridos que tengan actividad registrada se dan de baja como «Inactivos», conservando su historial. No se permite su borrado definitivo desde el uso habitual del sistema. La baja no elimina los registros históricos asociados ni sus relaciones.
Comprobación esperada: al dar de baja uno de esos registros con actividad, queda inactivo y su historial sigue disponible según los permisos existentes. Los viajes, turnos, gastos y liquidaciones históricos relacionados no desaparecen por esa baja. La operación habitual impide el borrado definitivo de esos registros. Esta decisión no fija un plazo de conservación. D-021 define el tratamiento de los viajes futuros al dar de baja a un chofer, y D-023 define la revisión de los viajes futuros ante la baja de pacientes o recorridos.
## D-021 — Viajes futuros sin asignar al dar de baja al chofer
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: se permite dar de baja al chofer aunque tenga viajes futuros asignados. Sus viajes futuros todavía no iniciados quedan «Sin asignar» y señalados para que Walter o Alejandro designen manualmente un reemplazo. La baja no exige haber completado previamente esas reasignaciones.
Comprobación esperada: al dar de baja al chofer, sus viajes futuros sin iniciar permanecen en la agenda, dejan de tener conductor asignado y se identifican como pendientes de asignación para Walter y Alejandro. No se cancelan ni se marcan «No realizado» por la baja, y no se asigna automáticamente un reemplazo. Los viajes ya realizados y el historial de asignaciones se conservan; los viajes en curso quedan fuera de esta desasignación de viajes futuros.
## D-022 — Retiro del acceso como Chofer al darlo de baja
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: la baja del chofer quita su acceso a las funciones del rol Chofer y conserva los demás roles activos que tenga. Si únicamente tenía el rol Chofer y no le queda otro rol activo, ya no puede ingresar al sistema. La baja no borra su cuenta ni su historial operativo.
Comprobación esperada: un usuario que sólo era chofer no puede ingresar ni operar el sistema después de la baja. Si tenía además otro rol activo, mantiene únicamente las funciones de ese rol; por ejemplo, Walter puede seguir actuando como Encargado, pero no como Chofer. Una sesión que ya estuviera abierta tampoco permite seguir usando los permisos retirados. Se conservan los registros históricos según D-020 y los viajes futuros se tratan según D-021.
## D-023 — Revisión de viajes futuros al dar de baja pacientes o recorridos
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Regla acordada: al dar de baja un paciente o un recorrido, los viajes futuros ya generados se conservan sin cambios automáticos en su programación y quedan señalados para revisión de Walter o Alejandro. Ellos deciden qué modificar o cancelar. La baja por sí sola no borra ni cancela esos viajes.
Comprobación esperada: los viajes futuros afectados permanecen en la agenda y se identifican como pendientes de revisión por la baja del paciente o recorrido. La baja no elimina automáticamente pasajeros ni modifica asignaciones, recorridos o estados de esos viajes. Walter o Alejandro revisan y aplican los cambios operativos correspondientes, respetando los permisos y el historial definidos. La actividad histórica se conserva según D-020.
## Seguimiento de Q-001 — Continúa pendiente de confirmar con IRID
15 de noviembre de 2026: Alejo indicó que todavía no pudo confirmar con IRID si el mínimo mensual es común o individual y pidió mantener Q-001 pendiente y continuar con otro tema. No se registra una nueva regla de remuneración ni se duplica la pregunta. También continúa sin confirmar la aplicación del mínimo a quien tiene el doble rol de Chofer y Encargado. No se retomará esta pregunta por defecto en las próximas consultas; se espera nueva información de IRID.
## D-024 — Formato propio de liquidación para Transp SERV y exportaciones
Estado: confirmado por Alejo el 15 de noviembre de 2026, en respuesta a la pregunta 25 de esta ronda.
Regla acordada: se puede definir un formato propio para la liquidación de Transp SERV, con los datos acordados y exportación a Excel y PDF. No es necesario reproducir una planilla externa obligatoria. Se mantiene el contenido funcional previsto: período, servicios realizados, Entradas y Salidas, cantidades e importes, con la separación habitual por grupos de días cuando corresponda.
Comprobación esperada: Alejandro puede exportar la liquidación a Excel y PDF en el formato propio que se diseñe, y ambos archivos reflejan los mismos datos de la liquidación y versión seleccionadas. Se mantienen los permisos económicos y la conservación de versiones ya definidos. Esta decisión autoriza el formato propio; el diseño concreto de columnas y presentación aún debe elaborarse para revisión.
## Q-002 — Volumen de traslados diarios pendiente de confirmar con IRID
15 de noviembre de 2026: Alejo indicó que todavía no tiene una estimación de los traslados diarios y pidió dejarla pendiente de confirmar con IRID. Se registra como Q-002 en el documento de preguntas pendientes, contando cada Entrada y cada Salida como un viaje separado. No se adopta una cifra por defecto ni se fija un límite o garantía de capacidad. Se continúa con otras definiciones a la espera de esa información.
## D-025 — Bloqueo de asignación del mismo chofer en fecha y hora coincidentes
Estado: confirmado por Alejo el 15 de noviembre de 2026, en respuesta a la pregunta 27 de esta ronda.
Regla acordada: se bloquea la asignación de dos viajes distintos al mismo chofer cuando coinciden exactamente la fecha y la hora programada. La coincidencia no se puede confirmar mediante una simple advertencia. El control se aplica al asignar o reasignar al chofer en la planificación.
Comprobación esperada: si la asignación deja al mismo chofer a cargo de dos viajes distintos con igual fecha y hora programada, no se permite guardarla. La regla comprueba esa coincidencia exacta; no incorpora cálculos de duración de recorridos, superposiciones estimadas ni integración con mapas. La referencia temporal de los horarios informados está pendiente de confirmar en Q-003; su interpretación para la agenda y esta comparación no se da por cerrada hasta resolverla.
## Q-003 — Significado de los horarios pendiente de confirmar con IRID
15 de noviembre de 2026: Alejo indicó que todavía no pudo confirmar qué representan los horarios informados por Transp SERV y pidió dejarlos pendientes de consultar con IRID. Se registra Q-003 para aclarar si corresponden al inicio de los recorridos o a la llegada/salida en la institución. No se adopta una interpretación por defecto. Esta precisión afecta a la agenda y a la interpretación del control de coincidencias de D-025.
## D-026 — Administración de cuentas y roles exclusiva del Administrador
Estado: confirmado por Alejo el 15 de noviembre de 2026, en respuesta a la pregunta 29 de esta ronda.
Regla acordada: sólo Alejandro, como Administrador, puede crear cuentas y asignar o quitar roles. El sistema no dispone de registro público de usuarios. Los demás roles no pueden crear cuentas ni modificar sus propios permisos o los de otros usuarios.
Comprobación esperada: Alejandro puede crear una cuenta y administrar sus roles; esas operaciones se impiden a Encargado, Chofer y Secretaria. Un visitante sin cuenta tampoco puede registrarse. Las restricciones se aplican tanto a las pantallas como a las operaciones del sistema. Los accesos derivados de la baja del chofer siguen D-022.
## D-027 — Recuperación con contraseña temporal y cambio obligatorio
Estado: confirmado por Alejo el 15 de noviembre de 2026, en respuesta a la pregunta 30 de esta ronda.
Regla acordada: Alejandro gestiona la recuperación de acceso de un usuario que olvidó su contraseña, entregándole una contraseña temporal. El usuario debe cambiarla obligatoriamente en el siguiente ingreso antes de utilizar las funciones habituales del sistema. La administración de este restablecimiento queda restringida al Administrador, conforme a D-026.
Comprobación esperada: tras el restablecimiento, el usuario puede iniciar el proceso de acceso con la contraseña temporal y el sistema exige definir una nueva contraseña antes de continuar. No puede omitir ese cambio ni acceder a las funciones habituales mientras esté pendiente. Una vez cambiado el secreto, la contraseña temporal deja de permitir el ingreso. Los demás roles no pueden restablecer las contraseñas de otros usuarios.
## D-028 — Respaldos automáticos diarios de base de datos y comprobantes
Estado: confirmado por Alejo el 15 de noviembre de 2026, en respuesta a la pregunta 31 de esta ronda.
Regla acordada: se realizarán copias de seguridad automáticas diarias de la base de datos y de las fotografías de los comprobantes. Ambos conjuntos de información deben estar incluidos en el respaldo.
Comprobación esperada: la configuración ejecuta automáticamente el respaldo de ambos conjuntos con frecuencia diaria y permite comprobar el resultado de cada ejecución. La verificación técnica deberá incluir la restauración de datos y de fotografías de prueba. Esta decisión no fija aún destino, plazo de retención ni tiempos garantizados de recuperación; se concretarán en el diseño técnico dentro de la infraestructura y capacidad previstas.
## Consolidación de la especificación — 15 de noviembre de 2026
Alejo solicitó consolidar la especificación con lo definido y las tres preguntas pendientes de IRID. Esta ronda queda registrada con 28 decisiones confirmadas (D-001 a D-028) y tres consultas pendientes de confirmar: Q-001 mínimo mensual garantizado, Q-002 volumen habitual de traslados diarios y Q-003 significado de los horarios informados por Transp SERV.
La especificación funcional consolidada v0.1 reúne la base documental y estas decisiones por módulo, con roles, reglas, entidades conceptuales, tecnologías documentadas y criterios de aceptación. El registro conserva el detalle histórico de las respuestas; el documento de preguntas mantiene las tres consultas abiertas.
Especificación funcional consolidada v0.1
La consolidación no supone aprobación automática del diseño UX/UI, del esquema de datos definitivo ni del diseño técnico pendiente, y no autoriza por sí sola la implementación o el despliegue. Las partes dependientes de Q-001, Q-002 y Q-003 permanecen abiertas hasta contar con las respuestas de IRID. El siguiente trabajo será revisar esta base y preparar el plan de implementación con esas dependencias explícitas.
# 10 Diseño de pantallas y flujos de uso — 15 de noviembre de 2026
Estado: relevamiento UX/UI iniciado por pedido de Alejo. Se avanzará con preguntas de a una y se registrará cada respuesta confirmada para preparar posteriormente el plan de implementación.
Base vigente: especificación funcional consolidada v0.1, decisiones D-001 a D-028 y consultas Q-001 a Q-003 pendientes de IRID. No se vuelven a preguntar reglas ya acordadas. Las propuestas de interfaz se distinguen de las decisiones aprobadas.
Las decisiones de pantallas y flujos se identificarán como UX-001 y siguientes, indicando actor, pantalla o recorrido afectado, comportamiento acordado y comprobación esperada. Se conservan las decisiones UX-001 a UX-059. Las referencias gráficas y su análisis están registrados en UX-060, y la base visual está aprobada en UX-061: bordó, fondos claros, Montserrat y logo original. Los ocho bloques F-01 a F-08 tienen sus decisiones principales acordadas. Está en revisión la primera propuesta visual de «Mi jornada»; las demás pantallas, su adaptación a celular y accesibilidad siguen pendientes. Las tres preguntas funcionales de IRID permanecen abiertas. UX-018, UX-024, UX-026, UX-042, UX-047 y UX-055 precisan condiciones funcionales incorporadas también a la especificación consolidada.
La definición progresiva abordará las tareas de cada rol, navegación, formularios, estados vacíos, errores, confirmaciones y recuperación; luego la dirección visual y los criterios de accesibilidad y adaptación a dispositivos. Esta etapa autoriza el trabajo de diseño y documentación, sin iniciar la implementación.
## UX-001 — «Mi jornada» como pantalla inicial del Chofer
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Chofer; inicio «Mi jornada».
Decisión acordada: al ingresar como Chofer, se abre directamente «Mi jornada», con el turno del vehículo y sus viajes asignados de hoy. Se conservan las restricciones de consulta de viajes propios y datos permitidos para ese rol.
Comprobación esperada: al completar el ingreso como Chofer y cualquier cambio de contraseña obligatorio que corresponda, el usuario llega a «Mi jornada» y encuentra el turno del vehículo y sus viajes asignados del día, sin tener que buscarlos primero en otra sección. No se muestran viajes de otros choferes ni información económica reservada.
Límite de esta decisión: se confirma la pantalla inicial y su contenido principal. UX-005 precisa la presentación sin turno abierto; los demás controles y el estado sin viajes se definirán en las siguientes consultas. UX-002 precisa el inicio de Walter, que combina los roles Encargado y Chofer. No se interpreta el significado de los horarios pendiente de Q-003.
## UX-002 — Agenda general como inicio de Walter y acceso a «Mi jornada»
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantallas: Walter, con roles de Encargado y Chofer; agenda general y «Mi jornada».
Decisión acordada: Walter ingresa a la agenda general y dispone de un acceso visible a «Mi jornada» para cuando conduce. La agenda corresponde a sus funciones de Encargado; «Mi jornada» presenta su turno del vehículo y sus propios viajes asignados de hoy, conforme a UX-001.
Comprobación esperada: al completar el ingreso y cualquier cambio obligatorio de contraseña, Walter llega a la agenda general. Desde allí identifica y utiliza el acceso a «Mi jornada», donde encuentra su información de Chofer. La navegación conserva los permisos de ambos roles y no habilita tarifas, remuneraciones ni liquidaciones.
Relación con las reglas vigentes: el acceso a las funciones de Chofer depende de que ese rol siga activo. Si se retira, Walter conserva las funciones de Encargado y pierde las de Chofer conforme a D-022. La posición visual concreta del acceso se definirá al diseñar la navegación.
## UX-003 — Resumen general como pantalla inicial de Alejandro
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Alejandro, como Administrador; resumen general.
Decisión acordada: Alejandro ingresa a un resumen general con los viajes del día, los pendientes de revisión y un acceso directo a las liquidaciones.
Comprobación esperada: al completar el ingreso y cualquier cambio obligatorio de contraseña, Alejandro llega al resumen general, identifica los viajes del día y los pendientes de revisión y puede acceder directamente a las liquidaciones. Se conservan los permisos y las reglas de revisión y emisión ya acordados; acceder desde el resumen no emite una liquidación.
Límite de esta decisión: se confirma el punto de entrada y sus tres contenidos principales. Los indicadores concretos, los tipos de pendientes y su disposición visual se definirán al detallar la pantalla, sin agregar funciones ajenas al alcance vigente.
## UX-004 — «Combustible y comprobantes» como inicio de la Secretaria
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Secretaria; «Combustible y comprobantes».
Decisión acordada: la Secretaria ingresa directamente a «Combustible y comprobantes», mostrando primero las cargas pendientes de verificación.
Comprobación esperada: al completar el ingreso y cualquier cambio obligatorio de contraseña, la Secretaria llega a esa sección y encuentra priorizadas las cargas pendientes de verificación. Se conservan sus funciones de consulta, verificación y corrección con historial, el acceso a gastos e intervenciones y las restricciones económicas ya acordadas.
Relación con las reglas vigentes: las cargas pendientes de comprobante forman parte de las pendientes según D-014 y D-016. La prioridad visual no modifica los totales, el historial ni los permisos de corrección de D-015. Los filtros, el tratamiento visual de cada pendiente y el estado sin cargas por revisar se definirán al detallar la pantalla.
## UX-005 — «Mi jornada» sin turno abierto
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Chofer; «Mi jornada» cuando no tiene un turno abierto.
Decisión acordada: cuando el chofer no tiene un turno abierto, «Mi jornada» muestra un botón destacado «Abrir turno» y permite seguir viendo sus viajes asignados de hoy.
Comprobación esperada: un chofer sin turno abierto encuentra la acción «Abrir turno» claramente visible y puede consultar sus viajes asignados del día sin abrir previamente un turno. Se mantienen los permisos de consulta de viajes propios y el acceso al flujo de selección de vehículo y registro de odómetro.
Relación con las reglas vigentes: consultar los viajes no equivale a iniciarlos. La decisión no modifica los controles de apertura, las diferencias de odómetro ni las condiciones de ejecución ya definidas. UX-007 precisa el regreso con turno abierto; el estado sin viajes asignados se definirá al continuar el diseño.
## UX-006 — Apertura de turno en una sola pantalla
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Chofer; formulario «Abrir turno».
Decisión acordada: la apertura del turno se realiza en una sola pantalla para elegir el vehículo por alias/patente e ingresar el kilometraje actual. Se muestra la lectura del último cierre del vehículo seleccionado como referencia, sin completar automáticamente el campo de kilometraje actual.
Comprobación esperada: desde «Abrir turno», el chofer puede identificar y seleccionar el vehículo por alias/patente e introducir su lectura real del odómetro en el mismo formulario. Si existe un cierre anterior para ese vehículo, su lectura se presenta como referencia y no se copia automáticamente al campo que debe completar el chofer.
Relación con las reglas vigentes: se conservan los datos y controles de apertura ya definidos, incluidas las aperturas incompatibles y las diferencias de kilometraje de D-011 y D-012. Mostrar la lectura anterior no autoriza a sustituir la lectura real ni a corregir el historial desde el rol Chofer. Los mensajes de validación y el caso sin cierre anterior se detallarán al completar los estados del formulario.
## UX-007 — Regreso a «Mi jornada» con el turno abierto
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Chofer; «Mi jornada» después de abrir el turno.
Decisión acordada: al abrir el turno, el chofer vuelve a «Mi jornada», con el vehículo activo visible y los accesos «Registrar combustible» y «Cerrar turno». Se mantienen visibles sus viajes asignados de hoy conforme a UX-001.
Comprobación esperada: tras una apertura de turno confirmada por el sistema, el chofer regresa a «Mi jornada», identifica el vehículo del turno abierto y encuentra los dos accesos indicados. El acceso a combustible conduce a su registro y el de cierre al flujo correspondiente; mostrar esos accesos no ejecuta las operaciones automáticamente.
Relación con las reglas vigentes: abrir el turno no inicia un viaje. Se conservan los permisos, la asociación entre viaje y vehículo del turno, los requisitos de combustible y los controles de cierre, incluido D-013 cuando hay un viaje en curso. UX-013 define el aviso con los viajes bloqueantes y el acceso a sus detalles.
## UX-008 — Detalle del viaje y acción «Iniciar viaje»
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Chofer; detalle de un viaje asignado.
Decisión acordada: al tocar un viaje, se abre su detalle con Entrada/Salida, horario, destino y pasajeros con sus domicilios. Desde ese detalle se utiliza «Iniciar viaje».
Comprobación esperada: el chofer abre uno de sus viajes y encuentra los datos indicados y la acción de inicio. Consultar el detalle no inicia el viaje automáticamente; el inicio se registra al ejecutar la acción explícita y cumplir los controles operativos vigentes. No se muestran viajes ajenos ni datos económicos reservados.
Relación con las reglas vigentes: el vehículo utilizado procede del turno abierto, conforme a la especificación. La interpretación y etiqueta precisa del horario continúan pendientes de Q-003; esta decisión no lo define como hora de inicio del recorrido. La disposición visual concreta de los datos se elaborará al diseñar la pantalla.
## UX-009 — Registro individual de pasajeros durante el viaje
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Chofer; detalle del viaje en curso.
Decisión acordada: durante el viaje, cada pasajero tiene los botones «Recogido» y «No viajó», y la elección se guarda al tocarla. El registro se realiza desde el detalle del viaje, sin requerir un botón general de guardado para toda la lista.
Comprobación esperada: al tocar una de las opciones de un pasajero, se guarda la elección para ese pasajero y se muestra su estado registrado. No es necesario completar primero el resto de la lista ni ejecutar un guardado general. Los pasajeros todavía sin marcar permanecen sin estado; no se completan automáticamente.
Relación con las reglas vigentes: se mantienen D-017 y D-018 sobre los estados requeridos para finalizar y el recorrido realizado sin pasajeros. Esta decisión corresponde al registro durante el viaje y no define permisos de corrección después de su finalización. Los mensajes de guardado y de error se detallarán al completar los estados de la interfaz; una operación fallida no debe presentarse como guardada.
## UX-010 — Resumen y confirmación para finalizar el viaje
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Chofer; finalización desde el detalle del viaje.
Decisión acordada: al tocar «Finalizar viaje», aparece un resumen de pasajeros recogidos y que no viajaron, y se pide confirmación antes de dejar el viaje como «Realizado».
Comprobación esperada: el chofer puede revisar el resumen antes de confirmar. Abrir o cerrar ese resumen no finaliza por sí solo el viaje; la finalización válida se registra tras la confirmación explícita y deja el viaje como Realizado. La confirmación corresponde al chofer y no requiere aprobación de Walter o Alejandro.
Relación con las reglas vigentes: D-017 impide finalizar mientras queden pasajeros sin estado. Si se hizo el recorrido previsto y todos figuran No viajó, se puede confirmar como Realizado conforme a D-018. Se conserva D-001 sobre la revisión de Alejandro antes de emitir la liquidación y los permisos de corrección de estados ya definidos.
## UX-011 — Motivo libre y confirmación de «No realizado»
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantalla: chofer asignado, Walter y Alejandro dentro de los permisos de D-002; formulario para registrar inicialmente un viaje como No realizado.
Decisión acordada: «No realizado» abre un formulario con un motivo de texto libre obligatorio y un botón «Confirmar no realizado».
Comprobación esperada: un usuario autorizado abre el formulario, escribe el motivo con sus propias palabras y confirma mediante el botón indicado. Sin motivo no puede guardar. Abrir el formulario o escribir el texto no cambia por sí solo el estado del viaje; la confirmación válida registra No realizado y conserva el motivo asociado.
Relación con las reglas vigentes: se mantienen D-002 y D-003. Este flujo no habilita al Chofer a corregir un estado final previamente registrado. Las correcciones de estados siguen D-004 a D-008, incluido el motivo de corrección y las restricciones posteriores a la emisión de liquidaciones.
## UX-012 — Datos y revisión antes de cerrar el turno
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Chofer; formulario «Cerrar turno».
Decisión acordada: «Cerrar turno» pide el kilometraje final y muestra el vehículo, la lectura inicial y los kilómetros del turno antes de confirmar el cierre.
Comprobación esperada: en la pantalla de cierre, el chofer identifica el vehículo y la lectura inicial, ingresa el kilometraje final y ve la diferencia calculada entre ambas lecturas antes de confirmar. Abrir el formulario o ingresar el dato no cierra automáticamente el turno; el cierre válido requiere la confirmación y los controles vigentes.
Relación con las reglas vigentes: los kilómetros del turno se calculan como lectura final menos lectura inicial y no reemplazan los kilómetros comerciales. Se conservan los controles del odómetro y el bloqueo de D-013 si quedan viajes en curso. Para cierres por olvido realizados por Walter o Alejandro también se requiere el motivo previsto en D-010 y se conserva la trazabilidad.
## UX-013 — Viajes pendientes visibles cuando se bloquea el cierre
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantalla: Chofer, Walter y Alejandro dentro de sus permisos; aviso al intentar cerrar un turno con viajes en curso.
Decisión acordada: si el cierre está bloqueado por viajes en curso, se muestra cuáles son y un botón «Ir al viaje» para abrir cada uno.
Comprobación esperada: al intentar cerrar un turno con viajes iniciados sin resolver, el aviso identifica los viajes que impiden el cierre y ofrece «Ir al viaje» para consultar el detalle de cada uno. El turno permanece abierto. Abrir un detalle no cambia automáticamente el estado del viaje ni el del turno.
Relación con las reglas vigentes: se aplica D-013 también a Walter y Alejandro, incluidos los cierres por olvido de D-010. Sólo se señalan como bloqueantes los viajes en curso vinculados al turno, no los viajes futuros sin iniciar. Resolverlos respeta los permisos y requisitos vigentes para registrar Realizado o No realizado; el acceso no habilita a eludirlos.
## UX-014 — Registro de combustible en una sola pantalla
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Chofer; «Registrar combustible».
Decisión acordada: «Registrar combustible» es una sola pantalla con el vehículo del turno ya indicado, los datos de la carga y la opción de adjuntar el comprobante.
Comprobación esperada: al acceder al registro de combustible desde su turno, el chofer identifica el vehículo asociado y puede completar en el mismo formulario los datos acordados —fecha y hora, tipo de combustible, cantidad y unidad, importe y kilometraje del tablero— y adjuntar la fotografía del comprobante.
Relación con las reglas vigentes: se conserva la vinculación de la carga con el vehículo, usuario y turno. D-014 permite guardar sin foto como Pendiente de comprobante y adjuntarla después al mismo registro. Se mantienen los permisos de corrección de D-015, los totales de D-016 y la separación de cantidades por tipo y unidad. La decisión no agrega campos obligatorios ni lectura automática de boletas.
## UX-015 — Captura o selección de comprobante con vista previa
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Chofer; incorporación de la foto del comprobante a una carga de combustible.
Decisión acordada: el chofer puede sacar una foto o elegir una imagen guardada, y ver una vista previa antes de adjuntar el comprobante.
Comprobación esperada: el flujo permite obtener la imagen mediante captura desde el celular o selección de una imagen existente y muestra una vista previa antes de incorporarla como comprobante de la carga. La fotografía finalmente adjunta corresponde a la imagen revisada.
Relación con las reglas vigentes: la foto se asocia a la carga correspondiente, incluida una guardada previamente como Pendiente de comprobante según D-014, respetando los permisos de D-015. Se mantienen el acceso restringido y los respaldos de las fotografías. La vista previa o la incorporación de la imagen no verifican administrativamente la carga ni realizan lectura automática de la boleta.
## UX-016 — Aviso de comprobantes pendientes en «Mi jornada»
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Chofer; «Mi jornada» y acceso a sus cargas pendientes de comprobante.
Decisión acordada: «Mi jornada» muestra un aviso con la cantidad de comprobantes pendientes y acceso a esas cargas, incluyendo las de días anteriores.
Comprobación esperada: si el chofer tiene cargas propias sin comprobante, el aviso cuenta tanto las del día como las anteriores y permite acceder a ellas para adjuntar la foto al registro correspondiente. Tras adjuntarla correctamente, esa carga deja de contar como pendiente de comprobante, aunque todavía pueda quedar pendiente de verificación administrativa.
Relación con las reglas vigentes: se utiliza el estado de D-014, conservando la carga original y su asociación con vehículo, turno y usuario. El acceso respeta D-015 y no muestra cargas ajenas al Chofer. Se distingue la falta de foto de la verificación pendiente; adjuntar la imagen no equivale a verificar la carga.
## UX-017 — Datos y comprobante juntos para revisar una carga
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Secretaria; detalle de una carga de combustible.
Decisión acordada: la Secretaria ve los datos de la carga y la foto del comprobante en la misma pantalla, con las acciones «Corregir» y «Marcar como verificada».
Comprobación esperada: al abrir una carga con comprobante, la Secretaria puede contrastar sus datos con la foto sin cambiar de pantalla y acceder a las dos acciones indicadas, según el estado del registro y sus permisos. Abrir o consultar el detalle no modifica ni verifica automáticamente la carga.
Relación con las reglas vigentes: se mantienen los permisos de corrección y el historial de D-015, el acceso restringido a las fotos y los totales de D-016. UX-018 precisa que, sin foto, la verificación está bloqueada y se muestra «Falta adjuntar el comprobante».
## UX-018 — Verificación bloqueada hasta adjuntar el comprobante
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantalla: usuarios con permiso para verificar combustible; detalle de una carga sin foto.
Decisión acordada: una carga sin foto no puede marcarse como verificada y muestra «Falta adjuntar el comprobante». La condición se aplica a cualquier usuario con permiso de verificación.
Comprobación esperada: una carga sin foto conserva su situación pendiente y el sistema impide marcarla como verificada, mostrando el mensaje acordado. Al adjuntar correctamente la fotografía, la falta de comprobante deja de impedir la verificación; la carga no se verifica automáticamente y requiere la acción de un usuario autorizado.
Relación con las reglas vigentes: se conserva D-014 para guardar sin foto y adjuntarla después, D-015 para las correcciones y D-016 para incluir pendientes en los totales. El bloqueo debe respetarse en las operaciones del sistema, además de en la pantalla. Esta decisión precisa una condición funcional del proceso y se incorpora también a la especificación consolidada.
## UX-019 — Agenda general con vistas diaria, semanal y mensual
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantalla: Walter y Alejandro; agenda general.
Decisión acordada: la agenda general abre mostrando los viajes de hoy y permite cambiar a una vista semanal o mensual.
Comprobación esperada: al entrar a la agenda general, el usuario autorizado ve los viajes del día actual y puede cambiar a las vistas semanal y mensual para consultar la programación. Cambiar de vista no modifica los viajes, sus asignaciones ni sus estados.
Relación con las reglas vigentes: se conserva el inicio de Walter en la agenda de UX-002 y el resumen inicial de Alejandro de UX-003. Las vistas respetan los permisos existentes y no cambian los patrones de generación mensual. UX-020 define los filtros y accesos rápidos; el formato visual se desarrollará en el diseño. La interpretación de horarios sigue pendiente de Q-003 y no se presupone un volumen de viajes ante Q-002.
## UX-020 — Filtros y accesos rápidos de la agenda
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantalla: Walter y Alejandro; agenda general.
Decisión acordada: la agenda permite filtrar por chofer y estado del viaje, con accesos rápidos a «Sin asignar» y «Pendientes de revisión».
Comprobación esperada: los usuarios autorizados pueden acotar los viajes mostrados por chofer o estado y acceder rápidamente a los que no tienen conductor asignado o requieren revisión operativa. El resultado respeta la fecha o período consultado. Aplicar o quitar un filtro no modifica viajes, estados ni asignaciones.
Relación con las reglas vigentes: «Sin asignar» representa la falta de conductor, como en D-021; «Pendientes de revisión» identifica viajes señalados para revisión, como los afectados por D-023. Son conceptos distintos del estado de ejecución. Se conservan las vistas de UX-019 y los permisos existentes.
## UX-021 — Selector y confirmación para asignar o cambiar chofer
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantalla: Walter y Alejandro; detalle de un viaje programado abierto desde la agenda.
Decisión acordada: al abrir un viaje programado desde la agenda, aparece «Asignar o cambiar chofer», con un selector de choferes y confirmación antes de guardar.
Comprobación esperada: el usuario autorizado accede a la acción desde el detalle, selecciona manualmente al chofer y confirma antes de guardar la asignación. Abrir el selector o elegir una opción no modifica por sí solo el viaje. La asignación se registra únicamente si cumple las validaciones vigentes.
Relación con las reglas vigentes: se mantiene el bloqueo por coincidencia exacta de fecha y hora de D-025. La acción no amplía los permisos de Chofer o Secretaria ni evita las restricciones de D-019 sobre correcciones del chofer ejecutor después de emitir una liquidación. La interpretación del horario permanece pendiente de Q-003.
## UX-022 — Viaje en conflicto visible al bloquear una asignación
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantalla: Walter y Alejandro; aviso de coincidencia al asignar o cambiar chofer.
Decisión acordada: el aviso de coincidencia exacta de fecha y hora muestra el viaje en conflicto y un botón «Ver viaje», manteniendo bloqueada la asignación.
Comprobación esperada: si la asignación propuesta coincide exactamente en fecha y hora con otro viaje del mismo chofer, no se guarda y el aviso permite identificar ese otro viaje y abrir su detalle mediante «Ver viaje». Consultarlo o cerrar el aviso no habilita la asignación ni modifica automáticamente ninguno de los viajes.
Relación con las reglas vigentes: se conserva D-025, sin posibilidad de omitir el bloqueo mediante una advertencia. El acceso al detalle respeta los permisos existentes. La comparación no incorpora duración ni solapamientos estimados, y la interpretación del horario sigue pendiente de Q-003.
## UX-023 — Vista previa y confirmación de la generación mensual
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantalla: Walter y Alejandro; generación de viajes del mes.
Decisión acordada: antes de generar los viajes del mes, se muestra una vista previa con recorridos, fechas y cantidad de Entradas y Salidas, y se pide confirmación.
Comprobación esperada: el usuario autorizado revisa los recorridos, las fechas y las cantidades de Entradas y Salidas previstas para el mes seleccionado antes de confirmar. La vista previa no crea viajes por sí sola; la generación se ejecuta al confirmar y cumplir las validaciones vigentes. Salir sin confirmar no genera los viajes.
Relación con las reglas vigentes: se utilizan las fechas reales del calendario y los grupos de días acordados, contando cada Entrada y cada Salida como un viaje separado. No se adopta una cantidad fija de días mensuales ni se alteran los permisos. UX-024 define que repetir la generación crea sólo los faltantes y conserva los existentes.
## UX-024 — Generación mensual que completa únicamente los viajes faltantes
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantalla: Walter y Alejandro; generación mensual sobre un mes con viajes existentes.
Decisión acordada: al repetir la generación de un mes, se crean únicamente los viajes que faltan y se conservan sin cambios los existentes.
Comprobación esperada: repetir la generación para una programación ya completa no crea nuevos viajes ni duplica los existentes. Si faltan viajes dentro del mes y los recorridos seleccionados, se crean sólo esos faltantes. Los viajes existentes conservan sus datos, asignaciones, estados e historial.
Relación con las reglas vigentes: la vista previa y la confirmación siguen UX-023. La generación repetida no sustituye las operaciones de modificación o corrección de viajes; éstas mantienen sus permisos, motivos e historial. Esta decisión precisa el comportamiento funcional de la generación y se incorpora también a la especificación consolidada.
## UX-025 — Alcance temporal y revisión de cambios de programación
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantalla: Walter y Alejandro; modificación de la programación de un recorrido.
Decisión acordada: al cambiar la programación de un recorrido, se elige «Sólo esta fecha» o «Desde esta fecha hasta fin de mes» y se revisan los viajes afectados antes de confirmar.
Comprobación esperada: el usuario autorizado selecciona el alcance temporal y puede identificar los viajes que resultarían afectados antes de confirmar. Elegir el alcance o consultar la revisión no aplica el cambio por sí solo. La operación confirmada se limita al alcance revisado y respeta las validaciones vigentes.
Relación con las reglas vigentes: se conserva la facultad ya definida de modificar una fecha puntual o las fechas restantes del mes. Las selecciones no amplían permisos de corrección ni eluden restricciones sobre viajes y liquidaciones. UX-026 precisa que el cambio sobre varias fechas sólo afecta a viajes sin iniciar y excluye los que estén en curso, realizados o no realizados.
## UX-026 — Cambios sobre varias fechas limitados a viajes sin iniciar
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantalla: Walter y Alejandro; modificación de la programación sobre varias fechas.
Decisión acordada: los cambios sobre varias fechas sólo afectan a viajes sin iniciar, dejando fuera los que estén en curso, realizados o no realizados.
Comprobación esperada: ante una selección que incluya viajes sin iniciar y viajes en curso o con estado final, la modificación en bloque sólo puede afectar a los primeros. Ningún viaje en curso, Realizado o No realizado se modifica mediante esa operación; conserva sus datos e historial.
Relación con las reglas vigentes: se mantiene la elección de alcance y revisión previa de UX-025. La exclusión se aplica al cambio sobre varias fechas y no modifica las reglas ni los permisos de corrección individual existentes. Esta condición funcional se incorpora también a la especificación consolidada.
## UX-027 — Vista previa con viajes a modificar y viajes excluidos
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantalla: Walter y Alejandro; vista previa de cambios de programación sobre varias fechas.
Decisión acordada: la vista previa separa «Viajes que se modificarán» y «Viajes excluidos», indicando el motivo de exclusión de cada uno.
Comprobación esperada: antes de confirmar, el usuario distingue los viajes que recibirían el cambio de los que quedan fuera. Cada viaje excluido muestra el motivo correspondiente a su situación y a las reglas vigentes. La consulta de la vista previa no modifica los registros ni permite incluir por excepción un viaje excluido.
Relación con las reglas vigentes: la revisión sigue UX-025 y las exclusiones de UX-026. Los viajes en curso, Realizado o No realizado permanecen fuera del cambio sobre varias fechas y conservan sus datos e historial.
## UX-028 — Período y destinatario para preparar una liquidación
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Alejandro, como Administrador; inicio de «Preparar liquidación».
Decisión acordada: «Preparar liquidación» pide primero el período y el tipo («Transp SERV» o «Chofer»), y para «Chofer» también se elige el conductor.
Comprobación esperada: Alejandro puede definir el período y el tipo de liquidación. Si selecciona Chofer, debe indicar el conductor correspondiente para continuar con esa liquidación; Transp SERV no requiere seleccionar un conductor individual. Completar este paso no emite una liquidación.
Relación con las reglas vigentes: se mantienen el acceso económico exclusivo del Administrador, la revisión antes de emitir y el tratamiento de versiones. La selección determina el alcance de datos que se revisarán y no modifica viajes ni importes. Q-001 sobre el mínimo mensual continúa pendiente y no se completa por suposición.
## UX-029 — Revisión de liquidación con viajes, importes y pendientes
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Alejandro, como Administrador; revisión de la liquidación seleccionada.
Decisión acordada: la revisión muestra los viajes a liquidar, sus importes y el total, además de los viajes sin resolver con acceso a su detalle.
Comprobación esperada: para el período, tipo y conductor seleccionados cuando corresponda, Alejandro puede revisar los servicios incluidos y sus importes, consultar el total e identificar por separado los viajes correspondientes que todavía no están resueltos. Puede abrir el detalle de estos últimos desde la revisión; hacerlo no cambia automáticamente su estado.
Relación con las reglas vigentes: se mantienen D-001 y D-009; la liquidación requiere revisión antes de emitir y no puede emitirse mientras queden viajes correspondientes sin resolver. Sólo los realizados se contabilizan como servicios ejecutados. La regla completa del mínimo mensual sigue pendiente de Q-001 y no se adopta un valor o cálculo por defecto.
## UX-030 — Confirmación de emisión con período, destinatario y total
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Alejandro, como Administrador; confirmación de «Emitir liquidación».
Decisión acordada: «Emitir liquidación» pide confirmación con período, destinatario y total, aclarando que las correcciones posteriores requieren una nueva versión.
Comprobación esperada: antes de emitir, Alejandro ve el período, el destinatario correspondiente —Transp SERV o el conductor seleccionado— y el total de la liquidación revisada, junto con la aclaración sobre versiones. Abrir o cancelar la confirmación no emite la liquidación; la emisión requiere la confirmación explícita y el cumplimiento de las validaciones vigentes.
Relación con las reglas vigentes: se conserva el bloqueo de D-009 si hay viajes correspondientes sin resolver. Las correcciones posteriores generan una versión del mismo período y conservan la anterior conforme a D-005. Se mantienen las restricciones que comienzan con la primera liquidación emitida según D-008 y D-019 y el acceso económico exclusivo del Administrador.
## UX-031 — Detalle de la versión emitida, descargas e historial
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Alejandro, como Administrador; detalle de una versión de liquidación emitida.
Decisión acordada: después de emitir se abre el detalle de esa versión con «Descargar Excel», «Descargar PDF» y acceso al historial de versiones.
Comprobación esperada: tras una emisión válida, Alejandro llega al detalle de la versión emitida y encuentra las dos descargas y el acceso al historial. Los archivos representan los datos de la versión consultada. Si existen versiones anteriores, puede acceder a ellas desde el historial, conservando los datos con los que fueron emitidas.
Relación con las reglas vigentes: se mantienen el acceso económico exclusivo del Administrador, los formatos de exportación acordados y la conservación de versiones de D-005. Consultar, navegar por el historial o descargar archivos no modifica ni reemplaza los datos de una versión emitida.
## UX-032 — Comparación de cambios antes de emitir una versión corregida
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Alejandro, como Administrador; «Preparar corrección» de una liquidación.
Decisión acordada: «Preparar corrección» muestra los cambios respecto de la versión anterior y la diferencia en el total antes de confirmar la nueva emisión.
Comprobación esperada: Alejandro puede identificar qué cambió respecto de la versión anterior y revisar la diferencia entre los totales antes de confirmar la emisión corregida. Consultar esa comparación no emite otra versión ni altera los datos conservados de la anterior.
Relación con las reglas vigentes: se mantiene D-005, con una versión corregida del mismo período y conservación de la anterior. Se respetan los permisos, motivos e historial exigidos para las correcciones. La nueva emisión conserva la confirmación de UX-030 y las validaciones vigentes; una vez emitida, su consulta, descargas e historial siguen UX-031.
## UX-033 — Búsqueda y filtros de actividad en los listados
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantallas: usuarios con los permisos correspondientes; listados de pacientes, choferes, vehículos y recorridos.
Decisión acordada: estos listados tienen búsqueda y filtros «Activos», «Inactivos» y «Todos», mostrando los activos al entrar.
Comprobación esperada: al acceder inicialmente a cada listado habilitado para su rol, el usuario encuentra seleccionado Activos. Puede buscar registros y cambiar a Inactivos o Todos, manteniendo las restricciones de consulta de su rol. Cambiar el filtro o realizar una búsqueda no modifica los registros.
Relación con las reglas vigentes: se conserva la baja como Inactivo y el historial de D-020. La presencia de un filtro no reactiva ni elimina registros, y no concede acceso a datos que el usuario no tenga permitido consultar.
## UX-034 — Ficha con datos, historial y acciones según permisos
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantallas: usuarios con los permisos correspondientes; fichas de pacientes, choferes, vehículos y recorridos.
Decisión acordada: cada registro abre una ficha con sus datos e historial y muestra «Editar» y «Dar de baja» según los permisos del usuario.
Comprobación esperada: al abrir un registro autorizado desde su listado, el usuario consulta sus datos y antecedentes permitidos. Las acciones de edición y baja se muestran únicamente cuando corresponden a sus permisos y al estado del registro. Consultar la ficha no modifica datos ni habilita operaciones restringidas.
Relación con las reglas vigentes: se mantienen los límites de consulta de información operativa y económica. La baja de registros con actividad conserva el historial y los deja Inactivos, según D-020; sus efectos siguen D-021 a D-023. La ficha no incorpora borrado definitivo ni permisos nuevos.
## UX-035 — Confirmación de baja con sus efectos
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantalla: usuarios autorizados para dar de baja; confirmación desde la ficha del registro.
Decisión acordada: «Dar de baja» pide confirmación mostrando el registro y sus efectos sobre los accesos y los viajes futuros, cuando corresponda.
Comprobación esperada: antes de confirmar, el usuario identifica el registro y puede revisar las consecuencias aplicables. Para un chofer se informa el retiro del acceso como Chofer y los viajes futuros que quedarán Sin asignar; para pacientes o recorridos se identifican los viajes futuros que quedarán señalados para revisión. Abrir o cancelar la confirmación no aplica la baja.
Relación con las reglas vigentes: se mantienen D-020 a D-023, los permisos y la conservación del historial. Si el chofer tiene otros roles activos, se conservan conforme a D-022. El resumen sólo muestra efectos ya definidos para ese tipo de registro, sin agregar cancelaciones automáticas ni asignaciones anticipadas de vehículos.
## UX-036 — Recorrido en una pantalla con pacientes y orden de paradas
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantalla: usuarios autorizados para crear o editar recorridos; formulario del recorrido.
Decisión acordada: crear o editar un recorrido se realiza en una sola pantalla, con sus datos y la selección de pacientes, permitiendo ordenar las paradas antes de guardar.
Comprobación esperada: el usuario autorizado puede revisar y completar los datos del recorrido, seleccionar los pacientes y establecer el orden de las paradas en el mismo formulario antes de guardar. La composición y el orden guardados corresponden a lo revisado y cumplen las validaciones vigentes.
Relación con las reglas vigentes: se conservan el máximo de cuatro pacientes por viaje y los permisos, incluida la reserva de valores comerciales para Alejandro. Los cambios sobre viajes ya programados siguen la elección de alcance y revisión de UX-025 a UX-027; la generación mensual conserva UX-023 y UX-024. El significado de los horarios continúa pendiente de Q-003. Esta decisión corresponde al bloque F-01.
## UX-037 — Alta y edición de pacientes, choferes y vehículos
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actores y pantallas: usuarios autorizados; formularios de pacientes, choferes y vehículos.
Decisión acordada: pacientes, choferes y vehículos se crean desde «Nuevo» en el listado y se editan desde su ficha, en una sola pantalla con «Guardar» y «Cancelar».
Comprobación esperada: el usuario autorizado inicia un alta desde el listado o una edición desde la ficha y completa el formulario en una sola pantalla. «Guardar» registra los datos cuando cumplen las validaciones; «Cancelar» no guarda los cambios introducidos. Las acciones se limitan a los permisos correspondientes.
Relación con las reglas vigentes: se utilizan los datos ya contemplados para cada tipo de registro, sin agregar campos obligatorios por esta decisión. La gestión de cuentas y roles se conserva bajo D-026 y D-027 y se detalla en F-04. Con UX-033 a UX-037 quedan acordadas las decisiones principales de F-01; la presentación y revisión visual de sus pantallas permanece pendiente.
## UX-038 — Tarifas vigentes, historial y nueva fecha de aplicación
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Alejandro, como Administrador, en la gestión de tarifas del bloque F-02.
Decisión: Alejandro verá las tarifas vigentes y su historial. La acción «Nueva tarifa» abrirá un formulario que solicite el importe y la fecha desde la que se aplica.
Comprobación esperada: la pantalla permite consultar los valores vigentes y sus antecedentes; al elegir «Nueva tarifa» se presentan los campos de importe y fecha de aplicación. Registrar una nueva tarifa conserva el historial y respeta la regla acordada de que un cambio posterior no modifica los importes de viajes anteriores.
Relación con lo ya definido: se mantiene el acceso económico exclusivo del Administrador. Esta definición de pantalla no resuelve el mínimo mensual de Q-001 ni modifica las reglas de corrección y versiones de liquidación. La revisión de los ajustes por viaje continúa como siguiente consulta; las pantallas todavía no están implementadas ni validadas visualmente.
## UX-039 — Ajuste del importe del viaje y de la remuneración del chofer
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Alejandro, como Administrador, en la revisión de ajustes económicos de un viaje del bloque F-02.
Decisión: Alejandro ajustará el importe del viaje y la remuneración del chofer en una sola pantalla. Verá los valores calculados y una comparación entre los importes anteriores y los nuevos antes de guardar.
Comprobación esperada: para un viaje seleccionado, la pantalla reúne los importes calculados de referencia y los importes finales que Alejandro puede ajustar; permite comparar los valores anteriores y los nuevos antes de guardar. Los ajustes se aplican al viaje seleccionado, sin extenderse automáticamente a otros viajes.
Relación con lo ya definido: se conservan el cálculo comercial de referencia según los kilómetros comerciales, la remuneración de referencia del 14% y la facultad del Administrador de ajustar los importes finales. Se respetan los permisos, motivos e historial ya acordados cuando correspondan. Si el ajuste afecta a una liquidación emitida, se conserva su versión anterior y se utiliza el flujo de corrección y nueva emisión; esta pantalla no modifica una versión emitida. El mínimo mensual de Q-001 permanece pendiente. Las decisiones principales de pantalla de F-02 quedan acordadas en UX-038 y UX-039, con revisión visual e implementación pendientes.
## UX-040 — Registro de gastos e intervenciones desde la ficha del vehículo
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: usuarios autorizados según los permisos funcionales acordados, desde la ficha de un vehículo; bloque F-03.
Decisión: desde la ficha del vehículo se registrará el gasto o intervención en una sola pantalla con fecha, categoría, descripción e importe. El registro guardado aparecerá en el historial de ese vehículo.
Comprobación esperada: al iniciar el registro desde una ficha se identifica el vehículo correspondiente y se reúnen los cuatro datos acordados en una pantalla. Al guardar, el gasto o intervención queda asociado a ese vehículo y puede consultarse en su historial. La misma carga alimenta el historial y los totales conforme al registro único ya definido, sin requerir un segundo ingreso de los mismos datos.
Relación con lo ya definido: se conservan las categorías, los datos adicionales cuando correspondan y los permisos incluidos en la especificación funcional. Las decisiones principales de pantalla de F-03 quedan acordadas; los reportes y filtros generales continúan en F-06. La revisión visual de las pantallas y la implementación siguen pendientes.
## UX-041 — Pantalla Usuarios para Alejandro
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Alejandro, como Administrador, en «Usuarios»; bloque F-04.
Decisión: Alejandro tendrá una pantalla «Usuarios» que muestre las cuentas, sus roles y su estado de acceso, con las acciones «Nuevo usuario», «Editar roles» y «Restablecer contraseña».
Comprobación esperada: el listado permite identificar las cuentas, consultar los roles de cada una y reconocer su estado de acceso. «Nuevo usuario» inicia la creación de una cuenta; «Editar roles» y «Restablecer contraseña» actúan sobre la cuenta seleccionada. Estas funciones están reservadas a Alejandro como Administrador según D-026.
Relación con lo ya definido: se mantienen la ausencia de registro público, la recuperación mediante contraseña temporal con cambio obligatorio de D-027 y la conservación de otros roles activos al quitar el rol Chofer de D-022. Se aprueban la organización de la pantalla y sus accesos; el detalle de los formularios y del recorrido de recuperación continúa en definición dentro de F-04. Las pantallas todavía no están implementadas ni validadas visualmente.
## UX-042 — Alta de usuarios con contraseña temporal
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Alejandro, como Administrador, en «Nuevo usuario»; bloque F-04.
Decisión: «Nuevo usuario» solicitará nombre, nombre de usuario y uno o varios roles. Al crear la cuenta, generará una contraseña temporal que el usuario deberá cambiar en su primer ingreso.
Comprobación esperada: Alejandro puede completar el nombre de la persona, el nombre de usuario que utilizará para ingresar y seleccionar uno o varios roles. Al confirmar el alta se genera la contraseña temporal. El primer ingreso exige establecer una nueva contraseña antes de acceder a las funciones habituales; no permite omitir el cambio y, una vez completado, la contraseña temporal deja de permitir el acceso.
Relación con lo ya definido: se mantienen la administración exclusiva de Alejandro, los roles múltiples y la ausencia de registro público. Esta decisión extiende al alta inicial el cambio obligatorio de contraseña que D-027 ya exigía para la recuperación de acceso. El requisito funcional se incorpora también a la sección de cuentas de la especificación consolidada y al criterio CA-26. El formulario todavía no está implementado ni validado visualmente.
## UX-043 — Edición de roles con confirmación de cambios de acceso
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Alejandro, como Administrador, en «Editar roles» desde «Usuarios»; bloque F-04.
Decisión: «Editar roles» mostrará los roles actuales de la cuenta y pedirá confirmar los accesos que se agregan o se quitan antes de guardar.
Comprobación esperada: al abrir la edición se identifican la cuenta seleccionada y sus roles actuales. Tras modificar la selección, se presenta el cambio de accesos resultante para que Alejandro lo confirme antes de guardar. El resumen considera los roles que permanecen activos, de modo que refleje los accesos efectivos que se agregan o se quitan. Cancelar la confirmación conserva los roles guardados previamente.
Relación con lo ya definido: la creación de cuentas y la asignación o retiro de roles siguen reservadas a Alejandro conforme a D-026. Se mantienen los permisos acordados y la conservación de otros roles activos según D-022. Esta decisión define la revisión y confirmación del cambio de roles; las pantallas todavía no están implementadas ni validadas visualmente.
## UX-044 — Restablecimiento de contraseña con confirmación y copia
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Alejandro, como Administrador, en «Restablecer contraseña» desde la cuenta seleccionada en «Usuarios»; bloque F-04.
Decisión: «Restablecer contraseña» pedirá confirmación mostrando el usuario. Tras confirmar, mostrará a Alejandro la contraseña temporal con un botón «Copiar».
Comprobación esperada: antes de restablecer se identifica claramente la cuenta y se solicita confirmación. Cancelar no restablece la contraseña. Al confirmar correctamente, Alejandro ve la contraseña temporal correspondiente a esa cuenta y puede copiarla mediante «Copiar» para entregarla al usuario.
Relación con lo ya definido: se conservan la gestión exclusiva de Alejandro según D-026 y el cambio obligatorio de la contraseña temporal en el siguiente ingreso según D-027. Después de ese cambio, la contraseña temporal deja de permitir el acceso. Esta decisión define el recorrido del Administrador; la pantalla de cambio obligatorio del usuario continúa como siguiente consulta. Las pantallas todavía no están implementadas ni validadas visualmente.
## UX-045 — Pantalla de cambio obligatorio de contraseña y acceso al inicio
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: usuario que ingresa con una contraseña temporal, tanto después del alta como de un restablecimiento; bloque F-04.
Decisión: el cambio obligatorio tendrá los campos «Nueva contraseña» y «Repetir contraseña» y la acción «Guardar y continuar». Después del cambio correcto se abrirá el inicio correspondiente al usuario.
Comprobación esperada: al ingresar con una contraseña temporal se presenta la pantalla de cambio obligatorio. «Guardar y continuar» comprueba que ambas entradas coincidan y guarda la nueva contraseña. Sólo después de guardar correctamente se abre el inicio correspondiente según UX-001 a UX-004. Si los valores no coinciden o falla el guardado, el cambio permanece pendiente y no se habilitan las funciones habituales.
Relación con lo ya definido: se conservan la obligación de cambio y la invalidación posterior de la contraseña temporal establecidas en D-027 y UX-042. Las decisiones principales de pantalla de F-04 quedan acordadas en UX-041 a UX-045, junto con los inicios ya definidos; la revisión visual y la implementación siguen pendientes.
## UX-046 — Pantalla de revisión de diferencias de kilometraje
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Walter o Alejandro, en la revisión de diferencias de kilometraje al abrir un turno; bloque F-05.
Decisión: Walter y Alejandro verán en una sola pantalla el vehículo, el último cierre, la lectura informada por el chofer y la diferencia, con acceso al historial de lecturas.
Comprobación esperada: la pantalla identifica el vehículo y presenta la lectura del último cierre, la lectura informada por el chofer y la diferencia entre ambas. Desde allí se puede consultar el historial de lecturas del mismo vehículo para revisar los registros involucrados. Abrir la pantalla o consultar el historial no modifica las lecturas ni resuelve automáticamente la revisión.
Relación con lo ya definido: se conservan D-011, que permite abrir el turno con una diferencia positiva pendiente de revisión, y D-012, que bloquea la apertura ante una lectura inferior hasta corregir el registro incorrecto, preservando la lectura real del vehículo. Esta decisión define la información de la pantalla; las acciones para resolver la revisión continúan en definición. Las pantallas todavía no están implementadas ni validadas visualmente.
## UX-047 — Resolución de diferencias positivas con motivo obligatorio
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Walter o Alejandro, en la revisión de una lectura de apertura superior al último cierre del mismo vehículo; bloque F-05.
Decisión: si la lectura supera el último cierre, Walter o Alejandro podrán «Confirmar diferencia» o «Corregir registro», indicando un motivo en ambos casos.
Comprobación esperada: ambas acciones exigen un motivo. «Confirmar diferencia» permite dar por válida la diferencia, conserva ambas lecturas y deja la revisión resuelta, registrando quién la realizó, el motivo y el resultado. «Corregir registro» permite corregir la lectura registrada incorrectamente, conservando el valor anterior, el nuevo, el motivo y el historial. Ninguna de las dos acciones puede completarse sin motivo.
Relación con lo ya definido: se precisa la resolución de la revisión pendiente de D-011. Esta opción de confirmación corresponde a diferencias positivas; D-012 mantiene bloqueada una apertura con lectura real inferior hasta corregir el registro incorrecto, sin reemplazar la lectura real por una ficticia. El requisito funcional se incorpora a la sección de turnos y odómetro de la especificación consolidada y al criterio CA-27. El formulario de corrección continúa como siguiente consulta; las pantallas todavía no están implementadas ni validadas visualmente.
## UX-048 — Corrección de lecturas con comparación antes de confirmar
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Walter o Alejandro, en «Corregir registro» para una lectura de odómetro; bloque F-05.
Decisión: «Corregir registro» mostrará el vehículo y el registro elegido, solicitará la lectura correcta y el motivo, y comparará la lectura anterior y la nueva antes de confirmar.
Comprobación esperada: el formulario identifica el vehículo y el registro que se va a corregir. Permite ingresar la lectura correcta y el motivo obligatorio y muestra la lectura anterior junto a la propuesta antes de confirmar. Sólo al confirmar se guarda la corrección, conservando los valores anterior y nuevo, el motivo y el historial. Cancelar no modifica la lectura guardada.
Relación con lo ya definido: se mantienen los permisos de Walter y Alejandro, la revisión del historial de UX-046 y las opciones para diferencias positivas de UX-047. La corrección preserva la lectura real del vehículo y respeta D-011 y D-012; la apertura con lectura inferior continúa bloqueada hasta resolver la inconsistencia. Las decisiones principales de la revisión y corrección de lecturas quedan acordadas; las pantallas todavía no están implementadas ni validadas visualmente.
## UX-049 — Listado de turnos abiertos y cierre por olvido
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Walter o Alejandro, en el listado de turnos abiertos y su cierre por olvido; bloque F-05.
Decisión: Walter y Alejandro verán los turnos abiertos con vehículo, chofer y fecha de apertura. Desde el turno seleccionado podrán cerrarlo por olvido, ingresando el kilometraje final y el motivo antes de confirmar.
Comprobación esperada: el listado permite identificar cada turno abierto y la acción «Cerrar turno por olvido» solicita el kilometraje final y el motivo. Antes de confirmar se conserva el resumen de vehículo, lectura inicial y kilómetros del turno de UX-012. Un viaje en curso impide completar el cierre y se muestra con acceso «Ir al viaje», según UX-013. Cancelar mantiene el turno abierto.
Relación con lo ya definido: se respeta D-010, conservando el chofer original e identificando a quien efectúa el cierre. El bloqueo de D-013 se aplica también a Walter y Alejandro. Esta pantalla no modifica por sí sola los estados de los viajes ni omite los controles del kilometraje. Las pantallas todavía no están implementadas ni validadas visualmente.
## UX-050 — Corrección del estado del viaje con aviso de liquidaciones afectadas
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: usuario autorizado según las reglas de corrección, desde el detalle del viaje; bloque F-05.
Decisión: «Corregir estado» se abrirá desde el detalle del viaje, mostrará el estado actual, solicitará el nuevo estado y el motivo, y avisará si hay liquidaciones emitidas afectadas antes de confirmar.
Comprobación esperada: quien tenga permiso accede al formulario desde el viaje, consulta el estado actual e indica el nuevo estado y el motivo obligatorio. Antes de confirmar se advierte si la corrección afecta a liquidaciones emitidas. Confirmar guarda la corrección con su historial; cancelar conserva el estado anterior. El aviso no sustituye el procedimiento de corrección y nueva emisión de liquidaciones.
Relación con lo ya definido: se mantienen D-004, D-007 y D-008: Walter y Alejandro pueden corregir antes de que se emita cualquiera de las dos liquidaciones; desde la primera emisión, sólo Alejandro. Toda corrección de estado exige motivo e historial. Las liquidaciones emitidas afectadas requieren versiones corregidas que conserven las anteriores, conforme a D-005 y UX-032. Las pantallas todavía no están implementadas ni validadas visualmente.
## UX-051 — Corrección de kilómetros comerciales y chofer con comparación previa
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: usuario autorizado según las reglas vigentes, desde el detalle del viaje; bloque F-05.
Decisión: desde el viaje se corregirán los kilómetros comerciales y el chofer que lo realizó, comparando los valores anteriores y los nuevos y avisando qué liquidaciones emitidas quedan afectadas antes de confirmar.
Comprobación esperada: desde el detalle se accede a la corrección de los kilómetros comerciales o del chofer que realizó el viaje, según los permisos del usuario. La revisión muestra los valores anteriores y los propuestos e identifica las liquidaciones emitidas afectadas antes de confirmar. Se solicita el motivo cuando lo exigen las reglas vigentes. Confirmar guarda los cambios con el historial correspondiente; cancelar conserva los valores anteriores.
Relación con lo ya definido: D-019 reserva estas correcciones a Alejandro desde que se emite cualquiera de las dos liquidaciones y exige motivo e historial. Las liquidaciones emitidas afectadas se corrigen mediante nuevas versiones que conservan las anteriores, conforme a D-005 y UX-032. Se mantiene la separación entre kilómetros comerciales y lecturas del odómetro. Las pantallas todavía no están implementadas ni validadas visualmente.
## UX-052 — Novedades del viaje con texto libre e historial
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Chofer, desde el detalle de uno de sus viajes; bloque F-05.
Decisión: el chofer podrá registrar una novedad desde el detalle del viaje mediante texto libre. La novedad quedará en el historial del viaje con fecha, hora y autor.
Comprobación esperada: «Registrar novedad» permite escribir el texto desde el detalle de un viaje al que el chofer tiene acceso. Al guardar, la novedad queda asociada a ese viaje y puede consultarse en su historial con fecha, hora y autor registrados por el sistema. La consulta del historial respeta los permisos de acceso al viaje.
Relación con lo ya definido: se concreta la función de informar y consultar novedades incluida en el alcance del Chofer. Registrar la novedad no sustituye las operaciones de cambio de estado, registro de pasajeros ni corrección de datos económicos. Las decisiones principales de pantalla de F-05 quedan acordadas en UX-046 a UX-052; la revisión visual y la implementación siguen pendientes.
## UX-053 — Reportes con filtros, revisión y exportación
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: usuarios autorizados según el tipo de información, en «Reportes»; bloque F-06.
Decisión: «Reportes» permitirá elegir el tipo de reporte y el período, aplicar filtros y revisar los resultados y totales antes de descargar en Excel o PDF.
Comprobación esperada: la pantalla ofrece los tipos de reporte permitidos al usuario y los filtros correspondientes a la consulta, como chofer, vehículo o categoría. Tras aplicar la selección, presenta los resultados y los totales propios del reporte para revisión. Las descargas en Excel y PDF respetan el tipo, el período y los filtros revisados y reflejan los resultados y totales correspondientes.
Relación con lo ya definido: se conservan las consultas básicas incluidas en el alcance, los permisos por rol, la separación por tipo de combustible y unidad y los subtotales de verificado y pendiente. Los datos comerciales, remuneraciones y liquidaciones continúan reservados al Administrador. El flujo específico de liquidaciones conserva la emisión y las versiones acordadas. Las decisiones principales de pantalla de F-06 quedan acordadas; la presentación concreta de los reportes y pantallas requiere revisión visual y la implementación sigue pendiente.
## UX-054 — Resumen de Alejandro con viajes y pendientes por tipo
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Alejandro, como Administrador, en su resumen de inicio; bloque F-07.
Decisión: Alejandro verá los viajes de hoy por estado y los pendientes de asignación, revisión, kilometraje y comprobantes, con cantidad y acceso a cada listado.
Comprobación esperada: el resumen presenta las cantidades de viajes del día por estado y los grupos «Sin asignar», «Viajes a revisar», «Diferencias de kilometraje» y «Comprobantes». Cada cantidad permite acceder al listado correspondiente. Los comprobantes pendientes comprenden los que requieren adjuntar la imagen o verificar la carga, según sus condiciones ya definidas. Los listados y las acciones disponibles respetan los permisos vigentes.
Relación con lo ya definido: se conserva el acceso directo a liquidaciones de UX-003. El resumen utiliza estados y pendientes existentes; los grupos no son necesariamente excluyentes, por lo que un viaje puede estar sin asignar y pendiente de revisión. Las acciones de resolución mantienen sus reglas propias. Las pantallas todavía no están implementadas ni validadas visualmente.
## UX-055 — Resolución explícita de viajes pendientes de revisión
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: Walter o Alejandro, en los viajes pendientes de revisión; bloque F-07.
Decisión: cada viaje pendiente de revisión mostrará el motivo del aviso. Walter o Alejandro podrán marcarlo como «Revisado» tras corregirlo o confirmar que no necesita cambios.
Comprobación esperada: el listado y el detalle permiten conocer por qué el viaje requiere revisión. Walter o Alejandro pueden resolver la revisión después de aplicar las correcciones permitidas o de confirmar que el viaje puede conservarse sin cambios. Se registra quién realizó la revisión y su resultado y se conserva el historial del aviso. La marca «Revisado» resuelve la revisión tratada; por sí sola no cambia el estado de ejecución, no asigna chofer y no resuelve otros pendientes.
Relación con lo ya definido: se precisa la atención de los avisos de D-023, conservando los permisos, motivos e historial requeridos para cualquier corrección que se efectúe. El requisito funcional se incorpora también a la especificación consolidada y al criterio CA-28. Las decisiones principales de pantalla de F-07 quedan acordadas en UX-054 y UX-055; la revisión visual y la implementación siguen pendientes.
## UX-056 — Menú único según los roles activos
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: todos los usuarios, en la navegación principal; bloque F-08.
Decisión: cada usuario tendrá un único menú con las secciones permitidas por sus roles activos y acceso visible a «Mi jornada» si tiene el rol Chofer.
Comprobación esperada: el menú reúne las secciones habilitadas por los roles activos de la cuenta. Un usuario con varios roles accede a sus opciones desde ese mismo menú. «Mi jornada» aparece como acceso visible para quienes tengan el rol Chofer, incluido Walter cuando conserva ese rol. La navegación respeta los permisos vigentes.
Relación con lo ya definido: se conservan los inicios acordados en UX-001 a UX-004 y las reglas de acceso por roles, incluida D-022. Retirar el rol Chofer elimina el acceso por ese rol y conserva las opciones de los demás roles activos. La disposición visual del menú en computadora y celular se presentará para revisión; las pantallas todavía no están implementadas ni validadas visualmente.
## UX-057 — Conservación del formulario y recuperación ante errores
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: todos los usuarios, en formularios y operaciones de guardado; bloque F-08.
Decisión: si falta un dato o falla el guardado, la pantalla conservará lo ingresado, indicará claramente el problema y permitirá corregir o reintentar.
Comprobación esperada: un dato faltante o inválido se señala junto al campo correspondiente y los demás valores ingresados se mantienen. Ante un fallo de guardado o conexión, el formulario permanece abierto con sus datos y muestra un aviso claro para reintentar. La pantalla sólo informa que el guardado se completó cuando su resultado está confirmado.
Relación con lo ya definido: se conservan las validaciones de negocio y los permisos acordados. La conservación se refiere a los datos del formulario abierto durante el uso online; no incorpora borradores persistentes al cerrar o recargar la aplicación ni funcionamiento offline. Las pantallas todavía no están implementadas ni validadas visualmente.
## UX-058 — Confirmación al salir de formularios con cambios sin guardar
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: todos los usuarios, al salir de un formulario con cambios pendientes; bloque F-08.
Decisión: al salir de un formulario con cambios sin guardar, se pedirá confirmación con «Seguir editando» y «Salir sin guardar».
Comprobación esperada: al intentar navegar fuera de un formulario con cambios locales sin guardar, aparece la confirmación. «Seguir editando» mantiene el formulario abierto y conserva los datos ingresados. «Salir sin guardar» permite continuar la salida y descarta únicamente los cambios pendientes. La confirmación no se requiere por cambios que ya se guardaron.
Relación con lo ya definido: se mantienen los guardados explícitos y automáticos acordados y la conservación del formulario ante errores de UX-057. Salir no revierte operaciones completadas ni altera datos ya guardados. Las pantallas todavía no están implementadas ni validadas visualmente.
## UX-059 — Listados vacíos con explicación y acciones pertinentes
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Actor y pantalla: todos los usuarios, en los listados que puedan consultar; bloque F-08.
Decisión: los listados vacíos explicarán si no hay registros o si los filtros no encontraron resultados, y ofrecerán «Nuevo» o «Limpiar filtros» según corresponda y los permisos del usuario.
Comprobación esperada: un listado sin datos muestra un mensaje que distingue la ausencia de registros de la falta de coincidencias con los filtros. «Nuevo» aparece cuando el listado permite crear registros y el usuario tiene ese permiso. «Limpiar filtros» se ofrece cuando corresponde ajustar la consulta. Los mensajes y acciones respetan la información y operaciones permitidas al usuario.
Relación con lo ya definido: se conservan las búsquedas, filtros y permisos acordados. Un fallo de consulta se presenta como error y no como ausencia de datos. Las decisiones principales de los ocho bloques de flujos quedan acordadas en UX-001 a UX-059; siguen pendientes la presentación y aprobación del diseño visual de las pantallas, su adaptación a celular y su revisión de accesibilidad. Las pantallas todavía no están implementadas ni validadas con usuarios.
## UX-060 — Referencias gráficas institucionales y extracción visual
Estado: referencias aportadas por Alejo el 15 de noviembre de 2026 para extraer colores y tipografías. La base visual derivada fue aprobada en UX-061; la identificación exacta de las fuentes de las imágenes continúa sin confirmarse.
Fuentes: logo «639567980_18003549455849719_4978419676389056175_n.jpg»; publicación del natatorio «codex-clipboard-1df4e389-2dc0-4453-afd6-4aa1d5ad962f.png»; publicación del aniversario «codex-clipboard-386dccde-3d24-4443-90b9-35e17a210902.png». Se conservan copias locales sin modificar para continuar el diseño.
Observación: el logo combina una sigla con tipografía serif, un corazón rojo, un arcoíris y nubes azules. Las publicaciones utilizan principalmente bordó y rosa, fondos blancos o crema y acentos celestes. Los títulos son de estilo sans serif geométrico y peso alto; aparecen también recursos tipográficos decorativos en la pieza del aniversario.
Paleta extraída: muestras de zonas gráficas y tipográficas de las publicaciones, evitando tomar colores de las fotografías de personas. Los HEX son aproximaciones a las imágenes recibidas, sujetas a compresión y captura; no constituyen códigos oficiales confirmados por un manual de marca.
Bordó: #7B1F36. Rosa oscuro: #A54358. Rosa suave: #E7C4CB. Bordó profundo: #501322.
Crema: #FEFDF8. Blanco: #FFFFFF. Celeste: #9ACCEE. Grafito: #25231F.
Tipografía propuesta: Montserrat como aproximación visual a los titulares de las publicaciones, con pesos 700–800 para títulos, 600 para controles y 400–500 para texto. No se ha identificado de forma concluyente la fuente exacta de las imágenes; tampoco la tipografía serif del logo ni las decorativas. Se propone conservar el archivo original del logo.
Referencia de la familia tipográfica propuesta: Montserrat — Google Fonts.
Aplicación de referencia: bordó para acciones principales, fondos blancos o crema, grafito para texto, rosa suave en superficies de apoyo y celeste como acento. El logo conserva su identidad multicolor. La base de bordó, fondos claros, Montserrat y logo original está aprobada en UX-061; la aplicación concreta en cada pantalla se presenta para revisión.
Comprobación del análisis: muestra visual «irid-base-visual-propuesta.png» preparada con colores medidos y ejemplos reales de Montserrat en los pesos propuestos. Contrastes calculados: blanco sobre bordó 10,04:1; blanco sobre rosa oscuro 5,93:1; grafito sobre crema 15,40:1; grafito sobre celeste 9,15:1. Estas mediciones corresponden a combinaciones de color y no sustituyen la revisión de accesibilidad de las pantallas.
## Continuidad: los ocho bloques de flujos permanecen acordados y la base visual está aprobada en UX-061. Se presentan las pantallas para revisión; la implementación del sistema no se ha iniciado. Las tres preguntas funcionales pendientes de IRID se mantienen.
## UX-061 — Base visual aprobada para las pantallas
Estado: confirmado por Alejo el 15 de noviembre de 2026.
Decisión: tomar como base para las pantallas el bordó y los fondos claros de las publicaciones de IRID, con Montserrat y el logo original.
Aplicación: utilizar las referencias de UX-060 como punto de partida, con bordó como color principal, superficies blancas o crema y Montserrat como familia de la interfaz. Conservar el logo original aportado. La adopción de Montserrat es una decisión de diseño para el sistema y no una identificación concluyente de las fuentes de las imágenes.
Comprobación esperada: las propuestas de pantalla emplean la base visual aprobada y conservan la identidad del logo. La composición, jerarquía y adaptación de cada pantalla se presentan para revisión antes de implementar el sistema.
Continuidad: se preparó la primera maqueta visual de «Mi jornada», en los estados sin turno y con turno abierto, para revisar su organización. La aprobación de la base visual no implica que esa composición ya esté aprobada ni que el sistema esté implementado.
## UX-062 — Organización de «Mi jornada» aprobada
Decisión confirmada por Alejo: «Mi jornada» tendrá el turno arriba, el aviso de comprobantes debajo y los viajes asignados de hoy ordenados por horario. Se conserva «Abrir turno» cuando no haya turno abierto y los accesos a combustible y cierre cuando lo haya. La aprobación corresponde a la organización visual y no modifica las reglas operativas.
## UX-063 — Maqueta interactiva integral autorizada
Alejo solicita construir directamente una maqueta completa para mostrar al cliente y validar la especificación y los flujos. Incluirá inicio de sesión y accesos rápidos de demostración para Alejandro, Walter, Secretaria y Chofer, navegación por permisos, todas las secciones acordadas, datos ficticios y acciones simuladas. Usará bordó, fondos claros, Montserrat y el logo original. Los cambios de la demo podrán conservarse localmente y reiniciarse. Se autoriza la ejecución de este prototipo; no se autoriza una implementación productiva, despliegue ni uso de datos reales. Las preguntas Q-001, Q-002 y Q-003 siguen pendientes y deberán quedar visibles.
## Mapa de cierre de flujos — 15 de noviembre de 2026
A pedido de Alejo, se organiza el cierre del alcance actual en ocho bloques de flujos. Varias decisiones UX forman parte de un mismo flujo. Este mapa mantiene el estado de las definiciones y no constituye nuevas decisiones de producto aprobadas. La revisión visual de las pantallas sigue pendiente.
F-01 — Altas y edición de registros y armado de recorridos. Decisiones principales acordadas en UX-033 a UX-037: listados, fichas, bajas, formulario de recorridos y altas/ediciones de pacientes, choferes y vehículos. Incluido en la maqueta interactiva integral entregada para revisión. Se realizó verificación técnica de la demo; la validación con IRID y la implementación productiva permanecen pendientes.
F-02 — Tarifas, vigencias y ajustes de remuneración. Decisiones principales de pantalla acordadas en UX-038 y UX-039: tarifas vigentes, historial, alta de nuevos valores con importe y fecha de aplicación, y ajuste económico de un viaje en una pantalla con comparación de importes anteriores y nuevos antes de guardar. El mínimo mensual continúa condicionado a Q-001. Incluido en la maqueta interactiva integral entregada para revisión. Se realizó verificación técnica de la demo; la validación con IRID y la implementación productiva permanecen pendientes.
F-03 — Gastos e intervenciones de vehículos. Decisiones principales de pantalla acordadas en UX-040: registro desde la ficha del vehículo en una sola pantalla con fecha, categoría, descripción e importe, y consulta posterior en su historial. Se conservan las categorías y el registro único ya incluidos en el alcance. Los reportes y filtros generales se tratarán en F-06. Incluido en la maqueta interactiva integral entregada para revisión. Se realizó verificación técnica de la demo; la validación con IRID y la implementación productiva permanecen pendientes.
F-04 — Usuarios, roles, ingreso y recuperación de acceso. Decisiones principales de pantalla acordadas en UX-041 a UX-045: «Usuarios», alta con contraseña temporal, edición de roles con confirmación de accesos, restablecimiento con confirmación y «Copiar», y cambio obligatorio con acceso al inicio correspondiente. Incluido en la maqueta interactiva integral entregada para revisión. Se realizó verificación técnica de la demo; la validación con IRID y la implementación productiva permanecen pendientes.
F-05 — Correcciones y novedades operativas. Decisiones principales de pantalla acordadas en UX-046 a UX-052: revisión y corrección de lecturas, turnos abiertos y cierre por olvido, correcciones del estado, kilómetros comerciales y chofer de los viajes, y novedades con fecha, hora y autor en el historial. Se conservan los permisos y las reglas de liquidaciones emitidas. Incluido en la maqueta interactiva integral entregada para revisión. Se realizó verificación técnica de la demo; la validación con IRID y la implementación productiva permanecen pendientes.
F-06 — Consultas, reportes y exportaciones generales. Decisiones principales de pantalla acordadas en UX-053: «Reportes» con selección de tipo y período, filtros, revisión de resultados y totales y descarga en Excel o PDF. Se conservan los reportes y permisos incluidos en el alcance y el flujo de liquidaciones ya definido. Incluido en la maqueta interactiva integral entregada para revisión. Se realizó verificación técnica de la demo; la validación con IRID y la implementación productiva permanecen pendientes.
F-07 — Resúmenes y seguimiento de pendientes. Decisiones principales de pantalla acordadas en UX-054 y UX-055: resumen de Alejandro con viajes del día por estado, grupos de pendientes con cantidad y acceso, motivo del aviso y resolución explícita de revisiones por Walter o Alejandro. Se conservan los permisos y el historial. Incluido en la maqueta interactiva integral entregada para revisión. Se realizó verificación técnica de la demo; la validación con IRID y la implementación productiva permanecen pendientes.
F-08 — Navegación y estados compartidos. Decisiones principales acordadas en UX-056 a UX-059: menú único por roles activos con acceso a «Mi jornada», conservación de datos y recuperación ante errores, confirmación al salir con cambios pendientes y mensajes y acciones en listados vacíos. Incluido en la maqueta interactiva integral entregada para revisión. Se realizó verificación técnica de la demo; la validación con IRID y la implementación productiva permanecen pendientes.
## Los ocho bloques y los flujos operativos previos están representados en la maqueta integral solicitada en UX-063. La base visual está aprobada en UX-061 y la organización de «Mi jornada» en UX-062. El prototipo se entrega para validar con IRID antes del plan productivo. Q-001, Q-002 y Q-003 permanecen abiertas.
## Maqueta integral — Entregada para validar con IRID
Entrega del 15/11/2026: «IRID-maqueta-interactiva.html» es un prototipo autónomo con ingreso y accesos rápidos para Alejandro, Walter, Secretaria y Chofer; incluye jornada, agenda, viajes y pasajeros, turnos, odómetros, maestros, combustible, gastos, tarifas, liquidaciones versionadas, reportes y cuentas. Los datos y las credenciales son ficticios. Las acciones y permisos son simulados, con persistencia local y reinicio de la demo. Usa Montserrat, bordó, fondos claros y el logo original.
Se entregan en el chat «IRID-demo-completa.zip», «IRID-guia-de-la-demo.md», «IRID-verificacion.md», capturas de referencia y un comprobante ficticio. El ZIP incluye el HTML, la guía, la verificación, la imagen de prueba y la licencia de la tipografía. El archivo no requiere instalación ni conexión para funcionar. Candidato HTML SHA-256: 6db9b38525cf59264669066a4a4e227fc662b58adc7d36dde6d854b04d2671dc.
Verificación técnica: 22 pruebas automáticas aprobadas; revisión independiente de reglas y permisos simulados; pruebas de navegador con los cuatro perfiles, formularios, bloqueos, comprobantes, generación mensual, emisión/corrección, exportaciones y recuperación con contraseña temporal. Se inspeccionaron pantallas de escritorio y celular; «Mi jornada» se comprobó sin desbordamiento a 390 y 320 píxeles. Se corrigieron los hallazgos de sincronización de bajas entre pestañas, bloqueo por lectura negativa pendiente y confirmación de liquidación ante cambios posteriores.
Límites: la validación con el cliente no está realizada. No es un sistema productivo ni una garantía de seguridad, concurrencia o accesibilidad completa. No se configuraron servidor, base productiva, almacenamiento privado, respaldos ni despliegue. Q-001 sigue impidiendo definir el mínimo mensual; Q-002 el volumen real; Q-003 el significado de horarios. La próxima etapa es recorrer la demo con IRID, registrar ajustes y completar esas respuestas antes del plan de implementación.
