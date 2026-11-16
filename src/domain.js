const capabilities = {
  admin: ['admin'],
  plan: ['admin', 'encargado'],
  drive: ['chofer'],
  fuelRead: ['admin', 'encargado', 'secretaria', 'chofer'],
  fuelVerify: ['admin', 'secretaria'],
  fleetRead: ['admin', 'encargado', 'secretaria'],
  expense: ['admin', 'encargado', 'secretaria'],
  masters: ['admin', 'encargado'],
  commercial: ['admin'],
  users: ['admin'],
  reports: ['admin', 'encargado', 'secretaria', 'chofer'],
  odometer: ['admin', 'encargado']
};

const finalStatuses = ['Realizado', 'No realizado'];
const groupDays = { LMV: [1, 3, 5], MJS: [2, 4, 6] };
const money = value => Math.round((value + Number.EPSILON) * 100) / 100;
const find = (state, collection, id) => state[collection].find(item => item.id === id);

function makeTrip(route, date, type, basePrice) {
  return {
    id: '', date, type, time: type === 'Entrada' ? route.entryTime : route.exitTime,
    routeId: route.id, driverId: null, status: 'Programado',
    commercialKm: route.baseKm, baseKm: route.baseKm, basePrice,
    amount: basePrice, driverPay: money(basePrice * 0.14),
    passengers: route.patientIds.map(patientId => ({ patientId, status: null })),
    shiftId: null, vehicleId: null, nonperformanceReason: '', reviewReasons: [], notes: [], history: []
  };
}

export function seed() {
  const today = '2026-11-16';
  const admin = 'u-admin';
  const diego = 'u-driver';
  const walter = 'u-walter';
  const secretary = 'u-secretary';
  const users = [
    [admin, 'Alejandro', 'alejandro', ['admin']],
    [walter, 'Walter', 'walter', ['encargado', 'chofer']],
    [secretary, 'Secretaria', 'secretaria', ['secretaria']],
    [diego, 'Diego López', 'diego', ['chofer']]
  ].map(([id, name, username, roles]) => ({
    id, name, username, roles, active: true, password: 'demo123', mustChangePassword: false, history: []
  }));
  const drivers = [
    ['d-diego', diego, 'Diego López'],
    ['d-walter', walter, 'Walter'],
    ['d-lucia', null, 'Lucía Ríos']
  ].map(([id, userId, name]) => ({ id, userId, name, phone: '', active: true, history: [] }));
  const patients = [
    ['Elena Torres', 'Pasaje Demo 142'],
    ['Rafael Méndez', 'Calle Ejemplo 208'],
    ['Marta Ruiz', 'Pasaje Demo 615'],
    ['Pablo Arias', 'Avenida Prueba 821'],
    ['Nora Vega', 'Calle Ejemplo 403'],
    ['Sergio Robles', 'Avenida Prueba 1309'],
    ['Irene Paz', 'Pasaje Demo 321'],
    ['Bruno Solís', 'Calle Ejemplo 490']
  ].map(([name, address], index) => ({ id: 'p-' + (index + 1), name, address, phone: '', active: true, history: [] }));
  const vehicles = [
    ['v-1', 'Móvil 01', 'DEMO 01', 50000],
    ['v-2', 'Móvil 02', 'DEMO 02', 41200],
    ['v-3', 'Móvil 03', 'DEMO 03', 31000]
  ].map(([id, alias, plate, lastCloseKm]) => ({ id, alias, plate, capacity: 4, lastCloseKm, active: true, history: [] }));
  const routes = [
    ['r-centro', 'Centro', 'LMV', '08:00', '12:00', ['p-1', 'p-2', 'p-3'], 18, 32000],
    ['r-sur', 'Sur', 'LMV', '09:00', '14:30', ['p-4', 'p-5'], 24, 36000],
    ['r-este', 'Este', 'MJS', '11:00', '16:00', ['p-6', 'p-7', 'p-8'], 16, 26500]
  ].map(([id, name, group, entryTime, exitTime, patientIds, baseKm, basePrice]) => ({
    id, name, group, days: [...groupDays[group]], entryTime, exitTime,
    destination: 'Institución de muestra · ' + name, patientIds, baseKm, basePrice, active: true, history: []
  }));
  const trips = [
    ['t-diego-08', today, 'Entrada', 0, 'd-diego'],
    ['t-diego-12', today, 'Salida', 0, 'd-diego'],
    ['t-diego-1430', today, 'Salida', 1, 'd-diego'],
    ['t-walter-09', today, 'Entrada', 1, 'd-walter'],
    ['t-unassigned', today, 'Entrada', 2, null],
    ['t-review', '2026-11-17', 'Salida', 2, null],
    ['t-oct-diego', '2026-10-09', 'Entrada', 0, 'd-diego', 'Realizado', 30000],
    ['t-oct-walter', '2026-10-12', 'Salida', 0, 'd-walter', 'Realizado', 30000],
    ['t-oct-no', '2026-10-13', 'Entrada', 2, 'd-diego', 'No realizado']
  ].map(([id, date, type, index, driverId, status = 'Programado', price]) => {
    const route = routes[index];
    const trip = { ...makeTrip(route, date, type, price ?? route.basePrice), id, driverId, status };
    if (status === 'No realizado') trip.nonperformanceReason = 'Servicio de demostración suspendido';
    if (status === 'Realizado') {
      trip.passengers.forEach(passenger => { passenger.status = 'Recogido'; });
      trip.shiftId = id === 't-oct-diego' ? 's-diego-oct' : 's-walter-oct';
      trip.vehicleId = trip.shiftId === 's-diego-oct' ? 'v-1' : 'v-2';
    }
    return trip;
  });
  const reviewTime = today + 'T06:01:00-03:00';
  for (const [tripId, id, reason] of [
    ['t-unassigned', 'tr-replace', 'Falta confirmar el chofer del viaje excepcional'],
    ['t-review', 'tr-stop', 'Revisar una parada antes de asignar el viaje']
  ]) {
    const trip = trips.find(item => item.id === tripId);
    trip.reviewReasons.push({ id, reason, resolved: false, authorId: walter, at: reviewTime });
    trip.history.push({ id: 'h-' + id, at: reviewTime, actorId: walter, text: 'Se señaló el viaje para revisión', reason });
  }
  const shifts = [
    ['s-diego-oct', 'd-diego', 'v-1', '2026-10-09T07:45:00-03:00', '2026-10-09T15:04:00-03:00', 49924, 50000, diego],
    ['s-walter-oct', 'd-walter', 'v-2', '2026-10-12T09:00:00-03:00', '2026-10-12T17:05:00-03:00', 41138, 41200, walter],
    ['s-old', 'd-lucia', 'v-2', '2026-11-14T08:10:00-03:00', null, 41220, null, null]
  ].map(([id, driverId, vehicleId, openedAt, closedAt, startKm, endKm, closedBy]) => ({
    id, driverId, vehicleId, openedAt, closedAt, startKm, endKm, closedBy, closeReason: '', history: []
  }));
  const receiptImage = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280"><rect width="400" height="280" fill="#f6f0e9"/><rect x="62" y="24" width="276" height="232" rx="5" fill="white"/><g fill="#7b1f36" text-anchor="middle" font-family="sans-serif"><text x="200" y="95" font-size="24">BOLETA FICTICIA</text><text x="200" y="131" font-size="14">Estación de prueba · IRID</text><text x="200" y="197" font-size="14">Sólo para demostración</text></g></svg>'
  );
  const fuel = [
    ['f-no-receipt', '2026-10-09', '14:40', 'v-1', 'd-diego', diego, 's-diego-oct', 'GNC', 10.25, 8700, 49985, null, false],
    ['f-pending', '2026-10-12', '15:10', 'v-2', 'd-walter', walter, 's-walter-oct', 'Nafta', 24.3, 30618, 41173, receiptImage, false],
    ['f-verified', '2026-10-09', '08:32', 'v-1', 'd-diego', diego, 's-diego-oct', 'Nafta', 17, 20400, 49939, receiptImage, true]
  ].map(([id, date, time, vehicleId, driverId, userId, shiftId, type, quantity, amount, odometer, receipt, verified]) => ({
    id, date, time, vehicleId, driverId, userId, shiftId, type, quantity, amount, odometer, receipt, verified, history: []
  }));
  const expenses = [
    ['e-insurance', 'v-1', today, 'Seguro', 'Cuota mensual de ejemplo', 63500, null, 'Aseguradora de muestra'],
    ['e-gps', 'v-2', '2026-11-06', 'GPS', 'Servicio mensual de prueba', 20800, null, 'Proveedor de muestra'],
    ['e-maintenance', 'v-2', '2026-11-05', 'Mantenimiento', 'Cambio de aceite y filtros', 82500, 41198, 'Taller de muestra'],
    ['e-tires', 'v-3', '2026-10-21', 'Cubiertas', 'Reposición de una cubierta de ejemplo', 118000, 30720, 'Gomería de muestra']
  ].map(([id, vehicleId, date, category, description, amount, odometer, provider]) => ({
    id, vehicleId, date, category, description, amount, odometer, provider, history: []
  }));
  const tariffs = [
    ['tf-centro-old', 'r-centro', 30000, '2026-10-01'],
    ['tf-centro', 'r-centro', 32000, '2026-11-01'],
    ['tf-sur', 'r-sur', 36000, '2026-10-01'],
    ['tf-este', 'r-este', 26500, '2026-10-01']
  ].map(([id, routeId, amount, effectiveDate]) => ({ id, routeId, amount, effectiveDate, history: [] }));
  const readingReviews = [
    ['rr-positive', 'v-2', 'd-lucia', 's-old', 41200, 41220, 'positive'],
    ['rr-negative', 'v-3', 'd-walter', null, 31000, 30970, 'negative']
  ].map(([id, vehicleId, driverId, shiftId, lastCloseKm, reading, kind]) => ({
    id, vehicleId, driverId, shiftId, lastCloseKm, reading, difference: reading - lastCloseKm,
    status: 'Pendiente', kind, reason: '', history: []
  }));
  const settlementTrip = trips.find(trip => trip.id === 't-oct-walter');
  const settlements = [{
    id: 'ls-walter-oct-v1', period: '2026-10', type: 'Chofer', driverId: 'd-walter', version: 1, previousId: null,
    issuedAt: '2026-11-04T11:00:00-03:00', issuedBy: admin, total: settlementTrip.driverPay, minimumPending: true,
    recipientName: 'Walter', tripIds: [settlementTrip.id],
    rows: [{
      tripId: settlementTrip.id, date: settlementTrip.date, time: settlementTrip.time, type: settlementTrip.type,
      route: 'Centro', group: 'LMV', driver: 'Walter', commercialKm: settlementTrip.commercialKm,
      status: settlementTrip.status, amount: settlementTrip.amount, driverPay: settlementTrip.driverPay
    }],
    history: [{ id: 'h-ls-seed', at: '2026-11-04T11:00:00-03:00', actorId: admin, text: 'Se emitió la versión 1' }]
  }];
  return { schema: 1, today, users, drivers, patients, vehicles, routes, trips, shifts, fuel, expenses, tariffs, settlements, readingReviews, audit: [], seq: 1000 };
}

