const UTF8 = new TextEncoder();
const PDF_WIN_ANSI = '€\x81‚ƒ„…†‡ˆ‰Š‹Œ\x8dŽ\x8f\x90‘’“”•–—˜™š›œ\x9džŸ';

function xml(value) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'})[char]);
}

function binary(length, write) {
  const bytes = new Uint8Array(length);
  write(new DataView(bytes.buffer));
  return bytes;
}

function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}

function zip(files) {
  let offset = 0;
  let directorySize = 0;
  const entries = [];
  const directory = [];
  for (const [path, source] of Object.entries(files)) {
    const name = UTF8.encode(path);
    const data = UTF8.encode(source);
    const crc = crc32(data);
    const local = binary(30, header => {
      header.setUint32(0, 0x04034b50, true);
      header.setUint16(4, 20, true);
      header.setUint16(12, 33, true);
      header.setUint32(14, crc, true);
      header.setUint32(18, data.length, true);
      header.setUint32(22, data.length, true);
      header.setUint16(26, name.length, true);
    });
    const central = binary(46, header => {
      header.setUint32(0, 0x02014b50, true);
      header.setUint16(4, 20, true);
      header.setUint16(6, 20, true);
      header.setUint16(14, 33, true);
      header.setUint32(16, crc, true);
      header.setUint32(20, data.length, true);
      header.setUint32(24, data.length, true);
      header.setUint16(28, name.length, true);
      header.setUint32(42, offset, true);
    });
    entries.push(local, name, data);
    directory.push(central, name);
    offset += local.length + name.length + data.length;
    directorySize += central.length + name.length;
  }
  const end = binary(22, header => {
    header.setUint32(0, 0x06054b50, true);
    header.setUint16(8, directory.length / 2, true);
    header.setUint16(10, directory.length / 2, true);
    header.setUint32(12, directorySize, true);
    header.setUint32(16, offset, true);
  });
  return new Blob([...entries, ...directory, end], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}

function columnName(index) {
  let name = '';
  for (let count = index + 1; count > 0; count = Math.floor((count - 1) / 26)) {
    name = String.fromCharCode(65 + (count - 1) % 26) + name;
  }
  return name;
}

function xlsx(title, columns, rows) {
  const ns = 'http://schemas.openxmlformats.org';
  const doc = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const sheetRows = [[title], columns, ...rows].map((row, i) => {
    const cells = row.map((value, col) => {
      const ref = `${columnName(col)}${i + 1}`;
      if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${ref}"><v>${value}</v></c>`;
      return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
    });
    return `<row r="${i + 1}">${cells.join('')}</row>`;
  }).join('');
  const widths = columns.map((name, index) => {
    const width = rows.reduce((max, row) => Math.max(max, String(row[index] ?? '').length + 2), String(name).length + 2);
    return `<col min="${index + 1}" max="${index + 1}" width="${Math.min(62, Math.max(12, width))}" customWidth="1"/>`;
  }).join('');
  return zip({
    '[Content_Types].xml': `${declaration}<Types xmlns="${ns}/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    '_rels/.rels': `${declaration}<Relationships xmlns="${ns}/package/2006/relationships"><Relationship Id="rId1" Type="${doc}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `${declaration}<workbook xmlns="${ns}/spreadsheetml/2006/main" xmlns:r="${doc}"><sheets><sheet name="IRID DEMO" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `${declaration}<Relationships xmlns="${ns}/package/2006/relationships"><Relationship Id="rId1" Type="${doc}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    'xl/worksheets/sheet1.xml': `${declaration}<worksheet xmlns="${ns}/spreadsheetml/2006/main"><cols>${widths}</cols><sheetData>${sheetRows}</sheetData></worksheet>`,
  });
}

function winAnsi(text) {
  return Uint8Array.from(text, char => {
    const code = char.codePointAt(0);
    if (code < 128 || (code >= 160 && code < 256)) return code;
    const alternate = PDF_WIN_ANSI.indexOf(char);
    return alternate < 0 ? 63 : alternate + 128;
  });
}

function pdfLiteral(text) {
  return String(text ?? '').replace(/[\\()]/g, '\\$&').replace(/[\u0000-\u001F]/g, ' ');
}

function lineWrap(value, capacity) {
  const lines = [];
  let line = '';
  for (const word of String(value ?? '').split(/\s+/)) {
    if (line && line.length + word.length + 1 > capacity) {
      lines.push(line);
      line = '';
    }
    if (word.length > capacity) {
      for (let i = 0; i + capacity < word.length; i += capacity) lines.push(word.slice(i, i + capacity));
      line = word.slice(Math.floor((word.length - 1) / capacity) * capacity);
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  return [...lines, line];
}

function pdf(title, columns, rows) {
  const objects = ['', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'];
  const pages = [];
  const weights = columns.map((column, index) => {
    const length = rows.reduce((max, row) => Math.max(max, String(row[index] ?? '').length), String(column).length);
    return Math.min(27, Math.max(9, length));
  });
  const weight = weights.reduce((sum, item) => sum + item, 0);
  const widths = weights.map(item => 784 * item / weight);
  let commands = [];
  let y = 0;
  const write = (value, x, baseline, size = 9) => commands.push(`BT /F1 ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${baseline} Tm (${pdfLiteral(value)}) Tj ET`);
  const drawRow = (cells, lineStart, lineCount) => {
    let x = 29;
    for (const [index, cell] of cells.entries()) {
      cell.slice(lineStart, lineStart + lineCount).forEach((value, line) => write(value, x, y - 12 * line));
      x += widths[index];
    }
    y -= 12 * lineCount + 6;
  };
  const wrapRow = row => columns.map((_, i) => lineWrap(row[i], Math.max(5, Math.floor((widths[i] - 6) / 5.5))));
  const header = wrapRow(columns);
  function begin() {
    commands = [];
    const titleLines = lineWrap(title, 88);
    titleLines.forEach((line, i) => write(line, 29, 559 - 18 * i, 15));
    y = 522 - 18 * (titleLines.length - 1);
    drawRow(header, 0, Math.max(...header.map(cell => cell.length)));
    commands.push(`0.55 G 29 ${y + 8} m 813 ${y + 8} l S 0 G`);
  }
  function finish() {
    write(`IRID · DEMO · Página ${pages.length + 1}`, 29, 24, 9);
    const stream = commands.join('\n');
    const pageId = objects.length + 1;
    pages.push(`${pageId} 0 R`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pageId + 1} 0 R >>`);
    objects.push(`<< /Length ${winAnsi(stream).length} >>\nstream\n${stream}\nendstream`);
  }
  begin();
  for (const row of rows) {
    const cells = wrapRow(row);
    const lineCount = Math.max(...cells.map(cell => cell.length));
    let lineStart = 0;
    while (lineStart < lineCount) {
      const capacity = Math.floor((y - 44) / 12);
      if (capacity <= 0 || (lineStart === 0 && lineCount > capacity && lineCount <= 30)) {
        finish();
        begin();
      }
      const count = Math.min(lineCount - lineStart, Math.max(1, Math.floor((y - 44) / 12)));
      drawRow(cells, lineStart, count);
      lineStart += count;
    }
  }
  finish();
  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Kids [${pages.join(' ')}] /Count ${pages.length} >>`;
  const chunks = [winAnsi('%PDF-1.4\n%âãÏÓ\n')];
  const offsets = ['0000000000 65535 f \n'];
  let position = chunks[0].length;
  objects.forEach((object, index) => {
    offsets.push(`${String(position).padStart(10, '0')} 00000 n \n`);
    const bytes = winAnsi(`${index + 1} 0 obj\n${object}\nendobj\n`);
    chunks.push(bytes);
    position += bytes.length;
  });
  chunks.push(winAnsi(`xref\n0 ${offsets.length}\n${offsets.join('')}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${position}\n%%EOF\n`));
  return new Blob(chunks, {type: 'application/pdf'});
}

export function exportData(title, columns, rows, format) {
  const extension = format === 'excel' ? 'xlsx' : format;
  if (extension !== 'pdf' && extension !== 'xlsx') throw new Error('Formato de descarga desconocido.');
  const name = title.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 115);
  const display = `IRID · DEMO · ${title}`;
  const blob = extension === 'xlsx' ? xlsx(display, columns, rows) : pdf(display, columns, rows);
  return {filename: `DEMO-${name}.${extension}`, blob};
}

const minimumText = 'Mínimo mensual garantizado pendiente de confirmar con IRID (Q-001). Simulación parcial por servicios realizados.';
const noAccessText = 'Tu usuario no tiene acceso a esta información.';
const reportTypes = {
  trips: 'Viajes',
  shifts: 'Kilómetros por turno',
  fuel: 'Combustible',
  expenses: 'Gastos e intervenciones',
  fleet: 'Historial de flota',
};
const categories = ['Seguro', 'GPS', 'Mantenimiento', 'Cubiertas', 'Reparaciones'];

function heading(ctx, title, description, actions = '', backHTML = '') {
  return `<header class="page-head"><div>${backHTML}<h1>${ctx.h(title)}</h1><p>${ctx.h(description)}</p></div>${actions && `<div class="actions">${actions}</div>`}</header>`;
}

function columnsTable(ctx, columns, rows) {
  return `<div class="table-wrap" tabindex="0" role="region" aria-label="Tabla de resultados">
    <table class="table"><thead><tr>${columns.map(item => `<th scope="col">${ctx.h(item)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell && typeof cell === 'object' && 'html' in cell ? cell.html : ctx.h(cell ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table>
  </div>`;
}

function options(values, label = '') {
  return [...(label ? [{id: '', name: label}] : []), ...values.map(value => ({id: value, name: value}))];
}

function relationOptions(items, label, field = 'name') {
  return [...(label ? [{id: '', name: label}] : []), ...items.map(item => ({id: item.id, name: item[field]}))];
}

function formatPeriod(period) {
  if (!period) return '—';
  const [year, month] = period.split('-');
  return `${month}/${year}`;
}

function sessionTime(ctx, stamp) {
  if (!stamp) return '—';
  return `${ctx.date(stamp.slice(0, 10))} ${stamp.slice(11, 16)}`;
}

function metric(ctx, label, value, extraClass = '') {
  return `<div class="metric${extraClass ? ` ${extraClass}` : ''}"><span>${ctx.h(label)}</span><strong>${ctx.h(value)}</strong></div>`;
}

function note(ctx, text, tone = 'info') {
  return `<div class="notice ${tone}">${ctx.h(text)}</div>`;
}

function validPeriod(value, fallback) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value ?? '') ? value : fallback;
}

function sortRecent(a, b, key = 'date') {
  return String(b[key] ?? '').localeCompare(String(a[key] ?? ''));
}

function renderTariffs(ctx) {
  const { routes, tariffs, today } = ctx.state;
  const order = [...tariffs].reverse().sort((a, b) => sortRecent(a, b, 'effectiveDate'));
  const current = new Set();
  const activeRows = routes.map(route => {
    const applied = order.find(tariff => tariff.routeId === route.id && tariff.effectiveDate <= today);
    if (applied) current.add(applied.id);
    return [route.name, route.active ? 'Activo' : 'Inactivo', ctx.money(applied?.amount ?? route.basePrice), applied ? ctx.date(applied.effectiveDate) : 'Valor base'];
  });
  const historyRows = order.map(tariff => {
    const entry = tariff.history?.[0];
    const status = current.has(tariff.id) ? 'Vigente' : tariff.effectiveDate > today ? 'Programada' : 'Histórica';
    return [ctx.lookup('routes', tariff.routeId), ctx.date(tariff.effectiveDate), ctx.money(tariff.amount), status, entry ? ctx.lookup('users', entry.actorId) : '—'];
  });
  const action = routes.some(route => route.active) ? ctx.button('Nueva tarifa', 'fin:new-tariff', '', 'primary') : '';
  return `${heading(ctx, 'Tarifas', 'Consultá el importe vigente de cada recorrido y sus cambios de vigencia.', action)}
    <div class="stack">
      <section class="panel"><h2>Tarifas vigentes</h2><p class="hint">Valores al ${ctx.h(ctx.date(today))}. Las nuevas vigencias se aplican al generar viajes según su fecha.</p>
        ${activeRows.length ? columnsTable(ctx, ['Recorrido', 'Actividad', 'Importe', 'Desde'], activeRows) : ctx.empty('Sin recorridos', 'Creá un recorrido para registrar su tarifa.')}
      </section>
      <section class="panel"><h2>Historial de vigencias</h2>
        ${historyRows.length ? columnsTable(ctx, ['Recorrido', 'Desde', 'Importe', 'Estado', 'Registró'], historyRows) : ctx.empty('Sin vigencias registradas', 'Los recorridos usan su valor base hasta que registres una tarifa.')}
      </section>
    </div>`;
}

function titleForSettlement(ctx, settlement) {
  return settlement.type === 'Chofer'
    ? settlement.recipientName || settlement.rows?.find(row => row.driver)?.driver || ctx.lookup('drivers', settlement.driverId)
    : 'Transp SERV';
}

function settlementHistory(ctx, settlement) {
  return ctx.state.settlements.filter(item => item.period === settlement.period && item.type === settlement.type && (item.driverId || '') === (settlement.driverId || ''))
    .sort((a, b) => b.version - a.version);
}

function downloadButtons(ctx, source, id = '') {
  const attrs = `data-source="${source}" data-id="${ctx.h(id)}"`;
  return `<div class="actions">${ctx.button('Descargar Excel', 'fin:download', `${attrs} data-format="xlsx"`)}${ctx.button('Descargar PDF', 'fin:download', `${attrs} data-format="pdf"`)}</div>`;
}

function groupOf(ctx, row) {
  if (row.group) return row.group;
  const trip = ctx.state.trips.find(item => item.id === row.tripId);
  return ctx.state.routes.find(route => route.id === trip?.routeId)?.group || '—';
}

function cashTotal(values) {
  return Math.round(values.reduce((sum, value) => sum + (Number(value) || 0), 0) * 100) / 100;
}

function settlementData(ctx, input, rows) {
  const isDriver = input.type === 'Chofer';
  const value = isDriver ? 'driverPay' : 'amount';
  const headers = ['Fecha', 'Hora', 'Grupo', 'Servicio', 'Recorrido', ...(isDriver ? [] : ['Chofer']), 'Estado', 'Km comerciales', 'Importe (ARS)'];
  const detailed = rows.map(row => [
    ctx.date(row.date), row.time, groupOf(ctx, row), row.type, row.route, ...(isDriver ? [] : [row.driver || 'Sin asignar']),
    row.status, row.commercialKm, row.status === 'Realizado' ? row[value] : 0,
  ]);
  const completed = rows.filter(row => row.status === 'Realizado');
  const totals = new Map();
  for (const row of completed) {
    const group = groupOf(ctx, row);
    const key = `${group} / ${row.type}`;
    const total = totals.get(key) || {group, type: row.type, count: 0, amount: 0};
    total.count++;
    total.amount += Number(row[value]) || 0;
    totals.set(key, total);
  }
  const subtotals = [...totals.values()].sort((a, b) => a.group.localeCompare(b.group) || a.type.localeCompare(b.type));
  const exportRows = input.version ? [
    ...detailed, [], ['Grupo', 'Servicio', 'Realizados', 'Subtotal (ARS)'],
    ...subtotals.map(group => [group.group, group.type, group.count, cashTotal([group.amount])]),
    ['Total', '', completed.length, input.total], [],
    ['Período', formatPeriod(input.period)], ['Destinatario', titleForSettlement(ctx, input)], ['Versión', input.version],
    ['Emisión', sessionTime(ctx, input.issuedAt)], ['Emitió', ctx.lookup('users', input.issuedBy)],
    ...(input.minimumPending ? [
      ['Q-001', 'Mínimo mensual garantizado pendiente'], ['Alcance', 'Simulación parcial por servicios realizados'],
    ] : []),
  ] : [];
  return {headers, detailed, completed, subtotals, exportRows};
}

function settlementRowsPanel(ctx, input, rows, total, editable = false) {
  const data = settlementData(ctx, input, rows);
  const tableHeaders = [...data.headers.slice(0, -1), 'Importe', ...(editable ? ['Ajuste'] : [])];
  const displayRows = data.detailed.map((row, index) => [
    ...row.slice(0, -1),
    ctx.money(row.at(-1)),
    ...(editable ? [{html: ctx.button('Ajustar', 'fin:adjust', `data-id="${ctx.h(rows[index].tripId)}"`, 'small')}] : []),
  ]);
  const completed = data.completed;
  const displaySubtotals = data.subtotals.map(item => [item.group, item.type, item.count, ctx.money(item.amount)]);
  return `<div class="metrics settlement-metrics">${metric(ctx, 'Servicios realizados', completed.length)}${metric(ctx, 'No realizados', rows.filter(row => row.status === 'No realizado').length)}${metric(ctx, input.type === 'Chofer' ? 'Subtotal por servicios' : 'Total', ctx.money(total), 'metric-total')}</div>
    <section class="panel"><h2>Servicios del período</h2>
      ${displayRows.length ? columnsTable(ctx, tableHeaders, displayRows) : ctx.empty('Sin servicios en el período', 'Probá con otro mes o destinatario.')}
    </section>
    ${displaySubtotals.length ? `<section class="panel"><h2>Subtotales por grupo y servicio</h2>${columnsTable(ctx, ['Grupo', 'Servicio', 'Realizados', 'Subtotal'], displaySubtotals)}</section>` : ''}`;
}

function renderSettlements(ctx, params) {
  if (params.period && params.type) return renderPreparation(ctx, params);
  const latest = [...ctx.state.settlements].sort((a, b) => sortRecent(a, b, 'period') || b.version - a.version);
  const listed = latest.filter((item, index) => latest.findIndex(other => other.period === item.period && other.type === item.type && other.driverId === item.driverId) === index);
  const periods = [...new Set(ctx.state.trips.map(trip => trip.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
  const quickPeriods = periods.map(period => {
    const periodTrips = ctx.state.trips.filter(trip => trip.date.startsWith(period + '-'));
    const pendingCount = periodTrips.filter(trip => !['Realizado', 'No realizado'].includes(trip.status)).length;
    const issued = listed.find(item => item.period === period && item.type === 'Transp SERV');
    const statusLabel = pendingCount
      ? `${pendingCount} ${pendingCount === 1 ? 'viaje sin resolver' : 'viajes sin resolver'}`
      : issued ? `Emitida · Versión ${issued.version}` : 'Lista para emitir';
    const tone = pendingCount ? 'warning' : issued ? 'info' : 'success';
    const btnLabel = pendingCount ? 'Revisar pendientes' : issued ? 'Revisar corrección' : 'Revisar Transp SERV';
    return `<div class="list-row"><div><strong>${ctx.h(formatPeriod(period))} · Transp SERV</strong><p>${ctx.h(`${periodTrips.length} ${periodTrips.length === 1 ? 'viaje' : 'viajes'} registrados`)}</p>${ctx.badge(statusLabel, tone)}</div>${ctx.button(btnLabel, 'fin:quick-prepare', `data-period="${ctx.h(period)}" data-type="Transp SERV"`, pendingCount || issued ? 'secondary small' : 'primary small')}</div>`;
  }).join('');
  const rows = listed.map(item => [
    formatPeriod(item.period), titleForSettlement(ctx, item), `Versión ${item.version}`,
    sessionTime(ctx, item.issuedAt), ctx.money(item.total), item.minimumPending ? 'Mínimo pendiente' : 'Emitida',
    {html: ctx.button('Ver liquidación', 'fin:version', `data-id="${ctx.h(item.id)}"`, 'small')},
  ]);
  return `${heading(ctx, 'Liquidaciones', 'Revisá los servicios del mes y consultá las versiones emitidas.', ctx.button('Preparar liquidación', 'fin:prepare', '', 'primary'))}
    <div class="stack">
      ${quickPeriods ? `<section class="panel"><h2>Períodos para revisar</h2>${quickPeriods}</section>` : ''}
      <section class="panel"><h2>Últimas versiones emitidas</h2>
        ${rows.length ? columnsTable(ctx, ['Período', 'Destinatario', 'Versión', 'Emisión', 'Total', 'Estado', 'Detalle'], rows) : ctx.empty('Sin liquidaciones emitidas', 'Prepará una liquidación para revisar los servicios antes de emitir.')}
      </section>
    </div>`;
}

function toSettlementParams(params) {
  return {period: params.period, type: params.type, driverId: params.driverId || undefined, previousId: params.previousId || undefined};
}

function settlementDiff(ctx, input, result) {
  if (!result.previous) return '';
  const relevantValue = input.type === 'Chofer' ? 'driverPay' : 'amount';
  const describe = row => row ? `${row.status} · ${row.commercialKm} km · ${row.driver || 'Sin asignar'} · ${ctx.money(row.status === 'Realizado' ? row[relevantValue] : 0)}` : 'Fuera de la liquidación';
  const rows = result.differences.map(change => {
    const row = change.after || change.before;
    const label = row ? `${ctx.date(row.date)} ${row.time} · ${row.type} · ${row.route}` : change.tripId;
    return [label, change.label, describe(change.before), describe(change.after)];
  });
  return `<section class="panel"><h2>Comparación con la versión ${ctx.h(result.previous.version)}</h2>
    <div class="grid-3">${metric(ctx, 'Total anterior', ctx.money(result.previous.total))}${metric(ctx, 'Total revisado', ctx.money(result.total))}${metric(ctx, 'Diferencia', ctx.money(result.total - result.previous.total))}</div>
    ${rows.length ? columnsTable(ctx, ['Viaje', 'Cambio', 'Anterior', 'Revisado'], rows) : note(ctx, 'Los datos del período coinciden con la versión emitida.')}
  </section>`;
}

function renderPreparation(ctx, params) {
  const input = toSettlementParams(params);
  const backBtn = ctx.button('← Volver a liquidaciones', 'fin:settlements', '', 'back-link');
  let result;
  try {
    result = ctx.preview('settlementPreview', input);
  } catch (error) {
    return `${heading(ctx, 'Preparar liquidación', error.message, '', backBtn)}`;
  }
  const blocked = result.unresolved.length > 0;
  const review = {...input, minimumPending: result.minimumPending};
  const unsettled = result.unresolved.map(trip => [
    ctx.date(trip.date), trip.time, ctx.lookup('routes', trip.routeId), trip.status,
    {html: ctx.button('Ver viaje', 'fin:trip', `data-id="${ctx.h(trip.id)}"`, 'small')},
  ]);
  const actions = ctx.button('Cambiar selección', 'fin:prepare')
    + (blocked ? '' : ctx.button('Emitir liquidación', 'fin:issue', '', 'primary'));
  return `${heading(ctx, result.previous ? 'Preparar corrección' : 'Revisar liquidación', `${formatPeriod(input.period)} · ${titleForSettlement(ctx, {...input, rows: result.rows})}`, actions, backBtn)}
    <div class="stack">
      ${result.minimumPending ? note(ctx, minimumText, 'warning') : ''}
      ${blocked ? `<section class="panel"><h2>Viajes pendientes</h2>
        ${note(ctx, `Resolvé los ${unsettled.length} viajes pendientes antes de emitir.`, 'warning')}
        ${columnsTable(ctx, ['Fecha', 'Hora', 'Recorrido', 'Estado', 'Detalle'], unsettled)}</section>` : ''}
      ${settlementDiff(ctx, input, result)}
      ${settlementRowsPanel(ctx, review, result.rows.filter(row => row.status === 'Realizado' || row.status === 'No realizado'), result.total, true)}
      <div class="actions">${ctx.button('Volver a liquidaciones', 'fin:settlements')}</div>
    </div>`;
}

function renderVersion(ctx, id) {
  const item = ctx.state.settlements.find(settlement => settlement.id === id);
  if (!item) return ctx.empty('Liquidación no disponible', 'Seleccioná una versión emitida.', ctx.button('Volver a liquidaciones', 'fin:settlements'));
  const history = settlementHistory(ctx, item);
  const versions = history.map(version => [
    `Versión ${version.version}`, sessionTime(ctx, version.issuedAt), ctx.lookup('users', version.issuedBy), ctx.money(version.total),
    version.id === item.id ? 'En pantalla' : {html: ctx.button('Ver versión', 'fin:version', `data-id="${ctx.h(version.id)}"`, 'small')},
  ]);
  const correction = history[0]?.id === item.id ? ctx.button('Preparar corrección', 'fin:correction', `data-id="${ctx.h(item.id)}"`) : '';
  return `${heading(ctx, `Liquidación · ${titleForSettlement(ctx, item)}`, `${formatPeriod(item.period)} · Versión ${item.version} · Emitida el ${sessionTime(ctx, item.issuedAt)}`, '', ctx.button('← Volver a liquidaciones', 'fin:settlements', '', 'back-link'))}
    <div class="stack">
      ${note(ctx, 'Versión emitida de demostración. Las correcciones se guardan en una nueva versión.')}
      ${item.minimumPending ? note(ctx, minimumText, 'warning') : ''}
      <div class="actions">${downloadButtons(ctx, 'settlement', item.id)}${correction}</div>
      ${settlementRowsPanel(ctx, item, item.rows, item.total)}
      <section class="panel"><h2>Historial de versiones</h2>
        ${columnsTable(ctx, ['Versión', 'Fecha y hora', 'Emitió', 'Total', 'Detalle'], versions)}
      </section>
    </div>`;
}

function permittedReports(ctx) {
  return Object.entries(reportTypes).filter(([key]) => {
    if (key === 'trips') return ctx.can('plan') || ctx.can('drive');
    if (key === 'shifts') return ctx.can('fleetRead') || ctx.can('drive');
    if (key === 'fuel') return ctx.can('fuelRead');
    if (key === 'expenses') return ctx.can('expense');
    return ctx.can('fleetRead');
  }).map(([id, name]) => ({id, name}));
}

function reportFilters(ctx, params, types) {
  return {
    kind: types.some(type => type.id === params.kind) ? params.kind : types[0]?.id,
    period: validPeriod(params.period, ctx.state.today.slice(0, 7)),
    driverId: params.driverId || '',
    vehicleId: params.vehicleId || '',
    category: params.category || '',
    status: params.status || '',
  };
}

function readReport(ctx, filters) {
  const {kind, period, driverId, vehicleId, category, status} = filters;
  const state = ctx.state;
  const allDrivers = ctx.can('fleetRead') || ctx.can('plan');
  const self = ctx.driver?.id;
  const allowedDriver = item => (allDrivers || (self && item.driverId === self)) && (!driverId || item.driverId === driverId);
  const allowedVehicle = item => !vehicleId || item.vehicleId === vehicleId;
  const inMonth = stamp => stamp?.slice(0, 7) === period;
  const vehicle = id => id ? ctx.lookup('vehicles', id, 'alias') : '—';
  const driver = id => id ? ctx.lookup('drivers', id) : 'Sin asignar';
  const fuelStatus = item => item.verified ? 'Verificada' : item.receipt ? 'Pendiente de verificación' : 'Pendiente de comprobante';
  const unit = item => item.type === 'GNC' ? 'm³' : 'litros';
  const cash = ctx.money;
  const pendingOrVerified = item => item.verified ? 'Verificado' : 'Pendiente';
  const vehicleStatus = item => item.closedAt ? 'Cerrado' : 'Abierto';
  const shiftKm = item => item.endKm == null ? null : item.endKm - item.startKm;
  const totalBy = (list, field) => cashTotal(list.map(item => item[field]));

  if (kind === 'trips') {
    const items = state.trips.filter(item => inMonth(item.date) && allowedDriver(item) && (!status || item.status === status))
      .sort((a, b) => sortRecent(a, b) || sortRecent(a, b, 'time'));
    const commercial = ctx.can('commercial');
    const realized = items.filter(item => item.status === 'Realizado');
    return {
      headers: ['Fecha', 'Hora', 'Servicio', 'Recorrido', 'Chofer', 'Estado', ...(commercial ? ['Km comerciales', 'Importe (ARS)', 'Remuneración (ARS)'] : [])],
      rows: items.map(item => [ctx.date(item.date), item.time, item.type, ctx.lookup('routes', item.routeId), driver(item.driverId), item.status,
        ...(commercial ? [item.commercialKm, item.status === 'Realizado' ? item.amount : 0, item.status === 'Realizado' ? item.driverPay : 0] : [])]),
      totals: [['Viajes', items.length], ['Realizados', realized.length], ['No realizados', items.filter(item => item.status === 'No realizado').length],
        ...(commercial ? [['Importe por servicios (ARS)', totalBy(realized, 'amount')], ['Remuneración por servicios (ARS)', totalBy(realized, 'driverPay')]] : [])],
      moneyColumns: commercial ? [7, 8] : [],
    };
  }

  if (kind === 'shifts') {
    const items = state.shifts.filter(item => inMonth(item.openedAt) && allowedDriver(item) && allowedVehicle(item) && (!status || vehicleStatus(item) === status))
      .sort((a, b) => sortRecent(a, b, 'openedAt'));
    return {
      headers: ['Apertura', 'Cierre', 'Vehículo', 'Chofer', 'Estado', 'Odómetro inicial', 'Odómetro final', 'Km de turno'],
      rows: items.map(item => [sessionTime(ctx, item.openedAt), sessionTime(ctx, item.closedAt), vehicle(item.vehicleId),
        driver(item.driverId), vehicleStatus(item), item.startKm, item.endKm, shiftKm(item)]),
      totals: [['Turnos', items.length], ['Cerrados', items.filter(item => item.closedAt).length], ['Km de turnos cerrados', cashTotal(items.map(shiftKm))]],
      moneyColumns: [],
    };
  }

  if (kind === 'fuel') {
    const items = state.fuel.filter(item => inMonth(item.date) && allowedDriver(item) && allowedVehicle(item) && (!category || item.type === category)
      && (!status || pendingOrVerified(item) === status)).sort((a, b) => sortRecent(a, b) || sortRecent(a, b, 'time'));
    const subtotals = ['GNC', 'Nafta', 'Gasoil'].flatMap(type => ['Verificado', 'Pendiente'].map(check => {
      const matches = items.filter(item => item.type === type && pendingOrVerified(item) === check);
      return [type, check, matches.length, totalBy(matches, 'quantity'), unit({type}), totalBy(matches, 'amount')];
    })).filter(row => row[2] > 0);
    return {
      headers: ['Fecha', 'Hora', 'Vehículo', 'Chofer', 'Tipo', 'Cantidad', 'Unidad', 'Importe (ARS)', 'Odómetro', 'Estado'],
      rows: items.map(item => [ctx.date(item.date), item.time, vehicle(item.vehicleId), driver(item.driverId), item.type,
        item.quantity, unit(item), item.amount, item.odometer, fuelStatus(item)]),
      totals: [['Cargas', items.length], ['Importe total (ARS)', totalBy(items, 'amount')],
        ['Importe verificado (ARS)', totalBy(items.filter(item => item.verified), 'amount')],
        ['Importe pendiente (ARS)', totalBy(items.filter(item => !item.verified), 'amount')]],
      breakdown: {headers: ['Tipo', 'Verificación', 'Cargas', 'Cantidad', 'Unidad', 'Importe (ARS)'], rows: subtotals, moneyColumns: [5]},
      moneyColumns: [7],
    };
  }

  const expenses = state.expenses.filter(item => inMonth(item.date) && allowedVehicle(item) && (!category || item.category === category))
    .sort(sortRecent);
  if (kind === 'expenses') {
    const subtotals = categories.map(name => {
      const items = expenses.filter(item => item.category === name);
      return [name, items.length, totalBy(items, 'amount')];
    }).filter(row => row[1] > 0);
    return {
      headers: ['Fecha', 'Vehículo', 'Categoría', 'Descripción', 'Proveedor', 'Odómetro', 'Importe (ARS)'],
      rows: expenses.map(item => [ctx.date(item.date), vehicle(item.vehicleId), item.category, item.description, item.provider, item.odometer, item.amount]),
      totals: [['Gastos', expenses.length], ['Importe total (ARS)', totalBy(expenses, 'amount')]],
      breakdown: {headers: ['Categoría', 'Gastos', 'Importe (ARS)'], rows: subtotals, moneyColumns: [2]},
      moneyColumns: [6],
    };
  }

  const fleetEntries = [
    ...state.shifts.filter(item => inMonth(item.openedAt) && allowedVehicle(item)).map(item => ({
      stamp: item.openedAt, vehicleId: item.vehicleId, type: 'Apertura de turno', description: driver(item.driverId), km: item.startKm,
    })),
    ...state.shifts.filter(item => inMonth(item.closedAt) && allowedVehicle(item)).map(item => ({
      stamp: item.closedAt, vehicleId: item.vehicleId, type: 'Cierre de turno', description: driver(item.driverId), km: item.endKm,
    })),
    ...state.fuel.filter(item => inMonth(item.date) && allowedVehicle(item)).map(item => ({
      stamp: `${item.date}T${item.time}`, vehicleId: item.vehicleId, type: `Carga de ${item.type}`, description: fuelStatus(item), km: item.odometer, amount: item.amount,
    })),
    ...expenses.map(item => ({
      stamp: item.date, vehicleId: item.vehicleId, type: item.category, description: item.description, km: item.odometer, amount: item.amount,
    })),
    ...state.vehicles.filter(item => !vehicleId || item.id === vehicleId).flatMap(item => (
      (item.history || []).filter(entry => inMonth(entry.at)).map(entry => ({
        stamp: entry.at, vehicleId: item.id, type: 'Cambio en la ficha', description: entry.text, km: null,
      }))
    )),
  ].sort((a, b) => sortRecent(a, b, 'stamp'));
  return {
    headers: ['Fecha y hora', 'Vehículo', 'Registro', 'Detalle', 'Odómetro', 'Importe (ARS)'],
    rows: fleetEntries.map(item => [item.stamp.includes('T') ? sessionTime(ctx, item.stamp) : ctx.date(item.stamp),
      vehicle(item.vehicleId), item.type, item.description, item.km, item.amount]),
    totals: [['Registros', fleetEntries.length], ['Vehículos', new Set(fleetEntries.map(item => item.vehicleId)).size],
      ['Importe total (ARS)', totalBy(fleetEntries, 'amount')]],
    moneyColumns: [5],
  };
}

function reportLabels(ctx, filters) {
  const {kind, driverId, vehicleId, category, status} = filters;
  const labels = [['Tipo de reporte', reportTypes[kind]], ['Período', formatPeriod(filters.period)]];
  if (['trips', 'shifts', 'fuel'].includes(kind)) labels.push(['Chofer', driverId ? ctx.lookup('drivers', driverId) : ctx.can('fleetRead') ? 'Todos' : ctx.driver?.name || 'Mis registros']);
  if (kind !== 'trips') labels.push(['Vehículo', vehicleId ? ctx.lookup('vehicles', vehicleId, 'alias') : 'Todos']);
  if (['fuel', 'expenses'].includes(kind)) labels.push([kind === 'fuel' ? 'Combustible' : 'Categoría', category || 'Todas']);
  if (['trips', 'shifts', 'fuel'].includes(kind)) labels.push(['Estado', status || 'Todos']);
  return labels;
}

function normalizeReportFilters(ctx, params, types) {
  const filters = reportFilters(ctx, params, types);
  const statuses = {
    trips: ['Programado', 'En curso', 'Realizado', 'No realizado'],
    shifts: ['Abierto', 'Cerrado'],
    fuel: ['Verificado', 'Pendiente'],
  };
  const categoriesByType = {fuel: ['GNC', 'Nafta', 'Gasoil'], expenses: categories};
  const allDrivers = ctx.can('fleetRead') || ctx.can('plan');
  const eligible = allDrivers ? ctx.state.drivers : ctx.state.drivers.filter(item => item.id === ctx.driver?.id);
  const ownVehicleIds = new Set([...ctx.state.shifts, ...ctx.state.fuel].filter(item => item.driverId === ctx.driver?.id).map(item => item.vehicleId));
  const vehicles = ctx.can('fleetRead') ? ctx.state.vehicles : ctx.state.vehicles.filter(item => ownVehicleIds.has(item.id));
  const hasDriver = ['trips', 'shifts', 'fuel'].includes(filters.kind);
  filters.driverId = hasDriver && eligible.some(item => item.id === filters.driverId) ? filters.driverId : '';
  filters.vehicleId = filters.kind !== 'trips' && vehicles.some(item => item.id === filters.vehicleId) ? filters.vehicleId : '';
  filters.category = categoriesByType[filters.kind]?.includes(filters.category) ? filters.category : '';
  filters.status = statuses[filters.kind]?.includes(filters.status) ? filters.status : '';
  return {filters, statuses, categoriesByType, eligible, vehicles};
}

function renderReports(ctx, params) {
  const types = permittedReports(ctx);
  if (!types.length) return ctx.empty('Reportes no disponibles', noAccessText);
  const {filters, statuses, categoriesByType, eligible, vehicles} = normalizeReportFilters(ctx, params, types);
  const {kind, period, driverId, vehicleId, category, status} = filters;
  const data = readReport(ctx, filters);
  const display = (rows, currencies) => rows.map(row => row.map((value, index) => currencies.includes(index) && value != null ? ctx.money(value) : value));
  const activeLabels = reportLabels(ctx, filters).slice(1).map(([label, value]) => `${label} ${value}`).join(' · ');
  const conditional = (kinds, label, name, choices, selected) => {
    const visible = kinds.includes(kind);
    return `<div data-report-kinds="${kinds.join(' ')}" ${visible ? '' : 'hidden'}>
      ${ctx.select(label, name, choices, visible ? selected : '', visible ? '' : 'disabled')}
    </div>`;
  };
  return `${heading(ctx, 'Reportes', 'Filtrá por mes y revisá los resultados antes de descargar.')}
    <div class="stack">
      <section class="panel"><h2>Filtros</h2>
        <form data-action="fin:report-filters" class="stack">
          <div class="form-grid">
            ${ctx.select('Tipo de reporte', 'kind', types, kind, 'data-change="fin:report-kind"')}
            ${ctx.field('Período', 'period', period, 'month', 'required')}
            ${ctx.can('fleetRead') || ctx.can('plan') ? conditional(['trips', 'shifts', 'fuel'], 'Chofer', 'driverId', relationOptions(eligible, 'Todos'), driverId) : ''}
            ${vehicles.length ? conditional(['shifts', 'fuel', 'expenses', 'fleet'], 'Vehículo', 'vehicleId', relationOptions(vehicles, 'Todos', 'alias'), vehicleId) : ''}
            ${types.filter(type => categoriesByType[type.id]).map(type =>
              conditional([type.id], type.id === 'fuel' ? 'Tipo de combustible' : 'Categoría', 'category', options(categoriesByType[type.id], 'Todos'), category)).join('')}
            ${types.filter(type => statuses[type.id]).map(type =>
              conditional([type.id], 'Estado', 'status', options(statuses[type.id], 'Todos'), status)).join('')}
          </div><div class="actions"><button type="submit" class="btn primary">Aplicar filtros</button></div>
        </form>
      </section>
      <section class="panel stack"><div><h2>${ctx.h(reportTypes[kind])}</h2><p class="hint">${ctx.h(activeLabels)}</p></div>
        <div class="grid-3">${data.totals.map(([label, value]) => metric(ctx, label.replace(' (ARS)', ''), label.endsWith('(ARS)') ? ctx.money(value) : value)).join('')}</div>
        ${data.rows.length ? columnsTable(ctx, data.headers, display(data.rows, data.moneyColumns)) : ctx.empty('Sin resultados', 'Probá con otro período o ajustá los filtros.')}
        ${data.rows.length ? downloadButtons(ctx, 'report') : ''}
      </section>
      ${data.breakdown?.rows.length ? `<section class="panel"><h2>Subtotales</h2>${columnsTable(ctx, data.breakdown.headers, display(data.breakdown.rows, data.breakdown.moneyColumns))}</section>` : ''}
    </div>`;
}

export function render(ctx, screen, params = {}) {
  if (screen === 'reportes') {
    return ctx.can('reports') ? renderReports(ctx, params) : ctx.empty('Reportes no disponibles', noAccessText);
  }
  if (!['tarifas', 'liquidaciones', 'liquidacion'].includes(screen)) return '';
  if (!ctx.can('commercial')) return ctx.empty('Acceso restringido', noAccessText);
  if (screen === 'tarifas') return renderTariffs(ctx);
  if (screen === 'liquidaciones') return renderSettlements(ctx, params);
  return renderVersion(ctx, params.id);
}

function addTariff(ctx) {
  const routes = ctx.getState().routes.filter(route => route.active);
  if (!routes.length) throw new Error('Necesitás un recorrido activo para registrar una tarifa.');
  ctx.dialog({
    title: 'Nueva tarifa',
    body: `${note(ctx, 'La nueva vigencia se aplica al generar viajes según su fecha. Los viajes existentes conservan sus importes.')}
      <div class="form-grid">
        ${ctx.select('Recorrido', 'routeId', relationOptions(routes, 'Seleccioná un recorrido'), '', 'required')}
        ${ctx.field('Importe (ARS)', 'amount', '', 'number', 'required min="0" step="0.01" inputmode="decimal"')}
        ${ctx.field('Vigente desde', 'effectiveDate', ctx.getState().today, 'date', 'required')}
      </div>`,
    submitLabel: 'Registrar tarifa',
    onSubmit(values) {
      ctx.run('addTariff', {routeId: values.routeId, amount: Number(values.amount), effectiveDate: values.effectiveDate});
      ctx.toast('Tarifa registrada.');
    },
  });
}

function prepareSettlement(ctx) {
  const state = ctx.getState();
  const type = ctx.params.type === 'Chofer' ? 'Chofer' : 'Transp SERV';
  const period = validPeriod(ctx.params.period, state.today.slice(0, 7));
  ctx.dialog({
    title: 'Preparar liquidación',
    body: `<div class="form-grid">
      ${ctx.field('Período', 'period', period, 'month', 'required')}
      ${ctx.select('Tipo de liquidación', 'type', options(['Transp SERV', 'Chofer']), type, 'data-change="fin:destination"')}
      <div data-settlement-driver ${type === 'Chofer' ? '' : 'hidden'}>
        ${ctx.select('Chofer', 'driverId', relationOptions(state.drivers, 'Seleccioná un chofer'), ctx.params.driverId || '', type === 'Chofer' ? 'required' : 'disabled')}
      </div>
    </div>`,
    submitLabel: 'Revisar liquidación',
    onSubmit(values) {
      if (values.type === 'Chofer' && !values.driverId) throw new Error('Seleccioná el chofer de la liquidación.');
      const input = toSettlementParams(values);
      ctx.preview('settlementPreview', input);
      ctx.go('liquidaciones', input);
    },
  });
}

function adjustTrip(ctx, id) {
  const trip = ctx.getState().trips.find(item => item.id === id);
  if (!trip) throw new Error('El viaje seleccionado no está disponible.');
  const amountReference = trip.baseKm > 0 ? cashTotal([trip.basePrice * trip.commercialKm / trip.baseKm]) : trip.basePrice;
  const driverPayReference = cashTotal([amountReference * 0.14]);
  const affected = ctx.getState().settlements.some(item => item.tripIds.includes(id));
  const reference = (label, calc, before, name) => [
    label, ctx.money(calc), ctx.money(before),
    {html: `<output data-adjust-value="${name}" aria-live="polite">${ctx.h(ctx.money(before))}</output>`},
  ];
  ctx.dialog({
    title: 'Ajuste económico del viaje',
    body: `<p>${ctx.h(`${ctx.date(trip.date)} · ${trip.time} · ${trip.type} · ${ctx.lookup('routes', trip.routeId)}`)}</p>
      <p class="hint">${ctx.h(`${trip.commercialKm} km comerciales sobre ${trip.baseKm} km base. La remuneración de referencia es el 14 % del importe calculado.`)}</p>
      ${columnsTable(ctx, ['Concepto', 'Referencia calculada', 'Anterior', 'Nuevo'], [
        reference('Importe del viaje', amountReference, trip.amount, 'amount'),
        reference('Remuneración del chofer', driverPayReference, trip.driverPay, 'driverPay'),
      ])}
      ${affected ? note(ctx, 'Este viaje ya integra una liquidación emitida. Prepará una corrección para reflejar el ajuste en una nueva versión.', 'warning') : ''}
      <div class="form-grid">
        ${ctx.field('Nuevo importe (ARS)', 'amount', trip.amount, 'number', 'required min="0" step="0.01" inputmode="decimal" data-change="fin:adjustment-value"')}
        ${ctx.field('Nueva remuneración (ARS)', 'driverPay', trip.driverPay, 'number', 'required min="0" step="0.01" inputmode="decimal" data-change="fin:adjustment-value"')}
        <label class="field field-full"><span>Motivo del ajuste</span><textarea name="reason" required rows="3"></textarea></label>
      </div>`,
    submitLabel: 'Guardar ajuste',
    onSubmit(values) {
      ctx.run('adjustTrip', {id, amount: Number(values.amount), driverPay: Number(values.driverPay), reason: values.reason});
      ctx.toast('Ajuste guardado en el historial del viaje.');
    },
  });
}

function issueSettlement(ctx) {
  const input = toSettlementParams(ctx.params);
  const review = ctx.preview('settlementPreview', input);
  if (review.unresolved.length) throw new Error('Resolvé los viajes pendientes antes de emitir.');
  const recipient = titleForSettlement(ctx, {...input, rows: review.rows});
  ctx.confirm('Confirmar emisión', `<dl class="key-value">
      <dt>Período</dt><dd>${ctx.h(formatPeriod(input.period))}</dd>
      <dt>Destinatario</dt><dd>${ctx.h(recipient)}</dd>
      <dt>${review.minimumPending ? 'Subtotal por servicios' : 'Total'}</dt><dd>${ctx.h(ctx.money(review.total))}</dd>
    </dl>
    <p>La versión emitida quedará guardada. Cualquier corrección requiere emitir una nueva versión.</p>
    ${review.minimumPending ? note(ctx, minimumText, 'warning') : ''}`, () => {
    const current = ctx.preview('settlementPreview', input);
    if (current.total !== review.total
      || current.previous?.id !== review.previous?.id
      || JSON.stringify(current.rows) !== JSON.stringify(review.rows)) {
      throw new Error('Los datos cambiaron. Cerrá la confirmación y volvé a revisar la liquidación.');
    }
    const id = ctx.run('issueSettlement', input);
    ctx.go('liquidacion', {id});
    ctx.toast('Liquidación de demostración emitida.');
  }, 'Emitir liquidación');
}

function downloadReport(ctx, format) {
  const types = permittedReports(ctx);
  if (!types.length || ctx.screen !== 'reportes') throw new Error(noAccessText);
  const {filters} = normalizeReportFilters(ctx, ctx.params, types);
  const data = readReport(ctx, filters);
  if (!data.rows.length) throw new Error('No hay resultados para descargar con los filtros aplicados.');
  const breakdown = data.breakdown?.rows.length ? [[], data.breakdown.headers, ...data.breakdown.rows] : [];
  const title = `Reporte de ${reportTypes[filters.kind]} · ${formatPeriod(filters.period)}`;
  const rows = [...data.rows, [], ['Totales'], ...data.totals, ...breakdown, [], ['Filtros aplicados'], ...reportLabels(ctx, filters)];
  const {filename, blob} = exportData(title, data.headers, rows, format);
  ctx.download(filename, blob);
}

function downloadSettlement(ctx, id, format) {
  if (!ctx.can('commercial')) throw new Error(noAccessText);
  const item = ctx.getState().settlements.find(settlement => settlement.id === id);
  if (!item) throw new Error('No se encontró esa versión de la liquidación.');
  const data = settlementData({...ctx, state: ctx.getState()}, item, item.rows);
  const title = `Liquidación ${titleForSettlement(ctx, item)} · ${formatPeriod(item.period)} · Versión ${item.version}`;
  const qualifier = item.minimumPending ? ' · Mínimo mensual pendiente' : '';
  const {filename, blob} = exportData(title + qualifier, data.headers, data.exportRows, format);
  ctx.download(filename, blob);
}

const commercialActions = new Set(['new-tariff', 'adjust', 'adjustment-value', 'prepare', 'quick-prepare', 'destination', 'issue', 'settlements', 'version', 'correction']);

export async function handle(ctx, action, el) {
  if (!action.startsWith('fin:')) return false;
  const command = action.slice(4);
  if (commercialActions.has(command) && !ctx.can('commercial')) throw new Error(noAccessText);
  switch (command) {
    case 'new-tariff':
      addTariff(ctx);
      break;
    case 'adjust':
      adjustTrip(ctx, el.dataset.id);
      break;
    case 'adjustment-value': {
      const target = el.form?.querySelector(`[data-adjust-value="${el.name === 'amount' ? 'amount' : 'driverPay'}"]`);
      if (target) target.textContent = el.value && el.validity.valid ? ctx.money(Number(el.value)) : '—';
      break;
    }
    case 'prepare':
      prepareSettlement(ctx);
      break;
    case 'quick-prepare':
      ctx.go('liquidaciones', {period: el.dataset.period, type: el.dataset.type || 'Transp SERV'});
      break;
    case 'destination': {
      const driver = el.form?.elements.namedItem('driverId');
      const wrapper = el.form?.querySelector('[data-settlement-driver]');
      const show = el.value === 'Chofer';
      if (driver && wrapper) {
        wrapper.hidden = !show;
        driver.required = show;
        driver.disabled = !show;
      }
      break;
    }
    case 'issue':
      issueSettlement(ctx);
      break;
    case 'settlements':
      ctx.go('liquidaciones');
      break;
    case 'version':
      ctx.go('liquidacion', {id: el.dataset.id});
      break;
    case 'correction': {
      const previous = ctx.getState().settlements.find(item => item.id === el.dataset.id);
      if (!previous) throw new Error('No se encontró esa versión.');
      ctx.go('liquidaciones', toSettlementParams({...previous, previousId: previous.id}));
      break;
    }
    case 'trip':
      ctx.go('viaje', {id: el.dataset.id, back:'liquidaciones', returnParams:ctx.params});
      break;
    case 'report-kind': {
      if (!ctx.can('reports')) throw new Error(noAccessText);
      for (const wrapper of el.form?.querySelectorAll('[data-report-kinds]') ?? []) {
        const show = wrapper.dataset.reportKinds.split(' ').includes(el.value);
        wrapper.hidden = !show;
        wrapper.querySelector('select').disabled = !show;
      }
      break;
    }
    case 'report-filters': {
      if (!ctx.can('reports')) throw new Error(noAccessText);
      const values = ctx.form(el);
      const {filters} = normalizeReportFilters(ctx, values, permittedReports(ctx));
      ctx.go('reportes', filters);
      break;
    }
    case 'download':
      if (el.dataset.source === 'settlement') downloadSettlement(ctx, el.dataset.id, el.dataset.format);
      if (el.dataset.source === 'report') {
        if (!ctx.can('reports')) throw new Error(noAccessText);
        downloadReport(ctx, el.dataset.format);
      }
      break;
    default:
      return false;
  }
  return true;
}
