/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-questions. Base: cards (custom question-link tile variant).
 * Source: https://www.toyotafinancial.com/us/en/planning_tools/faq/Guaranteed_Auto_Protection_GAP.html
 * Selector (page-templates.json): #main-content .screenFade > .questionlist div:has(> .faq-question)
 * Generated: 2026-10-03
 *
 * Content model (blocks/cards-questions/cards-questions.js): one row per question, 1 cell,
 * cell = <p><a href="...">Question text</a></p>.
 *
 * Source structure (verified in source.html / structure.json):
 *   div > div.mt-10.faq-question (x N, 1..31 per page) > a.btn[href]
 * Iteration is keyed on the .faq-question wrapper (not the sibling anchors) so that
 * DOM preprocessing which merges adjacent anchors cannot collapse the questions.
 * Hrefs are kept as found; the links transformer rewrites site-relative hrefs.
 */
export default function parse(element, { document }) {
  let items = [...element.querySelectorAll(':scope > .faq-question')];
  if (!items.length) items = [...element.querySelectorAll('.faq-question')];
  if (!items.length) {
    // Fallback: any direct child wrapper holding a link.
    items = [...element.children].filter((c) => c.querySelector('a[href]'));
  }

  const cells = [];
  items.forEach((item) => {
    const link = item.querySelector('a[href]');
    if (!link) return;
    const label = link.textContent.replace(/\s+/g, ' ').trim();
    if (!label) return;

    const a = document.createElement('a');
    a.setAttribute('href', link.getAttribute('href'));
    a.textContent = label;
    const p = document.createElement('p');
    p.append(a);
    cells.push([p]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-questions', cells });
  element.replaceWith(block);
}