export function can(state, userId, capability) {
  const user = find(state, 'users', userId);
  return Boolean(user?.active && !user.mustChangePassword
    && Object.hasOwn(capabilities, capability)
    && capabilities[capability].some(role => user.roles.includes(role)));
}

export function login(state, username, password) {
  const key = typeof username === 'string' ? username.trim().toLowerCase() : '';
  const user = state.users.find(item => item.username.toLowerCase() === key);
  if (!user?.active || !user.roles.length || user.password !== password) throw new Error('Usuario o contraseña incorrectos.');
  return user.id;
}

export function home(state, userId) {
  const user = find(state, 'users', userId);
  if (!user?.active || !user.roles.length) return 'login';
  if (user.mustChangePassword) return 'password';
  if (can(state, userId, 'admin')) return 'resumen';
  if (can(state, userId, 'plan')) return 'agenda';
  if (can(state, userId, 'fuelVerify')) return 'combustible';
  return 'jornada';
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function account(state, userId, type) {
  const user = find(state, 'users', userId);
  ensure(user?.active && user.roles.length, 'La cuenta no tiene permiso para operar.');
  ensure(!user.mustChangePassword || type === 'changePassword', 'Primero cambiá la contraseña temporal.');
  return user;
}

function required(value, label) {
  const cleaned = typeof value === 'string' ? value.trim() : '';
  ensure(cleaned, 'Completá ' + label + '.');
  return cleaned;
}

function optional(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function number(value, label, { minimum = 0, integer = false } = {}) {
  const validInput = typeof value === 'number' || (typeof value === 'string' && value.trim() !== '');
  const parsed = validInput ? Number(value) : NaN;
  const suffix = label.startsWith('una ') ? ' válida.' : ' válido.';
  ensure(Number.isFinite(parsed) && parsed >= minimum && (!integer || Number.isSafeInteger(parsed)), 'Ingresá ' + label + suffix);
  return parsed;
}

function choice(value, options, label) {
  ensure(options.includes(value), 'Seleccioná ' + label + ' válido.');
  return value;
}

function isoDate(value) {
  ensure(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), 'Ingresá una fecha válida.');
  const date = new Date(value + 'T00:00:00Z');
  ensure(Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value, 'Ingresá una fecha válida.');
  return value;
}

function isoMonth(value) {
  ensure(typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value), 'Seleccioná un mes válido.');
  return value;
}

function clockTime(value) {
  ensure(typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value), 'Ingresá un horario válido.');
  return value;
}

