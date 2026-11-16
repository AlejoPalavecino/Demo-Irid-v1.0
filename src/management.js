const masters = {
  patients: { screen: 'pacientes', title: 'Pacientes', singular: 'Paciente', create: 'Nuevo paciente', summary: 'Domicilios de traslado y participación en recorridos.' },
  drivers: { screen: 'choferes', title: 'Choferes', singular: 'Chofer', create: 'Nuevo chofer', summary: 'Datos de contacto y estado operativo de los choferes.' },
  vehicles: { screen: 'vehiculos', title: 'Vehículos', singular: 'Vehículo', create: 'Nuevo vehículo', summary: 'Vehículos de la flota, lecturas e intervenciones.' },
  routes: { screen: 'recorridos', title: 'Recorridos', singular: 'Recorrido', create: 'Nuevo recorrido', summary: 'Programación habitual y orden de las paradas.' }
};
const activityOptions = [
  { id: 'active', name: 'Activos' },
  { id: 'inactive', name: 'Inactivos' },
  { id: 'all', name: 'Todos' }
];
const fuelFilters = [
  { id: 'pending', name: 'Todos los pendientes' },
  { id: 'missing', name: 'Pendiente de comprobante' },
  { id: 'unverified', name: 'Pendiente de verificación' },
  { id: 'verified', name: 'Verificada' },
  { id: 'all', name: 'Todas las cargas' }
];
const fuels = ['GNC', 'Nafta', 'Gasoil'];
const expenseCategories = ['Seguro', 'GPS', 'Mantenimiento', 'Cubiertas', 'Reparaciones'];
const roles = {
  admin: { name: 'Administrador', access: ['Planificación y gestión operativa', 'Consulta de flota y choferes', 'Revisión de odómetro', 'Consulta de combustible y comprobantes', 'Corrección y verificación de combustible', 'Gastos de flota', 'Tarifas y liquidaciones', 'Gestión de usuarios'] },
  encargado: { name: 'Encargado', access: ['Planificación y gestión operativa', 'Consulta de flota y choferes', 'Revisión de odómetro', 'Consulta de combustible y comprobantes', 'Gastos de flota'] },
  secretaria: { name: 'Secretaria', access: ['Consulta de flota y choferes', 'Consulta de combustible y comprobantes', 'Corrección y verificación de combustible', 'Gastos de flota'] },
  chofer: { name: 'Chofer', access: ['Mi jornada, viajes propios y turnos', 'Registro de cargas y comprobantes propios'] }
};

const options = values => values.map(value => ({ id: value, name: value }));
const recordName = item => item.name ?? item.alias;
const unit = type => type === 'GNC' ? 'm³' : 'L';
const normalize = text => String(text ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const fuelStatus = item => !item.receipt ? 'missing' : item.verified ? 'verified' : 'unverified';
const verified = item => fuelStatus(item) === 'verified';
const number = value => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3 }).format(value);
const attr = (ctx, key, value) => `data-${key}="${ctx.h(value)}"`;
const masterRead = (ctx, collection) => Object.hasOwn(masters, collection) && (
  ctx.can('masters') || (['drivers', 'vehicles'].includes(collection) && ctx.can('fleetRead'))
);
const fuelScopeAll = ctx => ctx.can('fleetRead') || ctx.can('fuelVerify');
const ownsFuel = (ctx, item) => Boolean(ctx.driver && item.driverId === ctx.driver.id);
const fuelRead = (ctx, item) => ctx.can('fuelRead') && (fuelScopeAll(ctx) || ownsFuel(ctx, item));
const fuelEdit = (ctx, item) => ctx.can('fuelVerify') ||
  (ctx.can('drive') && ctx.driver?.active && ownsFuel(ctx, item) && item.userId === ctx.user.id && !item.verified);
const openShift = ctx => ctx.can('drive') && ctx.driver?.active && ctx.getState().shifts.find(shift => shift.driverId === ctx.driver.id && !shift.closedAt);
const vehicleName = (ctx, id) => ctx.lookup('vehicles', id, 'alias');

function page(ctx, title, summary, actions = '', eyebrow = 'Gestión', backHTML = '') {
  return `<header class="page-head"><div>${backHTML}<p class="eyebrow">${ctx.h(eyebrow)}</p><h1>${ctx.h(title)}</h1>${summary ? `<p>${ctx.h(summary)}</p>` : ''}</div>${actions ? `<div class="actions">${actions}</div>` : ''}</header>`;
}

function panel(ctx, title, body) {
  return `<section class="panel stack"><h2>${ctx.h(title)}</h2>${body}</section>`;
}

function kv(ctx, pairs) {
  return `<dl class="key-value">${pairs.map(([label, value]) => `<dt>${ctx.h(label)}</dt><dd>${ctx.h(value ?? '—')}</dd>`).join('')}</dl>`;
}

