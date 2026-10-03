/* eslint-disable */
/* global WebImporter */

// Produces the shared FAQ help fragment (/us/en/fragments/faq-help) from the
// "Still need help?" box (#faqcard) that is identical on every FAQ topic page.
// Run against ONE FAQ topic page; the topic pages themselves reference this
// fragment (see parsers/fragment.js and import-faq.js).

import linksTransformer from './transformers/toyotafinancial-links.js';

/**
 * Builds the shared FAQ help fragment ("Still need help?" box) from #faqcard,
 * before the fragment parser replaces the box with a reference to it.
 * Output: h2 + paragraph + Contact Us link, styled via section metadata.
 * @param {Document} document - The DOM document
 * @returns {{element: Element, path: string}|null}
 */
function buildHelpFragment(document) {
  const card = document.querySelector('#main-content .screenFade > .questionlist #faqcard');
  if (!card) return null;
  const container = document.createElement('div');
  const header = card.querySelector('.card-header');
  if (header) {
    const h2 = document.createElement('h2');
    h2.textContent = header.textContent.trim();
    container.append(h2);
  }
  card.querySelectorAll('.card-content p:not(.card-header)').forEach((p) => {
    const para = document.createElement('p');
    para.textContent = p.textContent.replace(/\s+/g, ' ').trim();
    if (para.textContent) container.append(para);
  });
  card.querySelectorAll('a[href]').forEach((a) => {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href'));
    link.textContent = a.textContent.trim();
    p.append(link);
    container.append(p);
  });
  container.append(WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: { style: 'help-card' },
  }));
  return { element: container, path: '/us/en/fragments/faq-help' };
}

export default {
  transform: (payload) => {
    const { document } = payload;
    const fragment = buildHelpFragment(document);
    if (!fragment) throw new Error('FAQ help box (#faqcard) not found on this page');
    // same link rewriting as page links (Contact Us -> original site until migrated)
    linksTransformer('afterTransform', fragment.element, payload);
    return [{
      element: fragment.element,
      path: fragment.path,
      report: { title: 'FAQ help fragment', template: 'faq-help-fragment', blocks: [] },
    }];
  },
};