function found(state, collection, id, label) {
  const record = find(state, collection, id);
  ensure(record, 'No se encontró ' + label + '.');
  return record;
}

function nextId(state, kind) {
  state.seq += 1;
  return kind + '-' + state.seq;
}

function now(state) {
  const localStart = Date.parse(state.today + 'T06:00:00Z');
  return new Date(localStart + state.seq * 1000).toISOString().slice(0, 19) + '-03:00';
}

function event(ctx, record, text, details = {}) {
  const item = { id: nextId(ctx.state, 'h'), at: now(ctx.state), actorId: ctx.user.id, text, ...details };
  record.history.push(item);
  ctx.state.audit.push(structuredClone(item));
  return record.id;
}

function permit(ctx, capability) {
  ensure(can(ctx.state, ctx.user.id, capability), 'Tu cuenta no tiene permiso para esta operación.');
}

function driverFor(state, userId) {
  return state.drivers.find(driver => driver.userId === userId && driver.active);
}

function ownDriver(ctx) {
  permit(ctx, 'drive');
  const driver = driverFor(ctx.state, ctx.user.id);
  ensure(driver, 'Tu cuenta no tiene un chofer activo asociado.');
  return driver;
}

function ownedTrip(ctx, id, status) {
  const driver = ownDriver(ctx);
  const trip = found(ctx.state, 'trips', id, 'el viaje');
  ensure(trip.driverId === driver.id, 'Sólo podés operar sobre un viaje propio asignado.');
  ensure(trip.status === status, 'El viaje debe estar ' + status.toLowerCase() + '.');
  return trip;
}

function ensureSchedule(trips, changedIds) {
  for (const trip of trips) {
    if (!changedIds.has(trip.id) || !trip.driverId) continue;
    const other = trips.find(candidate => candidate.id !== trip.id && candidate.driverId === trip.driverId
      && candidate.date === trip.date && candidate.time === trip.time);
    if (other) {
      const error = new Error('El chofer ya tiene otro viaje asignado en esa fecha y horario.');
      error.conflictId = other.id;
      throw error;
    }
  }
}

function openingVehicle(ctx, vehicleId) {
  const driver = ownDriver(ctx);
  const vehicle = found(ctx.state, 'vehicles', vehicleId, 'el vehículo');
  ensure(vehicle.active, 'El vehículo debe estar activo.');
  ensure(!ctx.state.shifts.some(shift => shift.driverId === driver.id && !shift.closedAt), 'Ya tenés un turno abierto.');
  ensure(!ctx.state.shifts.some(shift => shift.vehicleId === vehicle.id && !shift.closedAt), 'El vehículo ya tiene un turno abierto.');
  return { driver, vehicle };
}

function createReadingReview(ctx, { driver, vehicle }, reading, shiftId, kind) {
  const record = {
    id: nextId(ctx.state, 'rr'), vehicleId: vehicle.id, driverId: driver.id, shiftId,
    lastCloseKm: vehicle.lastCloseKm, reading, difference: reading - vehicle.lastCloseKm,
    status: 'Pendiente', kind, reason: '', history: []
  };
  ctx.state.readingReviews.push(record);
  return event(ctx, record, 'Se registró una diferencia de odómetro para revisar');
}

function openShift(ctx, { vehicleId, reading }) {
  const opening = openingVehicle(ctx, vehicleId);
  const { vehicle, driver } = opening;
  const startKm = number(reading, 'un kilometraje inicial', { integer: true });
  ensure(startKm >= vehicle.lastCloseKm, 'La lectura es inferior al último cierre. Enviá la lectura real para revisión.');
  const unresolved = ctx.state.readingReviews.some(review => review.vehicleId === vehicleId
    && review.kind === 'negative' && review.status === 'Pendiente');
  ensure(!unresolved, 'Hay una lectura inferior pendiente de revisión. La apertura requiere corregir el registro.');
  const shift = {
    id: nextId(ctx.state, 's'), driverId: driver.id, vehicleId, openedAt: now(ctx.state), closedAt: null,
    startKm, endKm: null, closedBy: null, closeReason: '', history: []
  };
  ctx.state.shifts.push(shift);
  if (startKm > vehicle.lastCloseKm) createReadingReview(ctx, opening, startKm, shift.id, 'positive');
  return event(ctx, shift, 'Se abrió el turno');
}

function closeShift(ctx, { id, endKm, reason }) {
  const shift = found(ctx.state, 'shifts', id, 'el turno');
  const own = can(ctx.state, ctx.user.id, 'drive') && driverFor(ctx.state, ctx.user.id)?.id === shift.driverId;
  if (!own) permit(ctx, 'odometer');
  ensure(!shift.closedAt, 'El turno ya está cerrado.');
  ensure(!ctx.state.trips.some(trip => trip.shiftId === id && trip.status === 'En curso'), 'Hay un viaje en curso. Resolvelo antes de cerrar el turno.');
  const end = number(endKm, 'un kilometraje final', { integer: true });
  ensure(end >= shift.startKm, 'El kilometraje final no puede ser inferior al inicial.');
  shift.closeReason = own ? optional(reason) : required(reason, 'el motivo del cierre supervisado');
  shift.endKm = end;
  shift.closedAt = now(ctx.state);
  shift.closedBy = ctx.user.id;
  const vehicle = found(ctx.state, 'vehicles', shift.vehicleId, 'el vehículo');
  vehicle.lastCloseKm = end;
  return event(ctx, shift, own ? 'Se cerró el turno' : 'Se cerró el turno por supervisión', { reason: shift.closeReason, after: end });
}

function requestReadingReview(ctx, { vehicleId, reading }) {
  const opening = openingVehicle(ctx, vehicleId);
  const observed = number(reading, 'una lectura', { integer: true });
  ensure(observed < opening.vehicle.lastCloseKm, 'La revisión de apertura se solicita cuando la lectura es inferior al último cierre.');
  const duplicate = ctx.state.readingReviews.find(review => review.vehicleId === vehicleId
    && review.driverId === opening.driver.id && review.status === 'Pendiente'
    && review.kind === 'negative' && review.reading === observed && review.lastCloseKm === opening.vehicle.lastCloseKm);
  return duplicate?.id ?? createReadingReview(ctx, opening, observed, null, 'negative');
}

function pendingReading(state, id) {
  const review = found(state, 'readingReviews', id, 'la revisión');
  ensure(review.status === 'Pendiente', 'La revisión ya está resuelta.');
  return review;
}

function completeReadingReview(ctx, review, reason, text) {
  review.status = 'Resuelta';
  review.reason = reason;
  return event(ctx, review, text, { reason });
}

function resolveReading(ctx, { id, reason }) {
  permit(ctx, 'odometer');
  const review = pendingReading(ctx.state, id);
  ensure(review.kind === 'positive', 'La lectura inferior requiere corregir el registro incorrecto.');
  return completeReadingReview(ctx, review, required(reason, 'el motivo'), 'Se confirmó la diferencia de odómetro');
}

