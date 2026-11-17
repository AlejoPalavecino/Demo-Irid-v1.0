import test from 'node:test';
import assert from 'node:assert/strict';
import { seed, apply } from '../src/domain.js';
import { render } from '../src/operations.js';

test('la jornada guía desde el turno hasta el siguiente viaje', () => {
  let state = seed();
  const ctx = {
    getState: () => state, driver: state.drivers.find(d => d.userId === 'u-driver'),
    can: cap => cap === 'drive', h: String, date: String,
    badge: String, lookup: (group,id) => state[group].find(x => x.id === id)?.name,
    button: (label,action,attrs,kind) => `<button class="${kind}" data-action="${action}" ${attrs}>${label}</button>`
  };
  const run = (action,payload) => { state = apply(state,'u-driver',action,payload).state; };
  const step = () => render(ctx,'jornada').match(/<section class="journey-step"[\s\S]*?<\/section>/)?.[0] || '';
  assert.match(step(), /Abrir turno/);
  run('openShift',{vehicleId:'v-1',reading:50000});
  assert.match(step(), /Iniciar viaje de las 08:00/);
  const id = 't-diego-08';
  run('startTrip',{id});
  assert.match(step(), /data-action="op:passenger"/);
  assert.doesNotMatch(step(), /data-action="op:finish-trip"/);
  for (const p of state.trips.find(t=>t.id===id).passengers) {
    run('passenger',{id,patientId:p.patientId,status:'Recogido'});
  }
  assert.match(step(), /Finalizar viaje/);
  run('finishTrip',{id});
  assert.match(step(), /Iniciar viaje de las 12:00/);
});
