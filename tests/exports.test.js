import assert from 'node:assert/strict';
import test from 'node:test';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { exportData, handle, render } from '../src/finance.js';
import { can, seed } from '../src/domain.js';

const title = 'Liquidación Diego López · Octubre · Versión 2';
const headers = ['Servicio', 'Importe (ARS)'];
const rows = Array.from({ length: 90 }, (_, index) => [`Viaje ${index + 1} · Ñandú & <á>`, index + 20.5]);

function partsOfZip(bytes) {
  const parts = new Map();
  let offset = 0;
  while (bytes.readUInt32LE(offset) === 0x04034b50) {
    const size = bytes.readUInt32LE(offset + 18);
    const nameLength = bytes.readUInt16LE(offset + 26);
    const namesStart = offset + 30;
    const dataStart = namesStart + nameLength + bytes.readUInt16LE(offset + 28);
    parts.set(bytes.toString('utf8', namesStart, namesStart + nameLength), bytes.toString('utf8', dataStart, dataStart + size));
    offset = dataStart + size;
  }
  assert.equal(bytes.readUInt32LE(offset), 0x02014b50);
  assert.equal(bytes.readUInt32LE(bytes.length - 22), 0x06054b50);
  return parts;
}

test('exporta un XLSX OpenXML con celdas numéricas y texto escapado', async () => {
  const { filename, blob } = exportData(title, headers, rows, 'xlsx');
  assert.match(filename, /^DEMO-.*\.xlsx$/);
  assert.match(blob.type, /spreadsheetml\.sheet/);
  const parts = partsOfZip(Buffer.from(await blob.arrayBuffer()));
  for (const path of ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels']) {
    assert.ok(parts.get(path));
  }
  const sheet = parts.get('xl/worksheets/sheet1.xml');
  assert.match(sheet, /DEMO.*Versión 2/);
  assert.match(sheet, /Viaje 90 · Ñandú &amp; &lt;á&gt;/);
  assert.match(sheet, /<v>109\.5<\/v>/);
  if (process.env.IRID_EXPORT_TEST_DIR) await writeFile(join(process.env.IRID_EXPORT_TEST_DIR, filename), new Uint8Array(await blob.arrayBuffer()));
});

test('exporta un PDF paginado que conserva acentos WinAnsi y la última fila', async () => {
  const { filename, blob } = exportData(title, headers, rows, 'pdf');
  assert.match(filename, /^DEMO-.*\.pdf$/);
  assert.equal(blob.type, 'application/pdf');
  const bytes = Buffer.from(await blob.arrayBuffer());
  const pdf = bytes.toString('latin1');
  assert.match(pdf, /^%PDF-1\.[4-7]/);
  assert.match(pdf, /\/Encoding \/WinAnsiEncoding/);
  assert.match(pdf, /\/Count [2-9]/);
  assert.match(pdf, /DEMO.*Versión 2/);
  assert.match(pdf, /Viaje 90 · Ñandú & <á>/);
  assert.match(pdf, /109\.5/);
  const [, xref] = pdf.match(/startxref\n(\d+)/);
  assert.equal(bytes.toString('ascii', Number(xref), Number(xref) + 4), 'xref');
  if (process.env.IRID_EXPORT_TEST_DIR) await writeFile(join(process.env.IRID_EXPORT_TEST_DIR, filename), bytes);
});

function mockContext(userId, state, params) {
  const downloads = [];
  return {
    state, params, downloads, screen: 'reportes',
    driver: state.drivers.find(driver => driver.userId === userId),
    getState: () => state,
    can: capability => can(state, userId, capability),
    date: date => date,
    lookup: (collection, id, field = 'name') => state[collection].find(item => item.id === id)?.[field] ?? '',
    download: (filename, blob) => downloads.push({filename, blob}),
    empty: title => title,
  };
}

async function sheetDownload(ctx, source, id) {
  await handle(ctx, 'fin:download', {dataset: {source, id, format: 'xlsx'}});
  return partsOfZip(Buffer.from(await ctx.downloads[0].blob.arrayBuffer())).get('xl/worksheets/sheet1.xml');
}

test('los reportes respetan filtros y separan los datos operativos por rol', async () => {
  const data = seed();
  const params = {kind: 'fuel', period: '2026-10', vehicleId: 'v-1'};
  const ownFuel = await sheetDownload(mockContext('u-driver', data, params), 'report');
  assert.match(ownFuel, /Diego López/);
  assert.match(ownFuel, /m³/);
  assert.match(ownFuel, /litros/);
  assert.match(ownFuel, /Importe verificado/);
  assert.doesNotMatch(ownFuel, /Walter|Móvil 02|30618/);
  const adminTrips = await sheetDownload(mockContext('u-admin', data, {kind: 'trips', period: '2026-10'}), 'report');
  const walterTrips = await sheetDownload(mockContext('u-walter', data, {kind: 'trips', period: '2026-10'}), 'report');
  assert.match(adminTrips, /Remuneración/);
  assert.match(walterTrips, /Walter/);
  assert.doesNotMatch(walterTrips, /Remuneración|Importe|30000|Km comerciales/);
  for (const userId of ['u-driver', 'u-walter', 'u-secretary']) {
    const ctx = mockContext(userId, data, {});
    assert.equal(render(ctx, 'tarifas'), 'Acceso restringido');
    await assert.rejects(handle(ctx, 'fin:download', {dataset: {source: 'settlement', id: 'ls-walter-oct-v1', format: 'xlsx'}}), /acceso/i);
    assert.equal(ctx.downloads.length, 0);
  }
});

test('descarga la versión emitida y conserva el mínimo pendiente tras cambiar los datos base', async () => {
  const data = seed();
  const version = data.settlements.find(item => item.id === 'ls-walter-oct-v1');
  const before = await sheetDownload(mockContext('u-admin', data, {}), 'settlement', version.id);
  data.trips.find(item => item.id === version.tripIds[0]).driverPay = 888888;
  data.routes.find(item => item.id === 'r-centro').group = 'MJS';
  data.drivers.find(item => item.id === 'd-walter').name = 'Chofer renombrado';
  const after = await sheetDownload(mockContext('u-admin', data, {}), 'settlement', version.id);
  assert.equal(after, before);
  assert.match(after, /Versión 1/);
  assert.match(after, /Mínimo mensual garantizado pendiente/);
  assert.match(after, /Simulación parcial por servicios realizados/);
  assert.match(after, /LMV/);
});