function lastClosedShift(state, vehicleId, before = Infinity) {
  return state.shifts.filter(shift => shift.vehicleId === vehicleId && shift.closedAt && Date.parse(shift.closedAt) <= before)
    .sort((a, b) => Date.parse(b.closedAt) - Date.parse(a.closedAt))[0];
}

function correctReading(ctx, { shiftId, vehicleId, field, value, reason, reviewId }) {
  permit(ctx, 'odometer');
  const corrected = number(value, 'un kilometraje', { integer: true });
  const why = required(reason, 'el motivo');
  const review = reviewId ? pendingReading(ctx.state, reviewId) : null;
  const shift = shiftId ? found(ctx.state, 'shifts', shiftId, 'el turno') : null;
  const vehicle = found(ctx.state, 'vehicles', shift?.vehicleId ?? vehicleId, 'el vehículo');
  const last = lastClosedShift(ctx.state, vehicle.id);
  if (shift) {
    choice(field, ['startKm', 'endKm'], 'un campo de odómetro');
    ensure(field === 'startKm' || shift.closedAt, 'El turno aún no tiene lectura final.');
    const start = field === 'startKm' ? corrected : shift.startKm;
    const end = field === 'endKm' ? corrected : shift.endKm;
    ensure(end === null || end >= start, 'El kilometraje final no puede ser inferior al inicial.');
  } else {
    ensure(!last, 'Corregí la lectura final del último turno cerrado.');
  }
  if (review) {
    ensure(review.vehicleId === vehicle.id, 'La revisión corresponde a otro vehículo.');
    if (review.kind === 'negative') {
      ensure(!shift || (field === 'endKm' && shift.id === last?.id), 'Corregí la lectura final que originó la diferencia.');
      ensure(corrected <= review.reading, 'La lectura corregida sigue por encima de la lectura real informada.');
    } else if (shift) {
      const opening = found(ctx.state, 'shifts', review.shiftId, 'el turno de apertura');
      const previous = lastClosedShift(ctx.state, vehicle.id, Date.parse(opening.openedAt));
      ensure((field === 'startKm' && shift.id === opening.id) || (field === 'endKm' && previous?.id === shift.id),
        'Elegí una lectura vinculada a la diferencia.');
    }
  }
  const target = shift ?? vehicle;
  const key = shift ? field : 'lastCloseKm';
  const before = target[key];
  target[key] = corrected;
  const correctsReference = !shift || (field === 'endKm' && shift.id === last?.id);
  if (correctsReference) vehicle.lastCloseKm = corrected;
  event(ctx, target, shift ? 'Se corrigió el odómetro del turno' : 'Se corrigió la referencia del vehículo', { reason: why, before, after: corrected });
  if (review?.kind === 'positive') completeReadingReview(ctx, review, why, 'Se corrigió el registro asociado a la diferencia');
  if (correctsReference) {
    for (const negative of ctx.state.readingReviews) {
      if (negative.vehicleId === vehicle.id && negative.kind === 'negative' && negative.status === 'Pendiente' && negative.reading >= corrected) {
        completeReadingReview(ctx, negative, why, 'Se corrigió el registro asociado a la diferencia');
      }
    }
  }
  return target.id;
}

function changePassword(ctx, { password, repeat }) {
  ensure(typeof password === 'string' && password.trim(), 'Ingresá una contraseña.');
  ensure(password === repeat, 'Las contraseñas deben coincidir.');
  ensure(password !== ctx.user.password, 'Elegí una contraseña distinta de la actual.');
  ctx.user.password = password;
  ctx.user.mustChangePassword = false;
  return event(ctx, ctx.user, 'Se cambió la contraseña');
}

function startTrip(ctx, { id }) {
  const trip = ownedTrip(ctx, id, 'Programado');
  const shift = ctx.state.shifts.find(record => record.driverId === trip.driverId && !record.closedAt);
  ensure(shift, 'Abrí un turno para iniciar el viaje.');
  ensure(!ctx.state.trips.some(record => record.driverId === trip.driverId && record.status === 'En curso'), 'Ya tenés un viaje en curso.');
  trip.status = 'En curso';
  trip.shiftId = shift.id;
  trip.vehicleId = shift.vehicleId;
  return event(ctx, trip, 'Se inició el viaje', { before: { status: 'Programado' }, after: { status: trip.status } });
}

function passenger(ctx, { id, patientId, status }) {
  const trip = ownedTrip(ctx, id, 'En curso');
  const stop = trip.passengers.find(item => item.patientId === patientId);
  ensure(stop, 'El paciente no pertenece al viaje.');
  const before = stop.status;
  stop.status = choice(status, ['Recogido', 'No viajó'], 'un estado del pasajero');
  return event(ctx, trip, 'Se registró el estado de un pasajero', {
    before: { patientId, status: before }, after: { patientId, status }
  });
}

function finishTrip(ctx, { id }) {
  const trip = ownedTrip(ctx, id, 'En curso');
  ensure(trip.passengers.every(stop => stop.status === 'Recogido' || stop.status === 'No viajó'), 'Completá el estado de todos los pasajeros.');
  trip.status = 'Realizado';
  return event(ctx, trip, 'Se finalizó el viaje', { before: { status: 'En curso' }, after: { status: trip.status } });
}

function permittedTripNote(ctx, id) {
  const trip = found(ctx.state, 'trips', id, 'el viaje');
  if (!can(ctx.state, ctx.user.id, 'plan')) {
    ensure(trip.driverId === ownDriver(ctx).id, 'Sólo podés operar sobre un viaje propio asignado.');
  }
  return trip;
}

function noTrip(ctx, { id, reason }) {
  const trip = permittedTripNote(ctx, id);
  ensure(!finalStatuses.includes(trip.status), 'El viaje ya tiene un estado final.');
  const why = required(reason, 'el motivo');
  const before = trip.status;
  trip.status = 'No realizado';
  trip.nonperformanceReason = why;
  return event(ctx, trip, 'Se registró el viaje como No realizado', { reason: why, before: { status: before }, after: { status: trip.status } });
}

function addNote(ctx, { id, text }) {
  const trip = permittedTripNote(ctx, id);
  const note = required(text, 'la novedad');
  trip.notes.push({ text: note, authorId: ctx.user.id, at: now(ctx.state) });
  return event(ctx, trip, 'Se agregó una novedad al viaje', { after: note });
}

function checkTripCorrection(ctx, id) {
  permit(ctx, 'plan');
  const trip = found(ctx.state, 'trips', id, 'el viaje');
  const issued = ctx.state.settlements.some(settlement => settlement.tripIds.includes(id));
  ensure(!issued || can(ctx.state, ctx.user.id, 'admin'), 'Sólo el Administrador puede corregir un viaje en una liquidación emitida.');
  return trip;
}

