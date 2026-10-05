/* eslint-disable */
/* global WebImporter */

/**
 * Parser for documents. Base: none (custom block).
 * Source: https://www.toyotafinancial.com/us/en/investor_relations/unsecured_term_debt.html
 * Selector (page-templates.json, content-page): #main-content .screenFade .doc-link.parbase
 * Generated: 2026-10-05
 *
 * Content model (blocks/documents/documents.js):
 *   [ <h3>group title</h3> ]
 *   [ label | links (one per file; text = file type, icon from the extension) ]
 *
 * Source structure: .doc-link.parbase > div > h3 + .doc-subsection* >
 *   .doc-links-text p (label) + .doc-links a[href] (icon-only: span.icon-pdf-icon / icon-word_icon)
 * The icon-only links have no text, which is why the default import dropped them.
 */
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
const TYPE = { pdf: 'PDF', doc: 'Word', docx: 'Word', htm: 'HTML', html: 'HTML', xls: 'Excel', xlsx: 'Excel' };

export default function parse(element, { document }) {
  const cells = [];
  const h = element.querySelector('h1, h2, h3, h4');
  if (h) {
    const h3 = document.createElement('h3');
    h3.textContent = text(h);
    cells.push([h3]);
  }
  element.querySelectorAll('.doc-subsection').forEach((sub) => {
    const label = text(sub.querySelector('.doc-links-text')) || (h ? text(h) : 'Document');
    const links = document.createElement('p');
    sub.querySelectorAll('.doc-links a[href]').forEach((a, i) => {
      const href = a.getAttribute('href');
      const ext = decodeURIComponent(href).split('?')[0].split('.').pop().toLowerCase();
      const link = document.createElement('a');
      link.setAttribute('href', href);
      link.textContent = TYPE[ext] || ext.toUpperCase();
      if (i) links.append(' ');
      links.append(link);
    });
    if (links.childNodes.length) cells.push([label, links]);
  });
  if (!cells.length) return;
  const block = WebImporter.Blocks.createBlock(document, { name: 'Documents', cells });
  element.replaceWith(block);
}
