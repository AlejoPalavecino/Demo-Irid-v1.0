import assert from 'node:assert/strict';
import test from 'node:test';
import { apply, can, home, login, preview, seed } from '../src/domain.js';

const admin = 'u-admin';
const walter = 'u-walter';
const secretary = 'u-secretary';
const diego = 'u-driver';
const activeTrip = 't-diego-08';
const get = (state, collection, id) => state[collection].find(item => item.id === id);
const run = (state, user, action, payload) => apply(state, user, action, payload).state;

test('la demo inicia por rol y protege operaciones comerciales y de usuarios', () => {
  const state = seed();
  assert.equal(login(state, 'diego', 'demo123'), diego);
  assert.equal(home(state, diego), 'jornada');
  assert.equal(home(state, walter), 'agenda');
  assert.equal(can(state, walter, 'drive'), true);
  assert.equal(can(state, walter, 'commercial'), false);
  assert.equal(can(state, secretary, 'odometer'), false);
  assert.throws(() => preview(state, walter, 'settlementPreview', { period: '2026-10', type: 'Transp SERV' }), /permiso/i);
  assert.throws(() => apply(state, secretary, 'assignTrip', { id: 't-unassigned', driverId: 'd-diego' }), /permiso/i);
  assert.throws(() => apply(state, diego, 'resetPassword', { id: admin }), /permiso/i);
});

test('apertura positiva, cierre bloqueado y recorrido sin pasajeros a bordo', () => {
  const original = seed();
  const { state: opened, result: shiftId } = apply(original, diego, 'openShift', { vehicleId: 'v-1', reading: 50020 });
  assert.equal(original.shifts.some(s => s.id === shiftId), false);
  const review = opened.readingReviews.find(r => r.shiftId === shiftId);
  assert.ok(review, 'la apertura 20 km por encima del último cierre debe crear una revisión');
  assert.equal(review.difference, 20);
  assert.equal(review.status, 'Pendiente');
  assert.throws(() => apply(opened, diego, 'openShift', { vehicleId: 'v-3', reading: 31000 }), /turno abierto/i);
  const started = run(opened, diego, 'startTrip', { id: activeTrip });
  assert.equal(get(started, 'trips', activeTrip).vehicleId, 'v-1');
  assert.throws(() => apply(started, diego, 'startTrip', { id: 't-diego-12' }), /viaje en curso/i);
  assert.throws(() => apply(started, admin, 'closeShift', { id: shiftId, endKm: 50040, reason: 'Olvido' }), /viaje en curso/i);
  assert.throws(() => apply(started, diego, 'finishTrip', { id: activeTrip }), /pasajeros/i);
  let current = started;
  for (const passenger of get(started, 'trips', activeTrip).passengers) {
    current = run(current, diego, 'passenger', { id: activeTrip, patientId: passenger.patientId, status: 'No viajó' });
  }
  current = run(current, diego, 'finishTrip', { id: activeTrip });
  assert.equal(get(current, 'trips', activeTrip).status, 'Realizado');
  current = run(current, diego, 'closeShift', { id: shiftId, endKm: 50044 });
  assert.equal(get(current, 'vehicles', 'v-1').lastCloseKm, 50044);
});

test('una lectura inferior bloquea y preserva la observada tras corregir la referencia', () => {
  const state = seed();
  state.readingReviews = state.readingReviews.filter(review => review.id !== 'rr-negative');
  assert.throws(() => apply(state, diego, 'openShift', { vehicleId: 'v-3', reading: 30970 }), /inferior/i);
  const { state: asked, result: id } = apply(state, diego, 'requestReadingReview', { vehicleId: 'v-3', reading: 30970 });
  assert.throws(() => apply(asked, diego, 'openShift', { vehicleId: 'v-3', reading: 31000 }), /pendiente de revisión/i);
  assert.throws(() => apply(asked, walter, 'openShift', { vehicleId: 'v-3', reading: 31010 }), /pendiente de revisión/i);
  assert.throws(() => apply(asked, walter, 'resolveReading', { id, reason: 'Conforme' }), /correg/i);
  assert.throws(() => apply(asked, secretary, 'correctReading', { vehicleId: 'v-3', value: 30970, reason: 'Error', reviewId: id }), /permiso/i);
  const second = apply(asked, walter, 'requestReadingReview', { vehicleId: 'v-3', reading: 30972 });
  const partial = run(second.state, walter, 'correctReading', {
    vehicleId: 'v-3', value: 30972, reason: 'Primera revisión', reviewId: second.result
  });
  assert.equal(get(partial, 'readingReviews', id).status, 'Pendiente');
  assert.equal(get(partial, 'readingReviews', second.result).status, 'Resuelta');
  assert.throws(() => apply(partial, walter, 'openShift', { vehicleId: 'v-3', reading: 30972 }), /pendiente de revisión/i);
  const corrected = run(second.state, walter, 'correctReading', { vehicleId: 'v-3', value: 30970, reason: 'Registro transpuesto', reviewId: id });
  assert.equal(get(corrected, 'readingReviews', id).reading, 30970);
  assert.equal(get(corrected, 'readingReviews', id).lastCloseKm, 31000);
  assert.equal(get(corrected, 'readingReviews', id).status, 'Resuelta');
  assert.equal(get(corrected, 'readingReviews', second.result).reading, 30972);
  assert.equal(get(corrected, 'readingReviews', second.result).status, 'Resuelta');
  assert.equal(get(corrected, 'vehicles', 'v-3').history.at(-1).before, 31000);
  assert.equal(get(corrected, 'vehicles', 'v-3').history.at(-1).after, 30970);
  assert.ok(apply(corrected, diego, 'openShift', { vehicleId: 'v-3', reading: 30970 }).result);
});

