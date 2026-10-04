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
 *
 * Class-based mapping (added 2026-10-04, template end-of-lease):
 *   Selector: main > .container-fluid.px-0 .lease-end-right-container > .login-reg-card.parbase
 *   Source: https://www.toyotafinancial.com/us/en/end_of_lease_options/your_option.html (all 7 pages)
 *   The login card is replaced by the fragment block and the footer-card dealer callout
 *   (main > .container-fluid.px-0 > .footer-card.parbase) is removed from the document —
 *   both live in the shared /us/en/fragments/lease-end-help fragment.
 *   Id mapping is checked first, so the FAQ (#faqcard) behaviour is unchanged.
 */
const FRAGMENTS = {
  faqcard: '/us/en/fragments/faq-help',
};

const CLASS_FRAGMENTS = [
  {
    selector: '.login-reg-card',
    path: '/us/en/fragments/lease-end-help',
    // Companion elements folded into the same fragment (removed from the page).
    remove: ['main > .container-fluid.px-0 > .footer-card.parbase'],
  },
];

export default function parse(element, { document }) {
  let path = FRAGMENTS[element.id];
  if (!path) {
    const match = CLASS_FRAGMENTS.find((f) => element.matches(f.selector));
    if (!match) return;
    path = match.path;
    match.remove.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (!el.contains(element)) el.remove();
      });
    });
  }

  const a = document.createElement('a');
  a.setAttribute('href', path);
  a.textContent = path;

  const block = WebImporter.Blocks.createBlock(document, { name: 'Fragment', cells: [[a]] });
  element.replaceWith(block);
}