function correctTripState(ctx, { id, status, reason, nonperformanceReason }) {
  const trip = checkTripCorrection(ctx, id);
  ensure(finalStatuses.includes(trip.status), 'Para corregir el estado, el viaje debe tener una ejecución ya registrada.');
  choice(status, finalStatuses, 'un estado final');
  ensure(trip.status !== status, 'Seleccioná un estado diferente al actual.');
  const why = required(reason, 'el motivo de la corrección');
  const before = { status: trip.status, nonperformanceReason: trip.nonperformanceReason };
  trip.status = status;
  if (status === 'Realizado') trip.nonperformanceReason = '';
  if (status === 'No realizado' && nonperformanceReason !== undefined) {
    trip.nonperformanceReason = required(nonperformanceReason, 'el motivo de no realización');
  }
  return event(ctx, trip, 'Se corrigió el estado del viaje', {
    reason: why, before, after: { status, nonperformanceReason: trip.nonperformanceReason }
  });
}

function plannedDriver(state, driverId) {
  const driver = found(state, 'drivers', driverId, 'el chofer');
  ensure(driver.active, 'El chofer debe estar activo.');
  return driver.id;
}

function assignTrip(ctx, { id, driverId }) {
  permit(ctx, 'plan');
  const trip = found(ctx.state, 'trips', id, 'el viaje');
  ensure(trip.status === 'Programado', 'Sólo podés asignar viajes programados.');
  const before = trip.driverId;
  trip.driverId = driverId == null || driverId === '' ? null : plannedDriver(ctx.state, driverId);
  ensureSchedule(ctx.state.trips, new Set([id]));
  if (trip.driverId === before) return id;
  return event(ctx, trip, trip.driverId ? 'Se asignó el chofer del viaje' : 'El viaje quedó sin asignar', {
    before: { driverId: before }, after: { driverId: trip.driverId }
  });
}

function tripValues(trip) {
  const { commercialKm, driverId, amount, driverPay } = trip;
  return { commercialKm, driverId, amount, driverPay };
}

function correctTrip(ctx, { id, commercialKm, driverId, reason }) {
  const trip = checkTripCorrection(ctx, id);
  const why = required(reason, 'el motivo de la corrección');
  const before = tripValues(trip);
  if (driverId !== undefined && driverId !== trip.driverId) {
    ensure(trip.status !== 'En curso', 'El chofer del viaje en curso se conserva hasta resolverlo.');
    trip.driverId = plannedDriver(ctx.state, driverId);
    ensureSchedule(ctx.state.trips, new Set([id]));
  }
  if (commercialKm !== undefined) {
    const kms = number(commercialKm, 'un kilometraje comercial');
    if (kms !== trip.commercialKm) {
      trip.commercialKm = kms;
      trip.amount = money(trip.basePrice * kms / trip.baseKm);
      trip.driverPay = money(trip.amount * 0.14);
    }
  }
  return event(ctx, trip, 'Se corrigieron los kilómetros comerciales o el chofer', {
    reason: why, before, after: tripValues(trip)
  });
}

function adjustTrip(ctx, { id, amount, driverPay, reason }) {
  permit(ctx, 'commercial');
  const trip = found(ctx.state, 'trips', id, 'el viaje');
  const why = required(reason, 'el motivo del ajuste');
  const before = { amount: trip.amount, driverPay: trip.driverPay };
  trip.amount = money(number(amount, 'un importe de viaje'));
  trip.driverPay = money(number(driverPay, 'una remuneración'));
  return event(ctx, trip, 'Se ajustaron los importes del viaje', {
    reason: why, before, after: { amount: trip.amount, driverPay: trip.driverPay }
  });
}

function flagTrip(ctx, trip, reason) {
  trip.reviewReasons.push({ id: nextId(ctx.state, 'tr'), reason, resolved: false, authorId: ctx.user.id, at: now(ctx.state) });
  event(ctx, trip, 'Se señaló el viaje para revisión', { reason });
}

function resolveTripReview(ctx, { id, reviewId, reason }) {
  permit(ctx, 'plan');
  const trip = found(ctx.state, 'trips', id, 'el viaje');
  const why = required(reason, 'el resultado de la revisión');
  const review = trip.reviewReasons.find(item => !item.resolved && (!reviewId || item.id === reviewId));
  ensure(review, 'No se encontró un aviso pendiente de revisión.');
  review.resolved = true;
  return event(ctx, trip, 'Se resolvió un aviso del viaje', { reason: why, before: review.reason, after: { reviewId: review.id, resolved: true } });
}

const masterLabels = { patients: 'el paciente', drivers: 'el chofer', vehicles: 'el vehículo', routes: 'el recorrido' };

function saveMaster(ctx, { collection, id, data = {} }) {
  permit(ctx, 'masters');
  ensure(Object.hasOwn(masterLabels, collection), 'Seleccioná un tipo de registro válido.');
  const current = id ? found(ctx.state, collection, id, masterLabels[collection]) : null;
  const input = { ...current, ...data };
  let fields;
  if (collection === 'patients') {
    fields = { name: required(input.name, 'el nombre'), address: required(input.address, 'el domicilio'), phone: optional(input.phone) };
  } else if (collection === 'drivers') {
    fields = { name: required(input.name, 'el nombre'), phone: optional(input.phone), userId: current?.userId ?? null };
  } else if (collection === 'vehicles') {
    const plate = required(input.plate, 'la patente').toUpperCase();
    const plateKey = value => value.replace(/\s+/g, '');
    ensure(!ctx.state.vehicles.some(vehicle => vehicle.id !== id && plateKey(vehicle.plate) === plateKey(plate)), 'Ya existe un vehículo con esa patente.');
    fields = {
      alias: required(input.alias, 'el alias'), plate, capacity: 4,
      lastCloseKm: current?.lastCloseKm ?? number(input.lastCloseKm ?? 0, 'un último kilometraje', { integer: true })
    };
  } else {
    const group = choice(input.group, ['LMV', 'MJS'], 'un grupo de días');
    ensure(Array.isArray(input.patientIds) && input.patientIds.length <= 4, 'El recorrido admite hasta 4 pacientes.');
    ensure(new Set(input.patientIds).size === input.patientIds.length, 'El recorrido tiene pacientes repetidos.');
    for (const patientId of input.patientIds) {
      const patient = found(ctx.state, 'patients', patientId, 'el paciente');
      ensure(patient.active || current?.patientIds.includes(patientId), 'Seleccioná pacientes activos para nuevas paradas.');
    }
    const previousPrice = current?.basePrice ?? 0;
    const submittedPrice = data.basePrice === '' || data.basePrice === undefined ? previousPrice : number(data.basePrice, 'un importe base');
    ensure(submittedPrice === previousPrice || can(ctx.state, ctx.user.id, 'commercial'), 'Tu cuenta no tiene permiso para cambiar importes.');
    fields = {
      name: required(input.name, 'el nombre'), group, days: [...groupDays[group]],
      entryTime: clockTime(input.entryTime), exitTime: clockTime(input.exitTime), destination: required(input.destination, 'el destino'),
      patientIds: [...input.patientIds], baseKm: number(input.baseKm, 'un kilometraje base', { minimum: Number.EPSILON }),
      basePrice: money(submittedPrice)
    };
  }
  if (current) {
    const before = Object.fromEntries(Object.keys(fields).map(key => [key, current[key]]));
    Object.assign(current, fields);
    return event(ctx, current, 'Se actualizaron los datos del registro', { before, after: fields });
  }
  const record = { id: nextId(ctx.state, collection.slice(0, -1)), ...fields, active: true, history: [] };
  ctx.state[collection].push(record);
  return event(ctx, record, 'Se dio de alta el registro');
}

