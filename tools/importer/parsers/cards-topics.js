/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-topics. Base: cards (custom text-only tile variant).
 * Source: https://www.toyotafinancial.com/us/en/planning_tools/faq.html
 * Selector (page-templates.json): #main-content .screenFade > .categorylist .mgb-40
 * Generated: 2026-10-03
 *
 * Content model (blocks/cards-topics/cards-topics.js): one row per tile, 1 cell,
 * cell = <p><a href="...">Label</a></p>.
 *
 * Source structure (verified in source.html):
 *   .mgb-40 > div.row (x13, empty - ignored)
 *           > div.col-sm-4.faq-box (x38) > a.btn[href] > span.btn-icon__label
 * Iteration is keyed on the .faq-box wrapper (not the sibling anchors) so that
 * DOM preprocessing which merges adjacent anchors cannot collapse the tiles.
 * Hrefs are kept as found; the links transformer rewrites site-relative hrefs.
 */
export default function parse(element, { document }) {
  let tiles = [...element.querySelectorAll('.faq-box')];
  if (!tiles.length) {
    // Fallback: any column wrapper holding a link.
    tiles = [...element.querySelectorAll('[class*="col-"]')].filter((c) => c.querySelector('a[href]'));
  }

  const cells = [];
  tiles.forEach((tile) => {
    const link = tile.querySelector('a[href]');
    if (!link) return;
    const labelEl = link.querySelector('.btn-icon__label') || link;
    const label = labelEl.textContent.replace(/\s+/g, ' ').trim();
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-topics', cells });
  element.replaceWith(block);
}
