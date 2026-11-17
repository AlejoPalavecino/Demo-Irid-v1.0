const STATES = ['Programado', 'En curso', 'Realizado', 'No realizado'];
const TONES = { Programado: 'info', 'En curso': 'warning', Realizado: 'success', 'No realizado': 'danger' };
const DAY = 86400000;
const number = new Intl.NumberFormat('es-AR');
const monthName = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'long', timeZone: 'UTC' });
let resumeDraft;

function iso(time) { return new Date(time).toISOString().slice(0, 10); }
function timeOf(date) { return Date.parse(`${date}T00:00:00Z`); }
function addDays(date, count) { return iso(timeOf(date) + count * DAY); }
function km(value) { return value == null ? '—' : `${number.format(value)} km`; }
function delta(value) { return `${value > 0 ? '+' : ''}${km(value)}`; }
function ordered(trips) {
  return [...trips].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}
function records(ctx, name, id) { return ctx.getState()[name].find(record => record.id === id); }
function idAttr(ctx, id) { return `data-id="${ctx.h(id)}"`; }
function act(ctx, label, action, id, kind = 'secondary', more = '') {
  return ctx.button(label, `op:${action}`, `${id ? idAttr(ctx, id) : ''} ${more}`, kind);
}
function heading(ctx, title, subtitle, actions = '', backHTML = '') {
  return `<header class="page-head"><div>${backHTML}<h1>${ctx.h(title)}</h1><p>${ctx.h(subtitle)}</p></div>${actions ? `<div class="actions">${actions}</div>` : ''}</header>`;
}
function metric(ctx, label, value, extra = '') {
  return `<div class="metric${extra ? ` ${extra}` : ''}"><span>${ctx.h(label)}</span><strong>${ctx.h(value)}</strong></div>`;
}
function facts(ctx, pairs) {
  return `<dl class="key-value">${pairs.map(([label, value]) => `<div><dt>${ctx.h(label)}</dt><dd>${ctx.h(value ?? '—')}</dd></div>`).join('')}</dl>`;
}
function notice(type, body) { return `<div class="notice ${type}">${body}</div>`; }
function reasonField(label = 'Motivo', name = 'reason', escapedValue = '') {
  return `<label class="field field-full"><span>${label}</span><textarea name="${name}" rows="3" required>${escapedValue}</textarea></label>`;
}
function vehicleName(ctx, id) {
  const vehicle = records(ctx, 'vehicles', id);
  return vehicle ? `${vehicle.alias} · ${vehicle.plate}` : '—';
}
function driverName(ctx, id) { return id ? ctx.lookup('drivers', id) : 'Sin asignar'; }
function dateTime(ctx, value) {
  return value ? `${ctx.date(value.slice(0, 10))} · ${value.slice(11, 16)}` : '—';
}
function pendingReviews(trip) { return trip.reviewReasons.filter(review => !review.resolved); }
function owns(ctx, trip) { return ctx.can('drive') && ctx.driver?.id === trip.driverId; }
function mayView(ctx, trip) { return trip && (ctx.can('plan') || owns(ctx, trip)); }
function ownShift(ctx) {
  return ctx.getState().shifts.find(shift => !shift.closedAt && shift.driverId === ctx.driver?.id);
}
function result(ctx, type, payload, feedback) {
  const data = ctx.run(type, payload);
  ctx.toast(typeof feedback === 'function' ? feedback(data) : feedback);
}
function passengerRows(ctx, trip, editable) {
  return trip.passengers.map(passenger => {
    const patient = records(ctx, 'patients', passenger.patientId);
    const status = passenger.status || 'Sin registrar';
    const picks = editable ? `<div class="actions">${['Recogido', 'No viajó'].map(value => act(ctx, value, 'passenger', trip.id, passenger.status === value ? 'primary' : 'secondary', `data-patient="${ctx.h(passenger.patientId)}" data-status="${ctx.h(value)}" aria-label="${ctx.h(`${value}: ${patient?.name || 'pasajero'}`)}" aria-pressed="${passenger.status === value}"`)).join('')}</div>` : '';
    return `<li class="list-row"><div><strong>${ctx.h(patient?.name || 'Pasajero')}</strong><p>${ctx.h(patient?.address || 'Sin domicilio registrado')}</p>${ctx.badge(status, passenger.status === 'Recogido' ? 'success' : passenger.status === 'No viajó' ? 'warning' : '')}</div>${picks}</li>`;
  }).join('');
}

function journeyStep(ctx, shift, trip, hasTrips) {
  if (!trip && hasTrips && !shift) {
    return '<h2>Ya completaste los viajes de hoy</h2><p>Tu turno está cerrado. Podés consultar los viajes registrados más abajo.</p>';
  }
  if (!shift) {
    return `<h2>¿Con qué vehículo vas a trabajar?</h2><p>Elegí el vehículo y anotá los kilómetros que marca el tablero.</p>
      ${act(ctx, 'Abrir turno', 'open-shift', '', 'primary')}`;
  }
  if (!trip) {
    return `<h2>${hasTrips ? 'Ya completaste los viajes de hoy' : 'Sin viajes asignados hoy'}</h2>
      <p>Cuando termines de usar el vehículo, anotá los kilómetros finales y cerrá el turno.</p>
      ${act(ctx, 'Cerrar turno', 'close-shift', shift.id, 'primary')}`;
  }
  const route = records(ctx, 'routes', trip.routeId);
  const driving = trip.status === 'En curso';
  const tripInfo = `<p class="section-label">${driving ? 'Viaje en curso' : 'Próximo viaje'}</p>
    <h2><time class="route-time">${ctx.h(trip.time)}</time> ${ctx.h(route?.name || 'Recorrido')}</h2>
    <p>${ctx.h(trip.type)} · ${ctx.h(route?.destination || 'Sin destino registrado')}</p>`;
  if (!driving) {
    return tripInfo + act(ctx, `Iniciar viaje de las ${trip.time}`, 'start-trip', trip.id, 'primary');
  }
  const remaining = trip.passengers.filter(p => !p.status).length;
  const prompt = remaining === 1 ? 'Falta marcar 1 pasajero' : `Faltan marcar ${remaining} pasajeros`;
  return `${tripInfo}<h3>${remaining ? prompt : 'Todo listo para finalizar'}</h3>
    <p>${remaining ? 'Indicá si recogiste a cada persona.' : 'Cuando llegues al destino, confirmá el final del viaje.'}</p>
    <ul class="journey-passengers">${passengerRows(ctx, trip, true)}</ul>
    ${remaining ? '' : act(ctx, 'Finalizar viaje', 'finish-trip', trip.id, 'primary')}`;
}

function journey(ctx) {
  if (!ctx.can('drive') || !ctx.driver) return unavailable(ctx);
  const { today, trips, fuel } = ctx.getState();
  const shift = ownShift(ctx);
  const todayTrips = ordered(trips.filter(trip => trip.date === today && owns(ctx, trip)));
  const current = trips.find(trip => owns(ctx, trip) && trip.status === 'En curso')
    || todayTrips.find(trip => trip.status === 'Programado');
  const receipts = fuel.filter(item => item.driverId === ctx.driver.id && !item.receipt);
  const utility = [];
  if (shift) {
    utility.push(ctx.button('Registrar combustible', 'mg:fuel-edit', `data-vehicle="${ctx.h(shift.vehicleId)}"`));
    if (current) utility.push(act(ctx, 'Cerrar turno', 'close-shift', shift.id));
  } else if (!current && todayTrips.length) {
    utility.push(act(ctx, 'Abrir otro turno', 'open-shift'));
  }
  if (receipts.length) utility.push(receipts.length === 1
    ? act(ctx, 'Adjuntar comprobante pendiente', 'receipt', receipts[0].id)
    : act(ctx, `Ver comprobantes pendientes (${receipts.length})`, 'receipts'));
  const tripList = todayTrips.map(trip => {
    const route = records(ctx, 'routes', trip.routeId);
    return `<li class="list-row"><div><strong>${ctx.h(trip.time)} · ${ctx.h(route?.name || 'Recorrido')}</strong>
      <p>${ctx.h(trip.type)} · ${ctx.h(route?.destination || 'Sin destino registrado')}</p>
      ${ctx.badge(trip.status, TONES[trip.status])}</div>${act(ctx, 'Ver viaje', 'trip', trip.id)}</li>`;
  }).join('');
  return `${heading(ctx, 'Mi jornada', `${ctx.driver.name} · ${weekday.format(timeOf(today))} ${ctx.date(today)}`)}
    <div class="stack"><section class="journey-step">${journeyStep(ctx, shift, current, todayTrips.length)}
      ${current ? `<div class="trip-exception">${!shift ? `<span>${ctx.h(current.time)} · ${ctx.h(ctx.lookup('routes',current.routeId))}</span>` : ''}${act(ctx, 'El viaje no se realizó', 'no-trip', current.id, 'ghost')}</div>` : ''}</section>
    <section class="panel"><h2>Viajes de hoy</h2>${tripList ? `<ul class="journey-list">${tripList}</ul>` : '<p>Los viajes que te asignen para hoy aparecen acá.</p>'}</section>
    <section class="panel"><h2>Vehículo y comprobantes</h2>
    ${shift ? `<p>${ctx.h(vehicleName(ctx, shift.vehicleId))} · Inicio del turno: ${ctx.h(km(shift.startKm))}</p>` : '<p>Sin turno abierto.</p>'}
    <div class="actions">${utility.join('')}</div></section></div>`;
}
function unavailable(ctx) { return ctx.empty('Vista no disponible', 'No tenés acceso a esta información con tu cuenta.'); }

