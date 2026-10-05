/*
 * compare-plans: plan comparison grouped into collapsible categories
 * (TFS Vehicle Service Agreement "Compare" tabs: Components and Features).
 *
 * Authoring (one block table):
 *  - Rows before the header row (1 cell): intro content shown above the table, e.g. the
 *    legend list "✓ Included Component" / "✗ Excluded Component".
 *  - Header row: first cell empty (or a label for the name column), then one cell per plan.
 *  - Category row: 1 cell holding a heading -> starts a new collapsible group.
 *  - Value row: name | one cell per plan. "✓" = included, "✗" = excluded, anything else is
 *    shown as text (Features rows leave the name cell empty and hold text per plan).
 *  - Note row: 1 cell without a heading -> note inside the current group, in authored order.
 *
 * Groups start closed (native details/summary). A link to "#print" anywhere on the page
 * ("View Printer Friendly Version") opens every group and prints the page.
 */
const INCLUDED = /^[✓✔]$/;
const EXCLUDED = /^[✗✕✘×]$/;

function mark(included) {
  const span = document.createElement('span');
  span.className = `compare-plans-mark ${included ? 'included' : 'excluded'}`;
  span.setAttribute('role', 'img');
  span.setAttribute('aria-label', included ? 'Included' : 'Not included');
  return span;
}

// replaces leading ✓ / ✗ characters in text (e.g. legend items) with marks
function decorateMarks(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hits = [];
  while (walker.nextNode()) {
    if (/^\s*[✓✔✗✕✘×]\s*/.test(walker.currentNode.nodeValue)) hits.push(walker.currentNode);
  }
  hits.forEach((node) => {
    const [, sym] = node.nodeValue.match(/^\s*([✓✔✗✕✘×])/);
    const m = mark(INCLUDED.test(sym));
    m.setAttribute('aria-hidden', 'true');
    m.removeAttribute('aria-label');
    m.removeAttribute('role');
    node.nodeValue = node.nodeValue.replace(/^\s*[✓✔✗✕✘×]\s*/, '');
    node.before(m);
  });
}

function cellContent(cell, plan) {
  const text = cell.textContent.trim();
  const td = document.createElement('td');
  if (plan) td.dataset.plan = plan;
  if (INCLUDED.test(text)) td.append(mark(true));
  else if (EXCLUDED.test(text)) td.append(mark(false));
  else td.append(...cell.childNodes);
  return td;
}

function headingOf(cell) {
  return cell.querySelector('h1, h2, h3, h4, h5, h6');
}

function bindPrint() {
  if (document.body.dataset.comparePrint) return;
  document.body.dataset.comparePrint = 'true';
  document.querySelectorAll('main a[href="#print"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.print();
    });
  });
  // printed pages show every group expanded
  const opened = [];
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('.compare-plans details:not([open])').forEach((d) => {
      d.open = true;
      opened.push(d);
    });
  });
  window.addEventListener('afterprint', () => {
    opened.splice(0).forEach((d) => { d.open = false; });
  });
}

export default function decorate(block) {
  const rows = [...block.children];
  const intro = document.createElement('div');
  intro.className = 'compare-plans-intro';
  const groups = document.createElement('div');
  groups.className = 'compare-plans-groups';

  let plans = null;
  let nameLabel = '';
  let tbody = null;

  const newGroup = (titleCell) => {
    const details = document.createElement('details');
    details.className = 'compare-plans-group';
    const summary = document.createElement('summary');
    const heading = headingOf(titleCell);
    summary.append(...(heading || titleCell).childNodes);
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    const corner = document.createElement('th');
    corner.scope = 'col';
    corner.textContent = nameLabel;
    if (!nameLabel) corner.className = 'compare-plans-corner';
    tr.append(corner, ...plans.map((p) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = p;
      return th;
    }));
    thead.append(tr);
    tbody = document.createElement('tbody');
    table.append(thead, tbody);
    const scroller = document.createElement('div');
    scroller.className = 'compare-plans-table';
    scroller.append(table);
    details.append(summary, scroller);
    groups.append(details);
  };

  rows.forEach((row) => {
    const cells = [...row.children];
    if (!plans) {
      if (cells.length > 1) {
        nameLabel = cells[0].textContent.trim();
        plans = cells.slice(1).map((c) => c.textContent.trim());
      } else if (cells[0]) {
        intro.append(...cells[0].childNodes);
      }
      return;
    }
    if (cells.length === 1 && headingOf(cells[0])) {
      newGroup(cells[0]);
      return;
    }
    if (!tbody) newGroup(document.createElement('div'));
    const tr = document.createElement('tr');
    if (cells.length === 1) {
      const td = document.createElement('td');
      td.colSpan = plans.length + 1;
      td.className = 'compare-plans-note';
      td.append(...cells[0].childNodes);
      tr.append(td);
    } else {
      const name = cells[0];
      const th = document.createElement('th');
      th.scope = 'row';
      th.append(...name.childNodes);
      if (!th.textContent.trim()) tr.classList.add('compare-plans-values');
      tr.append(th, ...cells.slice(1).map((c, i) => cellContent(c, plans[i])));
    }
    tbody.append(tr);
  });

  // text-only comparisons (Features) have no names: drop the empty name column
  groups.querySelectorAll('table').forEach((table) => {
    const names = [...table.querySelectorAll('tbody th')];
    if (names.some((th) => th.textContent.trim())) return;
    table.classList.add('compare-plans-text');
    table.querySelector('thead th')?.remove();
    names.forEach((th) => th.remove());
    table.querySelectorAll('td.compare-plans-note').forEach((td) => { td.colSpan = plans.length; });
  });

  decorateMarks(intro);
  block.replaceChildren(...(intro.childNodes.length ? [intro] : []), groups);
  bindPrint();
}