test('el cierre supervisado exige motivo y conserva al chofer, y confirmar una diferencia no cambia lecturas', () => {
  const state = seed();
  assert.throws(() => apply(state, walter, 'closeShift', { id: 's-old', endKm: 41290 }), /motivo/i);
  const old = get(state, 'shifts', 's-old');
  const closed = run(state, walter, 'closeShift', { id: 's-old', endKm: 41290, reason: 'Cierre olvidado' });
  assert.equal(get(closed, 'shifts', 's-old').driverId, old.driverId);
  assert.equal(get(closed, 'shifts', 's-old').closedBy, walter);
  assert.throws(() => apply(closed, walter, 'resolveReading', { id: 'rr-positive' }), /motivo/i);
  const done = run(closed, walter, 'resolveReading', { id: 'rr-positive', reason: 'Traslado al taller' });
  const review = get(done, 'readingReviews', 'rr-positive');
  assert.equal(review.status, 'Resuelta');
  assert.equal(review.reading, get(state, 'readingReviews', 'rr-positive').reading);
  assert.deepEqual(done.vehicles, closed.vehicles);
});

test('la foto se adjunta al mismo registro y la verificación bloquea edición del chofer', () => {
  const state = seed();
  const id = 'f-no-receipt';
  const receipt = get(state, 'fuel', 'f-pending').receipt;
  assert.throws(() => apply(state, secretary, 'verifyFuel', { id }), /Falta adjuntar el comprobante/);
  assert.throws(() => apply(state, diego, 'saveFuel', { id: 'f-pending', data: { amount: 20000 } }), /propia|permiso/i);
  assert.throws(() => apply(state, walter, 'saveFuel', { id, data: { amount: 20000 } }), /permiso/i);
  const attached = run(state, diego, 'saveFuel', { id, data: { receipt } });
  assert.equal(attached.fuel.length, state.fuel.length);
  assert.equal(get(attached, 'fuel', id).verified, false);
  const verified = run(attached, secretary, 'verifyFuel', { id });
  assert.equal(get(verified, 'fuel', id).verified, true);
  assert.throws(() => apply(verified, diego, 'saveFuel', { id, data: { amount: 20000 } }), /verificada/i);
  const edited = run(verified, secretary, 'saveFuel', { id, data: { amount: 20000 } });
  assert.equal(get(edited, 'fuel', id).receipt, receipt);
  assert.equal(get(edited, 'fuel', id).history.length, get(verified, 'fuel', id).history.length + 1);
});

test('la carga nueva usa el turno propio y el gasto tiene un único registro', () => {
  const state = seed();
  const fuel = { date: state.today, time: '10:00', vehicleId: 'v-1', type: 'GNC', quantity: 13.5, amount: 10500, odometer: 50032 };
  assert.throws(() => apply(state, diego, 'saveFuel', { data: fuel }), /turno abierto/i);
  const opened = apply(state, diego, 'openShift', { vehicleId: 'v-1', reading: 50000 });
  const saved = apply(opened.state, diego, 'saveFuel', { data: fuel });
  assert.equal(get(saved.state, 'fuel', saved.result).shiftId, opened.result);
  const data = { vehicleId: 'v-1', date: state.today, category: 'Reparaciones', description: 'Repuesto ficticio', amount: 120000, odometer: '', provider: '' };
  const expense = apply(saved.state, secretary, 'saveExpense', { data });
  const edited = run(expense.state, walter, 'saveExpense', { id: expense.result, data: { amount: 115000 } });
  assert.equal(edited.expenses.length, state.expenses.length + 1);
  assert.equal(get(edited, 'expenses', expense.result).amount, 115000);
});

