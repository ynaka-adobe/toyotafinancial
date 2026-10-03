/* eslint-disable */
/* global WebImporter */

/**
 * Parser for table-policy. Base: table.
 * Source: https://www.toyotafinancial.com/us/en/online_privacy_policy.html
 * Selector (page-templates.json): #main-content .screenFade > .one-column-component table
 * Generated: 2026-10-03
 *
 * Content model (blocks/table-policy/README.md + table-policy.js):
 *   Row 1: block name (added by createBlock).
 *   Row 2: header cells — plain text of each thead <th> (<p><b> unwrapped);
 *          the block JS renders this row as <th scope="col">.
 *   Rows 3+: one row per body <tr>, 2 cells:
 *          [row-header text (th scope="row", <p> unwrapped) | cell content (the <ul>)].
 *
 * Source structure (verified in cached source.html and the live DOM, 1 table, 4 rows):
 *   table[border width] > thead > tr > th[scope=col][width][valign] > p > b
 *                       > tbody > tr > th[scope=row] > p  +  td > ul > li
 * Legacy presentational attributes (width, valign, border, style, ...) are not
 * carried over: header/label cells are rebuilt as text, rich cells are deep-cloned
 * with all attributes stripped.
 */

function cleanText(el) {
  return (el.textContent || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function stripAttributes(root) {
  [root, ...root.querySelectorAll('*')].forEach((node) => {
    [...node.attributes].forEach((attr) => {
      if (node.tagName === 'A' && attr.name === 'href') return;
      if (node.tagName === 'IMG' && (attr.name === 'src' || attr.name === 'alt')) return;
      node.removeAttribute(attr.name);
    });
  });
  return root;
}

// A cell is "simple" when it holds only text (optionally wrapped in p/b/strong/span)
// — no lists, links, images or multiple paragraphs. Simple cells become plain text.
function isSimpleCell(cell) {
  if (cell.querySelector('ul, ol, table, img, a, br')) return false;
  return cell.querySelectorAll('p').length <= 1;
}

function buildCell(cell, document) {
  if (isSimpleCell(cell)) return cleanText(cell);
  const frag = document.createDocumentFragment();
  [...cell.childNodes].forEach((child) => {
    if (child.nodeType === 3) {
      if (child.textContent.trim()) frag.appendChild(document.createTextNode(child.textContent.trim()));
      return;
    }
    if (child.nodeType !== 1) return;
    frag.appendChild(stripAttributes(child.cloneNode(true)));
  });
  return frag;
}

export default function parse(element, { document }) {
  const table = element.matches('table') ? element : element.querySelector('table');
  if (!table) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Direct rows only (thead/tbody/tfoot or bare tr), never rows of a nested table.
  const rows = [...table.rows].filter((tr) => tr.closest('table') === table);
  if (!rows.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = rows.map((tr) => [...tr.cells].map((cell) => buildCell(cell, document)));

  // Every row must have the same number of cells.
  const colCount = Math.max(...cells.map((r) => r.length));
  cells.forEach((r) => { while (r.length < colCount) r.push(''); });

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-policy', cells });
  element.replaceWith(block);
}
