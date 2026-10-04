/* eslint-disable */
/* global WebImporter */

/**
 * Parser for table-caption. Base: table.
 * Source: https://www.toyotafinancial.com/us/en/financing_options/understanding_credit/your_credit.html
 *   (+ prepaid_maintenance_plan / vehicle_service_agreements plan-term tables inside tab panels)
 * Selector (page-templates.json): #main-content .screenFade .table.parbase:has(table)
 * Generated: 2026-10-04
 *
 * Content model (blocks/table-caption/README.md + table-caption.js; Table convention):
 *   Row 1: ONE merged cell [h3 caption, p text]   (rendered as the dark caption box)
 *   Row 2: header cells (source first <tr>)
 *   Rows 3..n: data cells (first column = row label)
 *   Column count = widest source row; shorter rows are padded with empty cells.
 *
 * Source structure (verified in cached source.html):
 *   .default-table > div (h3 [sometimes h3 > p] + p)  +  table > tbody > tr > (th|td)
 * Simple cells (text only) become plain text; rich cells (several p, b) are deep-cloned with
 * attributes stripped. Legacy presentational attributes are not carried over.
 */
function cleanText(el) {
  return (el.textContent || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
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

function isSimpleCell(cell) {
  if (cell.querySelector('ul, ol, table, img, a, b, strong, sup')) return false;
  return cell.querySelectorAll('p').length <= 1;
}

function buildCell(cell, document) {
  if (isSimpleCell(cell)) return cleanText(cell);
  const frag = document.createDocumentFragment();
  [...cell.childNodes].forEach((child) => {
    if (child.nodeType === 3) {
      if (child.textContent.trim()) frag.append(document.createTextNode(cleanText(child)));
      return;
    }
    if (child.nodeType !== 1) return;
    if (child.tagName === 'BR') return;
    if (!cleanText(child) && !child.querySelector('img')) return;
    frag.append(stripAttributes(child.cloneNode(true)));
  });
  return frag;
}

export default function parse(element, { document }) {
  const table = element.querySelector('table');
  if (!table) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const rows = [...table.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tr, :scope > tfoot > tr')]
    .filter((tr) => cleanText(tr) || tr.querySelector('img'));
  const width = Math.max(1, ...rows.map((tr) => tr.children.length));

  const cells = [];

  // Row 1: caption (h3 + p) as one merged cell.
  const wrapper = element.querySelector('.default-table') || element;
  const captionBox = [...wrapper.children].find((c) => c !== table && !c.contains(table) && cleanText(c));
  if (captionBox) {
    const captionCell = [];
    captionBox.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      if (!cleanText(h)) return;
      const h3 = document.createElement('h3');
      h3.textContent = cleanText(h);
      captionCell.push(h3);
    });
    [...captionBox.querySelectorAll('p')].filter((p) => !p.closest('h1, h2, h3, h4, h5, h6')).forEach((p) => {
      if (!cleanText(p)) return;
      const np = document.createElement('p');
      np.textContent = cleanText(p);
      captionCell.push(np);
    });
    if (captionCell.length) cells.push([captionCell]);
  }

  // Row 2: header; rows 3..n: data. Header cells are plain text.
  rows.forEach((tr, i) => {
    const row = [...tr.children].map((c) => (i === 0 && tr.querySelector('th') ? cleanText(c) : buildCell(c, document)));
    while (row.length < width) row.push('');
    cells.push(row);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-caption', cells });
  element.replaceWith(block);
}