test('colisión por fecha y hora exactas rechaza la asignación e identifica el otro viaje', () => {
  const state = seed();
  const other = get(state, 'trips', 't-unassigned');
  const existing = get(state, 'trips', activeTrip);
  other.date = existing.date;
  other.time = existing.time;
  assert.throws(() => apply(state, walter, 'assignTrip', { id: other.id, driverId: 'd-diego' }), { conflictId: activeTrip });
  assert.equal(other.driverId, null);
  other.time = '08:01';
  assert.equal(get(run(state, walter, 'assignTrip', { id: other.id, driverId: 'd-diego' }), 'trips', other.id).driverId, 'd-diego');
});

test('generación mensual usa el calendario, no duplica ni expone importes a Walter', () => {
  const state = seed();
  const payload = { month: '2026-12', routeIds: ['r-centro', 'r-centro'] };
  const first = preview(state, walter, 'generateMonth', payload);
  assert.equal(first.entries, 13);
  assert.equal(first.exits, 13);
  assert.equal(first.missing.every(trip => !Object.hasOwn(trip, 'amount') && !Object.hasOwn(trip, 'basePrice')), true);
  const created = apply(state, walter, 'generateMonth', payload);
  assert.equal(created.result.created, 26);
  const one = created.state.trips.find(trip => trip.date.startsWith('2026-12'));
  const assigned = run(created.state, walter, 'assignTrip', { id: one.id, driverId: 'd-diego' });
  const next = apply(assigned, walter, 'generateMonth', payload);
  assert.deepEqual(next.result, { created: 0, existing: 26 });
  assert.deepEqual(next.state, assigned);
});

test('reprogramación sólo alcanza fechas seleccionadas sin iniciar y no deja cambios parciales con colisión', () => {
  const state = seed();
  const current = get(state, 'trips', activeTrip);
  const routeId = current.routeId;
  get(state, 'trips', 't-diego-12').status = 'En curso';
  const payload = { routeId, date: state.today, scope: 'rest', entryTime: '07:00', exitTime: '12:05' };
  const plan = preview(state, walter, 'reschedule', payload);
  assert.ok(plan.affected.some(trip => trip.id === activeTrip));
  assert.ok(plan.excluded.some(row => row.trip.id === 't-diego-12'));
  const changed = run(state, walter, 'reschedule', payload);
  assert.equal(get(changed, 'trips', activeTrip).time, '07:00');
  assert.deepEqual(get(changed, 'trips', 't-diego-12'), get(state, 'trips', 't-diego-12'));
  const collision = get(state, 'trips', 't-diego-1430');
  collision.time = '07:00';
  assert.throws(() => apply(state, walter, 'reschedule', payload), { conflictId: collision.id });
  assert.equal(current.time, '08:00');
});

test('baja chofer conserva doble rol, historia y ejecución en curso', () => {
  const state = seed();
  const running = get(state, 'trips', 't-diego-1430');
  running.driverId = 'd-walter';
  running.status = 'En curso';
  const after = run(state, admin, 'deactivate', { collection: 'drivers', id: 'd-walter' });
  assert.equal(can(after, walter, 'plan'), true);
  assert.equal(can(after, walter, 'drive'), false);
  assert.equal(get(after, 'trips', 't-walter-09').driverId, null);
  assert.ok(get(after, 'trips', 't-walter-09').reviewReasons.some(review => !review.resolved));
  assert.deepEqual(get(after, 'trips', running.id), running);
  assert.equal(get(after, 'trips', 't-oct-walter').driverId, 'd-walter');
});

test('bajas de paciente y recorrido conservan pasajeros y revisan un aviso por vez', () => {
  const state = seed();
  const trip = get(state, 'trips', activeTrip);
  let next = run(state, walter, 'deactivate', { collection: 'patients', id: trip.passengers[0].patientId });
  next = run(next, walter, 'deactivate', { collection: 'routes', id: trip.routeId });
  const flagged = get(next, 'trips', activeTrip);
  assert.deepEqual(flagged.passengers, trip.passengers);
  assert.equal(flagged.driverId, trip.driverId);
  assert.equal(flagged.reviewReasons.length, 2);
  assert.throws(() => apply(next, diego, 'resolveTripReview', { id: activeTrip, reason: 'Listo' }), /permiso/i);
  next = run(next, walter, 'resolveTripReview', { id: activeTrip, reviewId: flagged.reviewReasons[1].id, reason: 'Se mantiene programación' });
  assert.equal(get(next, 'trips', activeTrip).reviewReasons.filter(review => review.resolved).length, 1);
  assert.equal(get(next, 'trips', activeTrip).reviewReasons[0].resolved, false);
  assert.equal(get(next, 'trips', activeTrip).status, trip.status);
});

