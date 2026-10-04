/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-faq. Base: accordion.
 * Source: https://www.toyotafinancial.com/us/en/financing_options/leasing_a_toyota.html
 * Selector (page-templates.json): #main-content .screenFade .accordion.parbase ul.custom-faq-accordion
 * Generated: 2026-10-04
 *
 * Content model (blocks/accordion-faq/README.md; Accordion convention):
 *   N rows, 2 cells: [title text] | [body rich text: p, ul, sup, links]
 *
 * Source structure (verified in cached source.html; structure.json: li.panel repeating, iterationSafe):
 *   ul.custom-faq-accordion > li.panel
 *     > .panel-heading > h3.panel-title > a[href="#collapse…"] (title text + empty <sup> + i.glyphicon)
 *     > .panel-collapse > .panel-body (rich content)
 * The surrounding h2 / intro p / disclaimers of .accordion.parbase stay default content.
 */
function cleanText(el) {
  return (el.textContent || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function buildTitle(heading, document) {
  const src = heading.querySelector('a') || heading;
  const frag = document.createDocumentFragment();
  [...src.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      const t = node.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ');
      if (t.trim()) frag.append(document.createTextNode(t));
      return;
    }
    if (node.nodeType !== 1) return;
    if (node.tagName === 'I') return; // chevron icon
    if (!cleanText(node)) return; // empty <sup>
    if (node.tagName === 'SUP') {
      const sup = document.createElement('sup');
      sup.textContent = cleanText(node);
      frag.append(sup);
      return;
    }
    frag.append(document.createTextNode(cleanText(node)));
  });
  // trim leading/trailing whitespace of the assembled title
  if (frag.firstChild && frag.firstChild.nodeType === 3) frag.firstChild.textContent = frag.firstChild.textContent.replace(/^\s+/, '');
  if (frag.lastChild && frag.lastChild.nodeType === 3) frag.lastChild.textContent = frag.lastChild.textContent.replace(/\s+$/, '');
  return frag;
}

export default function parse(element, { document }) {
  const items = [...element.querySelectorAll(':scope > li.panel, :scope > li')];
  const cells = [];

  items.forEach((item) => {
    const heading = item.querySelector('.panel-heading .panel-title, .panel-heading');
    const body = item.querySelector('.panel-collapse .panel-body, .panel-body, .panel-collapse');
    if (!heading || !cleanText(heading)) return;

    const bodyCell = [];
    if (body) {
      [...body.childNodes].forEach((node) => {
        if (node.nodeType === 3) {
          if (node.textContent.trim()) {
            const p = document.createElement('p');
            p.textContent = node.textContent.trim();
            bodyCell.push(p);
          }
          return;
        }
        if (node.nodeType !== 1) return;
        if (!cleanText(node) && !node.querySelector('img')) return;
        bodyCell.push(node);
      });
    }
    cells.push([buildTitle(heading, document), bodyCell.length ? bodyCell : '']);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