function driverDeactivation(ctx, driver) {
  if (!driver.active) return;
  driver.active = false;
  event(ctx, driver, 'Se dio de baja al chofer', { before: true, after: false });
  for (const trip of ctx.state.trips) {
    if (trip.driverId !== driver.id || trip.status !== 'Programado' || trip.date < ctx.state.today) continue;
    trip.driverId = null;
    event(ctx, trip, 'El viaje quedó sin asignar por baja del chofer', { before: { driverId: driver.id }, after: { driverId: null } });
    flagTrip(ctx, trip, 'Chofer dado de baja: requiere reemplazo.');
  }
}

function deactivate(ctx, { collection, id }) {
  permit(ctx, 'masters');
  ensure(Object.hasOwn(masterLabels, collection), 'Seleccioná un tipo de registro válido.');
  const record = found(ctx.state, collection, id, masterLabels[collection]);
  if (!record.active) return id;
  if (collection === 'drivers') {
    driverDeactivation(ctx, record);
    const user = find(ctx.state, 'users', record.userId);
    if (user?.roles.includes('chofer')) {
      const before = user.roles;
      user.roles = before.filter(role => role !== 'chofer');
      user.active = user.roles.length > 0;
      event(ctx, user, 'Se retiró el rol Chofer por baja operativa', { before, after: user.roles });
    }
    return id;
  }
  record.active = false;
  event(ctx, record, 'Se dio de baja el registro', { before: true, after: false });
  for (const trip of ctx.state.trips) {
    if (trip.date < ctx.state.today || finalStatuses.includes(trip.status)) continue;
    if (collection === 'patients' && trip.passengers.some(item => item.patientId === id)) {
      flagTrip(ctx, trip, 'Paciente dado de baja: revisar las paradas.');
    }
    if (collection === 'routes' && trip.routeId === id) flagTrip(ctx, trip, 'Recorrido dado de baja: revisar la programación.');
  }
  return id;
}

function priceOn(state, route, date) {
  const tariff = state.tariffs.filter(item => item.routeId === route.id && item.effectiveDate <= date)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0];
  return tariff?.amount ?? route.basePrice;
}

function operationalTrip(trip) {
  const { basePrice, amount, driverPay, history, ...visible } = trip;
  return visible;
}

function monthPlan(ctx, { month, routeIds }, redact) {
  permit(ctx, 'plan');
  isoMonth(month);
  ensure(Array.isArray(routeIds) && routeIds.length, 'Seleccioná al menos un recorrido.');
  const routes = [...new Set(routeIds)].map(id => {
    const route = found(ctx.state, 'routes', id, 'el recorrido');
    ensure(route.active, 'Seleccioná sólo recorridos activos.');
    return { ...route, patientIds: route.patientIds.filter(patientId => find(ctx.state, 'patients', patientId)?.active) };
  });
  const existingByKey = new Map(ctx.state.trips.map(trip => [trip.date + '/' + trip.routeId + '/' + trip.type, trip]));
  const missing = [];
  const existing = [];
  const first = new Date(month + '-01T00:00:00Z');
  for (const date = first; date.toISOString().startsWith(month); date.setUTCDate(date.getUTCDate() + 1)) {
    const iso = date.toISOString().slice(0, 10);
    for (const route of routes) {
      if (!route.days.includes(date.getUTCDay())) continue;
      for (const type of ['Entrada', 'Salida']) {
        const known = existingByKey.get(iso + '/' + route.id + '/' + type);
        if (known) {
          existing.push(known);
        } else {
          missing.push(makeTrip(route, iso, type, priceOn(ctx.state, route, iso)));
        }
      }
    }
  }
  const entries = missing.filter(trip => trip.type === 'Entrada').length;
  return {
    missing: redact ? missing.map(operationalTrip) : missing,
    existing: redact ? existing.map(operationalTrip) : existing,
    entries, exits: missing.length - entries
  };
}

function generateMonth(ctx, payload) {
  const plan = monthPlan(ctx, payload, false);
  for (const trip of plan.missing) {
    trip.id = nextId(ctx.state, 't');
    ctx.state.trips.push(trip);
    event(ctx, trip, 'Se generó el viaje de la programación mensual');
  }
  return { created: plan.missing.length, existing: plan.existing.length };
}

function reprogramming(ctx, { routeId, date, scope, entryTime, exitTime }) {
  permit(ctx, 'plan');
  found(ctx.state, 'routes', routeId, 'el recorrido');
  isoDate(date);
  choice(scope, ['one', 'rest'], 'un alcance');
  clockTime(entryTime);
  clockTime(exitTime);
  const selected = ctx.state.trips.filter(trip => trip.routeId === routeId && (scope === 'one'
    ? trip.date === date
    : trip.date >= date && trip.date >= ctx.state.today && trip.date.startsWith(date.slice(0, 7))));
  const affected = selected.filter(trip => trip.status === 'Programado');
  const excluded = selected.filter(trip => trip.status !== 'Programado')
    .map(trip => ({ trip, reason: trip.status === 'En curso' ? 'El viaje ya se inició.' : 'El viaje tiene un estado final.' }));
  const changedTimes = new Map();
  for (const trip of affected) {
    const time = trip.type === 'Entrada' ? entryTime : exitTime;
    if (time !== trip.time) changedTimes.set(trip.id, time);
  }
  const projected = ctx.state.trips.map(trip => changedTimes.has(trip.id) ? { ...trip, time: changedTimes.get(trip.id) } : trip);
  ensureSchedule(projected, new Set(changedTimes.keys()));
  return { affected, excluded, changedTimes };
}

function reschedule(ctx, payload) {
  const plan = reprogramming(ctx, payload);
  for (const trip of plan.affected) {
    const time = plan.changedTimes.get(trip.id);
    if (!time) continue;
    const before = trip.time;
    trip.time = time;
    event(ctx, trip, 'Se reprogramó el horario', { before: { time: before }, after: { time } });
  }
  return { changed: plan.changedTimes.size, excluded: plan.excluded.length };
}

function fuelReceipt(value) {
  if (value == null || value === '') return null;
  ensure(typeof value === 'string' && /^data:image\/[\w.+-]+(?:;[\w=.+-]+)*,/i.test(value), 'Adjuntá una imagen válida del comprobante.');
  return value;
}

