/* eslint-disable */
/* global WebImporter */

/**
 * Parser for document-library. Base: none (custom block).
 * Source: https://www.toyotafinancial.com/us/en/investor_relations/sec_filings.html
 *   (+ asset-backed_securities)
 * Selectors (page-templates.json, content-page):
 *   #main-content .screenFade .sec-filling.parbase           (SEC Filings app)
 *   #main-content .screenFade .assetbacked-security.parbase  (ABS investor reports app)
 * Generated: 2026-10-05
 *
 * Content model (blocks/document-library/document-library.js): key | value rows
 *   | Source | link to the library folder (/content/dam/... on www.toyotafinancial.com) |
 *   | Layout | sec-filings | asset-backed |
 *   | Year label | Please select a fiscal year |
 *   | Order | report types in display order (sec-filings) |
 *
 * The source components are jQuery apps that read the AEM Assets API at runtime: an inline
 * <script> with var root_dir = '/api/assets/<folder>.json[?limit=n]', a year dropdown
 * (label + .materialized-dropdown li.option) and the rendered lists. The block reads the same
 * library live, so only the configuration is kept.
 */
const ORIGIN = 'https://www.toyotafinancial.com';
const DEFAULTS = {
  'sec-filings': '/content/dam/tmcc-webcommons/toyotafinancial/documents/investor-relations/sec-filings',
  'asset-backed': '/content/dam/tmcc-webcommons/toyotafinancial/documents/investor-relations/ABS',
};
// display order of the SEC report types (source script: data.entities.move(...))
const SEC_ORDER = 'Quarterly Reports on Form 10-Q, Annual Reports on Form 10-K, Current Reports on Form 8-K';

export default function parse(element, { document }) {
  const layout = element.matches('.assetbacked-security') ? 'asset-backed' : 'sec-filings';
  const script = [...element.querySelectorAll('script')].map((s) => s.textContent).join('\n');
  const m = script.match(/root_dir\s*=\s*'([^']+)'/);
  const folder = m
    ? m[1].replace(/^\/api\/assets\//, '/content/dam/').replace(/\.json.*$/, '')
    : DEFAULTS[layout];

  const labelEl = element.querySelector('label, .select-label, p');
  const label = (labelEl ? labelEl.textContent.replace(/\s+/g, ' ').trim() : '')
    || (layout === 'sec-filings' ? 'Please select a fiscal year' : 'Please select a year');
  const toSentence = (s) => (s === s.toUpperCase() ? s.charAt(0) + s.slice(1).toLowerCase() : s);

  const link = document.createElement('a');
  link.setAttribute('href', `${ORIGIN}${folder}`);
  link.textContent = `${ORIGIN}${folder}`;
  const cells = [['Source', link], ['Layout', layout], ['Year label', toSentence(label)]];
  if (layout === 'sec-filings') cells.push(['Order', SEC_ORDER]);

  // authored text inside the app component stays as default content after the block,
  // e.g. SEC Filings: p.sec_footer_text "TMCC periodic filings are also available via ... EDGAR"
  const after = [...element.querySelectorAll('p.sec_footer_text')];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Document Library', cells });
  element.replaceWith(block);
  block.after(...after);
}
