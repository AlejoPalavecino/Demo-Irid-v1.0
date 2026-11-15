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
function heading(ctx, title, subtitle, actions = '') {
  return `<header class="page-head"><div><h1>${ctx.h(title)}</h1><p>${ctx.h(subtitle)}</p></div>${actions ? `<div class="actions">${actions}</div>` : ''}</header>`;
}
function metric(ctx, label, value) {
  return `<div class="metric"><span>${ctx.h(label)}</span><strong>${ctx.h(value)}</strong></div>`;
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
function journey(ctx) {
  if (!ctx.can('drive') || !ctx.driver) return unavailable(ctx);
  const { today, trips, fuel } = ctx.getState();
  const shift = ownShift(ctx);
  const todayTrips = ordered(trips.filter(trip => trip.date === today && owns(ctx, trip)));
  const receipts = fuel.filter(item => item.driverId === ctx.driver.id && !item.receipt);
  const fuelButton = shift ? ctx.button('Registrar combustible', 'mg:fuel-edit', `data-vehicle="${ctx.h(shift.vehicleId)}"`, 'primary') : '';
  const turn = shift
    ? `<div><p class="section-label">Turno del vehículo</p><h2>${ctx.h(vehicleName(ctx, shift.vehicleId))}</h2><p>Odómetro inicial <strong>${ctx.h(km(shift.startKm))}</strong></p></div><div class="actions">${fuelButton}${act(ctx, 'Cerrar turno', 'close-shift', shift.id)}</div>`
    : `<div><p class="section-label">Turno del vehículo</p><h2>Sin turno abierto</h2><p>Elegí el vehículo y registrá la lectura del tablero para empezar.</p></div>${act(ctx, 'Abrir turno', 'open-shift', '', 'primary')}`;
  const receiptNotice = receipts.length ? notice('warning', `<div class="panel-head"><div><strong>${receipts.length === 1 ? 'Tenés 1 comprobante pendiente' : `Tenés ${receipts.length} comprobantes pendientes`}</strong><p>Adjuntá la foto a la carga que ya registraste.</p></div>${receipts.length === 1 ? act(ctx, 'Adjuntar comprobante', 'receipt', receipts[0].id) : act(ctx, 'Ver comprobantes', 'receipts')}</div>`) : '';
  return `${heading(ctx, 'Mi jornada', `${ctx.driver.name} · ${weekday.format(timeOf(today))} ${ctx.date(today)}`)}
    <div class="stack"><section class="panel"><div class="panel-head">${turn}</div></section>${receiptNotice}
    <section class="stack" aria-label="Viajes de hoy"><div class="panel-head"><h2>Viajes de hoy</h2><span>${todayTrips.length} ${todayTrips.length === 1 ? 'viaje' : 'viajes'}</span></div>
    ${todayTrips.length ? todayTrips.map(trip => tripCard(ctx, trip, false)).join('') : ctx.empty('Sin viajes asignados hoy', 'Los viajes que te asignen para hoy aparecen acá.')}</section></div>`;
}
function tripCard(ctx, trip, showDriver = true) {
  const route = records(ctx, 'routes', trip.routeId);
  const reasons = ctx.can('plan') ? pendingReviews(trip) : [];
  return `<article class="trip-card"><div class="trip-top"><div><strong class="time">${ctx.h(trip.time)}</strong> <span class="section-label">${ctx.h(trip.type)}</span></div>${ctx.badge(trip.status, TONES[trip.status])}</div><h3>${ctx.h(route?.name || 'Recorrido')}</h3><p>${ctx.h(route?.destination || '—')} · ${trip.passengers.length} ${trip.passengers.length === 1 ? 'pasajero' : 'pasajeros'}</p><div class="trip-bottom"><div>${showDriver ? `<p>${ctx.h(driverName(ctx, trip.driverId))}</p>` : ''}${reasons.length ? ctx.badge('Pendiente de revisión', 'warning') : ''}</div>${act(ctx, 'Ver viaje', 'trip', trip.id)}</div></article>`;
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
      return `<td>${act(ctx, day.slice(-2), 'day', '', day === today ? 'primary' : 'ghost', `data-date="${ctx.h(day)}" aria-label="${ctx.h(label)}"${day === today ? ' aria-current="date"' : ''}`)}${count ? `<small class="hint">${count} ${count === 1 ? 'viaje' : 'viajes'}</small>` : ''}</td>`;
    }).join('')}</tr>`);
  }
  return `<div class="table-wrap calendar-wrap"><table class="table" aria-label="Calendario del mes"><thead><tr>${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => `<th scope="col">${day}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}
function agenda(ctx, input) {
  const plan = ctx.can('plan');
  if (!plan && !ctx.can('drive')) return unavailable(ctx);
  const params = agendaParams(ctx, input);
  if (!plan) { params.driverId = ''; params.filter = ''; }
  const { date, view, driverId, status, filter } = params;
  const days = agendaDays(params);
  const { today, drivers, trips } = ctx.getState();
  const periodTrips = ordered(trips.filter(trip => (plan || owns(ctx, trip)) && trip.date >= days[0] && trip.date <= days.at(-1)));
  const filtered = periodTrips.filter(trip => (!driverId || trip.driverId === driverId) && (!status || trip.status === status) && (filter !== 'unassigned' || !trip.driverId) && (filter !== 'review' || pendingReviews(trip).length));
  const rows = new Map();
  for (const trip of filtered) {
    if (!rows.has(trip.date)) rows.set(trip.date, []);
    rows.get(trip.date).push(trip);
  }
  const caption = view === 'day' ? `${weekday.format(timeOf(date))} ${ctx.date(date)}`
    : view === 'week' ? `${ctx.date(days[0])} al ${ctx.date(days.at(-1))}` : monthName.format(timeOf(date));
  const switchView = ['Día', 'Semana', 'Mes'].map((label, index) => {
    const mode = ['day', 'week', 'month'][index];
    return act(ctx, label, 'view', '', view === mode ? 'primary' : 'secondary', `data-view="${mode}" aria-pressed="${view === mode}"`);
  }).join('');
  const clear = act(ctx, 'Limpiar filtros', 'clear-filters');
  const quick = plan ? `<div class="actions">${act(ctx, 'Sin asignar', 'quick-filter', '', filter === 'unassigned' ? 'primary' : 'secondary', `data-filter="unassigned" aria-pressed="${filter === 'unassigned'}"`)}${act(ctx, 'Pendientes de revisión', 'quick-filter', '', filter === 'review' ? 'primary' : 'secondary', `data-filter="review" aria-pressed="${filter === 'review'}"`)}</div>` : '';
  const agendaActions = plan ? `${act(ctx, 'Reprogramar', 'reschedule')}${act(ctx, 'Generar mes', 'generate', '', 'primary')}` : '';
  const statuses = STATES.map(state => ({ id: state, name: state }));
  const noTrips = driverId || status || filter ? ctx.empty('Sin coincidencias', 'Probá con otros filtros para este período.', clear)
    : ctx.empty('Sin viajes en este período', plan ? 'Podés elegir otras fechas o generar viajes desde los recorridos activos.' : 'Tus viajes asignados aparecerán acá.', plan ? act(ctx, 'Generar mes', 'generate') : '');
  const groups = [...rows].map(([day, group]) => `<section class="stack"><div class="panel-head"><h3>${ctx.h(`${weekday.format(timeOf(day))} ${ctx.date(day)}`)}</h3><span>${group.length} ${group.length === 1 ? 'viaje' : 'viajes'}</span></div>${group.map(trip => tripCard(ctx, trip, plan)).join('')}</section>`).join('');
  return `${heading(ctx, plan ? 'Agenda' : 'Mis viajes', plan ? 'Consultá la programación y organizá las asignaciones.' : 'Consultá tus viajes asignados por fecha.', agendaActions)}
    <div class="stack"><section class="panel stack" aria-label="Controles de agenda">
      <div class="panel-head"><h2>${ctx.h(caption)}</h2><div class="actions" aria-label="Vista de agenda">${switchView}</div></div>
      <div class="actions">${act(ctx, 'Anterior', 'move', '', 'secondary', 'data-direction="-1"')}${act(ctx, 'Hoy', 'today', '', date === today ? 'ghost' : 'secondary')}${act(ctx, 'Siguiente', 'move', '', 'secondary', 'data-direction="1"')}</div>
      <form class="toolbar" data-action="op:agenda-filter">${ctx.field('Ir a la fecha', 'date', date, 'date', 'required')}${plan ? ctx.select('Chofer', 'driverId', [{ id: '', name: 'Todos' }, ...drivers], driverId) : ''}${ctx.select('Estado', 'status', [{ id: '', name: 'Todos' }, ...statuses], status)}<button type="submit" class="btn secondary">Aplicar filtros</button>${driverId || status || filter ? clear : ''}</form>${quick}
    </section>${view === 'month' ? `<section class="panel">${calendar(ctx, days, filtered)}</section>` : ''}${groups || noTrips}</div>`;
}

function rowTable(ctx, headers, rows) {
  return `<div class="table-wrap"><table class="table"><thead><tr>${headers.map(label => `<th scope="col">${ctx.h(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(value => `<td>${ctx.h(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function editDraft(ctx, open) {
  resumeDraft = open;
  return act(ctx, 'Volver a editar', 'edit-draft');
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
  const table = groups.size ? rowTable(ctx, ['Recorrido', 'Fecha', 'Entradas nuevas', 'Salidas nuevas', 'Se conservan'], rows) : '<p>El mes seleccionado no tiene viajes previstos.</p>';
  const body = `<div class="stack"><p>${ctx.h(monthName.format(timeOf(`${payload.month}-01`)))}</p><div class="metrics">${metric(ctx, 'Entradas nuevas', preview.entries)}${metric(ctx, 'Salidas nuevas', preview.exits)}${metric(ctx, 'Viajes que se conservan', preview.existing.length)}</div>${!preview.missing.length && preview.existing.length ? '<p>Los viajes seleccionados ya están generados.</p>' : ''}${table}<div class="actions">${editDraft(ctx, () => generate(ctx, payload))}</div></div>`;
  if (!preview.missing.length) { ctx.dialog({ title: 'Vista previa de generación', body }); return; }
  ctx.confirm('Vista previa de generación', body, () => {
    result(ctx, 'generateMonth', payload, data => `Se generaron ${data.created} viajes. Se conservaron ${data.existing} existentes.`);
  }, 'Generar viajes');
}
function generate(ctx, draft) {
  const { routes } = ctx.getState();
  const active = routes.filter(route => route.active);
  if (!active.length) { ctx.dialog({ title: 'Generar mes', body: '<p>Necesitás un recorrido activo para generar viajes.</p>' }); return; }
  ctx.dialog({ title: 'Generar mes', submitLabel: 'Ver vista previa',
    body: `<div class="stack">${ctx.field('Mes a generar', 'month', draft?.month || agendaParams(ctx, ctx.params).date.slice(0, 7), 'month', 'required')}
    <fieldset><legend>Recorridos activos</legend>${active.map(route => `<label class="list-row"><span><strong>${ctx.h(route.name)}</strong><br><small>${route.group === 'LMV' ? 'Lunes, miércoles y viernes' : 'Martes, jueves y sábados'}</small></span><input type="checkbox" name="routeIds" value="${ctx.h(route.id)}"${!draft || draft.routeIds.includes(route.id) ? ' checked' : ''}></label>`).join('')}</fieldset></div>`,
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
  ctx.dialog({ title: 'Reprogramar recorrido', submitLabel: 'Revisar cambios',
    body: `<div class="form-grid">${ctx.select('Recorrido', 'routeId', choices, route.id, 'required data-change="op:reprogram-route"')}${ctx.field('Fecha desde la que se revisa', 'date', date, 'date', 'required data-change="op:reprogram-route"')}${ctx.select('Alcance', 'scope', [{ id: 'one', name: 'Sólo esta fecha' }, { id: 'rest', name: 'Desde esta fecha hasta fin de mes' }], draft?.scope || 'one')}${ctx.field('Horario de Entrada', 'entryTime', draft?.entryTime || entry?.time || route.entryTime, 'time', 'required')}${ctx.field('Horario de Salida', 'exitTime', draft?.exitTime || exit?.time || route.exitTime, 'time', 'required')}</div>${FORM_ERROR}`,
    onSubmit(payload, form) {
      try {
        const preview = ctx.preview('reschedule', payload);
        const comparisons = preview.affected.map(item => [ctx.date(item.date), item.type, item.time, item.type === 'Entrada' ? payload.entryTime : payload.exitTime]);
        const changed = comparisons.filter(([, , before, after]) => before !== after);
        const excluded = preview.excluded.map(({ trip: item, reason }) => [ctx.date(item.date), item.type, item.time, reason]);
        excluded.push(...comparisons.filter(([, , before, after]) => before === after).map(([date, type, time]) => [date, type, time, 'El horario propuesto coincide con el actual']));
        const body = `<div class="stack"><p>${ctx.h(ctx.lookup('routes', payload.routeId))}</p><section><h3>Viajes que se modificarán (${changed.length})</h3>${changed.length ? rowTable(ctx, ['Fecha', 'Tipo', 'Horario actual', 'Horario propuesto'], changed) : '<p>La selección no tiene cambios de horario aplicables.</p>'}</section><section><h3>Viajes excluidos (${excluded.length})</h3>${excluded.length ? rowTable(ctx, ['Fecha', 'Tipo', 'Horario', 'Motivo'], excluded) : '<p>Sin exclusiones.</p>'}</section><div class="actions">${editDraft(ctx, () => reprogram(ctx, trip, routeId, payload))}</div></div>${FORM_ERROR}`;
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
  if ((own || plan) && (scheduled || inCourse)) buttons.push(act(ctx, 'No realizado', 'no-trip', trip.id, 'danger'));
  if (final && mayCorrect(ctx, trip)) buttons.push(act(ctx, 'Corregir estado', 'state', trip.id));
  if (mayCorrect(ctx, trip)) buttons.push(act(ctx, 'Corregir kilómetros o chofer', 'correct-trip', trip.id));
  if (ctx.can('commercial')) buttons.push(ctx.button('Ajustar importes', 'fin:adjust', idAttr(ctx, trip.id)));
  if (own || plan) buttons.push(act(ctx, 'Registrar novedad', 'note', trip.id));
  const persons = trip.passengers.map(passenger => {
    const patient = records(ctx, 'patients', passenger.patientId);
    const status = passenger.status || 'Sin registrar';
    const picks = own && inCourse ? `<div class="actions">${['Recogido', 'No viajó'].map(value => act(ctx, value, 'passenger', trip.id, passenger.status === value ? 'primary' : 'secondary', `data-patient="${ctx.h(passenger.patientId)}" data-status="${ctx.h(value)}" aria-label="${ctx.h(`${value}: ${patient?.name || 'pasajero'}`)}" aria-pressed="${passenger.status === value}"`)).join('')}</div>` : '';
    return `<li class="list-row"><div><strong>${ctx.h(patient?.name || 'Pasajero')}</strong><p>${ctx.h(patient?.address || 'Sin domicilio registrado')}</p>${ctx.badge(status, passenger.status === 'Recogido' ? 'success' : '')}</div>${picks}</li>`;
  }).join('');
  const factsHtml = facts(ctx, [['Horario', trip.time], ['Tipo', trip.type], ['Destino', route?.destination], ['Chofer', driverName(ctx, trip.driverId)], ['Vehículo del viaje', trip.vehicleId ? vehicleName(ctx, trip.vehicleId) : 'Se toma del turno al iniciar'], ...(plan ? [['Kilómetros comerciales', km(trip.commercialKm)]] : []), ...(ctx.can('commercial') ? [['Importe del viaje', ctx.money(trip.amount)], ['Remuneración', ctx.money(trip.driverPay)]] : [])]);
  const reviewNotice = reviews.length ? notice('warning', `<h2>Motivos de revisión</h2><ul>${reviews.map(review => `<li class="list-row"><span>${ctx.h(review.reason)}</span>${act(ctx, 'Marcar como revisado', 'review-trip', trip.id, 'secondary', `data-review="${ctx.h(review.id)}"`)}</li>`).join('')}</ul>`) : '';
  const notes = [...trip.notes].reverse().map(note => `<li><p>${ctx.h(note.text)}</p><p class="hint">${ctx.h(dateTime(ctx, note.at))} · ${ctx.h(ctx.lookup('users', note.authorId))}</p></li>`).join('');
  return `${heading(ctx, route?.name || 'Detalle del viaje', `${ctx.date(trip.date)} · ${trip.type} · ${trip.time}`, act(ctx, 'Volver', 'back'))}
    <div class="stack"><section class="panel stack"><div class="panel-head"><h2>Datos del viaje</h2>${ctx.badge(trip.status, TONES[trip.status])}</div>${factsHtml}${trip.nonperformanceReason ? `<p><strong>Motivo de no realización</strong> ${ctx.h(trip.nonperformanceReason)}</p>` : ''}${workflow.join('')}${buttons.length ? `<div class="actions">${buttons.join('')}</div>` : ''}</section>${reviewNotice}
    <section class="panel"><h2>Pasajeros</h2>${persons ? `<ul class="stack">${persons}</ul>` : '<p class="hint">Sin pasajeros previstos.</p>'}</section>
    <section class="panel"><h2>Historial del viaje</h2>${notes ? `<h3>Novedades</h3><ol class="history">${notes}</ol>` : ''}${history(ctx, trip.history)}</section></div>`;
}

function assign(ctx, trip) {
  const drivers = ctx.getState().drivers.filter(driver => driver.active);
  ctx.dialog({ title: 'Asignar o cambiar chofer', submitLabel: 'Confirmar asignación',
    body: `<div class="stack"><p>${ctx.h(`${ctx.date(trip.date)} · ${trip.time} · ${trip.type}`)}</p>${facts(ctx, [['Chofer actual', driverName(ctx, trip.driverId)]])}
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
  ctx.confirm('Finalizar viaje', `<div class="stack">${facts(ctx, [[`Recogidos (${picked.length})`, names(picked)], [`No viajaron (${noRide.length})`, names(noRide)]])}${picked.length ? '' : notice('info', '<p>Confirmá si hiciste el recorrido previsto, aunque no haya viajado ningún pasajero.</p>')}</div>`, () => result(ctx, 'finishTrip', { id: trip.id }, 'Viaje registrado como realizado.'), 'Confirmar finalización');
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
    <div class="stack">${trips.map(trip => `<section class="panel stack">${tripCard(ctx, trip)}<p class="hint">${ctx.h(ctx.date(trip.date))}</p><ul class="stack">${pendingReviews(trip).map(review => `<li class="list-row"><span>${ctx.h(review.reason)}</span>${act(ctx, 'Marcar como revisado', 'review-trip', trip.id, 'secondary', `data-review="${ctx.h(review.id)}"`)}</li>`).join('')}</ul></section>`).join('') || ctx.empty('Sin revisiones pendientes', 'Los viajes con avisos operativos aparecen acá.')}</div>`;
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
    ${ctx.field('Lectura actual del odómetro (km)', 'reading', '', 'number', 'required min="0" step="1" inputmode="numeric"')}${FORM_ERROR}</div>`,
    onSubmit(values, form) {
      try { result(ctx, 'openShift', values, 'Turno abierto.'); }
      catch (error) {
        const vehicle = records(ctx, 'vehicles', values.vehicleId);
        const busy = ctx.getState().shifts.some(shift => shift.vehicleId === values.vehicleId && !shift.closedAt);
        if (!vehicle?.active || busy || ownShift(ctx) || vehicle.lastCloseKm == null || Number(values.reading) >= vehicle.lastCloseKm) throw error;
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
  const row = (shift, isOpen) => `<article class="list-row"><div><strong>${ctx.h(vehicleName(ctx, shift.vehicleId))}</strong><p>${ctx.h(driverName(ctx, shift.driverId))} · Apertura ${ctx.h(dateTime(ctx, shift.openedAt))}</p><p>${isOpen ? `Lectura inicial ${ctx.h(km(shift.startKm))}` : `Cierre ${ctx.h(dateTime(ctx, shift.closedAt))} · ${ctx.h(km(shift.endKm - shift.startKm))}`}</p></div><div class="actions">${act(ctx, 'Ver turno', 'shift-detail', shift.id)}${isOpen ? act(ctx, 'Cerrar turno por olvido', 'close-shift', shift.id, 'secondary', 'data-forgotten="true"') : ''}</div></article>`;
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
    <div class="metrics">${metric(ctx, 'Último cierre', km(review.lastCloseKm))}${metric(ctx, 'Lectura informada', km(review.reading))}${metric(ctx, 'Diferencia', delta(review.difference))}</div>
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
      const destinations = ['agenda', 'jornada', 'revisiones', 'turnos', ...(ctx.can('commercial') ? ['liquidaciones', 'liquidacion'] : [])];
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
    case 'op:agenda-filter': goAgenda(ctx.form(el)); break;
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
      const reference = el.form.querySelector('[data-opening-reference]');
      reference.textContent = openingReference(ctx, records(ctx, 'vehicles', el.value));
      el.form.querySelector('[data-operation-error]').replaceChildren(); break;
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
    case 'op:start-trip': requirePermission(own && trip.status === 'Programado'); result(ctx, 'startTrip', { id }, 'Viaje iniciado.'); break;
    case 'op:passenger': requirePermission(own && trip.status === 'En curso'); result(ctx, 'passenger', { id, patientId: el.dataset.patient, status: el.dataset.status }, 'Estado del pasajero guardado.'); break;
    case 'op:finish-trip': requirePermission(own && trip.status === 'En curso'); finish(ctx, trip); break;
    case 'op:no-trip': {
      requirePermission(trip && (plan || own) && ['Programado', 'En curso'].includes(trip.status));
      ctx.dialog({ title: 'Registrar como no realizado', body: reasonField('Motivo de no realización'), submitLabel: 'Confirmar no realizado', onSubmit({ reason }) { result(ctx, 'noTrip', { id, reason }, 'Viaje registrado como no realizado.'); } }); break;
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
