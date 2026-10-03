/*
 * table-policy: bordered legal data table (TFS privacy policy tables).
 * First authored row becomes the header row (th scope=col); in every other row the
 * first cell is the row label (th scope=row, bold like the source) and the rest are data.
 * Cell content (paragraphs, bulleted lists) is moved as-is.
 */
function buildCell(scope) {
  const cell = document.createElement(scope ? 'th' : 'td');
  if (scope) cell.setAttribute('scope', scope);
  return cell;
}

export default function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  [...block.children].forEach((child, i) => {
    const isHeader = i === 0;
    const row = document.createElement('tr');
    [...child.children].forEach((col, j) => {
      let scope = null;
      if (isHeader) scope = 'col';
      else if (j === 0 && child.children.length > 1) scope = 'row';
      const cell = buildCell(scope);
      while (col.firstChild) cell.append(col.firstChild);
      row.append(cell);
    });
    (isHeader ? thead : tbody).append(row);
  });

  if (thead.children.length) table.append(thead);
  table.append(tbody);

  const wrapper = document.createElement('div');
  wrapper.className = 'table-policy-scroll';
  wrapper.append(table);
  block.replaceChildren(wrapper);
}
