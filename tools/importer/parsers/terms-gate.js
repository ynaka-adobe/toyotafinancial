/* eslint-disable */
/* global WebImporter */

/**
 * Parser for terms-gate. Base: none (custom block).
 * Source: https://www.toyotafinancial.com/us/en/investor_relations/sales_and_trading.html
 *   (+ unsecured_term_debt, asset-backed_securities)
 * Selector (page-templates.json, content-page): #main-content .screenFade .investor-relations-terms
 * Generated: 2026-10-05
 *
 * Content model (blocks/terms-gate/terms-gate.js): 1 cell per row
 *   [ <h1>title</h1> + terms paragraphs ]
 *   [ Decline link (-> SEC Filings) + **Accept** link to "#accept" ]
 * followed by a section break, so the gated content (.investor-relations-content) starts a
 * new section (everything after the block's section stays hidden until "Accept").
 *
 * Source structure: .investor-relations-terms > .page-heading h1 + .rte p ... +
 *   .card-component .terms-buttons > a.terms-decline[href] + a.terms-accept (no href)
 */
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

export default function parse(element, { document }) {
  const content = document.createElement('div');
  const h = element.querySelector('h1, h2');
  if (h) {
    const h1 = document.createElement('h1');
    h1.textContent = text(h);
    content.append(h1);
  }
  element.querySelectorAll('.rte p, .rte ul, .rte ol').forEach((p) => {
    if (text(p)) content.append(p.cloneNode(true));
  });

  const actions = document.createElement('p');
  const decline = element.querySelector('a.terms-decline');
  if (decline) {
    const a = document.createElement('a');
    a.setAttribute('href', decline.getAttribute('href'));
    a.textContent = text(decline) || 'Decline';
    actions.append(a, ' ');
  }
  const accept = document.createElement('a');
  accept.setAttribute('href', '#accept');
  accept.textContent = text(element.querySelector('a.terms-accept')) || 'Accept';
  const strong = document.createElement('strong');
  strong.append(accept);
  actions.append(strong);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Terms Gate', cells: [[content], [actions]] });
  element.replaceWith(block);
  // section break: the gated content follows in its own section
  block.after(document.createElement('hr'));
}
