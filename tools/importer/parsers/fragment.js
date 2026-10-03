/* eslint-disable */
/* global WebImporter */

/**
 * Parser for fragment. Base: fragment (no library convention; standard EDS Fragment block).
 * Source: https://www.toyotafinancial.com/us/en/planning_tools/faq/Guaranteed_Auto_Protection_GAP.html
 * Selector (page-templates.json): #main-content .screenFade > .questionlist #faqcard
 * Generated: 2026-10-03
 *
 * Content model (blocks/fragment/fragment.js): 1 row, 1 cell = link to the fragment path.
 *
 * Shared boxes repeated verbatim on every page are replaced by a reference to a
 * fragment document. The source element id is mapped to the fragment path; unknown
 * ids leave the element untouched. The fragment documents themselves are produced
 * separately by the import script.
 */
const FRAGMENTS = {
  faqcard: '/us/en/fragments/faq-help',
};

export default function parse(element, { document }) {
  const path = FRAGMENTS[element.id];
  if (!path) return;

  const a = document.createElement('a');
  a.setAttribute('href', path);
  a.textContent = path;

  const block = WebImporter.Blocks.createBlock(document, { name: 'Fragment', cells: [[a]] });
  element.replaceWith(block);
}
