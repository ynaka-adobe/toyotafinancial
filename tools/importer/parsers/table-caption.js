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

// A <br> followed by more text splits the cell into separate lines.
function hasLineBreak(cell) {
  return [...cell.querySelectorAll('br')].some((br) => {
    let n = br.nextSibling;
    while (n) {
      if ((n.textContent || '').replace(/ /g, ' ').trim()) return true;
      n = n.nextSibling;
    }
    return false;
  });
}

function isSimpleCell(cell) {
  if (cell.querySelector('ul, ol, table, img, a, b, strong, sup')) return false;
  if (hasLineBreak(cell)) return false;
  return cell.querySelectorAll('p').length <= 1;
}

// Inline-only copy of a caption node: text + sup/sub/b/strong/em/i/a kept; p/span/br unwrapped.
function inlineContent(src, document) {
  const frag = document.createDocumentFragment();
  [...src.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const t = n.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ');
      if (t.trim() || (frag.lastChild && t === ' ')) frag.append(document.createTextNode(t));
      return;
    }
    if (n.nodeType !== 1 || n.tagName === 'BR') return;
    if (/^(SUP|SUB|B|STRONG|EM|I|A)$/.test(n.tagName)) {
      if (!cleanText(n)) return;
      const el = document.createElement(n.tagName.toLowerCase());
      if (n.tagName === 'A' && n.getAttribute('href')) el.setAttribute('href', n.getAttribute('href'));
      el.append(inlineContent(n, document));
      frag.append(el);
      return;
    }
    // p / span / div inside the caption: unwrap (keep a separating space)
    if (frag.lastChild) frag.append(document.createTextNode(' '));
    frag.append(inlineContent(n, document));
  });
  return frag;
}

function trimEdges(el) {
  const first = el.firstChild;
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  const last = el.lastChild;
  if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
  return el;
}

// Cell with <br>-separated lines and no block children: one <p> per line.
function buildLineCell(cell, document) {
  const frag = document.createDocumentFragment();
  let p = document.createElement('p');
  const flush = () => {
    trimEdges(p);
    if (cleanText(p)) frag.append(p);
    p = document.createElement('p');
  };
  [...cell.childNodes].forEach((n) => {
    if (n.nodeType === 1 && n.tagName === 'BR') { flush(); return; }
    if (n.nodeType === 3) { p.append(document.createTextNode(n.textContent.replace(/ /g, ' ').replace(/\s+/g, ' '))); return; }
    if (n.nodeType === 1) p.append(stripAttributes(n.cloneNode(true)));
  });
  flush();
  return frag;
}

function buildCell(cell, document) {
  if (isSimpleCell(cell)) return cleanText(cell);
  if (hasLineBreak(cell) && !cell.querySelector('p, div, ul, ol, table')) return buildLineCell(cell, document);
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
      h3.append(inlineContent(h, document));
      captionCell.push(trimEdges(h3));
    });
    [...captionBox.querySelectorAll('p')].filter((p) => !p.closest('h1, h2, h3, h4, h5, h6')).forEach((p) => {
      if (!cleanText(p)) return;
      const np = document.createElement('p');
      np.append(inlineContent(p, document));
      captionCell.push(trimEdges(np));
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
