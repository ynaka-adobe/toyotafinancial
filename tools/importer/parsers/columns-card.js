/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-card. Base: columns.
 * Source: https://www.toyotafinancial.com/us/en/about_us/company_overview.html
 * Selector (page-templates.json): #main-content .screenFade > .card-component.parbase
 * Generated: 2026-10-03
 *
 * Content model (blocks/columns-card/README.md): 1 row, 2 cells [picture | text].
 *
 * Source structure (verified in source.html and the live DOM):
 *   .card.no-pd > .col-sm-6 (image half: .row > img[alt="civic 50"], Scene7 URL live)
 *               > .col-sm-6 (text half: .row > .caption > p + empty a.js-external-tp)
 * The statistics are baked into the image, so the image alt is kept as-is.
 * The empty a.js-external-tp (no text, no image) is dropped.
 */
export default function parse(element, { document }) {
  const card = element.querySelector('.card') || element;
  const cols = [...card.querySelectorAll(':scope > .col-sm-6, :scope > [class*="col-"]')];

  // Image column: first column that contains an <img>; text column: the .caption
  // (fallback: first column without an image).
  const imgCol = cols.find((c) => c.querySelector('img')) || card;
  const img = imgCol.querySelector('img');
  const textSource = card.querySelector('.caption')
    || cols.find((c) => c !== imgCol && !c.querySelector('img'));

  // Empty-block guard.
  if (!img && !(textSource && textSource.textContent.trim())) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Cell 1: picture.
  const imageCell = [];
  if (img) {
    const newImg = document.createElement('img');
    newImg.setAttribute('src', img.getAttribute('src'));
    newImg.setAttribute('alt', img.getAttribute('alt') || '');
    imageCell.push(newImg);
  }

  // Cell 2: text content (paragraphs, headings, lists, non-empty links).
  const textCell = [];
  if (textSource) {
    [...textSource.children].forEach((child) => {
      if (child.matches('a') && !child.textContent.trim() && !child.querySelector('img')) return;
      if (!child.textContent.trim() && !child.querySelector('img')) return;
      textCell.push(child);
    });
  }

  const cells = [[imageCell.length ? imageCell : '', textCell.length ? textCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-card', cells });
  element.replaceWith(block);
}