function table(ctx, caption, headers, rows) {
  return `<div class="table-wrap records-table" role="region" aria-label="${ctx.h(caption)}"><table class="table" role="table"><thead role="rowgroup"><tr role="row">${headers.map(label => `<th scope="col" role="columnheader">${ctx.h(label)}</th>`).join('')}</tr></thead><tbody role="rowgroup">${rows.map(row => `<tr role="row">${row.map((value, index) => `<td role="cell" data-label="${ctx.h(headers[index])}"><div class="cell-value">${value}</div></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

const historyFields = {
  name: 'Nombre', address: 'Domicilio', phone: 'Teléfono', alias: 'Alias', plate: 'Patente',
  group: 'Días', entryTime: 'Horario de Entrada', exitTime: 'Horario de Salida', destination: 'Destino',
  baseKm: 'Kilómetros base', basePrice: 'Valor base', patientIds: 'Orden de paradas',
  date: 'Fecha', time: 'Hora', vehicleId: 'Vehículo', type: 'Combustible', quantity: 'Cantidad',
  amount: 'Importe', odometer: 'Odómetro', receipt: 'Comprobante', verified: 'Verificación',
  category: 'Categoría', description: 'Descripción', provider: 'Taller o proveedor', active: 'Estado'
};

function historyValue(ctx, key, value) {
  if (key === 'receipt') return value ? 'Adjunto' : 'Sin comprobante';
  if (key === 'patientIds') return value?.map(id => ctx.lookup('patients', id)).join(' → ') || 'Sin paradas';
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'amount' || key === 'basePrice') return ctx.money(value);
  if (key === 'date') return ctx.date(value);
  if (key === 'vehicleId') return vehicleName(ctx, value);
  if (key === 'group') return value === 'LMV' ? 'Lunes, miércoles y viernes' : 'Martes, jueves y sábado';
  if (key === 'verified') return value ? 'Verificada' : 'Pendiente';
  if (key === 'active') return value ? 'Activo' : 'Inactivo';
  return value;
}

function historyDiff(ctx, entry) {
  const from = entry.before;
  const to = entry.after;
  if (!from || !to || typeof from !== 'object' || typeof to !== 'object') return '';
  const keys = Object.keys(historyFields).filter(key => Object.hasOwn(from, key) && Object.hasOwn(to, key) &&
    (key !== 'basePrice' || ctx.can('commercial')) && JSON.stringify(from[key]) !== JSON.stringify(to[key]));
  return keys.length ? `<ul>${keys.map(key => {
    const label = ctx.h(historyFields[key]);
    if (key === 'receipt' && from.receipt && to.receipt) return `<li><strong>${label}</strong> · Se reemplazó la imagen.</li>`;
    return `<li><strong>${label}</strong> · ${ctx.h(historyValue(ctx, key, from[key]))} → ${ctx.h(historyValue(ctx, key, to[key]))}</li>`;
  }).join('')}</ul>` : '';
}

function history(ctx, entries, redact = false) {
  if (!entries.length) return '<p class="hint">Todavía no hay cambios registrados.</p>';
  return `<ol class="history">${entries.slice().reverse().map(entry => {
    const when = String(entry.at ?? '').replace('T', ' ');
    const who = entry.actorId ? ctx.lookup('users', entry.actorId) : 'Sistema';
    const safeText = !redact || ['Se dio de alta el registro', 'Se actualizó el registro', 'Se actualizaron los datos del registro', 'Se dio de baja el registro'].includes(entry.text);
    return `<li><strong>${ctx.h(safeText ? entry.text : 'Actualización de la ficha')}</strong><p class="hint">${ctx.h(ctx.date(when.slice(0, 10)))} ${ctx.h(when.slice(11, 16))} · ${ctx.h(who)}</p>${!redact && entry.reason ? `<p>${ctx.h(entry.reason)}</p>` : ''}${historyDiff(ctx, entry)}</li>`;
  }).join('')}</ol>`;
}

function statusBadge(ctx, active) {
  return ctx.badge(active ? 'Activo' : 'Inactivo', active ? 'success' : 'neutral');
}

function masterList(ctx, collection, params) {
  const meta = masters[collection];
  const { q = '', status = 'active' } = params;
  const editable = ctx.can('masters');
  const newButton = editable ? ctx.button(meta.create, 'mg:master-edit', attr(ctx, 'collection', collection), 'primary') : '';
  const all = ctx.state[collection];
  const records = all.filter(item => {
    const searchable = [recordName(item), item.plate, item.address, item.destination, item.phone].map(normalize);
    return (status === 'all' || item.active === (status === 'active')) && searchable.some(value => value.includes(normalize(q)));
  }).sort((a, b) => recordName(a).localeCompare(recordName(b), 'es-AR'));
  const tool = `<form class="toolbar" data-action="mg:master-filter" ${attr(ctx, 'collection', collection)}>
    ${ctx.field('Buscar', 'q', q, 'search')}${ctx.select('Estado', 'status', activityOptions, status, 'data-change="mg:master-filter"')}
    <button type="submit" class="btn secondary">Aplicar filtros</button>
  </form>`;
  const details = {
    patients: ['Domicilio', item => item.address],
    drivers: ['Teléfono', item => item.phone],
    vehicles: ['Patente', item => item.plate],
    routes: ['Días', item => item.group === 'LMV' ? 'Lunes, miércoles y viernes' : 'Martes, jueves y sábado']
  }[collection];
  const body = records.length ? table(ctx, meta.title, [meta.singular, details[0], 'Estado', 'Acciones'], records.map(item => [
    `<strong>${ctx.h(recordName(item))}</strong>`,
    ctx.h(details[1](item) || '—'),
    statusBadge(ctx, item.active),
    ctx.button('Ver ficha', 'mg:master-view', `${attr(ctx, 'collection', collection)} ${attr(ctx, 'id', item.id)} aria-label="${ctx.h(`Ver ficha de ${recordName(item)}`)}"`, 'small')
  ])) : ctx.empty(all.length ? 'No hay coincidencias' : 'Todavía no hay registros',
    all.length ? 'Probá otra búsqueda o cambiá el estado.' : `Las fichas de ${meta.title.toLowerCase()} aparecerán acá.`,
    all.length ? ctx.button('Limpiar filtros', 'mg:master-clear', attr(ctx, 'collection', collection)) : newButton);
  return page(ctx, meta.title, meta.summary, newButton) + `<section class="panel stack">${tool}${body}</section>`;
}

function masterDetail(ctx, collection, item) {
  const meta = masters[collection];
  const recordAttrs = `${attr(ctx, 'collection', collection)} ${attr(ctx, 'id', item.id)}`;
  const editable = item.active && ctx.can('masters');
  const backBtn = ctx.button(`← Volver a ${meta.title.toLowerCase()}`, 'mg:master-back',
    `${attr(ctx, 'collection', collection)} ${attr(ctx, 'q', ctx.params?.q ?? '')} ${attr(ctx, 'status', ctx.params?.status ?? 'active')}`, 'back-link');
  const actions = [
    editable ? ctx.button('Editar', 'mg:master-edit', recordAttrs, 'primary') : '',
    editable && collection === 'routes' && ctx.can('plan')
      ? ctx.button('Reprogramar', 'op:reschedule', attr(ctx, 'route-id', item.id)) : '',
    editable ? ctx.button('Dar de baja', 'mg:master-deactivate', recordAttrs, 'danger') : ''
  ].join('');
  const data = {
    patients: () => [['Domicilio', item.address], ['Teléfono', item.phone || '—']],
    drivers: () => [['Teléfono', item.phone || '—'], ['Cuenta vinculada', item.userId ? ctx.lookup('users', item.userId) : 'Sin cuenta vinculada']],
    vehicles: () => [['Patente', item.plate], ['Capacidad', `${item.capacity} pasajeros`], ['Último kilometraje de cierre', `${number(item.lastCloseKm)} km`]],
    routes: () => [
      ['Días', item.group === 'LMV' ? 'Lunes, miércoles y viernes' : 'Martes, jueves y sábado'],
      ['Horario de Entrada', item.entryTime],
      ['Horario de Salida', item.exitTime],
      ['Destino', item.destination],
      ['Kilómetros base', `${number(item.baseKm)} km`],
      ...(ctx.can('commercial') ? [['Valor base', ctx.money(item.basePrice)]] : [])
    ]
  }[collection]();
  let related = '';
  if (collection === 'routes') {
    related = panel(ctx, 'Orden de paradas', item.patientIds.length
      ? `<ol class="stack">${item.patientIds.map(id => {
        const patient = ctx.state.patients.find(record => record.id === id);
        return `<li><strong>${ctx.h(patient?.name ?? 'Paciente')}</strong> <span class="hint">${ctx.h(patient?.address ?? '')}</span>${patient?.active === false ? ` ${statusBadge(ctx, false)}` : ''}</li>`;
      }).join('')}</ol>`
      : '<p class="hint">El recorrido no tiene paradas registradas.</p>');
  }
  if (collection === 'patients') {
    const routes = ctx.state.routes.filter(route => route.patientIds.includes(item.id));
    related = panel(ctx, 'Recorridos', routes.length ? `<ul class="stack">${routes.map(route => `<li>${ctx.button(route.name, 'mg:master-view', `${attr(ctx, 'collection', 'routes')} ${attr(ctx, 'id', route.id)}`, 'ghost')} ${statusBadge(ctx, route.active)}</li>`).join('')}</ul>` : '<p class="hint">Todavía no participa en recorridos.</p>');
  }
  if (collection === 'vehicles' && ctx.can('expense')) related = vehicleExpenses(ctx, item);
  return page(ctx, recordName(item), '', actions, meta.singular, backBtn)
    + `<div class="stack">${panel(ctx, 'Datos de la ficha', statusBadge(ctx, item.active) + kv(ctx, data))}${related}${panel(ctx, 'Historial de cambios', history(ctx, item.history, collection === 'routes' && !ctx.can('commercial')))}</div>`;
}

function masterForm(ctx, collection, item) {
  const meta = masters[collection];
  const record = item ?? {};
  const required = 'required';
  const entry = (label, name, type = 'text', attrs = required) => ctx.field(label, name, record[name] ?? '', type, attrs);
  let body;
  if (collection === 'vehicles') {
    body = entry('Alias', 'alias') + entry('Patente', 'plate') +
      ctx.field('Capacidad de pasajeros', 'capacity', record.capacity ?? 4, 'number', 'readonly');
    if (!item) body += ctx.field('Lectura inicial del odómetro (km)', 'lastCloseKm', '0', 'number', 'min="0" step="1"');
  } else {
    body = entry('Nombre', 'name');
    if (collection === 'patients') body += entry('Domicilio', 'address');
    if (collection !== 'routes') body += entry('Teléfono', 'phone', 'tel', '');
  }
  if (collection === 'routes') {
    body += ctx.select('Días', 'group', [
      { id: 'LMV', name: 'Lunes, miércoles y viernes' },
      { id: 'MJS', name: 'Martes, jueves y sábado' }
    ], record.group ?? 'LMV', required) + entry('Horario de Entrada', 'entryTime', 'time') + entry('Horario de Salida', 'exitTime', 'time')
      + entry('Destino', 'destination') + entry('Kilómetros base', 'baseKm', 'number', 'required min="0" step="any"');
    if (ctx.can('commercial')) body += entry('Valor base ($)', 'basePrice', 'number', 'required min="0" step="0.01"');
    const patients = ctx.state.patients.filter(patient => patient.active || record.patientIds?.includes(patient.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'es-AR'));
    const choices = [{ id: '', name: 'Sin paciente' }, ...patients.map(patient => ({
      id: patient.id, name: patient.active ? patient.name : `${patient.name} (inactivo)`
    }))];
    body += `<fieldset class="field-full stack"><legend>Orden de paradas</legend><p class="hint">Elegí hasta cuatro pacientes distintos. El número indica el orden del traslado.</p><div class="form-grid">${Array.from({ length: 4 }, (_, index) => ctx.select(`Parada ${index + 1}`, `stop${index + 1}`, choices, record.patientIds?.[index] ?? '')).join('')}</div></fieldset>`;
  }
  ctx.dialog({
    title: item ? `Editar ${meta.singular.toLowerCase()}` : meta.create,
    body: `<div class="form-grid">${body}</div>`,
    onSubmit(values) {
      const data = { ...values };
      if (collection === 'routes') {
        data.patientIds = [values.stop1, values.stop2, values.stop3, values.stop4].filter(Boolean);
        if (new Set(data.patientIds).size !== data.patientIds.length) throw new Error('Elegí un paciente distinto en cada parada.');
        delete data.stop1;
        delete data.stop2;
        delete data.stop3;
        delete data.stop4;
      }
      if (collection === 'vehicles' && data.lastCloseKm === '') delete data.lastCloseKm;
      ctx.run('saveMaster', { collection, id: item?.id, data });
      ctx.toast(item ? 'Cambios guardados.' : 'Ficha creada.');
    }
  });
}

function deactivateMaster(ctx, collection, item) {
  const trips = ctx.getState().trips;
  const today = ctx.getState().today;
  const linked = trip => ({
    patients: () => trip.passengers.some(passenger => passenger.patientId === item.id),
    routes: () => trip.routeId === item.id,
    drivers: () => trip.driverId === item.id,
    vehicles: () => false
  })[collection]();
  const canBeAffected = trip => trip.status === 'Programado' || (collection !== 'drivers' && trip.status === 'En curso');
  const affected = trips.filter(trip => trip.date >= today && canBeAffected(trip) && linked(trip))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const access = collection === 'drivers' && ctx.state.users.find(account => account.id === item.userId)?.roles.includes('chofer');
  const impact = collection === 'drivers'
    ? (access ? 'Se retira el rol Chofer de la cuenta. Los demás roles que tenga seguirán activos. ' : '')
      + (affected.length ? 'Estos viajes programados quedarán sin asignar y pendientes de reemplazo.' : 'No hay viajes programados que desasignar.')
    : collection === 'vehicles' ? 'El vehículo quedará fuera de la selección para abrir turnos.'
      : (affected.length ? 'Estos viajes conservarán su programación y quedarán pendientes de revisión.' : 'No hay viajes que señalar para revisión.');
  ctx.confirm('Dar de baja', `<div class="stack"><p><strong>${ctx.h(recordName(item))}</strong> quedará inactivo. Se conserva su historial.</p><p>${ctx.h(impact)}</p>${affected.length ? `<ul>${affected.map(trip => `<li>${ctx.h(ctx.date(trip.date))} · ${ctx.h(trip.time)} · ${ctx.h(trip.type)} · ${ctx.h(ctx.lookup('routes', trip.routeId))}</li>`).join('')}</ul>` : ''}</div>`, () => {
    ctx.run('deactivate', { collection, id: item.id });
    ctx.toast('Baja registrada. Podés consultar la ficha en Inactivos.');
  }, 'Confirmar baja');
}

function fuelBadge(ctx, item) {
  const status = fuelStatus(item);
  return ctx.badge(fuelFilters.find(option => option.id === status).name, status === 'verified' ? 'success' : 'warning');
}

function vehicleOptions(ctx) {
  return ctx.state.vehicles.map(vehicle => ({ id: vehicle.id, name: `${vehicle.alias} · ${vehicle.plate}` }));
}

function dateTime(ctx, item) {
  return `${ctx.date(item.date)}${item.time ? ` · ${item.time}` : ''}`;
}

function stat(ctx, label, value) {
  return `<div class="metric"><span>${ctx.h(label)}</span><strong>${ctx.h(value)}</strong></div>`;
}

function fuelList(ctx, params) {
  const { filter = 'pending', vehicleId = '', driverId = '', month = '' } = params;
  const all = ctx.state.fuel.filter(item => fuelRead(ctx, item));
  const monthAndScope = all.filter(item => (!month || item.date.startsWith(month)) &&
    (!vehicleId || item.vehicleId === vehicleId) && (!driverId || item.driverId === driverId));
  const rows = monthAndScope.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !verified(item);
    return fuelStatus(item) === filter;
  }).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  const newButton = openShift(ctx) ? ctx.button('Registrar combustible', 'mg:fuel-edit', '', 'primary') : '';
  const tool = `<form class="toolbar" data-action="mg:fuel-filter">
    ${ctx.field('Mes', 'month', month, 'month', 'data-change="mg:fuel-filter"')}
    ${ctx.select('Vehículo', 'vehicleId', [{ id: '', name: 'Todos' }, ...vehicleOptions(ctx).filter(vehicle => fuelScopeAll(ctx) || all.some(item => item.vehicleId === vehicle.id))], vehicleId, 'data-change="mg:fuel-filter"')}
    ${fuelScopeAll(ctx) ? ctx.select('Chofer', 'driverId', [{ id: '', name: 'Todos' }, ...ctx.state.drivers], driverId, 'data-change="mg:fuel-filter"') : ''}
    ${ctx.select('Comprobante', 'filter', fuelFilters, filter, 'data-change="mg:fuel-filter"')}
    <button type="submit" class="btn secondary">Aplicar filtros</button>
  </form>`;
  const sum = records => ctx.money(records.reduce((total, item) => total + item.amount, 0));
  const totals = monthAndScope.length ? `<section class="panel stack">
    <h2>Totales de combustible</h2><p class="hint">Incluyen cargas verificadas y pendientes del mes, vehículo y chofer seleccionados.</p>
    <div class="grid-3">${stat(ctx, 'Total registrado', sum(monthAndScope))}${stat(ctx, 'Verificado', sum(monthAndScope.filter(verified)))}${stat(ctx, 'Pendiente', sum(monthAndScope.filter(item => !verified(item))))}</div>
    ${table(ctx, 'Cantidades por tipo de combustible', ['Combustible', 'Cantidad total', 'Verificado', 'Pendiente'], fuels.filter(type => monthAndScope.some(item => item.type === type)).map(type => {
      const items = monthAndScope.filter(item => item.type === type);
      const quantity = records => ctx.h(`${number(records.reduce((total, item) => total + item.quantity, 0))} ${unit(type)}`);
      return [ctx.h(type), quantity(items), quantity(items.filter(verified)), quantity(items.filter(item => !verified(item)))];
    }))}
  </section>` : '';
  const body = rows.length ? table(ctx, 'Cargas de combustible', ['Fecha y hora', 'Vehículo', 'Chofer', 'Combustible', 'Cantidad', 'Importe', 'Comprobante', 'Acciones'], rows.map(item => [
    ctx.h(dateTime(ctx, item)), ctx.h(vehicleName(ctx, item.vehicleId)), ctx.h(ctx.lookup('drivers', item.driverId)), ctx.h(item.type),
    ctx.h(`${number(item.quantity)} ${unit(item.type)}`), ctx.h(ctx.money(item.amount)), fuelBadge(ctx, item),
    ctx.button('Ver carga', 'mg:fuel-view', `${attr(ctx, 'id', item.id)} aria-label="${ctx.h(`Ver carga de ${item.type} del ${dateTime(ctx, item)}`)}"`, 'small')
  ])) : ctx.empty(all.length ? 'No hay cargas para esta consulta' : 'Todavía no hay cargas',
    all.length ? 'Cambiá los filtros para ver otras cargas.' : 'Las cargas registradas aparecerán acá.',
    all.length ? ctx.button('Limpiar filtros', 'mg:fuel-clear') : newButton);
  return page(ctx, 'Combustible', 'Cargas, comprobantes y estado de verificación.', newButton, 'Flota')
    + `<div class="stack"><section class="panel stack">${tool}${body}</section>${totals}</div>`;
}

const receiptURI = /^data:image\/(?:[a-z0-9.+-]+)(?:;charset=[a-z0-9-]+)?(?:;base64)?,/i;

function receiptImage(ctx, receipt) {
  return receipt && receiptURI.test(receipt)
    ? `<img class="receipt-preview" src="${ctx.h(receipt)}" alt="Foto del comprobante de combustible">`
    : '';
}

function fuelDetail(ctx, item) {
  const itemAttr = attr(ctx, 'id', item.id);
  const editable = fuelEdit(ctx, item);
  const backBtn = ctx.button('← Volver a combustible', 'mg:fuel-back', ['filter', 'month', 'vehicleId', 'driverId'].map(key => {
    const dataKey = { vehicleId: 'vehicle-id', driverId: 'driver-id' }[key] ?? key;
    return attr(ctx, dataKey, ctx.params?.[key] ?? '');
  }).join(' '), 'back-link');
  const verifyBtn = ctx.can('fuelVerify') && !item.verified
    ? item.receipt
      ? ctx.button('Marcar como verificada', 'mg:fuel-verify', itemAttr, 'primary')
      : '<button type="button" class="btn secondary" disabled aria-describedby="mg-missing-receipt">Marcar como verificada</button>'
    : '';
  const attachBtn = editable && !item.receipt ? ctx.button('Adjuntar comprobante', 'mg:fuel-edit', `${itemAttr} data-mode="attach"`, 'primary') : '';
  const controls = [
    attachBtn,
    editable ? ctx.button('Corregir', 'mg:fuel-edit', itemAttr) : '',
    verifyBtn
  ].join('');
  const pairs = [
    ['Fecha y hora', dateTime(ctx, item)], ['Vehículo', vehicleName(ctx, item.vehicleId)],
    ['Chofer', ctx.lookup('drivers', item.driverId)], ['Registrada por', ctx.lookup('users', item.userId)],
    ['Combustible', item.type], ['Cantidad', `${number(item.quantity)} ${unit(item.type)}`],
    ['Importe', ctx.money(item.amount)], ['Odómetro', `${number(item.odometer)} km`]
  ];
  const photo = receiptImage(ctx, item.receipt) || '<p id="mg-missing-receipt" class="notice warning">Falta adjuntar el comprobante</p>';
  const photoActions = (item.receipt ? verifyBtn : attachBtn) ? `<div class="actions">${item.receipt ? verifyBtn : attachBtn}</div>` : '';
  const pendingOthers = item.verified && ctx.can('fuelVerify')
    ? ctx.state.fuel.filter(entry => entry.id !== item.id && entry.receipt && !entry.verified)
    : [];
  const nextNotice = pendingOthers.length
    ? `<div class="notice info"><div class="panel-head"><span>${ctx.h(pendingOthers.length === 1 ? 'Queda 1 comprobante pendiente de verificación.' : `Quedan ${pendingOthers.length} comprobantes pendientes de verificación.`)}</span>${ctx.button('Ir al siguiente pendiente →', 'mg:fuel-view', attr(ctx, 'id', pendingOthers[0].id), 'small')}</div></div>`
    : '';
  return page(ctx, 'Detalle de carga', dateTime(ctx, item), controls, 'Combustible', backBtn) + `<div class="stack">${nextNotice}<div class="grid-2">
    ${panel(ctx, 'Datos de la carga', fuelBadge(ctx, item) + kv(ctx, pairs))}
    ${panel(ctx, 'Comprobante', photo + photoActions)}
  </div>${panel(ctx, 'Historial de la carga', history(ctx, item.history))}</div>`;
}

const receiptUploads = new WeakMap();

function receiptFields(ctx, receipt, required) {
  const help = required ? 'Revisá la imagen antes de adjuntarla.' : 'Podés guardar la carga y adjuntar la foto más adelante.';
  return `<fieldset class="field-full stack"><legend>Comprobante</legend>
    <p class="hint" id="mg-receipt-help">${ctx.h(help)}</p>
    <div class="form-grid">
      <label class="field"><span>Sacar una foto</span><input type="file" name="capturePhoto" accept="image/*" capture="environment" data-change="mg:receipt-change" aria-describedby="mg-receipt-help"></label>
      <label class="field"><span>Elegir una imagen</span><input type="file" name="uploadPhoto" accept="image/*" data-change="mg:receipt-change" aria-describedby="mg-receipt-help"></label>
    </div>
    <div data-receipt-original>${receiptImage(ctx, receipt)}</div>
    <img class="receipt-preview" data-receipt-preview hidden alt="Vista previa del comprobante">
    <p class="notice danger" data-receipt-error hidden role="alert"></p>
    <div data-receipt-reset hidden>${ctx.button('Descartar foto seleccionada', 'mg:receipt-reset', '', 'ghost')}</div>
  </fieldset>`;
}

function updateReceipt(form, upload) {
  const preview = form.querySelector('[data-receipt-preview]');
  const original = form.querySelector('[data-receipt-original]');
  const error = form.querySelector('[data-receipt-error]');
  const reset = form.querySelector('[data-receipt-reset]');
  preview.hidden = !upload.data;
  original.hidden = Boolean(upload.data);
  if (upload.data) preview.src = upload.data;
  else preview.removeAttribute('src');
  error.hidden = !upload.error;
  error.textContent = upload.error ?? '';
  reset.hidden = !upload.data && !upload.error && !upload.loading;
}

async function selectReceipt(input) {
  const file = input.files?.[0];
  if (!file || !input.form) return;
  const form = input.form;
  const upload = { loading: true };
  receiptUploads.set(form, upload);
  updateReceipt(form, upload);
  for (const other of form.querySelectorAll('input[data-change="mg:receipt-change"]')) {
    if (other !== input) other.value = '';
  }
  try {
    if (!file.type.startsWith('image/')) throw new Error('Elegí un archivo de imagen.');
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('La imagen no se pudo leer. Probá elegirla de nuevo.'));
      reader.readAsDataURL(file);
    });
    const image = new Image();
    image.src = data;
    try {
      await image.decode();
    } catch {
      throw new Error('La imagen no se puede previsualizar. Probá con una foto JPG o PNG.');
    }
    let result = data;
    if (file.type !== 'image/svg+xml' && (data.length > 260000 || image.naturalWidth > 1400 || image.naturalHeight > 1400)) {
      const scale = Math.min(1, 1400 / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx2d = canvas.getContext('2d');
      if (ctx2d) {
        ctx2d.fillStyle = '#ffffff';
        ctx2d.fillRect(0, 0, canvas.width, canvas.height);
        ctx2d.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.78);
        if (compressed.startsWith('data:image/') && compressed.length < data.length) result = compressed;
      }
    }
    upload.data = result;
  } catch (error) {
    upload.error = error.message;
  } finally {
    upload.loading = false;
    if (receiptUploads.get(form) === upload) updateReceipt(form, upload);
  }
}

function resetReceipt(form) {
  if (!form) return;
  receiptUploads.delete(form);
  for (const input of form.querySelectorAll('input[data-change="mg:receipt-change"]')) input.value = '';
  updateReceipt(form, {});
}

function currentTime() {
  return new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
}

function fuelForm(ctx, item, attach = false) {
  const shift = item ? null : openShift(ctx);
  if (!item && !shift) {
    ctx.toast('Abrí un turno para registrar una carga.', 'error');
    return;
  }
  const record = item ?? { date: ctx.state.today, time: currentTime(), vehicleId: shift.vehicleId, type: 'GNC' };
  const vehicle = vehicleOptions(ctx).find(option => option.id === record.vehicleId);
  const typeSelector = ctx.select('Combustible', 'type', options(fuels), record.type, 'required data-change="mg:fuel-type"');
  const fields = attach
    ? `<p class="field-full"><strong>${ctx.h(vehicle?.name ?? '')}</strong> · ${ctx.h(dateTime(ctx, record))} · ${ctx.h(record.type)}</p>`
    : `<p class="field-full"><strong>Vehículo</strong> · ${ctx.h(vehicle?.name ?? '')}</p>
      ${ctx.field('Fecha', 'date', record.date, 'date', 'required')}
      ${ctx.field('Hora', 'time', record.time, 'time', 'required')}
      ${typeSelector}
      <label class="field"><span>Cantidad (<span data-fuel-unit>${ctx.h(unit(record.type))}</span>)</span>
        <input type="number" name="quantity" value="${ctx.h(record.quantity ?? '')}" min="0" step="any" required>
      </label>
      ${ctx.field('Importe ($)', 'amount', record.amount ?? '', 'number', 'required min="0.01" step="0.01"')}
      ${ctx.field('Odómetro al cargar (km)', 'odometer', record.odometer ?? '', 'number', 'required min="0" step="1"')}`;
  ctx.dialog({
    title: attach ? 'Adjuntar comprobante' : item ? 'Corregir carga' : 'Registrar combustible',
    submitLabel: attach ? 'Adjuntar comprobante' : 'Guardar carga',
    body: `<div class="form-grid">${fields}${receiptFields(ctx, record.receipt, attach)}</div>`,
    onSubmit(values, form) {
      const upload = receiptUploads.get(form);
      if (upload?.loading) throw new Error('Esperá a que cargue la vista previa.');
      if (upload?.error) throw new Error(upload.error);
      if (attach && !upload?.data) throw new Error('Elegí la foto del comprobante.');
      const source = attach ? record : values;
      const { date, time, type, quantity, amount, odometer } = source;
      const data = { date, time, vehicleId: record.vehicleId, type, quantity, amount, odometer };
      if (upload?.data) data.receipt = upload.data;
      ctx.run('saveFuel', { id: item?.id, data });
      ctx.toast(attach ? 'Comprobante adjuntado. Pendiente de verificación.' : 'Carga guardada.');
    }
  });
}

function verifyFuel(ctx, item) {
  if (!item.receipt) {
    ctx.toast('Falta adjuntar el comprobante', 'error');
    return;
  }
  ctx.confirm('Marcar como verificada', `<p>Confirmá que revisaste el comprobante de la carga del ${ctx.h(dateTime(ctx, item))}, por ${ctx.h(ctx.money(item.amount))}.</p>`, () => {
    ctx.run('verifyFuel', { id: item.id });
    ctx.toast('Carga verificada.');
  }, 'Confirmar verificación');
}

function expenseRows(ctx, items, showVehicle) {
  const sorted = items.slice().sort((a, b) => b.date.localeCompare(a.date));
  return table(ctx, 'Gastos e intervenciones', ['Fecha', ...(showVehicle ? ['Vehículo'] : []), 'Categoría', 'Descripción', 'Importe', 'Acciones'], sorted.map(item => [
    ctx.h(ctx.date(item.date)),
    ...(showVehicle ? [ctx.h(vehicleName(ctx, item.vehicleId))] : []),
    ctx.h(item.category), ctx.h(item.description), ctx.h(ctx.money(item.amount)),
    ctx.button('Ver gasto', 'mg:expense-view', `${attr(ctx, 'id', item.id)} aria-label="${ctx.h(`Ver gasto de ${item.category} del ${ctx.date(item.date)}`)}"`, 'small')
  ]));
}

function vehicleExpenses(ctx, vehicle) {
  const records = ctx.state.expenses.filter(item => item.vehicleId === vehicle.id);
  return panel(ctx, 'Historial de gastos e intervenciones',
    `<div class="actions">${ctx.button('Registrar gasto o intervención', 'mg:expense-edit', attr(ctx, 'vehicle', vehicle.id), 'primary')}</div>`
    + (records.length ? expenseRows(ctx, records, false) : '<p class="hint">Todavía no hay gastos para este vehículo.</p>'));
}

function expenseList(ctx, params) {
  const { month = '', vehicleId = '', category = '' } = params;
  const all = ctx.state.expenses;
  const items = all.filter(item => (!month || item.date.startsWith(month)) &&
    (!vehicleId || item.vehicleId === vehicleId) && (!category || item.category === category));
  const newButton = ctx.button('Registrar gasto o intervención', 'mg:expense-edit', '', 'primary');
  const filters = `<form class="toolbar" data-action="mg:expense-filter">
    ${ctx.field('Mes', 'month', month, 'month', 'data-change="mg:expense-filter"')}
    ${ctx.select('Vehículo', 'vehicleId', [{ id: '', name: 'Todos' }, ...vehicleOptions(ctx)], vehicleId, 'data-change="mg:expense-filter"')}
    ${ctx.select('Categoría', 'category', [{ id: '', name: 'Todas' }, ...options(expenseCategories)], category, 'data-change="mg:expense-filter"')}
    <button type="submit" class="btn secondary">Aplicar filtros</button>
  </form>`;
  const content = items.length
    ? `<div class="metrics">${stat(ctx, 'Total de la consulta', ctx.money(items.reduce((total, item) => total + item.amount, 0)))}</div>${expenseRows(ctx, items, true)}`
    : ctx.empty(all.length ? 'No hay gastos para esta consulta' : 'Todavía no hay gastos',
      all.length ? 'Probá otro mes, vehículo o categoría.' : 'Los gastos se guardan también en la ficha del vehículo.',
      all.length ? ctx.button('Limpiar filtros', 'mg:expense-clear') : newButton);
  return page(ctx, 'Gastos e intervenciones', 'Gastos de flota, mantenimiento y reparaciones.', newButton, 'Flota')
    + `<section class="panel stack">${filters}${content}</section>`;
}

function expenseView(ctx, item) {
  ctx.dialog({
    title: item.category,
    body: `<div class="stack">${kv(ctx, [
      ['Vehículo', vehicleName(ctx, item.vehicleId)], ['Fecha', ctx.date(item.date)],
      ['Descripción', item.description], ['Importe', ctx.money(item.amount)],
      ['Kilometraje', item.odometer === null ? '—' : `${number(item.odometer)} km`], ['Taller o proveedor', item.provider || '—']
    ])}<div class="actions">${ctx.button('Editar gasto', 'mg:expense-edit', attr(ctx, 'id', item.id))}</div>
    <h3>Historial de cambios</h3>${history(ctx, item.history)}</div>`
  });
}

function expenseForm(ctx, item, vehicleId) {
  const currentVehicle = item?.vehicleId ?? vehicleId;
  const lockedVehicle = !item && currentVehicle ? vehicleOptions(ctx).find(vehicle => vehicle.id === currentVehicle) : null;
  const fields = (lockedVehicle
    ? `<p class="field-full"><strong>Vehículo</strong> · ${ctx.h(lockedVehicle.name)}</p>`
    : ctx.select('Vehículo', 'vehicleId', [{ id: '', name: 'Elegí un vehículo' }, ...vehicleOptions(ctx)], currentVehicle ?? '', 'required'))
    + ctx.field('Fecha', 'date', item?.date ?? ctx.state.today, 'date', 'required')
    + ctx.select('Categoría', 'category', options(expenseCategories), item?.category ?? 'Mantenimiento', 'required')
    + ctx.field('Importe ($)', 'amount', item?.amount ?? '', 'number', 'required min="0.01" step="0.01"')
    + ctx.field('Kilometraje (km)', 'odometer', item?.odometer ?? '', 'number', 'min="0" step="1"')
    + ctx.field('Taller o proveedor', 'provider', item?.provider ?? '')
    + `<label class="field field-full"><span>Descripción</span><textarea name="description" rows="3" required>${ctx.h(item?.description ?? '')}</textarea></label>`;
  ctx.dialog({
    title: item ? 'Editar gasto o intervención' : 'Registrar gasto o intervención',
    body: `<div class="form-grid">${fields}</div>`,
    onSubmit(values) {
      const data = { ...values, vehicleId: lockedVehicle?.id ?? values.vehicleId };
      ctx.run('saveExpense', { id: item?.id, data });
      ctx.toast('Gasto guardado en el historial del vehículo.');
    }
  });
}

function userList(ctx) {
  const items = ctx.state.users.slice().sort((a, b) => a.name.localeCompare(b.name, 'es-AR'));
  const newButton = ctx.button('Nuevo usuario', 'mg:user-create', '', 'primary');
  const body = items.length ? table(ctx, 'Cuentas de usuario', ['Cuenta', 'Roles', 'Acceso', 'Acciones'], items.map(item => {
    const state = !item.active ? 'Inactivo' : item.mustChangePassword ? 'Cambio de contraseña pendiente' : 'Activo';
    return [
      `<strong>${ctx.h(item.name)}</strong><br><span class="hint">${ctx.h(item.username)}</span>`,
      ctx.h(item.roles.map(role => roles[role]?.name).filter(Boolean).join(', ') || 'Sin roles'),
      ctx.badge(state, !item.active ? 'neutral' : item.mustChangePassword ? 'warning' : 'success'),
      `<div class="actions">${ctx.button('Editar roles', 'mg:user-roles', attr(ctx, 'id', item.id), 'small')}
      ${ctx.button('Restablecer contraseña', 'mg:user-reset', attr(ctx, 'id', item.id), 'small')}</div>`
    ];
  })) : ctx.empty('Todavía no hay cuentas', 'Los usuarios creados aparecerán acá.', newButton);
  return page(ctx, 'Usuarios', 'Cuentas, roles y recuperación de acceso.', newButton, 'Administración') + `<section class="panel">${body}</section>`;
}

function roleFields(ctx, selected = []) {
  return `<fieldset class="field-full stack"><legend>Roles</legend>${Object.entries(roles).map(([id, role]) =>
    `<label class="list-row"><span><input type="checkbox" name="roles" value="${ctx.h(id)}"${selected.includes(id) ? ' checked' : ''} data-change="mg:role-change"> ${ctx.h(role.name)}</span></label>`
  ).join('')}</fieldset>`;
}

function showPassword(ctx, username, password) {
  ctx.dialog({
    title: 'Contraseña temporal',
    body: `<div class="stack"><p>La cuenta <strong>${ctx.h(username)}</strong> deberá cambiarla al ingresar.</p>
    ${ctx.field('Contraseña temporal de la demo', 'mg-temp-password', password, 'text', 'readonly autocomplete="off"')}
    <div class="actions">${ctx.button('Copiar', 'mg:user-copy')}</div></div>`
  });
}

async function copyPassword(ctx, form) {
  const input = form?.querySelector('input[name="mg-temp-password"]') ?? document.querySelector('input[name="mg-temp-password"]');
  if (!input) return;
  try {
    await navigator.clipboard.writeText(input.value);
    ctx.toast('Contraseña temporal copiada.');
  } catch {
    input.focus();
    input.select();
    if (document.execCommand?.('copy')) ctx.toast('Contraseña temporal copiada.');
    else ctx.toast('La contraseña quedó seleccionada. Podés copiarla con el teclado.', 'info');
  }
}

function userCreate(ctx) {
  const availableDrivers = ctx.state.drivers.filter(driver => driver.active && !driver.userId);
  const driverSelection = availableDrivers.length ? `<div class="field-full" data-driver-selection hidden>${ctx.select('Chofer vinculado', 'driverId',
    [{ id: '', name: 'Crear un registro de chofer' }, ...availableDrivers])}</div>` : '';
  ctx.dialog({
    title: 'Nuevo usuario',
    submitLabel: 'Crear cuenta',
    body: `<div class="form-grid">${ctx.field('Nombre', 'name', '', 'text', 'required')}${ctx.field('Nombre de usuario', 'username', '', 'text', 'required autocomplete="off"')}
    ${roleFields(ctx)}${driverSelection}</div>`,
    onSubmit(values, form) {
      const selected = new FormData(form).getAll('roles');
      if (!selected.length) throw new Error('Elegí al menos un rol.');
      const result = ctx.run('createUser', {
        name: values.name, username: values.username, roles: selected,
        ...(selected.includes('chofer') && values.driverId ? { driverId: values.driverId } : {})
      });
      ctx.toast('Usuario creado.');
      showPassword(ctx, values.username, result.tempPassword);
    }
  });
}

function accessFor(selected) {
  return new Set(selected.flatMap(role => roles[role]?.access ?? []));
}

function changesHTML(ctx, before, after) {
  const added = [...after].filter(access => !before.has(access));
  const removed = [...before].filter(access => !after.has(access));
  const list = entries => entries.length ? `<ul>${entries.map(entry => `<li>${ctx.h(entry)}</li>`).join('')}</ul>` : '<p>Sin cambios.</p>';
  return `<div class="grid-2"><div><strong>Accesos que se agregan</strong>${list(added)}</div><div><strong>Accesos que se quitan</strong>${list(removed)}</div></div>`;
}

function userRoles(ctx, item) {
  let reviewed = '';
  const original = item.roles.slice().sort().join(',');
  ctx.dialog({
    title: 'Editar roles',
    submitLabel: 'Revisar cambios',
    body: `<div class="stack"><p><strong>${ctx.h(item.name)}</strong> · ${ctx.h(item.username)}</p>
      <p class="hint">Roles actuales: ${ctx.h(item.roles.map(role => roles[role]?.name).filter(Boolean).join(', ') || 'Sin roles')}.</p>
      ${roleFields(ctx, item.roles)}
      <div class="notice info stack" data-role-review hidden aria-live="polite"></div></div>`,
    onSubmit(_, form) {
      const selected = new FormData(form).getAll('roles');
      const key = selected.slice().sort().join(',');
      if (key === original) throw new Error('La selección coincide con los roles actuales.');
      if (reviewed === key && !form.querySelector('[data-role-review]').hidden) {
        ctx.run('setRoles', { id: item.id, roles: selected });
        ctx.toast('Roles actualizados.');
        return;
      }
      reviewed = key;
      const review = form.querySelector('[data-role-review]');
      review.innerHTML = changesHTML(ctx, accessFor(item.roles), accessFor(selected)) + (selected.length ? '' : '<p>La cuenta quedará sin acceso.</p>');
      review.hidden = false;
      form.querySelector('[type="submit"]').textContent = 'Confirmar cambios';
      return false;
    }
  });
}

function userReset(ctx, item) {
  ctx.confirm('Restablecer contraseña',
    `<p>Se generará una contraseña temporal para <strong>${ctx.h(item.username)}</strong>. La cuenta deberá cambiarla al ingresar.</p>`,
    () => {
      const result = ctx.run('resetPassword', { id: item.id });
      ctx.toast('Contraseña restablecida.');
      showPassword(ctx, item.username, result.tempPassword);
    }, 'Restablecer contraseña');
}

export function render(ctx, screen, params = {}) {
  const masterCollection = Object.keys(masters).find(key => masters[key].screen === screen);
  if (masterCollection && masterRead(ctx, masterCollection)) return masterList(ctx, masterCollection, params);
  if (screen === 'ficha' && masterRead(ctx, params.collection)) {
    const item = ctx.state[params.collection].find(record => record.id === params.id);
    if (item) return masterDetail(ctx, params.collection, item);
    return ctx.empty('Ficha no disponible', 'Volvé al listado para seleccionar otro registro.',
      ctx.button('Volver al listado', 'mg:master-back', attr(ctx, 'collection', params.collection)));
  }
  if (screen === 'combustible' && ctx.can('fuelRead')) return fuelList(ctx, params);
  if (screen === 'carga' && ctx.can('fuelRead')) {
    const item = ctx.state.fuel.find(record => record.id === params.id);
    if (item && fuelRead(ctx, item)) return fuelDetail(ctx, item);
    return ctx.empty('Carga no disponible', 'Volvé a combustible para consultar las cargas disponibles.',
      ctx.button('Volver a combustible', 'mg:fuel-back'));
  }
  if (screen === 'gastos' && ctx.can('expense')) return expenseList(ctx, params);
  if (screen === 'usuarios' && ctx.can('users')) return userList(ctx);
  return ctx.empty('Sección no disponible', 'Esta cuenta no tiene acceso a la sección.');
}

const fuelParams = ({ filter, month, vehicleId, driverId }) => Object.fromEntries(
  Object.entries({ filter, month, vehicleId, driverId }).filter(([, value]) => value)
);

export async function handle(ctx, action, el) {
  const { id, mode, vehicle, q, status } = el.dataset;
  const form = el.form || el;
  const collection = el.dataset.collection || form?.dataset?.collection;
  if (action.startsWith('mg:master-') && masterRead(ctx, collection)) {
    const item = ctx.getState()[collection].find(record => record.id === id);
    const meta = masters[collection];
    if (action === 'mg:master-filter') ctx.go(meta.screen, ctx.form(form));
    if (action === 'mg:master-clear') ctx.go(meta.screen, { status: 'all' });
    if (action === 'mg:master-back') ctx.go(meta.screen, { q: q ?? '', status: status ?? 'active' });
    if (action === 'mg:master-view' && item) {
      const fromList = ctx.screen === meta.screen ? ctx.params : {};
      ctx.go('ficha', { collection, id, q: fromList?.q, status: fromList?.status });
    }
    if (ctx.can('masters')) {
      if (action === 'mg:master-edit' && (!id || item?.active)) masterForm(ctx, collection, item);
      if (action === 'mg:master-deactivate' && item?.active) deactivateMaster(ctx, collection, item);
    }
    return true;
  }
  if (action.startsWith('mg:fuel-') && ctx.can('fuelRead')) {
    const item = ctx.getState().fuel.find(record => record.id === id);
    if (action === 'mg:fuel-filter') ctx.go('combustible', fuelParams(ctx.form(form)));
    if (action === 'mg:fuel-clear') ctx.go('combustible', { filter: 'all' });
    if (action === 'mg:fuel-back') ctx.go('combustible', fuelParams(el.dataset));
    if (action === 'mg:fuel-view' && item && fuelRead(ctx, item)) {
      ctx.go('carga', { ...fuelParams(ctx.params ?? {}), id });
    }
    if (action === 'mg:fuel-edit') {
      if (!id && ctx.can('drive')) fuelForm(ctx, null);
      if (item && fuelRead(ctx, item) && fuelEdit(ctx, item)) fuelForm(ctx, item, mode === 'attach');
    }
    if (action === 'mg:fuel-verify' && item && ctx.can('fuelVerify') && !item.verified) verifyFuel(ctx, item);
    if (action === 'mg:fuel-type') {
      const unitLabel = el.form?.querySelector('[data-fuel-unit]');
      if (unitLabel) unitLabel.textContent = unit(el.value);
    }
    return true;
  }
  if (action === 'mg:receipt-change' && ctx.can('fuelRead')) {
    await selectReceipt(el);
    return true;
  }
  if (action === 'mg:receipt-reset' && ctx.can('fuelRead')) {
    resetReceipt(el.form);
    return true;
  }
  if (action.startsWith('mg:expense-') && ctx.can('expense')) {
    const item = ctx.getState().expenses.find(record => record.id === id);
    if (action === 'mg:expense-filter') ctx.go('gastos', ctx.form(form));
    if (action === 'mg:expense-clear') ctx.go('gastos');
    if (action === 'mg:expense-view' && item) expenseView(ctx, item);
    if (action === 'mg:expense-edit' && (!id || item)) expenseForm(ctx, item, vehicle);
    return true;
  }
  if (ctx.can('users')) {
    const item = ctx.getState().users.find(record => record.id === id);
    if (action === 'mg:user-create') userCreate(ctx);
    if (action === 'mg:user-roles' && item) userRoles(ctx, item);
    if (action === 'mg:user-reset' && item) userReset(ctx, item);
    if (action === 'mg:user-copy') await copyPassword(ctx, el.form);
    if (action === 'mg:role-change' && el.form) {
      const selection = el.form.querySelector('[data-driver-selection]');
      if (selection) selection.hidden = !el.form.querySelector('[name="roles"][value="chofer"]').checked;
      const review = el.form.querySelector('[data-role-review]');
      if (review) {
        review.hidden = true;
        el.form.querySelector('[type="submit"]').textContent = 'Revisar cambios';
      }
    }
    if (['mg:user-create', 'mg:user-roles', 'mg:user-reset', 'mg:user-copy', 'mg:role-change'].includes(action)) return true;
  }
  return false;
}