function saveFuel(ctx, { id, data = {} }) {
  const current = id ? found(ctx.state, 'fuel', id, 'la carga') : null;
  let shift;
  let driver;
  if (current && can(ctx.state, ctx.user.id, 'fuelVerify')) {
    shift = find(ctx.state, 'shifts', current.shiftId);
  } else {
    driver = ownDriver(ctx);
    if (current) {
      ensure(current.userId === ctx.user.id && current.driverId === driver.id, 'Sólo tenés permiso para editar una carga propia.');
      ensure(!current.verified, 'La carga ya está verificada.');
      shift = find(ctx.state, 'shifts', current.shiftId);
    } else {
      shift = ctx.state.shifts.find(record => record.driverId === driver.id && !record.closedAt);
      ensure(shift, 'Abrí un turno abierto antes de registrar combustible.');
    }
  }
  const input = { ...current, ...data };
  const vehicle = found(ctx.state, 'vehicles', input.vehicleId ?? shift?.vehicleId, 'el vehículo');
  ensure(!shift || shift.vehicleId === vehicle.id, 'La carga debe corresponder al vehículo del turno.');
  const receipt = data.receipt === undefined ? current?.receipt ?? null : fuelReceipt(data.receipt);
  ensure(!current?.verified || receipt, 'Una carga verificada debe conservar su comprobante.');
  const fields = {
    date: isoDate(input.date), time: clockTime(input.time), vehicleId: vehicle.id,
    type: choice(input.type, ['GNC', 'Nafta', 'Gasoil'], 'un combustible'),
    quantity: number(input.quantity, 'una cantidad', { minimum: Number.EPSILON }),
    amount: money(number(input.amount, 'un importe', { minimum: Number.EPSILON })),
    odometer: number(input.odometer, 'un kilometraje', { integer: true }), receipt
  };
  if (current) {
    const before = Object.fromEntries(Object.keys(fields).map(key => [key, current[key]]));
    Object.assign(current, fields);
    return event(ctx, current, 'Se actualizó la carga de combustible', {
      before: { ...before, receipt: Boolean(before.receipt) }, after: { ...fields, receipt: Boolean(fields.receipt) }
    });
  }
  const record = {
    id: nextId(ctx.state, 'f'), ...fields, driverId: driver.id, userId: ctx.user.id,
    shiftId: shift.id, verified: false, history: []
  };
  ctx.state.fuel.push(record);
  return event(ctx, record, 'Se registró la carga de combustible');
}

function verifyFuel(ctx, { id }) {
  permit(ctx, 'fuelVerify');
  const record = found(ctx.state, 'fuel', id, 'la carga');
  ensure(record.receipt, 'Falta adjuntar el comprobante');
  if (record.verified) return id;
  record.verified = true;
  return event(ctx, record, 'Se verificó el comprobante de combustible', { before: false, after: true });
}

function saveExpense(ctx, { id, data = {} }) {
  permit(ctx, 'expense');
  const current = id ? found(ctx.state, 'expenses', id, 'el gasto') : null;
  const input = { ...current, ...data };
  const vehicle = found(ctx.state, 'vehicles', input.vehicleId, 'el vehículo');
  const fields = {
    vehicleId: vehicle.id, date: isoDate(input.date),
    category: choice(input.category, ['Seguro', 'GPS', 'Mantenimiento', 'Cubiertas', 'Reparaciones'], 'una categoría'),
    description: required(input.description, 'la descripción'),
    amount: money(number(input.amount, 'un importe', { minimum: Number.EPSILON })),
    odometer: input.odometer == null || input.odometer === '' ? null : number(input.odometer, 'un kilometraje', { integer: true }),
    provider: optional(input.provider)
  };
  if (current) {
    const before = Object.fromEntries(Object.keys(fields).map(key => [key, current[key]]));
    Object.assign(current, fields);
    return event(ctx, current, 'Se actualizó el gasto', { before, after: fields });
  }
  const record = { id: nextId(ctx.state, 'e'), ...fields, history: [] };
  ctx.state.expenses.push(record);
  return event(ctx, record, 'Se registró el gasto');
}

function normalizeRoles(roles, allowEmpty = false) {
  ensure(Array.isArray(roles) && (roles.length || allowEmpty), 'Seleccioná al menos un rol.');
  return [...new Set(roles.map(role => choice(role, ['admin', 'encargado', 'secretaria', 'chofer'], 'un rol')))];
}

function associateDriver(ctx, user, driverId) {
  const current = ctx.state.drivers.find(driver => driver.userId === user.id);
  if (current) {
    if (!current.active) {
      current.active = true;
      event(ctx, current, 'Se reactivó al chofer al asignar el rol', { before: false, after: true });
    }
    return;
  }
  if (driverId) {
    const driver = found(ctx.state, 'drivers', driverId, 'el chofer');
    ensure(!driver.userId, 'Ese chofer ya está asociado a otra cuenta.');
    driver.userId = user.id;
    driver.active = true;
    event(ctx, driver, 'Se asoció el chofer a su cuenta');
    return;
  }
  const driver = {
    id: nextId(ctx.state, 'driver'), userId: user.id, name: user.name, phone: '', active: true, history: []
  };
  ctx.state.drivers.push(driver);
  event(ctx, driver, 'Se creó el chofer asociado a la cuenta');
}

function createUser(ctx, { name, username, roles, driverId }) {
  permit(ctx, 'users');
  const loginName = required(username, 'el nombre de usuario').toLowerCase();
  ensure(!/\s/.test(loginName), 'El nombre de usuario debe ir sin espacios.');
  ensure(!ctx.state.users.some(user => user.username.toLowerCase() === loginName), 'Ese nombre de usuario ya existe.');
  const assigned = normalizeRoles(roles);
  ensure(!driverId || assigned.includes('chofer'), 'Asigná el rol Chofer para vincular un chofer existente.');
  const id = nextId(ctx.state, 'u');
  const tempPassword = 'irid-demo-' + ctx.state.seq;
  const user = {
    id, name: required(name, 'el nombre'), username: loginName, roles: assigned, active: true,
    password: tempPassword, mustChangePassword: true, history: []
  };
  ctx.state.users.push(user);
  if (assigned.includes('chofer')) associateDriver(ctx, user, driverId);
  event(ctx, user, 'Se creó la cuenta con una contraseña temporal', { after: assigned });
  return { id, tempPassword };
}

function setRoles(ctx, { id, roles }) {
  permit(ctx, 'users');
  const user = found(ctx.state, 'users', id, 'la cuenta');
  const after = normalizeRoles(roles, true);
  const before = user.roles;
  if (before.includes('admin') && !after.includes('admin')) {
    ensure(id !== ctx.user.id, 'Conservá tu rol de Administrador en esta maqueta.');
    const anotherAdmin = ctx.state.users.some(candidate => candidate.id !== id && candidate.active && candidate.roles.includes('admin'));
    ensure(anotherAdmin, 'Debe quedar al menos un Administrador activo.');
  }
  user.roles = after;
  user.active = after.length > 0;
  if (after.includes('chofer')) {
    associateDriver(ctx, user);
  } else if (before.includes('chofer')) {
    const driver = driverFor(ctx.state, id);
    if (driver) driverDeactivation(ctx, driver);
  }
  return event(ctx, user, 'Se actualizaron los roles de la cuenta', { before, after });
}