function agendaParams(ctx, input = {}) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(input.date || '') && Number.isFinite(timeOf(input.date)) ? input.date : ctx.getState().today;
  const view = ['week', 'month'].includes(input.view) ? input.view : 'day';
  return { date, view, driverId: input.driverId || '', status: STATES.includes(input.status) ? input.status : '', filter: ['unassigned', 'review'].includes(input.filter) ? input.filter : '' };
}
function agendaDays({ date, view }) {
  if (view === 'week') {
    const start = addDays(date, -((new Date(timeOf(date)).getUTCDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }
  if (view === 'month') {
    const anchor = new Date(timeOf(date));
    const days = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0)).getUTCDate();
    return Array.from({ length: days }, (_, index) => addDays(`${date.slice(0, 7)}-01`, index));
  }
  return [date];
}
function moveDate({ date, view }, direction) {
  if (view !== 'month') return addDays(date, (view === 'week' ? 7 : 1) * direction);
  const anchor = new Date(timeOf(date));
  return iso(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + direction, 1));
}
function calendar(ctx, days, trips) {
  const firstWeekday = (new Date(timeOf(days[0])).getUTCDay() + 6) % 7;
  const cells = Array.from({ length: firstWeekday }, () => '').concat(days);
  while (cells.length % 7) cells.push('');
  const counts = new Map();
  for (const trip of trips) counts.set(trip.date, (counts.get(trip.date) || 0) + 1);
  const today = ctx.getState().today;
  const rows = [];
  for (let offset = 0; offset < cells.length; offset += 7) {
    rows.push(`<tr>${cells.slice(offset, offset + 7).map(day => {
      if (!day) return '<td></td>';
      const count = counts.get(day) || 0;
      const label = `${ctx.date(day)}, ${count} ${count === 1 ? 'viaje' : 'viajes'}`;
      return `<td>${act(ctx, day.slice(-2), 'day', '', day === today ? 'primary' : 'ghost', `data-date="${ctx.h(day)}" aria-label="${ctx.h(label)}"${day === today ? ' aria-current="date"' : ''}`)}${count ? `<span class="cal-count">${count} ${count === 1 ? 'viaje' : 'viajes'}</span>` : ''}</td>`;
    }).join('')}</tr>`);
  }
  return `<div class="table-wrap calendar-wrap"><table class="table" aria-label="Calendario del mes"><thead><tr>${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => `<th scope="col">${day}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}
function sentenceCase(text) {
  return text ? text[0].toUpperCase() + text.slice(1) : '';
}
function stepItem(num, title, description, actionsHTML, cueHTML = '') {
  return `<section class="workflow-step"><div class="step-head"><span class="step-num">${num}</span><h2>${title}</h2></div><p>${description}</p><div class="actions">${actionsHTML}</div>${cueHTML}</section>`;
}
function dispatchRow(ctx, trip, plan) {
  const route = records(ctx, 'routes', trip.routeId);
  const reasons = plan ? pendingReviews(trip) : [];
  const patientNames = trip.passengers.map(passenger => ctx.lookup('patients', passenger.patientId)).filter(Boolean);
  const passengersLine = patientNames.length ? `<p class="dispatch-passengers">${ctx.h(patientNames.join(', '))}</p>` : '';
  const alertLine = reasons.length ? `<p class="dispatch-alert">Aviso: ${ctx.h(reasons[0].reason)}</p>` : '';
  const quickAction = plan && trip.status === 'Programado'
    ? act(ctx, trip.driverId ? 'Reasignar' : 'Asignar chofer', 'assign', trip.id, trip.driverId ? 'secondary small' : 'primary small')
    : '';
  const rowTone = plan && !trip.driverId && trip.status === 'Programado'
    ? ' is-attention'
    : (reasons.length ? ' is-review' : '');
  const driverHTML = plan
    ? `<span class="dispatch-driver${trip.driverId ? '' : ' is-missing'}">${ctx.h(driverName(ctx, trip.driverId))}</span>`
    : '';
  return `<article class="dispatch-row${rowTone}">
    <div class="dispatch-time"><time>${ctx.h(trip.time)}</time><span class="dir-tag ${trip.type === 'Entrada' ? 'is-entry' : 'is-exit'}">${ctx.h(trip.type)}</span></div>
    <div class="dispatch-main">
      <div class="dispatch-title"><h4>${ctx.h(route?.name || 'Recorrido')}</h4>${ctx.badge(trip.status, TONES[trip.status])}${reasons.length ? ctx.badge('Por revisar', 'warning') : ''}</div>
      <p class="dispatch-dest">${ctx.h(route?.destination || '—')} (${trip.passengers.length} ${trip.passengers.length === 1 ? 'pasajero' : 'pasajeros'})</p>
      ${passengersLine}${alertLine}
    </div>
    <div class="dispatch-actions">${driverHTML}<div class="actions">${quickAction}${act(ctx, 'Ver viaje', 'trip', trip.id, 'secondary small')}</div></div>
  </article>`;
}
function needsDriver(trip) {
  return !trip.driverId && trip.status === 'Programado';
}

export function unassignedTrips(trips) {
  return ordered(trips.filter(needsDriver));
}

function assignmentQueue(ctx) {
  const trips = unassignedTrips(ctx.getState().trips);
  const groups = new Map();
  for (const trip of trips) {
    if (!groups.has(trip.date)) groups.set(trip.date, []);
    groups.get(trip.date).push(trip);
  }
  const days = [...groups].map(([date, items]) =>
    `<section class="schedule-day"><div class="schedule-day-head"><h2>${ctx.h(ctx.date(date))}</h2></div>
      ${items.map(trip => dispatchRow(ctx, trip, true)).join('')}</section>`);
  const back = ctx.button('Volver al resumen','shell:home','','back-link');
  const summary = trips.length === 1 ? '1 viaje pendiente de asignación' : `${trips.length} viajes pendientes de asignación`;
  return heading(ctx,'Viajes sin chofer',summary,'',back) + (days.length
    ? `<div class="stack">${days.join('')}</div>`
    : ctx.empty('Todos los viajes tienen chofer','Cuando un viaje necesite chofer, aparecerá acá.'));
}

