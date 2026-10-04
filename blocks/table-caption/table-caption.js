/*
 * table-caption: data table with a dark caption box above it (TFS default-table, e.g. the credit
 * rating table and the PPM plan-term tables).
 * Rows: [caption: one merged cell with h3 + p] / [header cells] / [data cells...].
 * The caption row is detected when the first row has a single cell and the table has wider rows;
 * it becomes a real <caption>. The next row is the header (th scope=col); in body rows the first
 * cell is the row label (th scope=row, bold like the source).
 */
function buildCell(scope) {
  const cell = document.createElement(scope ? 'th' : 'td');
  if (scope) cell.setAttribute('scope', scope);
  return cell;
}

export default function decorate(block) {
  const rows = [...block.children];
  const maxCols = Math.max(0, ...rows.map((row) => row.children.length));

  const table = document.createElement('table');
  let start = 0;
  if (rows.length && rows[0].children.length === 1 && maxCols > 1) {
    const caption = document.createElement('caption');
    caption.className = 'table-caption-caption';
    const cell = rows[0].firstElementChild;
    while (cell.firstChild) caption.append(cell.firstChild);
    table.append(caption);
    start = 1;
  }

  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  rows.slice(start).forEach((child, i) => {
    const isHeader = i === 0 && rows.length - start > 1;
    const tr = document.createElement('tr');
    [...child.children].forEach((col, j) => {
      let scope = null;
      if (isHeader) scope = 'col';
      else if (j === 0 && child.children.length > 1) scope = 'row';
      const cell = buildCell(scope);
      while (col.firstChild) cell.append(col.firstChild);
      tr.append(cell);
    });
    (isHeader ? thead : tbody).append(tr);
  });

  if (thead.children.length) table.append(thead);
  table.append(tbody);

  const wrapper = document.createElement('div');
  wrapper.className = 'table-caption-scroll';
  wrapper.append(table);
  block.replaceChildren(wrapper);
}