test('aún no se emite un alcance sin resolver y la primera liquidación de chofer protege un viaje', () => {
  const state = seed();
  assert.throws(() => apply(state, admin, 'issueSettlement', { period: '2026-11', type: 'Transp SERV' }), /resolver|pendientes/i);
  assert.throws(() => apply(state, walter, 'correctTripState', { id: 't-oct-walter', status: 'No realizado', reason: 'Corrección' }), /Administrador|emitida/i);
  assert.throws(() => apply(state, walter, 'correctTrip', { id: 't-oct-walter', commercialKm: 17, driverId: 'd-walter', reason: 'Corrección' }), /Administrador|emitida/i);
  const corrected = run(state, walter, 'correctTrip', { id: 't-oct-diego', commercialKm: 9, driverId: 'd-diego', reason: 'Distancia real' });
  const trip = get(corrected, 'trips', 't-oct-diego');
  assert.equal(trip.amount, Math.round(trip.basePrice * 9 / trip.baseKm * 100) / 100);
  assert.equal(trip.driverPay, Math.round(trip.amount * .14 * 100) / 100);
});

test('una versión corregida conserva el cierre anterior aun al cambiar el chofer', () => {
  const state = seed();
  const previous = get(state, 'settlements', 'ls-walter-oct-v1');
  const corrected = run(state, admin, 'correctTrip', { id: 't-oct-walter', commercialKm: 18, driverId: 'd-diego', reason: 'Conductor cargado por error' });
  const payload = { period: '2026-10', type: 'Chofer', driverId: 'd-walter', previousId: previous.id };
  const prepared = preview(corrected, admin, 'settlementPreview', payload);
  assert.ok(prepared.differences.some(row => row.tripId === 't-oct-walter' && row.before && row.after === null));
  assert.equal(prepared.minimumPending, true);
  const issued = apply(corrected, admin, 'issueSettlement', payload);
  assert.deepEqual(get(issued.state, 'settlements', previous.id), previous);
  const version = get(issued.state, 'settlements', issued.result);
  assert.equal(version.version, 2);
  assert.equal(version.previousId, previous.id);
  assert.equal(version.total, 0);
});

test('tarifa nueva usa vigencia para viajes nuevos sin reescribir viajes existentes', () => {
  const state = seed();
  const current = get(state, 'trips', activeTrip);
  const withTariff = run(state, admin, 'addTariff', { routeId: current.routeId, amount: 50000, effectiveDate: '2026-11-18' });
  assert.deepEqual(get(withTariff, 'trips', activeTrip), current);
  const previewed = preview(withTariff, admin, 'generateMonth', { month: '2026-11', routeIds: [current.routeId] });
  assert.ok(previewed.missing.some(trip => trip.date === '2026-11-18' && trip.amount === 50000));
  assert.ok(previewed.missing.some(trip => trip.date < state.today && trip.amount !== 50000));
});

test('alta, restablecimiento y cambio obligatorio de contraseña temporal', () => {
  const state = seed();
  const created = apply(state, admin, 'createUser', { name: 'Cuenta de muestra', username: 'ensayo', roles: ['chofer'] });
  const { id, tempPassword } = created.result;
  assert.equal(login(created.state, 'ensayo', tempPassword), id);
  assert.equal(can(created.state, id, 'drive'), false);
  assert.throws(() => apply(created.state, id, 'openShift', { vehicleId: 'v-1', reading: 50000 }), /contraseña/i);
  const changed = run(created.state, id, 'changePassword', { password: 'otra-demo', repeat: 'otra-demo' });
  assert.equal(can(changed, id, 'drive'), true);
  assert.throws(() => login(changed, 'ensayo', tempPassword), /contraseña/i);
  assert.ok(changed.drivers.find(driver => driver.userId === id));
  const reset = apply(changed, admin, 'resetPassword', { id });
  assert.equal(can(reset.state, id, 'drive'), false);
  assert.throws(() => login(reset.state, 'ensayo', 'otra-demo'), /contraseña/i);
  assert.throws(() => apply(changed, admin, 'setRoles', { id: admin, roles: ['chofer'] }), /administr/i);
});