function agenda(ctx, input) {
  const plan = ctx.can('plan');
  if (!plan && !ctx.can('drive')) return unavailable(ctx);
  if (plan && input.queue === 'unassigned') return assignmentQueue(ctx);
  const params = agendaParams(ctx, input);
  if (!plan) { params.driverId = ''; params.filter = ''; }
  const { date, view, driverId, status, filter } = params;
  const days = agendaDays(params);
  const { today, drivers, trips } = ctx.getState();
  const visibleTrips = ordered(trips.filter(trip => plan || owns(ctx, trip)));
  const periodTrips = visibleTrips.filter(trip => trip.date >= days[0] && trip.date <= days.at(-1));
  const filtered = periodTrips.filter(trip => (!driverId || trip.driverId === driverId) && (!status || trip.status === status) && (filter !== 'unassigned' || needsDriver(trip)) && (filter !== 'review' || pendingReviews(trip).length));
  const rows = new Map();
  for (const trip of filtered) {
    if (!rows.has(trip.date)) rows.set(trip.date, []);
    rows.get(trip.date).push(trip);
  }
  const caption = view === 'day' ? `${weekday.format(timeOf(date))} ${ctx.date(date)}`
    : view === 'week' ? `${ctx.date(days[0])} al ${ctx.date(days.at(-1))}` : monthName.format(timeOf(date));
  const switchView = ['Día', 'Semana', 'Mes'].map((label, index) => {
    const mode = ['day', 'week', 'month'][index];
    return act(ctx, label, 'view', '', view === mode ? 'primary small' : 'secondary small', `data-view="${mode}" aria-pressed="${view === mode}"`);
  }).join('');
  const clear = act(ctx, 'Limpiar filtros', 'clear-filters', '', 'secondary small');
  const unassignedInPeriod = periodTrips.filter(needsDriver).length;
  const reviewInPeriod = periodTrips.filter(trip => pendingReviews(trip).length).length;
  const monthPrefix = date.slice(0, 7);
  const monthTrips = visibleTrips.filter(trip => trip.date.startsWith(monthPrefix));
  const unassignedInMonth = monthTrips.filter(needsDriver).length;
  const reviewInMonth = monthTrips.filter(trip => pendingReviews(trip).length).length;
  const monthCue = view !== 'month' && (unassignedInMonth > unassignedInPeriod || reviewInMonth > reviewInPeriod)
    ? `<div class="workflow-cue"><span>En ${ctx.h(sentenceCase(monthName.format(timeOf(`${monthPrefix}-01`))))}: ${unassignedInMonth} sin chofer, ${reviewInMonth} con aviso</span><button type="button" class="btn-inline" data-action="op:view" data-view="month">Ver mes</button></div>`
    : '';
  const steps = plan ? `<section class="agenda-workflow" aria-label="Flujo de trabajo de la agenda">
    ${stepItem(1, 'Programar el mes', 'Creá entradas y salidas del mes según sus días, sin duplicar viajes cargados.', act(ctx, 'Generar mes', 'generate', '', 'primary small'))}
    ${stepItem(2, 'Asignar y revisar', 'Filtrá rápido los viajes pendientes para cubrir choferes o resolver avisos.', `${act(ctx, `Sin chofer (${unassignedInPeriod})`, 'quick-filter', '', filter === 'unassigned' ? 'primary small' : 'secondary small', `data-filter="unassigned" aria-pressed="${filter === 'unassigned'}"`)}${act(ctx, `Con aviso (${reviewInPeriod})`, 'quick-filter', '', filter === 'review' ? 'primary small' : 'secondary small', `data-filter="review" aria-pressed="${filter === 'review'}"`)}`, monthCue)}
    ${stepItem(3, 'Cambiar horarios', 'Ajustá la hora de Entrada o Salida de un recorrido para una fecha o hasta fin de mes.', act(ctx, 'Reprogramar', 'reschedule', '', 'secondary small'))}
  </section>` : '';
  const readinessParts = [unassignedInPeriod ? `${unassignedInPeriod} sin chofer` : '', reviewInPeriod ? `${reviewInPeriod} con aviso` : ''].filter(Boolean);
  const readiness = plan && periodTrips.length
    ? readinessParts.length
      ? `<span class="badge ${unassignedInPeriod ? 'brand' : 'warning'}">${ctx.h(`${periodTrips.length} ${periodTrips.length === 1 ? 'viaje' : 'viajes'}: ${readinessParts.join(', ')}`)}</span>`
      : `<span class="badge success">${periodTrips.length} ${periodTrips.length === 1 ? 'viaje cubierto' : 'viajes cubiertos'}</span>`
    : '';
  const activeFilterParts = [
    filter === 'unassigned' ? 'sólo viajes sin chofer asignado' : '',
    filter === 'review' ? 'sólo viajes pendientes de revisión' : '',
    driverId ? `chofer ${driverName(ctx, driverId)}` : '',
    status ? `estado ${status}` : ''
  ].filter(Boolean);
  const filterBanner = activeFilterParts.length
    ? notice('info', `<div class="panel-head"><span><strong>Mostrando:</strong> ${ctx.h(activeFilterParts.join(', '))}</span>${clear}</div>`)
    : '';
  const statuses = STATES.map(state => ({ id: state, name: state }));
  const emptyActions = view !== 'month' && ((filter === 'unassigned' && unassignedInMonth > 0) || (filter === 'review' && reviewInMonth > 0))
    ? `${act(ctx, 'Ver todo el mes', 'view', '', 'primary', 'data-view="month"')}${clear}`
    : clear;
  const emptyHint = view !== 'month' && filter === 'unassigned' && unassignedInMonth > 0
    ? `No hay viajes sin chofer en esta vista, pero quedan ${unassignedInMonth} en ${monthName.format(timeOf(`${monthPrefix}-01`))}.`
    : view !== 'month' && filter === 'review' && reviewInMonth > 0
      ? `No hay avisos pendientes en esta vista, pero quedan ${reviewInMonth} en ${monthName.format(timeOf(`${monthPrefix}-01`))}.`
      : 'Probá cambiando los filtros o el período para ver otros viajes.';
  const noTrips = driverId || status || filter ? ctx.empty('Sin viajes con este filtro', emptyHint, emptyActions)
    : ctx.empty('Sin viajes en este período', plan ? 'Cambiá de fecha o usá Generar mes para programar los recorridos.' : 'Tus viajes asignados aparecerán acá.', plan ? act(ctx, 'Generar mes', 'generate') : '');
  const groups = [...rows].map(([day, group]) => {
    const groupTitle = view === 'day' ? 'Hoja de ruta del día' : sentenceCase(`${weekday.format(timeOf(day))} ${ctx.date(day)}`);
    const dayUnassigned = plan ? group.filter(needsDriver).length : 0;
    const dayReviews = plan ? group.filter(trip => pendingReviews(trip).length).length : 0;
    const daySummary = [`${group.length} ${group.length === 1 ? 'viaje' : 'viajes'}`, dayUnassigned ? `${dayUnassigned} sin chofer` : '', dayReviews ? `${dayReviews} con aviso` : ''].filter(Boolean).join(', ');
    return `<section class="schedule-day"><div class="schedule-day-head"><h3>${ctx.h(groupTitle)}</h3><span class="schedule-summary">${ctx.h(daySummary)}</span></div>${group.map(trip => dispatchRow(ctx, trip, plan)).join('')}</section>`;
  }).join('');
  return `${heading(ctx, plan ? 'Agenda' : 'Mis viajes', plan ? 'Organizá los viajes del mes, cubrí choferes y ajustá horarios desde un solo lugar.' : 'Consultá tus viajes asignados por fecha.')}
    <div class="stack">${steps}<section class="panel stack agenda-controls" aria-label="Controles de agenda">
      <div class="agenda-bar"><div class="agenda-title-group"><h2>${ctx.h(sentenceCase(caption))}</h2>${readiness}</div><div class="agenda-nav"><div class="actions">${act(ctx, 'Anterior', 'move', '', 'secondary small', 'data-direction="-1"')}${act(ctx, 'Hoy', 'today', '', date === today ? 'ghost small' : 'secondary small')}${act(ctx, 'Siguiente', 'move', '', 'secondary small', 'data-direction="1"')}</div><div class="actions" aria-label="Vista de agenda">${switchView}</div></div></div>
      <form class="toolbar" data-action="op:agenda-filter">${ctx.field('Fecha', 'date', date, 'date', 'required data-change="op:agenda-filter"')}${plan ? ctx.select('Chofer', 'driverId', [{ id: '', name: 'Todos' }, ...drivers], driverId, 'data-change="op:agenda-filter"') : ''}${ctx.select('Estado', 'status', [{ id: '', name: 'Todos' }, ...statuses], status, 'data-change="op:agenda-filter"')}${driverId || status || filter ? clear : ''}</form>
    </section>${filterBanner}${view === 'month' ? `<section class="panel">${calendar(ctx, days, filtered)}</section>` : ''}${groups || noTrips}</div>`;
}

