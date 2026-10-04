/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-boxed. Base: accordion.
 * Source: https://www.toyotafinancial.com/us/en/planning_tools/ways_to_pay.html
 * Selector (page-templates.json):
 *   #main-content .screenFade .compContainer.parbase .tmcc-accordion > .newAccordion.parbase
 * Generated: 2026-10-04
 *
 * Content model (blocks/accordion-boxed/README.md; Accordion convention):
 *   N rows, 2 cells: [title] | [body rich text: p, ul (nested), links, h3]
 *
 * The selector matches each panel (7 sibling .newAccordion.parbase). The FIRST matched panel
 * collects itself and every consecutive .newAccordion.parbase sibling into ONE block and removes
 * the others; later calls on the detached siblings are no-ops (the import script skips
 * elements that no longer have a parent).
 *
 * Source structure (verified in cached source.html):
 *   .newAccordion > .panel > .panel-heading h4.panel-title a .col-xs-9 (title text)
 *                          > .panel-collapse > .tcom-accordion-content-wrapper
 *                              > (.text|.rich-text).parbase > div > p, ul, h3, table
 *                              > .generalcolumn.parbase (3-col address grid)
 * Flattening (blocks cannot nest, requirements doc):
 *   - generalcolumn grid: one h3 per column (its leading <b>) + p with the remaining lines.
 *   - tables: header row -> p > strong "A: B"; each data row -> p "cell1: cell2".
 *   - inline style / class attributes dropped.
 */
const PANEL_SELECTOR = '.newAccordion.parbase, .newAccordion';

function cleanText(el) {
  return (el.textContent || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function stripAttributes(root) {
  [root, ...root.querySelectorAll('*')].forEach((node) => {
    [...node.attributes].forEach((attr) => {
      if (node.tagName === 'A' && (attr.name === 'href')) return;
      if (node.tagName === 'IMG' && (attr.name === 'src' || attr.name === 'alt')) return;
      node.removeAttribute(attr.name);
    });
  });
  // drop empty <b>/<strong> left by the CMS (e.g. "application:<b></b>")
  root.querySelectorAll('b, strong').forEach((b) => { if (!b.textContent.trim() && !b.querySelector('img')) b.remove(); });
  return root;
}

// One grid column -> [h3 (leading bold line), p (remaining lines)]
function flattenColumn(col, document) {
  const out = [];
  col.querySelectorAll('p').forEach((p) => {
    const first = p.firstElementChild;
    const startsBold = first && /^(B|STRONG)$/.test(first.tagName)
      && p.textContent.trim().startsWith(first.textContent.trim());
    if (startsBold && first.textContent.trim()) {
      const h3 = document.createElement('h3');
      h3.textContent = cleanText(first);
      out.push(h3);
      const rest = p.cloneNode(true);
      rest.removeChild(rest.firstElementChild);
      // drop leading <br>/whitespace
      while (rest.firstChild && ((rest.firstChild.nodeType === 3 && !rest.firstChild.textContent.trim())
        || (rest.firstChild.nodeType === 1 && rest.firstChild.tagName === 'BR'))) {
        rest.removeChild(rest.firstChild);
      }
      if (cleanText(rest)) out.push(stripAttributes(rest));
    } else if (cleanText(p)) {
      out.push(stripAttributes(p.cloneNode(true)));
    }
  });
  return out;
}

function flattenTable(table, document) {
  const out = [];
  [...table.querySelectorAll('tr')].forEach((tr, i) => {
    const values = [...tr.children].map(cleanText).filter(Boolean);
    if (!values.length) return;
    const p = document.createElement('p');
    const isHeader = i === 0 && (tr.querySelector('th') || [...tr.children].every((c) => c.querySelector('b, strong')));
    if (isHeader) {
      const strong = document.createElement('strong');
      strong.textContent = values.join(': ');
      p.append(strong);
    } else {
      p.textContent = values.join(': ');
    }
    out.push(p);
  });
  return out;
}

// Walk the panel body and emit flat rich-text nodes.
function flattenBody(node, document, out) {
  [...node.children].forEach((child) => {
    if (child.matches('.generalcolumn, .generalcolumn.parbase')) {
      // leaf grid columns only (skip the outer .col-sm-12 wrapper that holds the .row)
      const COL = '[class*="col-sm-"], [class*="col-xs-"]';
      const cols = [...child.querySelectorAll(COL)]
        .filter((c) => !c.querySelector(COL) && c.querySelector('p'));
      if (cols.length) cols.forEach((col) => out.push(...flattenColumn(col, document)));
      else flattenBody(child, document, out);
      return;
    }
    if (child.tagName === 'TABLE') { out.push(...flattenTable(child, document)); return; }
    if (/^(P|UL|OL|H1|H2|H3|H4|H5|H6|BLOCKQUOTE)$/.test(child.tagName)) {
      if (!cleanText(child) && !child.querySelector('img')) return;
      out.push(stripAttributes(child.cloneNode(true)));
      return;
    }
    if (child.tagName === 'IMG') { out.push(stripAttributes(child.cloneNode(true))); return; }
    if (child.tagName === 'DIV' || child.tagName === 'SECTION' || child.tagName === 'SPAN') {
      // a wrapper that directly holds text (no block children) becomes a paragraph
      const hasBlockChild = child.querySelector('p, ul, ol, h1, h2, h3, h4, h5, h6, table, div');
      if (!hasBlockChild && cleanText(child)) {
        const p = document.createElement('p');
        p.append(...[...child.childNodes].map((n) => n.cloneNode(true)));
        out.push(stripAttributes(p));
        return;
      }
      flattenBody(child, document, out);
    }
  });
}

function panelTitle(panel) {
  const heading = panel.querySelector('.panel-heading .panel-title, .panel-heading');
  if (!heading) return '';
  const text = heading.querySelector('.col-xs-9, .pad_left_0') || heading.querySelector('a') || heading;
  return cleanText(text);
}

export default function parse(element, { document }) {
  if (!element.parentNode) return; // already merged into the block by the first sibling

  // Collect this panel and every consecutive panel sibling.
  const panels = [element];
  let next = element.nextElementSibling;
  while (next && next.matches(PANEL_SELECTOR)) {
    panels.push(next);
    next = next.nextElementSibling;
  }

  const cells = [];
  panels.forEach((panel) => {
    const title = panelTitle(panel);
    if (!title) return;
    const body = panel.querySelector('.panel-collapse .tcom-accordion-content-wrapper, .panel-collapse, .panel-body');
    const bodyCell = [];
    if (body) flattenBody(body, document, bodyCell);
    cells.push([title, bodyCell.length ? bodyCell : '']);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  panels.slice(1).forEach((p) => p.remove());
  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-boxed', cells });
  element.replaceWith(block);
}