test('una novedad y una no realización requieren viaje propio o planificación y motivos separados al corregir', () => {
  const original = seed();
  assert.throws(() => apply(original, diego, 'noTrip', { id: 't-walter-09', reason: 'Ausencia' }), /viaje propio/i);
  assert.throws(() => apply(original, walter, 'noTrip', { id: activeTrip, reason: ' ' }), /motivo/i);
  const noted = run(original, diego, 'addNote', { id: activeTrip, text: 'Cambio informado por la familia' });
  assert.equal(get(noted, 'trips', activeTrip).notes[0].authorId, diego);
  const cancelled = run(noted, walter, 'noTrip', { id: activeTrip, reason: 'Servicio cancelado' });
  assert.equal(get(cancelled, 'trips', activeTrip).nonperformanceReason, 'Servicio cancelado');
  const asCompleted = run(cancelled, walter, 'correctTripState', { id: activeTrip, status: 'Realizado', reason: 'Se hizo el traslado' });
  assert.equal(get(asCompleted, 'trips', activeTrip).status, 'Realizado');
  assert.equal(get(asCompleted, 'trips', activeTrip).nonperformanceReason, '');
  const restored = run(asCompleted, walter, 'correctTripState', {
    id: activeTrip, status: 'No realizado', reason: 'Se registró otro viaje', nonperformanceReason: 'Paciente ausente'
  });
  const trip = get(restored, 'trips', activeTrip);
  assert.equal(trip.nonperformanceReason, 'Paciente ausente');
  assert.equal(trip.history.at(-1).reason, 'Se registró otro viaje');
});

test('maestros conservan asociaciones, límite de pasajeros e importes reservados', () => {
  const state = seed();
  const route = get(state, 'routes', 'r-centro');
  const edited = run(state, walter, 'saveMaster', { collection: 'routes', id: route.id, data: { destination: 'Destino ficticio' } });
  assert.equal(get(edited, 'routes', route.id).basePrice, route.basePrice);
  assert.throws(() => apply(state, walter, 'saveMaster', { collection: 'routes', id: route.id, data: { basePrice: 1 } }), /permiso/i);
  assert.throws(() => apply(state, admin, 'saveMaster', {
    collection: 'routes', id: route.id, data: { patientIds: ['p-1', 'p-2', 'p-3', 'p-4', 'p-5'] }
  }), /hasta 4/i);
  const newDriver = apply(state, walter, 'saveMaster', { collection: 'drivers', data: { name: 'Chofer de muestra' } });
  assert.equal(newDriver.state.users.length, state.users.length);
  const user = apply(newDriver.state, admin, 'createUser', {
    name: 'Chofer de muestra', username: 'muestra', roles: ['chofer'], driverId: newDriver.result
  });
  assert.equal(get(user.state, 'drivers', newDriver.result).userId, user.result.id);
  const revoked = run(user.state, admin, 'setRoles', { id: user.result.id, roles: [] });
  assert.equal(get(revoked, 'drivers', newDriver.result).active, false);
  assert.equal(home(revoked, user.result.id), 'login');
  const restored = run(revoked, admin, 'setRoles', { id: user.result.id, roles: ['chofer'] });
  assert.equal(get(restored, 'drivers', newDriver.result).active, true);
});

test('ajustar este viaje conserva su cálculo base y los totales cuentan solamente realizados', () => {
  const original = seed();
  const id = 't-oct-diego';
  assert.throws(() => apply(original, walter, 'adjustTrip', { id, amount: 31000, driverPay: 4500, reason: 'Ajuste' }), /permiso/i);
  const adjusted = run(original, admin, 'adjustTrip', { id, amount: 31000, driverPay: 4500, reason: 'Ajuste de la demo' });
  const before = get(original, 'trips', id);
  const trip = get(adjusted, 'trips', id);
  assert.equal(trip.basePrice, before.basePrice);
  assert.equal(trip.history.at(-1).before.amount, before.amount);
  const scope = { period: '2026-10', type: 'Chofer', driverId: 'd-diego' };
  const review = preview(adjusted, admin, 'settlementPreview', scope);
  assert.equal(review.total, 4500);
  assert.ok(review.tripIds.includes('t-oct-no'));
  assert.equal(review.unresolved.length, 0);
  review.rows[0].driverPay = 0;
  assert.equal(preview(adjusted, admin, 'settlementPreview', scope).total, 4500);
});

test('los mensajes de validación numérica respetan concordancia de género', () => {
  const state = seed();
  assert.throws(() => apply(state, diego, 'requestReadingReview', { vehicleId: 'v-3', reading: -1 }), /una lectura válida/);
  assert.throws(() => apply(state, admin, 'adjustTrip', { id: 't-oct-diego', amount: 30000, driverPay: -1, reason: 'Test' }), /una remuneración válida/);
});