function rowTable(ctx, headers, rows) {
  return `<div class="table-wrap"><table class="table"><thead><tr>${headers.map(label => `<th scope="col">${ctx.h(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(value => `<td>${ctx.h(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function editDraft(ctx, open, label = 'Volver a editar') {
  resumeDraft = open;
  return act(ctx, label, 'edit-draft', '', 'secondary small');
}
function wizardSteps(active, first, second) {
  return `<div class="wizard-steps" aria-label="Pasos"><span class="wizard-step${active === 1 ? ' is-active' : ''}">${first}</span><span class="wizard-step${active === 2 ? ' is-active' : ''}">${second}</span></div>`;
}
function confirmGenerate(ctx, payload) {
  const preview = ctx.preview('generateMonth', payload);
  const groups = new Map();
  for (const [trips, existing] of [[preview.missing, false], [preview.existing, true]]) for (const trip of trips) {
    const key = `${trip.routeId}|${trip.date}`;
    if (!groups.has(key)) groups.set(key, [ctx.lookup('routes', trip.routeId), ctx.date(trip.date), 0, 0, 0]);
    groups.get(key)[existing ? 4 : (trip.type === 'Entrada' ? 2 : 3)] += 1;
  }
  const rows = [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([, row]) => row);
  const table = groups.size ? rowTable(ctx, ['Recorrido', 'Fecha', 'Entradas nuevas', 'Salidas nuevas', 'Se conservan'], rows) : '<p>El mes seleccionado no tiene viajes previstos para estos recorridos.</p>';
  const stepNote = preview.missing.length
    ? '<p class="hint">Revisá cuántos viajes se agregarán antes de confirmar. No se guardan duplicados.</p>'
    : notice('success', '<p>Todos los viajes de estos recorridos ya están creados en ese mes. Editá la selección para probar otro mes.</p>');
  const body = `<div class="stack">${wizardSteps(2, '1. Mes y recorridos', '2. Revisar y confirmar')}${stepNote}<div class="panel-head"><h3>${ctx.h(sentenceCase(monthName.format(timeOf(`${payload.month}-01`))))}</h3>${editDraft(ctx, () => generate(ctx, payload), 'Cambiar selección')}</div><div class="metrics">${metric(ctx, 'Entradas nuevas', preview.entries)}${metric(ctx, 'Salidas nuevas', preview.exits)}${metric(ctx, 'Viajes existentes', preview.existing.length)}</div>${table}</div>`;
  if (!preview.missing.length) { ctx.dialog({ title: 'Vista previa de generación', body }); return; }
  ctx.confirm('Vista previa de generación', body, () => {
    result(ctx, 'generateMonth', payload, data => `Se generaron ${data.created} viajes. Se conservaron ${data.existing} existentes.`);
  }, 'Confirmar y generar viajes');
}
function generate(ctx, draft) {
  const { routes } = ctx.getState();
  const active = routes.filter(route => route.active);
  if (!active.length) { ctx.dialog({ title: 'Generar mes', body: '<p>Necesitás un recorrido activo para generar viajes.</p>' }); return; }
  ctx.dialog({ title: 'Generar viajes del mes', submitLabel: 'Revisar viajes a crear',
    body: `<div class="stack">${wizardSteps(1, '1. Mes y recorridos', '2. Revisar y confirmar')}<p class="hint">Elegí el mes y los recorridos activos. Se programan viajes de Entrada y Salida sin duplicar existentes.</p>${ctx.field('Mes a generar', 'month', draft?.month || agendaParams(ctx, ctx.params).date.slice(0, 7), 'month', 'required')}
    <fieldset><legend>Recorridos activos a incluir</legend>${active.map(route => `<label class="list-row"><span><strong>${ctx.h(route.name)}</strong><br><small>${route.group === 'LMV' ? 'Lun, mié y vie' : 'Mar, jue y sáb'} — Entrada ${ctx.h(route.entryTime)}, salida ${ctx.h(route.exitTime)} (${route.patientIds.length} pasajeros)</small></span><input type="checkbox" name="routeIds" value="${ctx.h(route.id)}"${!draft || draft.routeIds.includes(route.id) ? ' checked' : ''}></label>`).join('')}</fieldset></div>`,
    onSubmit(values, form) { const routeIds = new FormData(form).getAll('routeIds'); if (!routeIds.length) throw new Error('Elegí al menos un recorrido.'); confirmGenerate(ctx, { month: values.month, routeIds }); }
  });
}
function showConflict(ctx, form, error) {
  if (!error.conflictId) throw error;
  const target = form.querySelector('[data-operation-error]');
  if (!target) throw error;
  const trip = records(ctx, 'trips', error.conflictId);
  const detail = mayView(ctx, trip) ? `<p>${ctx.h(`${ctx.date(trip.date)} · ${trip.time} · ${trip.type} · ${ctx.lookup('routes', trip.routeId)}`)}</p>${act(ctx, 'Ver viaje', 'trip', trip.id)}` : '';
  target.innerHTML = notice('danger', `<p>${ctx.h(error.message)}</p>${detail}`);
  target.focus();
  return false;
}
const FORM_ERROR = '<div data-operation-error tabindex="-1" aria-live="polite"></div>';

function reprogram(ctx, trip, routeId, draft) {
  const { routes, today, trips } = ctx.getState();
  const choices = routes.filter(route => route.active || trips.some(item => item.status === 'Programado' && item.routeId === route.id));
  const route = choices.find(item => item.id === (draft?.routeId || trip?.routeId || routeId)) || choices[0];
  if (!route) { ctx.dialog({ title: 'Reprogramar recorrido', body: '<p>No hay recorridos disponibles para reprogramar.</p>' }); return; }
  const date = draft?.date || trip?.date || ctx.params.date || today;
  const entry = trips.find(item => item.date === date && item.routeId === route.id && item.type === 'Entrada');
  const exit = trips.find(item => item.date === date && item.routeId === route.id && item.type === 'Salida');
  ctx.dialog({ title: 'Reprogramar recorrido', submitLabel: 'Revisar viajes afectados',
    body: `<div class="stack">${wizardSteps(1, '1. Recorrido y horarios', '2. Revisar afectados')}<p class="hint">Elegí el recorrido, desde qué fecha revisar y los nuevos horarios. Sólo cambian viajes sin iniciar.</p><div class="form-grid">${ctx.select('Recorrido', 'routeId', choices, route.id, 'required data-change="op:reprogram-route"')}${ctx.field('Fecha desde la que se revisa', 'date', date, 'date', 'required data-change="op:reprogram-route"')}<div class="field-full">${ctx.select('Alcance', 'scope', [{ id: 'one', name: 'Sólo esta fecha (únicamente el día elegido)' }, { id: 'rest', name: 'Desde esta fecha hasta fin de mes (futuros sin iniciar)' }], draft?.scope || 'one')}</div>${ctx.field('Horario de Entrada', 'entryTime', draft?.entryTime || entry?.time || route.entryTime, 'time', 'required')}${ctx.field('Horario de Salida', 'exitTime', draft?.exitTime || exit?.time || route.exitTime, 'time', 'required')}</div>${FORM_ERROR}</div>`,
    onSubmit(payload, form) {
      try {
        const preview = ctx.preview('reschedule', payload);
        const comparisons = preview.affected.map(item => [ctx.date(item.date), item.type, item.time, item.type === 'Entrada' ? payload.entryTime : payload.exitTime]);
        const changed = comparisons.filter(([, , before, after]) => before !== after);
        const excluded = preview.excluded.map(({ trip: item, reason }) => [ctx.date(item.date), item.type, item.time, reason]);
        excluded.push(...comparisons.filter(([, , before, after]) => before === after).map(([date, type, time]) => [date, type, time, 'El horario propuesto coincide con el actual']));
        const stepBanner = changed.length
          ? '<p class="hint">Confirmá los cambios antes de aplicarlos. Los viajes excluidos quedan intactos.</p>'
          : notice('warning', '<p>No hay cambios aplicables con estos horarios. Editá los horarios para probar otra fecha o alcance.</p>');
        const body = `<div class="stack">${wizardSteps(2, '1. Recorrido y horarios', '2. Revisar afectados')}${stepBanner}<div class="panel-head"><h3>${ctx.h(ctx.lookup('routes', payload.routeId))}</h3>${editDraft(ctx, () => reprogram(ctx, trip, routeId, payload), 'Editar horarios')}</div><section><h3>Viajes que se modificarán (${changed.length})</h3>${changed.length ? rowTable(ctx, ['Fecha', 'Tipo', 'Horario actual', 'Horario propuesto'], changed) : '<p>La selección no tiene cambios de horario aplicables.</p>'}</section><section><h3>Viajes excluidos (${excluded.length})</h3>${excluded.length ? rowTable(ctx, ['Fecha', 'Tipo', 'Horario', 'Motivo'], excluded) : '<p>Sin exclusiones.</p>'}</section></div>${FORM_ERROR}`;
        if (!changed.length) { ctx.dialog({ title: 'Revisión de programación', body }); return; }
        ctx.dialog({ title: 'Revisión de programación', body, submitLabel: 'Confirmar reprogramación', onSubmit(_, confirmForm) {
          try { result(ctx, 'reschedule', payload, data => `Viajes reprogramados: ${data.changed}. Excluidos: ${excluded.length}.`); }
          catch (error) { return showConflict(ctx, confirmForm, error); }
        } });
      } catch (error) { return showConflict(ctx, form, error); }
    }
  });
}

function settlementImpact(ctx, trip) {
  return ctx.getState().settlements.filter(record => record.tripIds.includes(trip.id));
}
function mayCorrect(ctx, trip) {
  return ctx.can('plan') && (ctx.can('admin') || !settlementImpact(ctx, trip).length);
}
function affectedSettlements(ctx, trip) {
  if (!ctx.can('commercial')) return '';
  const impacted = settlementImpact(ctx, trip);
  if (!impacted.length) return '<p class="hint">Este viaje todavía no integra una liquidación emitida.</p>';
  return notice('warning', `<p><strong>Liquidaciones emitidas afectadas</strong></p><ul>${impacted.map(record => `<li>${ctx.h(`${record.type === 'Chofer' ? driverName(ctx, record.driverId) : record.type} · ${record.period} · versión ${record.version}`)}</li>`).join('')}</ul><p>Las correcciones de liquidación se emiten como nuevas versiones.</p>`);
}
function historyValue(ctx, key, value) {
  if (value === undefined || value === null || value === '') return '—';
  if (key === 'driverId') return driverName(ctx, value);
  if (key === 'vehicleId') return vehicleName(ctx, value);
  if (['amount', 'driverPay'].includes(key)) return ctx.money(value);
  if (['commercialKm', 'startKm', 'endKm', 'lastCloseKm', 'reading'].includes(key)) return km(value);
  return String(value);
}
function history(ctx, entries) {
  const commercial = ctx.can('commercial');
  const labels = { status: 'Estado', time: 'Horario', driverId: 'Chofer', commercialKm: 'Kilómetros comerciales', startKm: 'Lectura inicial', endKm: 'Lectura final', lastCloseKm: 'Referencia de último cierre', amount: 'Importe del viaje', driverPay: 'Remuneración' };
  const visible = [...entries].reverse().filter(entry => commercial || entry.text !== 'Se ajustaron los importes del viaje');
  if (!visible.length) return '<p class="hint">Todavía no hay movimientos registrados.</p>';
  return `<ol class="history">${visible.map(entry => {
    const comparisons = Object.entries(labels).filter(([key]) => (commercial || !['amount', 'driverPay'].includes(key)) && (ctx.can('plan') || key !== 'commercialKm') && (entry.before?.[key] !== undefined || entry.after?.[key] !== undefined) && entry.before?.[key] !== entry.after?.[key]);
    const differences = comparisons.map(([key, label]) => [label, `${historyValue(ctx, key, entry.before?.[key])} → ${historyValue(ctx, key, entry.after?.[key])}`]);
    if (typeof entry.before === 'number' && typeof entry.after === 'number') differences.push(['Lectura anterior y corregida', `${km(entry.before)} → ${km(entry.after)}`]);
    return `<li><strong>${ctx.h(entry.text)}</strong><p class="hint">${ctx.h(dateTime(ctx, entry.at))} · ${ctx.h(entry.actorId ? ctx.lookup('users', entry.actorId) : 'Sistema')}</p>${entry.reason ? `<p>${ctx.h(entry.reason)}</p>` : ''}${differences.length ? facts(ctx, differences) : ''}</li>`;
  }).join('')}</ol>`;
}

function tripDetail(ctx, params) {
  const trip = records(ctx, 'trips', params.id);
  if (!mayView(ctx, trip)) return unavailable(ctx);
  const route = records(ctx, 'routes', trip.routeId);
  const own = owns(ctx, trip);
  const plan = ctx.can('plan');
  const shift = own ? ownShift(ctx) : null;
  const inCourse = trip.status === 'En curso';
  const scheduled = trip.status === 'Programado';
  const final = !scheduled && !inCourse;
  const blockTrip = shift && ctx.getState().trips.find(item => item.id !== trip.id && item.driverId === ctx.driver?.id && item.status === 'En curso');
  const unmarked = trip.passengers.filter(passenger => !passenger.status).length;
  const reviews = plan ? pendingReviews(trip) : [];
  const workflow = [];
  const buttons = [];
  if (own && scheduled) {
    if (!shift) workflow.push(notice('info', `<div class="panel-head"><p>Abrí un turno para iniciar el viaje.</p>${act(ctx, 'Abrir turno', 'open-shift', '', 'primary')}</div>`));
    else if (blockTrip) workflow.push(notice('warning', `<div class="panel-head"><p>Tenés otro viaje en curso.</p>${act(ctx, 'Ir al viaje', 'trip', blockTrip.id)}</div>`));
    else buttons.push(act(ctx, 'Iniciar viaje', 'start-trip', trip.id, 'primary'));
  }
  if (own && inCourse) {
    buttons.push(act(ctx, 'Finalizar viaje', 'finish-trip', trip.id, 'primary', unmarked ? 'disabled' : ''));
    if (unmarked) workflow.push(notice('info', `<p>${unmarked === 1 ? 'Falta indicar si viajó un pasajero.' : `Falta indicar si viajaron ${unmarked} pasajeros.`}</p>`));
  }
  if (plan && scheduled) buttons.push(act(ctx, 'Asignar o cambiar chofer', 'assign', trip.id), act(ctx, 'Reprogramar', 'reschedule', trip.id));
  if ((own || plan) && (scheduled || inCourse)) buttons.push(act(ctx, 'El viaje no se realizó', 'no-trip', trip.id, 'danger'));
  if (final && mayCorrect(ctx, trip)) buttons.push(act(ctx, 'Corregir estado', 'state', trip.id));
  if (mayCorrect(ctx, trip)) buttons.push(act(ctx, 'Corregir kilómetros o chofer', 'correct-trip', trip.id));
  if (ctx.can('commercial')) buttons.push(ctx.button('Ajustar importes', 'fin:adjust', idAttr(ctx, trip.id)));
  if (own || plan) buttons.push(act(ctx, 'Registrar novedad', 'note', trip.id));
  const persons = passengerRows(ctx, trip, own && inCourse);
  const factsHtml = facts(ctx, [['Horario', trip.time], ['Tipo', trip.type], ['Destino', route?.destination], ['Chofer', driverName(ctx, trip.driverId)], ['Vehículo del viaje', trip.vehicleId ? vehicleName(ctx, trip.vehicleId) : 'Se toma del turno al iniciar'], ...(plan ? [['Kilómetros comerciales', km(trip.commercialKm)]] : []), ...(ctx.can('commercial') ? [['Importe del viaje', ctx.money(trip.amount)], ['Remuneración', ctx.money(trip.driverPay)]] : [])]);
  const reviewNotice = reviews.length ? notice('warning', `<h2>Motivos de revisión</h2><ul>${reviews.map(review => `<li class="list-row"><span>${ctx.h(review.reason)}</span>${act(ctx, 'Marcar como revisado', 'review-trip', trip.id, 'secondary', `data-review="${ctx.h(review.id)}"`)}</li>`).join('')}</ul>`) : '';
  const notes = [...trip.notes].reverse().map(note => `<li><p>${ctx.h(note.text)}</p><p class="hint">${ctx.h(dateTime(ctx, note.at))} · ${ctx.h(ctx.lookup('users', note.authorId))}</p></li>`).join('');
  const footerFinish = own && inCourse
    ? `<div class="actions section-gap">${act(ctx, 'Finalizar viaje', 'finish-trip', trip.id, 'primary', unmarked ? 'disabled' : '')}${unmarked ? `<span class="hint">${ctx.h(unmarked === 1 ? 'Falta indicar 1 pasajero.' : `Faltan indicar ${unmarked} pasajeros.`)}</span>` : ''}</div>` : '';
  return `${heading(ctx, route?.name || 'Detalle del viaje', `${ctx.date(trip.date)} · ${trip.type} · ${trip.time}`, '', act(ctx, 'Volver', 'back', '', 'back-link'))}
    <div class="stack"><section class="panel stack"><div class="panel-head"><h2>Datos del viaje</h2>${ctx.badge(trip.status, TONES[trip.status])}</div>${factsHtml}${trip.nonperformanceReason ? `<p><strong>Motivo de no realización</strong> ${ctx.h(trip.nonperformanceReason)}</p>` : ''}${workflow.join('')}${buttons.length ? `<div class="actions">${buttons.join('')}</div>` : ''}</section>${reviewNotice}
    <section class="panel"><div class="panel-head"><h2>Pasajeros</h2></div>${persons ? `<ul class="stack">${persons}</ul>` : '<p class="hint">Sin pasajeros previstos.</p>'}${footerFinish}</section>
    <section class="panel"><h2>Historial del viaje</h2>${notes ? `<h3>Novedades</h3><ol class="history">${notes}</ol>` : ''}${history(ctx, trip.history)}</section></div>`;
}

function assign(ctx, trip) {
  const drivers = ctx.getState().drivers.filter(driver => driver.active);
  ctx.dialog({ title: 'Asignar o cambiar chofer', submitLabel: 'Confirmar asignación',
    body: `<div class="stack"><p>${ctx.h(`${ctx.date(trip.date)} · ${trip.time} · ${trip.type} · ${ctx.lookup('routes', trip.routeId)}`)}</p><p class="hint">Elegí un chofer activo. Si ya tiene otro viaje exactamente en esta fecha y hora, el sistema te avisa para evitar choques.</p>${facts(ctx, [['Chofer actual', driverName(ctx, trip.driverId)]])}
    ${ctx.select('Chofer asignado', 'driverId', [{ id: '', name: 'Elegí un chofer' }, ...drivers], trip.driverId || '', 'required')}${FORM_ERROR}</div>`,
    onSubmit({ driverId }, form) {
      try { result(ctx, 'assignTrip', { id: trip.id, driverId }, 'Asignación guardada.'); }
      catch (error) { return showConflict(ctx, form, error); }
    }
  });
}
function finish(ctx, trip) {
  const missing = trip.passengers.filter(passenger => !passenger.status);
  if (missing.length) throw new Error('Indicá si viajó cada pasajero antes de finalizar.');
  const picked = trip.passengers.filter(passenger => passenger.status === 'Recogido');
  const noRide = trip.passengers.filter(passenger => passenger.status === 'No viajó');
  const names = list => list.map(passenger => ctx.lookup('patients', passenger.patientId)).join(', ') || '—';
  ctx.confirm('Finalizar viaje', `<div class="stack">${facts(ctx, [[`Recogidos (${picked.length})`, names(picked)], [`No viajaron (${noRide.length})`, names(noRide)]])}${picked.length ? '' : notice('info', '<p>Confirmá si hiciste el recorrido previsto, aunque no haya viajado ningún pasajero.</p>')}</div>`, () => {
    result(ctx, 'finishTrip', { id: trip.id }, 'Viaje registrado como realizado.');
    if (ctx.screen === 'jornada' || ctx.params.back === 'jornada') ctx.go('jornada');
  }, 'Confirmar finalización');
}
function tripState(ctx, trip) {
  const status = trip.status === 'Realizado' ? 'No realizado' : 'Realizado';
  ctx.dialog({ title: 'Corregir estado', submitLabel: 'Confirmar corrección',
    body: `<div class="stack">${facts(ctx, [['Estado actual', trip.status], ['Nuevo estado', status]])}${reasonField('Motivo de la corrección')}${status === 'No realizado' ? reasonField('Motivo de no realización', 'nonperformanceReason') : ''}${affectedSettlements(ctx, trip)}</div>`,
    onSubmit({ reason, nonperformanceReason }) { result(ctx, 'correctTripState', { id: trip.id, status, reason, nonperformanceReason }, 'Estado corregido.'); }
  });
}
function correctTrip(ctx, trip, draft) {
  const drivers = ctx.getState().drivers.filter(driver => driver.active || driver.id === trip.driverId);
  const driverField = trip.status === 'En curso' ? '<p class="hint">El chofer del viaje en curso se conserva hasta resolverlo.</p>'
    : ctx.select('Chofer propuesto', 'driverId', [...(!trip.driverId ? [{ id: '', name: 'Sin asignar' }] : []), ...drivers], draft?.driverId ?? (trip.driverId || ''));
  ctx.dialog({ title: 'Corregir kilómetros o chofer', submitLabel: 'Revisar corrección',
    body: `<div class="stack">${facts(ctx, [['Kilómetros comerciales actuales', km(trip.commercialKm)], ['Chofer actual', driverName(ctx, trip.driverId)]])}
    <div class="form-grid">${ctx.field('Kilómetros comerciales propuestos', 'commercialKm', draft?.commercialKm ?? trip.commercialKm, 'number', 'min="0" step="any" required')}${driverField}${reasonField('Motivo de la corrección', 'reason', ctx.h(draft?.reason))}</div></div>`,
    onSubmit(values) {
      if (!values.reason.trim()) throw new Error('Ingresá el motivo de la corrección.');
      const payload = { ...values, driverId: values.driverId || undefined, id: trip.id };
      const body = `<div class="stack">${rowTable(ctx, ['Dato', 'Antes', 'Después'], [['Kilómetros comerciales', km(trip.commercialKm), km(Number(values.commercialKm))], ['Chofer', driverName(ctx, trip.driverId), driverName(ctx, values.driverId || trip.driverId)]])}<p>${ctx.h(values.reason)}</p>${affectedSettlements(ctx, trip)}<div class="actions">${editDraft(ctx, () => correctTrip(ctx, trip, values))}</div></div>${FORM_ERROR}`;
      ctx.dialog({ title: 'Confirmar corrección del viaje', body, submitLabel: 'Confirmar corrección', onSubmit(_, form) {
        try { result(ctx, 'correctTrip', payload, 'Corrección guardada.'); }
        catch (error) { return showConflict(ctx, form, error); }
      } });
    }
  });
}

function reviewTrip(ctx, trip, reviewId) {
  const review = pendingReviews(trip).find(item => item.id === reviewId);
  if (!review) throw new Error('El aviso ya no está pendiente.');
  ctx.dialog({ title: 'Marcar como revisado', submitLabel: 'Confirmar revisión',
    body: `<div class="stack"><p>${ctx.h(review.reason)}</p>${reasonField('Resultado de la revisión')}</div>`,
    onSubmit({ reason }) { result(ctx, 'resolveTripReview', { id: trip.id, reviewId, reason }, 'Revisión resuelta.'); }
  });
}
function reviews(ctx) {
  if (!ctx.can('plan')) return unavailable(ctx);
  const trips = ordered(ctx.getState().trips.filter(trip => pendingReviews(trip).length));
  return `${heading(ctx, 'Viajes a revisar', 'Consultá los motivos y registrá el resultado de cada revisión.')}
    <div class="stack">${trips.map(trip => {
      const items = pendingReviews(trip);
      const dayTitle = sentenceCase(`${weekday.format(timeOf(trip.date))} ${ctx.date(trip.date)}`);
      return `<section class="schedule-day"><div class="schedule-day-head"><h3>${ctx.h(dayTitle)}</h3><span class="schedule-summary">${items.length} ${items.length === 1 ? 'aviso pendiente' : 'avisos pendientes'}</span></div>${dispatchRow(ctx, trip, true)}<div style="padding:14px 22px;background:#fcfbfa;border-top:1px solid #f1edef"><ul class="stack">${items.map(review => `<li class="list-row"><span>${ctx.h(review.reason)}</span>${act(ctx, 'Marcar como revisado', 'review-trip', trip.id, 'primary small', `data-review="${ctx.h(review.id)}"`)}</li>`).join('')}</ul></div></section>`;
    }).join('') || ctx.empty('Sin revisiones pendientes', 'Los viajes con avisos operativos aparecen acá.')}</div>`;
}

function openingReference(ctx, vehicle) {
  if (!vehicle) return 'Elegí un vehículo para consultar su último cierre.';
  if (vehicle.lastCloseKm == null) return 'Este vehículo no tiene una lectura de cierre registrada.';
  const busy = ctx.getState().shifts.find(shift => shift.vehicleId === vehicle.id && !shift.closedAt);
  return `Último cierre: ${km(vehicle.lastCloseKm)}.${busy ? ' Hay un turno abierto para este vehículo.' : ''}`;
}
function openShift(ctx) {
  const { vehicles } = ctx.getState();
  const active = vehicles.filter(vehicle => vehicle.active);
  const options = active.map(vehicle => ({ id: vehicle.id, name: vehicleName(ctx, vehicle.id) }));
  if (!options.length) { ctx.dialog({ title: 'Abrir turno', body: '<p>No hay vehículos activos disponibles.</p>' }); return; }
  ctx.dialog({ title: 'Abrir turno', submitLabel: 'Confirmar apertura',
    body: `<div class="stack">${ctx.select('Vehículo', 'vehicleId', [{ id: '', name: 'Elegí un vehículo' }, ...options], '', 'required data-change="op:opening-vehicle" aria-describedby="opening-reference"')}
    <p class="hint" id="opening-reference" data-opening-reference aria-live="polite">${ctx.h(openingReference(ctx))}</p>
    <div data-opening-quick hidden><button type="button" class="btn small secondary" data-action="op:use-last-km" data-km=""></button></div>
    ${ctx.field('Kilómetros que marca el tablero', 'reading', '', 'number', 'required min="0" step="1" inputmode="numeric"')}${FORM_ERROR}</div>`,
    onSubmit(values, form) {
      try { result(ctx, 'openShift', values, 'Turno abierto.'); }
      catch (error) {
        const vehicle = records(ctx, 'vehicles', values.vehicleId);
        const busy = ctx.getState().shifts.some(shift => shift.vehicleId === values.vehicleId && !shift.closedAt);
        const rawReading = String(values.reading ?? '').trim();
        const parsed = Number(rawReading);
        const validNegative = rawReading !== '' && Number.isSafeInteger(parsed) && parsed >= 0 && parsed < vehicle?.lastCloseKm;
        const unresolved = ctx.getState().readingReviews.some(review => review.vehicleId === values.vehicleId && review.kind === 'negative' && review.status === 'Pendiente');
        if (!vehicle?.active || busy || ownShift(ctx) || vehicle.lastCloseKm == null || !validNegative || unresolved) throw error;
        const target = form.querySelector('[data-operation-error]');
        target.innerHTML = notice('danger', `<p>${ctx.h(error.message)}</p><p>Podés enviar la lectura real informada para revisión.</p>${act(ctx, 'Enviar lectura para revisión', 'request-reading')}`);
        target.focus();
        return false;
      }
      if (ctx.screen !== 'jornada') ctx.go('jornada');
    }
  });
}

function closeShift(ctx, shift, forgotten) {
  const blockers = ordered(ctx.getState().trips.filter(trip => trip.shiftId === shift.id && trip.status === 'En curso'));
  if (blockers.length) {
    const body = `<div class="stack"><p>Resolvé los viajes en curso de este turno para poder cerrarlo.</p>${blockers.map(trip => `<div class="list-row"><span>${ctx.h(`${ctx.date(trip.date)} · ${trip.time} · ${trip.type} · ${ctx.lookup('routes', trip.routeId)}`)}</span>${act(ctx, 'Ir al viaje', 'trip', trip.id)}</div>`).join('')}</div>`;
    ctx.dialog({ title: 'El turno sigue abierto', body });
    return;
  }
  ctx.dialog({ title: forgotten ? 'Cerrar turno por olvido' : 'Cerrar turno', submitLabel: 'Confirmar cierre',
    body: `<div class="stack">${facts(ctx, [['Vehículo', vehicleName(ctx, shift.vehicleId)], ['Chofer', driverName(ctx, shift.driverId)], ['Lectura inicial', km(shift.startKm)]])}
    ${ctx.field('Kilometraje final (km)', 'endKm', '', 'number', `required min="${ctx.h(shift.startKm)}" step="1" inputmode="numeric" data-change="op:close-km" data-start="${ctx.h(shift.startKm)}" aria-describedby="closing-distance"`)}
    <p id="closing-distance" class="notice info" data-close-km aria-live="polite">Ingresá el kilometraje final para calcular los kilómetros del turno.</p>${forgotten ? reasonField('Motivo del cierre por olvido') : ''}</div>`,
    onSubmit({ endKm, reason }) { result(ctx, 'closeShift', { id: shift.id, endKm, reason }, 'Turno cerrado.'); }
  });
}
function closedBy(ctx, shift) { return shift.closedBy ? ctx.lookup('users', shift.closedBy) : '—'; }
function shiftDetail(ctx, shift) {
  if (!ctx.can('plan') && (ctx.driver?.id !== shift.driverId || !ctx.can('drive'))) throw new Error('No tenés acceso a ese turno.');
  ctx.dialog({ title: `Turno · ${vehicleName(ctx, shift.vehicleId)}`, body: `<div class="stack">${facts(ctx, [['Chofer', driverName(ctx, shift.driverId)], ['Apertura', dateTime(ctx, shift.openedAt)], ['Odómetro inicial', km(shift.startKm)], ['Cierre', dateTime(ctx, shift.closedAt)], ['Odómetro final', km(shift.endKm)], ['Kilómetros del turno', km(shift.endKm == null ? null : shift.endKm - shift.startKm)], ...(shift.closedAt ? [['Cerrado por', closedBy(ctx, shift)], ...(shift.closeReason ? [['Motivo de cierre', shift.closeReason]] : [])] : [])])}<section><h3>Historial del turno</h3>${history(ctx, shift.history)}</section></div>` });
}
function shifts(ctx) {
  if (!ctx.can('plan')) return unavailable(ctx);
  const list = [...ctx.getState().shifts].sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  const open = list.filter(shift => !shift.closedAt);
  const closed = list.filter(shift => shift.closedAt);
  const row = (shift, isOpen) => `<article class="list-row"><div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><strong>${ctx.h(vehicleName(ctx, shift.vehicleId))}</strong>${ctx.badge(isOpen ? 'Sin cerrar' : 'Cerrado', isOpen ? 'warning' : 'success')}</div><p>${ctx.h(driverName(ctx, shift.driverId))} — Apertura ${ctx.h(dateTime(ctx, shift.openedAt))}</p><p>${isOpen ? `Lectura inicial ${ctx.h(km(shift.startKm))}` : `Cierre ${ctx.h(dateTime(ctx, shift.closedAt))} · ${ctx.h(km(shift.endKm - shift.startKm))}`}</p></div><div class="actions">${act(ctx, 'Ver turno', 'shift-detail', shift.id, 'secondary small')}${isOpen ? act(ctx, 'Cerrar turno por olvido', 'close-shift', shift.id, 'secondary small', 'data-forgotten="true"') : ''}</div></article>`;
  return `${heading(ctx, 'Turnos', 'Consultá el uso de cada vehículo y atendé cierres pendientes.')}
    <div class="stack"><section class="panel stack"><div class="panel-head"><h2>Turnos abiertos</h2>${ctx.badge(`${open.length} ${open.length === 1 ? 'abierto' : 'abiertos'}`, open.length ? 'warning' : 'success')}</div>${open.map(shift => row(shift, true)).join('') || ctx.empty('Sin turnos abiertos', 'Los turnos en uso aparecen acá.')}</section>
    <section class="panel stack"><h2>Turnos cerrados</h2>${closed.map(shift => row(shift, false)).join('') || ctx.empty('Sin turnos cerrados', 'Los turnos que cierren los choferes o el equipo de operación aparecen acá.')}</section></div>`;
}

function latestClose(ctx, vehicleId) {
  return ctx.getState().shifts.filter(shift => shift.vehicleId === vehicleId && shift.closedAt).sort((a, b) => b.closedAt.localeCompare(a.closedAt))[0];
}
function readingHistory(ctx, vehicleId) {
  const { shifts, readingReviews } = ctx.getState();
  const vehicle = records(ctx, 'vehicles', vehicleId);
  const shiftList = shifts.filter(shift => shift.vehicleId === vehicleId).sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  const readings = readingReviews.filter(review => review.vehicleId === vehicleId);
  const shiftRows = shiftList.map(shift => [dateTime(ctx, shift.openedAt), driverName(ctx, shift.driverId), km(shift.startKm), dateTime(ctx, shift.closedAt), km(shift.endKm)]);
  const reviewRows = readings.map(review => [driverName(ctx, review.driverId), km(review.lastCloseKm), km(review.reading), delta(review.difference), review.status]);
  const events = [...(vehicle?.history || []), ...shiftList.flatMap(shift => shift.history), ...readings.flatMap(review => review.history)].sort((a, b) => (a.at || '').localeCompare(b.at || ''));
  ctx.dialog({ title: 'Historial de lecturas', body: `<div class="stack"><p><strong>${ctx.h(vehicleName(ctx, vehicleId))}</strong></p>${facts(ctx, [['Referencia actual de último cierre', km(vehicle?.lastCloseKm)]])}
    <section><h3>Lecturas de turnos</h3>${shiftRows.length ? rowTable(ctx, ['Apertura', 'Chofer', 'Odómetro inicial', 'Cierre', 'Odómetro final'], shiftRows) : '<p>Sin turnos registrados para el vehículo.</p>'}</section>
    <section><h3>Lecturas informadas para revisión</h3>${reviewRows.length ? rowTable(ctx, ['Chofer', 'Último cierre', 'Lectura real informada', 'Diferencia', 'Estado'], reviewRows) : '<p>Sin diferencias registradas para el vehículo.</p>'}</section>
    <section><h3>Movimientos</h3>${history(ctx, events)}</section></div>` });
}
function reportReading(ctx, values) {
  const vehicle = records(ctx, 'vehicles', values.vehicleId);
  ctx.confirm('Enviar lectura para revisión', `<div class="stack">${facts(ctx, [['Vehículo', vehicleName(ctx, vehicle?.id)], ['Último cierre', km(vehicle?.lastCloseKm)], ['Lectura real informada', km(Number(values.reading))]])}<p>El turno sigue sin abrir hasta que se revise la diferencia.</p></div>`, () => result(ctx, 'requestReadingReview', { vehicleId: values.vehicleId, reading: values.reading }, 'Lectura enviada para revisión.'), 'Enviar a revisión');
}
function confirmReading(ctx, review) {
  ctx.dialog({ title: 'Confirmar diferencia', submitLabel: 'Confirmar diferencia',
    body: `<div class="stack">${facts(ctx, [['Vehículo', vehicleName(ctx, review.vehicleId)], ['Último cierre', km(review.lastCloseKm)], ['Lectura real informada', km(review.reading)], ['Diferencia', delta(review.difference)]])}${reasonField('Motivo de la confirmación')}</div>`,
    onSubmit({ reason }) { result(ctx, 'resolveReading', { id: review.id, reason }, 'Diferencia confirmada.'); }
  });
}
function readingTargets(ctx, review) {
  const opening = review.kind === 'positive' && records(ctx, 'shifts', review.shiftId);
  const previous = ctx.getState().shifts.filter(shift => shift.vehicleId === review.vehicleId && shift.closedAt && (!opening || shift.closedAt <= opening.openedAt)).sort((a, b) => b.closedAt.localeCompare(a.closedAt))[0];
  const vehicle = records(ctx, 'vehicles', review.vehicleId);
  const targets = [];
  if (opening) targets.push({ id: 'open', name: `Apertura del turno · ${dateTime(ctx, opening.openedAt)}`, before: opening.startKm, payload: { shiftId: opening.id, field: 'startKm' } });
  if (previous) targets.push({ id: 'close', name: `Cierre anterior · ${dateTime(ctx, previous.closedAt)}`, before: previous.endKm, payload: { shiftId: previous.id, field: 'endKm' } });
  else if (!latestClose(ctx, vehicle.id)) targets.push({ id: 'reference', name: 'Referencia de último cierre sin turno asociado', before: vehicle.lastCloseKm, payload: { vehicleId: vehicle.id } });
  return targets;
}
function correctReading(ctx, review, draft) {
  const targets = readingTargets(ctx, review);
  if (!targets.length) throw new Error('No hay una lectura registrada asociada a esta revisión.');
  ctx.dialog({ title: 'Corregir registro de odómetro', submitLabel: 'Revisar corrección',
    body: `<div class="stack">${facts(ctx, [['Vehículo', vehicleName(ctx, review.vehicleId)], ['Lectura real informada', km(review.reading)]])}
    ${ctx.select('Registro a corregir', 'target', targets.map(item => ({ ...item, name: `${item.name} (${km(item.before)})` })), draft?.target || targets[0].id, 'required')}
    ${ctx.field('Lectura correcta (km)', 'value', draft?.value || '', 'number', 'required min="0" step="1" inputmode="numeric"')}${reasonField('Motivo de la corrección', 'reason', ctx.h(draft?.reason))}</div>`,
    onSubmit(values) {
      if (!values.reason.trim()) throw new Error('Ingresá el motivo de la corrección.');
      const target = targets.find(item => item.id === values.target);
      if (!target) throw new Error('Elegí el registro que querés corregir.');
      const body = `<div class="stack">${facts(ctx, [['Vehículo', vehicleName(ctx, review.vehicleId)], ['Registro', target.name], ['Lectura anterior', km(target.before)], ['Lectura propuesta', km(Number(values.value))], ['Lectura real informada', km(review.reading)], ['Motivo', values.reason]])}<div class="actions">${editDraft(ctx, () => correctReading(ctx, review, values))}</div></div>`;
      ctx.confirm('Confirmar corrección de lectura', body, () => result(ctx, 'correctReading', { ...target.payload, value: values.value, reason: values.reason, reviewId: review.id }, 'Lectura corregida con historial.'), 'Confirmar corrección');
    }
  });
}
function readings(ctx) {
  if (!ctx.can('odometer')) return unavailable(ctx);
  const { readingReviews } = ctx.getState();
  const pending = readingReviews.filter(item => item.status === 'Pendiente');
  const resolved = readingReviews.filter(item => item.status === 'Resuelta');
  const card = (review, isPending) => `<article class="panel stack"><div class="panel-head"><div><h3>${ctx.h(vehicleName(ctx, review.vehicleId))}</h3><p>${ctx.h(driverName(ctx, review.driverId))}</p></div>${ctx.badge(review.status, isPending ? 'warning' : 'success')}</div>
    <div class="metrics">${metric(ctx, 'Último cierre', km(review.lastCloseKm))}${metric(ctx, 'Lectura informada', km(review.reading))}${metric(ctx, 'Diferencia', delta(review.difference), isPending ? (review.kind === 'negative' ? 'metric-danger' : 'metric-warn') : 'metric-good')}</div>
    ${review.reason ? `<p>${ctx.h(review.reason)}</p>` : ''}${isPending && review.kind === 'negative' ? notice('warning', '<p>Apertura bloqueada hasta corregir el registro de cierre.</p>') : ''}
    <div class="actions">${act(ctx, 'Historial de lecturas', 'reading-history', review.vehicleId)}${isPending && review.kind === 'positive' ? act(ctx, 'Confirmar diferencia', 'confirm-reading', review.id) : ''}${isPending && readingTargets(ctx, review).length ? act(ctx, 'Corregir registro', 'correct-reading', review.id, 'primary') : ''}</div></article>`;
  return `${heading(ctx, 'Diferencias de kilometraje', 'Compará el último cierre con la lectura que informó el chofer.')}
    <div class="stack"><section class="stack"><div class="panel-head"><h2>Pendientes</h2><span>${pending.length}</span></div>${pending.map(item => card(item, true)).join('') || ctx.empty('Sin diferencias pendientes', 'Las lecturas que requieran revisión aparecen acá.')}</section>
    ${resolved.length ? `<section class="stack"><h2>Resueltas</h2>${resolved.map(item => card(item, false)).join('')}</section>` : ''}</div>`;
}

export function render(ctx, screen, params = {}) {
  switch (screen) {
    case 'jornada': return journey(ctx);
    case 'agenda': return agenda(ctx, params);
    case 'viaje': return tripDetail(ctx, params);
    case 'turnos': return shifts(ctx);
    case 'kilometraje': return readings(ctx);
    case 'revisiones': return reviews(ctx);
    default: return '';
  }
}

function requirePermission(ok) {
  if (!ok) throw new Error('Esta acción no está disponible con tu cuenta o para el estado actual.');
}
function goTrip(ctx, id) {
  const trip = records(ctx, 'trips', id);
  requirePermission(mayView(ctx, trip));
  const back = ctx.screen === 'viaje' ? ctx.params.back : ctx.screen;
  const returnParams = ctx.screen === 'viaje' ? ctx.params.returnParams : ctx.params;
  ctx.go('viaje', { id, back, returnParams });
}

export async function handle(ctx, action, el) {
  if (!action.startsWith('op:')) return false;
  const id = el.dataset.id;
  const trip = id && records(ctx, 'trips', id);
  const shift = id && records(ctx, 'shifts', id);
  const review = id && records(ctx, 'readingReviews', id);
  const plan = ctx.can('plan');
  const own = trip && owns(ctx, trip);
  const params = agendaParams(ctx, ctx.params);
  const goAgenda = updates => ctx.go('agenda', { ...params, ...updates });
  switch (action) {
    case 'op:edit-draft': {
      requirePermission(plan && resumeDraft);
      const edit = resumeDraft;
      resumeDraft = undefined;
      edit(); break;
    }
    case 'op:trip': goTrip(ctx, id); break;
    case 'op:back': {
      const fallback = plan ? 'agenda' : 'jornada';
      const destinations = [...(ctx.can('admin') ? ['resumen'] : []), 'agenda', 'jornada', 'revisiones', 'turnos', ...(ctx.can('commercial') ? ['liquidaciones', 'liquidacion'] : [])];
      const back = destinations.includes(ctx.params.back) ? ctx.params.back : fallback;
      ctx.go(back, ctx.params.returnParams || {}); break;
    }
    case 'op:receipt': {
      const item = records(ctx, 'fuel', id);
      requirePermission(ctx.can('drive') && item && item.driverId === ctx.driver?.id);
      ctx.go('carga', { id }); break;
    }
    case 'op:receipts': requirePermission(ctx.can('drive')); ctx.go('combustible', { filter: 'missing' }); break;
    case 'op:view': goAgenda({ view: el.dataset.view }); break;
    case 'op:day': goAgenda({ date: el.dataset.date, view: 'day' }); break;
    case 'op:today': goAgenda({ date: ctx.getState().today }); break;
    case 'op:move': goAgenda({ date: moveDate(params, Number(el.dataset.direction)) }); break;
    case 'op:clear-filters': goAgenda({ driverId: '', status: '', filter: '' }); break;
    case 'op:quick-filter': requirePermission(plan); goAgenda({ filter: params.filter === el.dataset.filter ? '' : el.dataset.filter, driverId: '', status: '' }); break;
    case 'op:agenda-filter': {
      const form = el.form || el;
      const values = ctx.form(form);
      goAgenda({ ...values, filter: values.driverId || values.status ? '' : params.filter });
      break;
    }
    case 'op:generate': requirePermission(plan); generate(ctx); break;
    case 'op:reschedule': requirePermission(plan); reprogram(ctx, trip, el.dataset.routeId); break;
    case 'op:reprogram-route': {
      requirePermission(plan);
      const { routeId, date } = ctx.form(el.form);
      const route = records(ctx, 'routes', routeId);
      if (!route) break;
      const onDate = ctx.getState().trips.filter(item => item.routeId === routeId && item.date === date);
      el.form.elements.entryTime.value = onDate.find(item => item.type === 'Entrada')?.time || route.entryTime;
      el.form.elements.exitTime.value = onDate.find(item => item.type === 'Salida')?.time || route.exitTime;
      break;
    }
    case 'op:open-shift': requirePermission(ctx.can('drive') && ctx.driver && !ownShift(ctx)); openShift(ctx); break;
    case 'op:opening-vehicle': {
      const vehicle = records(ctx, 'vehicles', el.value);
      const reference = el.form.querySelector('[data-opening-reference]');
      reference.textContent = openingReference(ctx, vehicle);
      const quickWrap = el.form.querySelector('[data-opening-quick]');
      const quickBtn = quickWrap?.querySelector('button');
      const busy = vehicle && ctx.getState().shifts.some(shift => shift.vehicleId === vehicle.id && !shift.closedAt);
      const unresolved = vehicle && ctx.getState().readingReviews.some(review => review.vehicleId === vehicle.id && review.kind === 'negative' && review.status === 'Pendiente');
      if (quickWrap && quickBtn && vehicle?.active && !busy && !unresolved && vehicle.lastCloseKm != null) {
        quickBtn.dataset.km = String(vehicle.lastCloseKm);
        quickBtn.textContent = `Usar último cierre (${km(vehicle.lastCloseKm)})`;
        quickWrap.hidden = false;
      } else if (quickWrap) {
        quickWrap.hidden = true;
      }
      el.form.querySelector('[data-operation-error]').replaceChildren(); break;
    }
    case 'op:use-last-km': {
      if (el.form?.elements.reading) {
        el.form.elements.reading.value = el.dataset.km || '';
        el.form.querySelector('[data-operation-error]')?.replaceChildren();
        el.form.elements.reading.focus();
      }
      break;
    }
    case 'op:request-reading': requirePermission(ctx.can('drive')); reportReading(ctx, ctx.form(el.form)); break;
    case 'op:close-shift': {
      requirePermission(shift && !shift.closedAt && (plan || (ctx.can('drive') && ctx.driver?.id === shift.driverId)));
      closeShift(ctx, shift, (plan && el.dataset.forgotten === 'true') || ctx.driver?.id !== shift.driverId); break;
    }
    case 'op:close-km': {
      const target = el.form.querySelector('[data-close-km]');
      const distance = Number(el.value) - Number(el.dataset.start);
      target.textContent = el.value === '' ? 'Ingresá el kilometraje final para calcular los kilómetros del turno.' : distance < 0 ? 'El kilometraje final debe ser igual o mayor que el inicial.' : `Kilómetros del turno: ${km(distance)}.`;
      break;
    }
    case 'op:shift-detail': requirePermission(shift); shiftDetail(ctx, shift); break;
    case 'op:reading-history': requirePermission(ctx.can('odometer')); readingHistory(ctx, id); break;
    case 'op:confirm-reading': requirePermission(ctx.can('odometer') && review?.status === 'Pendiente' && review.kind === 'positive'); confirmReading(ctx, review); break;
    case 'op:correct-reading': requirePermission(ctx.can('odometer') && review?.status === 'Pendiente'); correctReading(ctx, review); break;
    case 'op:start-trip': {
      requirePermission(own && trip.status === 'Programado');
      result(ctx, 'startTrip', { id }, 'Viaje iniciado.');
      if (ctx.screen === 'jornada') ctx.go('jornada');
      else if (ctx.screen !== 'viaje') ctx.go('viaje', { id, back: ctx.screen, returnParams: ctx.params });
      break;
    }
    case 'op:passenger': {
      requirePermission(own && trip.status === 'En curso');
      const { patient, status } = el.dataset;
      ctx.run('passenger', { id, patientId: patient, status });
      const buttons = document.querySelectorAll('[data-action="op:passenger"]');
      const selected = [...buttons].find(button => button.dataset.patient === patient && button.dataset.status === status);
      selected?.focus({preventScroll:true});
      const pending = records(ctx, 'trips', id).passengers.filter(person => !person.status).length;
      ctx.toast(pending ? `Guardado. ${pending === 1 ? 'Falta marcar 1 pasajero' : `Faltan marcar ${pending} pasajeros`}.` : 'Pasajeros registrados. Ya podés finalizar el viaje.');
      break;
    }
    case 'op:finish-trip': requirePermission(own && trip.status === 'En curso'); finish(ctx, trip); break;
    case 'op:no-trip': {
      requirePermission(trip && (plan || own) && ['Programado', 'En curso'].includes(trip.status));
      ctx.dialog({ title: 'Registrar como no realizado', body: `<p>${ctx.h(ctx.date(trip.date))} · ${ctx.h(trip.time)} · ${ctx.h(ctx.lookup('routes',trip.routeId))}</p>${reasonField('¿Por qué no se realizó el viaje?')}`, submitLabel: 'Confirmar no realizado', onSubmit({ reason }) { result(ctx, 'noTrip', { id, reason }, 'Viaje registrado como no realizado.'); } }); break;
    }
    case 'op:assign': requirePermission(plan && trip?.status === 'Programado'); assign(ctx, trip); break;
    case 'op:state': requirePermission(trip && mayCorrect(ctx, trip) && ['Realizado', 'No realizado'].includes(trip.status)); tripState(ctx, trip); break;
    case 'op:correct-trip': requirePermission(trip && mayCorrect(ctx, trip)); correctTrip(ctx, trip); break;
    case 'op:note': {
      requirePermission(trip && (plan || own));
      ctx.dialog({ title: 'Registrar novedad', body: reasonField('Novedad del viaje', 'text'), submitLabel: 'Guardar novedad', onSubmit({ text }) { result(ctx, 'addNote', { id, text }, 'Novedad guardada.'); } }); break;
    }
    case 'op:review-trip': requirePermission(plan && trip); reviewTrip(ctx, trip, el.dataset.review); break;
    default: return false;
  }
  return true;
}