function resetPassword(ctx, { id }) {
  permit(ctx, 'users');
  const user = found(ctx.state, 'users', id, 'la cuenta');
  const tempPassword = 'irid-demo-' + nextId(ctx.state, 'pw').slice(3);
  user.password = tempPassword;
  user.mustChangePassword = true;
  event(ctx, user, 'Se restableció el acceso con una contraseña temporal');
  return { id, tempPassword };
}

function addTariff(ctx, { routeId, amount, effectiveDate }) {
  permit(ctx, 'commercial');
  found(ctx.state, 'routes', routeId, 'el recorrido');
  isoDate(effectiveDate);
  ensure(effectiveDate >= ctx.state.today, 'La vigencia debe comenzar hoy o en una fecha posterior.');
  ensure(!ctx.state.tariffs.some(tariff => tariff.routeId === routeId && tariff.effectiveDate === effectiveDate), 'Ya hay una tarifa con esa fecha de vigencia.');
  const tariff = { id: nextId(ctx.state, 'tf'), routeId, amount: money(number(amount, 'un importe')), effectiveDate, history: [] };
  ctx.state.tariffs.push(tariff);
  return event(ctx, tariff, 'Se registró una nueva tarifa');
}

function settlementRow(state, trip) {
  const route = find(state, 'routes', trip.routeId);
  const driver = find(state, 'drivers', trip.driverId);
  return {
    tripId: trip.id, date: trip.date, time: trip.time, type: trip.type,
    route: route?.name ?? 'Recorrido sin nombre', group: route?.group ?? '', driver: driver?.name ?? 'Sin asignar',
    commercialKm: trip.commercialKm, status: trip.status, amount: trip.amount, driverPay: trip.driverPay
  };
}

function settlementDifferences(previous, rows) {
  if (!previous) return [];
  const oldById = new Map(previous.rows.map(row => [row.tripId, row]));
  const newById = new Map(rows.map(row => [row.tripId, row]));
  const ids = new Set([...oldById.keys(), ...newById.keys()]);
  const differences = [];
  for (const tripId of ids) {
    const before = oldById.get(tripId) ?? null;
    const after = newById.get(tripId) ?? null;
    if (before && after && Object.keys(after).every(key => before[key] === after[key])) continue;
    const label = before ? (after ? 'Viaje corregido' : 'El viaje salió del alcance') : 'Viaje incorporado';
    differences.push({ tripId, label, before, after });
  }
  return differences;
}

function settlementScope(ctx, { period, type, driverId, previousId }) {
  permit(ctx, 'commercial');
  isoMonth(period);
  choice(type, ['Transp SERV', 'Chofer'], 'un tipo de liquidación');
  const driver = type === 'Chofer' ? found(ctx.state, 'drivers', driverId, 'el chofer') : null;
  const matching = ctx.state.settlements.filter(item => item.period === period && item.type === type
    && item.driverId === (driver?.id ?? null));
  const latest = matching.reduce((current, item) => (!current || item.version > current.version) ? item : current, null);
  const previous = previousId ? matching.find(item => item.id === previousId) : latest;
  ensure(!previousId || previous, 'La versión anterior debe corresponder al mismo período y destinatario.');
  return { driver, latest, previous };
}

function settlementPreview(ctx, payload) {
  const { period, type } = payload;
  const { driver, previous } = settlementScope(ctx, payload);
  const trips = ctx.state.trips.filter(trip => trip.date.startsWith(period + '-') && (!driver || trip.driverId === driver.id))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
  const unresolved = trips.filter(trip => !finalStatuses.includes(trip.status));
  const rows = trips.map(trip => settlementRow(ctx.state, trip));
  const payable = type === 'Chofer' ? 'driverPay' : 'amount';
  const total = money(rows.reduce((sum, row) => sum + (row.status === 'Realizado' ? row[payable] : 0), 0));
  return {
    rows, tripIds: trips.map(trip => trip.id), unresolved, total, minimumPending: type === 'Chofer',
    differences: settlementDifferences(previous, rows), previous
  };
}

function issueSettlement(ctx, payload) {
  const { period, type } = payload;
  const { driver, latest, previous } = settlementScope(ctx, payload);
  ensure(previous === latest, 'Prepará la corrección desde la última versión emitida.');
  const calculated = settlementPreview(ctx, payload);
  ensure(!calculated.unresolved.length, 'Quedan viajes pendientes de resolver en esta liquidación.');
  const version = latest ? latest.version + 1 : 1;
  const record = {
    id: nextId(ctx.state, 'ls'), period, type, driverId: driver?.id ?? null, version, previousId: previous?.id ?? null,
    issuedAt: now(ctx.state), issuedBy: ctx.user.id, recipientName: driver?.name ?? 'Transp SERV',
    total: calculated.total, minimumPending: calculated.minimumPending, tripIds: calculated.tripIds, rows: calculated.rows, history: []
  };
  ctx.state.settlements.push(record);
  return event(ctx, record, 'Se emitió la versión ' + version);
}

const actions = {
  changePassword, saveMaster, deactivate, openShift, closeShift, requestReadingReview, resolveReading, correctReading,
  startTrip, passenger, finishTrip, noTrip, correctTripState, assignTrip, correctTrip, adjustTrip, addNote, resolveTripReview,
  generateMonth, reschedule, saveFuel, verifyFuel, saveExpense, createUser, setRoles, resetPassword, addTariff, issueSettlement
};

const previews = {
  generateMonth: (ctx, payload) => monthPlan(ctx, payload, !can(ctx.state, ctx.user.id, 'commercial')),
  reschedule: (ctx, payload) => {
    const { affected, excluded } = reprogramming(ctx, payload);
    if (can(ctx.state, ctx.user.id, 'commercial')) return { affected, excluded };
    return {
      affected: affected.map(operationalTrip),
      excluded: excluded.map(({ trip, reason }) => ({ trip: operationalTrip(trip), reason }))
    };
  },
  settlementPreview
};

export function apply(state, userId, type, payload = {}) {
  account(state, userId, type);
  ensure(Object.hasOwn(actions, type), 'Acción desconocida.');
  const next = structuredClone(state);
  const ctx = { state: next, user: find(next, 'users', userId) };
  return { state: next, result: actions[type](ctx, payload) };
}

export function preview(state, userId, type, payload = {}) {
  const user = account(state, userId, type);
  ensure(Object.hasOwn(previews, type), 'Vista previa desconocida.');
  return structuredClone(previews[type]({ state, user }, payload));
}
