import test from 'node:test';
import assert from 'node:assert/strict';
import { seed, apply } from '../src/domain.js';
import { handle, render } from '../src/operations.js';

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
  assert.match(step(), /El viaje no se realizó/);
  assert.match(render(ctx,'jornada'), /data-action="op:close-shift"/);
  for (const p of state.trips.find(t=>t.id===id).passengers) {
    run('passenger',{id,patientId:p.patientId,status:'Recogido'});
  }
  assert.match(step(), /Finalizar viaje/);
  run('finishTrip',{id});
  assert.match(step(), /Iniciar viaje de las 12:00/);
});

test('el detalle no puede sobrescribir asistencias individuales en lote', async () => {
  let state = seed();
  const run = (type,payload) => { state = apply(state,'u-driver',type,payload).state; };
  const id = 't-diego-08';
  run('openShift',{vehicleId:'v-1',reading:50000});
  run('startTrip',{id});
  const passengers = () => state.trips.find(t=>t.id===id).passengers;
  run('passenger',{id,patientId:passengers()[0].patientId,status:'No viajó'});
  const before = passengers().map(p=>p.status);
  const ctx = {getState:()=>state,driver:state.drivers.find(d=>d.userId==='u-driver'),
    can:cap=>cap==='drive',params:{},run,toast(){}};
  assert.equal(await handle(ctx,'op:passengers-all',{dataset:{id}}),false);
  assert.deepEqual(passengers().map(p=>p.status),before);
});

test('asignaciones pendientes incluye todas las fechas y se actualiza al asignar', () => {
  let state = seed();
  const ctx = {getState:()=>state, can:()=>true, field:String, select:String, h:String, date:String, badge:String,
    lookup:(group,id)=>state[group].find(item=>item.id===id)?.name,
    button:(label,action,attrs)=>`<button data-action="${action}" ${attrs}>${label}</button>`, empty:String};
  const list = () => render(ctx,'agenda',{queue:'unassigned'});
  const pending = state.trips.filter(t=>!t.driverId && t.status==='Programado');
  pending.forEach(t=>assert.ok(list().includes(`data-id="${t.id}"`)));
  assert.equal((list().match(/data-action="op:assign"/g)||[]).length,pending.length);
  for (const trip of pending) {
    state = apply(state,'u-admin','assignTrip',{id:trip.id,driverId:'d-lucia'}).state;
    assert.ok(!list().includes(`data-id="${trip.id}"`));
  }
  assert.match(list(),/Todos los viajes tienen chofer/);
});
