# IRID · contrato de la maqueta integral

Registro de continuidad al entregar: reference/ux-delivered.md (incluye UX-062, UX-063, entrega y verificación). reference/ux.md conserva la captura inicial para trazabilidad.

## Autoridad y alcance
El usuario autorizó el 15/11/2026 construir una maqueta interactiva completa para validar con el cliente, usando datos ficticios. No es implementación productiva, ni define un esquema físico. Fuentes: reference/spec.md y reference/ux.md (Google Docs vigente). La última decisión UX-062 ordena Mi jornada: turno, aviso de comprobantes, viajes por horario. Base aprobada: bordó #7B1F36, fondos #FEFDF8/blanco, Montserrat, logo original. Q-001 mínimo mensual, Q-002 volumen diario y Q-003 interpretación de horarios siguen pendientes. No inventar respuestas.

Prototipo autónomo HTML, sin servidor ni servicios externos, fuentes y logo incrustados. Persistencia local sólo de datos de ejemplo. No afirmar seguridad, respaldo, autenticación ni liquidación real. Toda pantalla usa español argentino claro; documentos/evidencia profesionales. Todos los accesos rápidos son simulación visible.

## Archivos y responsabilidades exclusivas
- domain.js + tests/domain.test.js: agente dominio. ESM sin DOM/imports externos.
- operations.js: agente operación (Mi jornada, viaje, agenda, turnos, lecturas, revisiones).
- management.js: agente gestión (pacientes, choferes, vehículos, recorridos, combustible, gastos, usuarios).
- finance.js: agente finanzas (tarifas, ajustes, liquidaciones, reportes y exportadores XLSX/PDF).
- main.js, styles.css, template.html, build.py, contract.md, odd/tasks/*: orquestador.
No editar archivos ajenos. No estás solo en el código: acomodá cambios ajenos y no los reviertas. Consultá al orquestador si un contrato no alcanza; no cambies interfaces unilateralmente.

## Módulos UI
Cada archivo exporta `render(ctx, screen, params = {})` => HTML string y `handle(ctx, action, el, event)` async => boolean. No imports. Funciones privadas libres dentro de cada archivo. Acciones prefijadas op:, mg:, fin:. Root delega clicks `[data-action]`, submits `form[data-action]` y cambios `[data-change]`; `el` siempre es el elemento con ese atributo. Evitar onclick inline. Botones type=button salvo submit. Todos los textos/datos se escapan.

Pantallas: operations = jornada, viaje {id}, agenda {date?,view?,driverId?,status?,filter?}, turnos, kilometraje, revisiones. management = pacientes, choferes, vehiculos, recorridos, ficha {collection,id}, combustible {filter?}, carga {id}, gastos, usuarios. finance = tarifas, liquidaciones, liquidacion {id}, reportes. fin:adjust con data-id abre ajuste de un viaje desde cualquier módulo.

ctx expone:
- state, user, driver (o null), params, screen. Estos se recalculan tras cada render. En callbacks usar ctx.getState() si hubo mutaciones previas.
- getState(): estado vigente; can(capability): boolean; h(value): HTML escape; money(number): ARS; date(iso): dd/mm/yyyy; lookup(collection,id,field='name'): texto; badge(text,tone?): HTML.
- go(screen,params={}): navegación con control de cambios sin guardar; render(): refresca fondo conservando modal.
- run(type,payload={}): mutación Domain.apply, guarda persistencia y refresca; devuelve result; LANZA Error si inválido (muestra error en formulario al capturarlo raíz). No ignorar errores. ctx.run NO cierra modal.
- preview(type,payload={}): Domain.preview, sin mutaciones.
- dialog({title,body,submitLabel='Guardar',onSubmit}): modal con form y footer Cancelar/submit. onSubmit(values,form) recibe objeto strings y elemento form; puede ser async. Si devuelve false conserva modal; si abre otro modal no se cierra el nuevo. Sin onSubmit: modal informativo sólo Cerrar. body puede incluir campos y botones data-action. root maneja dirty, Escape y foco.
- confirm(title,body,onConfirm,label='Confirmar'): misma modal y callback, sin campos (si se precisan campos usar dialog).
- toast(text,type='success'); download(filename,blobOrString,mime); exportData(title,columns,rows,format): root conecta al exportador finanzas.
- field(label,name,value='',type='text',attrs=''): label+input wrapper (attrs provistos por código, no por datos).
- select(label,name,options,value='',attrs=''): options array {id,name}; label+select.
- empty(title,text,actionHTML=''): estado vacío.
- button(label,action,attrs='',kind='secondary'): `<button type=button class="btn KIND" data-action="..." ATTRS>`.
- form(form): Object.fromEntries(new FormData(form)); para arrays usar new FormData(form).getAll(name).

HTML/CSS disponibles: page-head (eyebrow,h1,p, actions), panel, panel-head, stack, grid-2, grid-3, grid-4, metrics, metric, toolbar, form-grid, field, field-full, hint, notice [warning|success|danger|info], btn [primary|secondary|ghost|danger|small], actions, table-wrap/table, badge, list-row, trip-card, section-label, empty-state, key-value, history, receipt-preview. Se pueden agregar estilos propios mínimos en styles? NO: comunicar root clases nuevas o devolver style acotado si imprescindible. Diseño con jerarquía sobria, iconos texto o SVG inline sin dependencias. Controles min44px.

## Domain API compartida (pura)
`export function seed()` estado nuevo. `export function can(state,userId,capability)`; `export function apply(state,userId,type,payload={})` => `{state:newState,result}` sin mutar entrada, Error con message y opcional conflictId. `export function preview(state,userId,type,payload={})` => resultado sinmutar. `export function login(state,username,password)` => userId o Error. `export function home(state,userId)` => screen.

Capacidades: admin (admin), plan (admin/encargado), drive (chofer), fuelRead (admin/encargado/secretaria/chofer, chofer propio), fuelVerify (admin/secretaria), fleetRead (admin/encargado/secretaria), expense (admin/encargado/secretaria), masters (admin/encargado; secretaria flota/choferes lectura), commercial (admin), users (admin), reports (todos con alcance), odometer (admin/encargado).
Estado: schema:1; today:'2026-11-16'; users,drivers,patients,vehicles,routes,trips,shifts,fuel,expenses,tariffs,settlements,readingReviews,audit arrays; seq:number. Fechas ISO; at ISO timestamp ficticio o real para auditoría. historia uniforme array {id,at,actorId,text,reason?,before?,after?}. Strings estados en español según abajo. Seed id fijo u-admin/Alejandro admin; u-walter/Walter encargado+chofer d-walter; u-secretary/Secretaria secretaria; u-driver/Diego López chofer d-diego. password ejemplo `demo123`, cuentas de demostración. Otros datos ficticios.

users: {id,name,username,roles:['admin'|'encargado'|'secretaria'|'chofer'],active:boolean,password:string,mustChangePassword:boolean,history:[]}. password es texto sólo ficticio y visible como DEMO, no seguridad real.
drivers: {id,userId:null|id,name,phone:'',active,history:[]}.
patients: {id,name,address,phone:'',active,history:[]}.
vehicles: {id,alias,plate,capacity:4,active,lastCloseKm:number,history:[]}.
routes: {id,name,group:'LMV'|'MJS',days:[1,3,5] o [2,4,6],entryTime,exitTime,destination,patientIds:[] ordenados,baseKm,basePrice,active,history:[]}.
trips: {id,date,time,type:'Entrada'|'Salida',routeId,driverId:null|id,status:'Programado'|'En curso'|'Realizado'|'No realizado',commercialKm,baseKm,basePrice,amount,driverPay,passengers:[{patientId,status:null|'Recogido'|'No viajó'}],shiftId:null|id,vehicleId:null|id,nonperformanceReason:'',reviewReasons:[{id,reason,resolved:false,authorId?,at?}],notes:[{text,authorId,at}],history:[]}.
shifts: {id,driverId,vehicleId,openedAt,closedAt:null|timestamp,startKm,endKm:null|number,closedBy:null|userId,closeReason:'',history:[]}.
fuel: {id,date,time,vehicleId,driverId,userId,shiftId:null|id,type:'GNC'|'Nafta'|'Gasoil',quantity,amount,odometer,receipt:null|dataURI,verified:false,history:[]}. Estado derivado: sinfoto Pendiente de comprobante; foto sinverificar Pendiente de verificación; verificada Verificada. No sumar litros con m³.
expenses: {id,vehicleId,date,category:'Seguro'|'GPS'|'Mantenimiento'|'Cubiertas'|'Reparaciones',description,amount,odometer:null|number,provider:'',history:[]}.
tariffs: {id,routeId,amount,effectiveDate,history:[]}; nuevos viajes toman última vigencia para su fecha, existentes no cambian.
readingReviews: {id,vehicleId,driverId,shiftId:null|id,lastCloseKm,reading,difference,status:'Pendiente'|'Resuelta',kind:'positive'|'negative',reason:'',history:[]}.
settlements: cada emisión ES una versión {id,period:'2026-10',type:'Transp SERV'|'Chofer',driverId:null|id,version:1,previousId:null|id,issuedAt,issuedBy,total,minimumPending:boolean,tripIds:[] incluyendo No realizado del alcance,rows:[{tripId,date,time,type,route,driver,commercialKm,status,amount,driverPay}],history:[]}. Snapshots no mutan tras cambios. Corrección puede crear versión para anterior conductor aunque viaje ya no le pertenezca, reteniendo trazabilidad de la anterior. Sólo Realizado suma. Q001: mínimo no computado; todas las liquidaciones de chofer y exports advierten simulación parcial del mínimo pendiente, nunca inventar importe.

## Acciones dominio y previews
- changePassword {password,repeat}; sólo usuario actual, validación coincidencia, temporal deja de funcionar.
- saveMaster {collection:'patients'|'drivers'|'vehicles'|'routes',id?:string,data:campos}; result=id. Máx4 pacientes, campos base válidos, no cuentas auto.
- deactivate {collection,id}; result=id. Efectos confirmados D020-023; sin borrados.
- openShift {vehicleId,reading}; result=shiftId. own driver activo, no otro turno propio/vehículo abierto. reading mayor deja revisión. Menor LANZA error, no se abre; registrar lectura real en un review mediante acción requestReadingReview {vehicleId,reading} result=id (UI puede ofrecer enviarla para revisión cuando apertura falla). No forzarlectura falsa.
- closeShift {id,endKm,reason?}; propio o supervisión; supervisión motivo, final>=inicio, bloquea cualquier viaje en curso asociado.
- resolveReading {id,reason}; sólo reviewpositivo, no corregir lecturas. result=id.
- correctReading {shiftId,field:'startKm'|'endKm',value,reason,reviewId?}; mantienehistoria, actualiza lastCloseKm si último cierre. Si sólo existe referencia seed vehículo sinshift: permitir {vehicleId,value,reason,reviewId?} para referencia; UIidentificar explícito. Corrige lectura, conserva reviewreadingreal.
- startTrip {id}; propio/asignado, turnoabierto, nootroviajeencurso delchofer; asocia shift/vehículo, estadoProgramado.
- passenger {id,patientId,status}; propio viajeencurso.
- finishTrip {id}; propioencurso, todos definidos; result=id.
- noTrip {id,reason}; propioasignado oplan, sóloProgramado/Enc urso, motivo.
- correctTripState {id,status:'Realizado'|'No realizado',reason}; plan antes/solo admin despuéscualquieremitida; motivo.
- assignTrip {id,driverId}; plan, sóloProgramado, active, bloqueo exactfecha/hora con conflictId.
- correctTrip {id,commercialKm,driverId,reason}; planantes/adminpost; proporcionalbase, remun14%, motivo; no permitir colisión; snapshots intactos.
- adjustTrip {id,amount,driverPay,reason}; commercial; conserva calculados/historia, motivo obligatorio como detalle mock; no alteraotrasfechas.
- addNote {id,text}; choferasignado oplan, historia.
- resolveTripReview {id,reason}; plan, marcar flagsresueltas con resultado, no cambiaestado/asignación.
- generateMonth {month:'2026-11',routeIds:[]}; plan; idempotentedate-route-type; sóloactive. result={created:n,existing:n}. preview mismo tipo => {missing:[tripcandidate],existing:[trip],entries:n,exits:n}. Valorescomerciales jamás mostrar aWalter.
- reschedule {routeId,date,scope:'one'|'rest',entryTime,exitTime}; plan; preview => {affected:[trip],excluded:[{trip,reason}]}; apply result={changed:n,excluded:n}; sóloProgramado, no cambiapasadofueraalcance; detectaconflictosantesmutación.
- saveFuel {id?,data:{date,time,vehicleId,type,quantity,amount,odometer,receipt?}}; result=id; own driver open shift creates; supervisorcanedit; adjuntar保preservasiundefined, propio sinverificar edit; onlysecret/admin verificada; Walterlectura únicamente.
- verifyFuel {id}; fuelVerify, fotomandatoria.
- saveExpense {id?,data:{vehicleId,date,category,description,amount,odometer,provider}}; expense. result=id.
- createUser {name,username,roles:[]}; users; result={id,tempPassword}; si chofernuevo asociar por nombre? NO: dejar cuenta con driver operativo nuevo del mismo nombre, o permitir driverId en payload para asociar choferexistente. Acordado alta chofer NO crea cuenta, alta cuenta conchofer puede asociarregistro para demofuncional.
- setRoles {id,roles:[]}; users; result=id; no quitarúltimoadmin ni propiaúltima administración (protección de demo, no regla negocio aprobada). Al activar Chofer generar driver si falta o reactivar asociado; al quitarChofer tratar efectosdeactividadpreservados según D022.
- resetPassword {id}; users; result={id,tempPassword}; contraseña temporal inmediata.
- addTariff {routeId,amount,effectiveDate}; commercial, result=id; no retrospectivo.
- settlementPreview {period,type,driverId?,previousId?}: SOLO preview; => {rows,tripIds,unresolved:[trip],total,minimumPending,differences:[{tripId,label,before,after}],previous:null|settlement}. Scope mensual; driver anteriorpreviousId conservaquerevisar. previewconsulta commercial.
- issueSettlement {period,type,driverId?,previousId?}; commercial; bloqueaunresolved; versióncreciente para mismo período/tipo/chofer. result=id.
Acciones adicionales deben acordarse con root por mensaje. Todos los permisos se verifican en Domain.apply además de ocultar UI. Esto demuestra reglas; no es seguridad real del HTML.

## Seed de demostración
Datos inequívocamente ficticios. 6-10 pacientes, 3-4 vehículos, 3 conductores, 3 recorridos. Hoy incluye Diego Programados08/12/14:30, Walter unviaje, Sin asignar y pendientesrevisión. No turnoDiego abierto inicialmente: primeroabrir. Unturnoabiertoantiguodeotrochofer para cierreolvido. Diferencia positiva pendiente y negativo con lecturareal preservada para revisar. Combustible: sinfotoanterior Diego, confotosinverificar, verificadas. Foto seed será SVG dataURI con boleta FICTICIA (no imagen de persona). Octubre completado para emitir y Noviembre con viajes pendientes para demostrarbloqueo. Una emisión previa de octubre para demostrar historial/corrección ademásdeunalcancesinemitir. Gastosvarios ytarifashistóricas.

## Verificación y límites
Pruebas Node de reglas negativas reales: roles, pasajerofaltante/ningunoabordo, cierrecontrip, lecturas, verificaciónsincomprobante, exactcollision, monthidempotence, deactivate chofermultirole, inactivos conservarpasajeros, emisiónincompleta, primeraliquidaciónbloqueaWalter, versióninmutable,tarifanoretroactiva,tempPW. Agente dominio primero prueba RED y devuelve evidencia RED/GREEN.
Browser por root: 4 accesos, navegación, tareasrepresentativas, preservaciónformularios/errores, descargas, responsive390 ydesktop, teclado/modales. Revisiónindependiente despuésdelcandidato. No afirmar auditoría completa ni accesibilidadcertificada.
