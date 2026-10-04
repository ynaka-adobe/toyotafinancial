/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-callout. Base: columns.
 * Source: https://www.toyotafinancial.com/us/en/financing_options/leasing_a_toyota.html
 *   (+ guaranteed_auto_protection Download card, vehicle_service_agreements tab-panel cards,
 *    TFS_ThoughtFuel_Blog article Apply Now card)
 * Selector (page-templates.json):
 *   #main-content .screenFade .card-component.parbase:has(.card-content, .img-card)
 *     :not(:has(.thumbnail-card, .materialized-dropdown, .card.no-pd))
 * Generated: 2026-10-04
 *
 * Content model (blocks/columns-callout/README.md + columns-callout.js; Columns convention:
 * one row, cells side by side):
 *   1 row, 2 cells: [p > strong title, p text..., optional img] | [CTA cell]
 *   CTA cell: bold link (p > strong > a) = primary pill button;
 *             plain links (p > a, one per p) = link list (Download card PDFs).
 *
 * Source shapes (verified in cached source.html):
 *   A) .card > .card-content (p.card-header + p*) + .card-btn > a.btn          (text + button)
 *   B) .img-card > .col-sm-12 > p.card-header + .card-content > img + .card-btn > a.btn
 *   C) .card > .card-content > p.card-header + .col-sm-4 > p.pdf-link > a > span.card-pdf-text
 *   D) .card > .card-content > p.card-header (title only) + .card-btn > a.btn
 * All hrefs are kept as found (the links transformer rewrites/absolutizes them later).
 */

function cleanText(el) {
  return (el.textContent || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function isDocumentHref(href) {
  return /\.(pdf|docx?|xlsx?|mp4|webm)(\?|#|$)/i.test(href || '') || /\/content\/dam\//.test(href || '');
}

export default function parse(element, { document }) {
  const root = element.querySelector('.img-card, .card') || element;
  const header = root.querySelector('.card-header');
  const content = root.querySelector('.card-content');

  // ---- Text cell ----
  const textCell = [];
  if (header && cleanText(header)) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = cleanText(header);
    p.append(strong);
    textCell.push(p);
  }
  // img-card shape: body text sits next to the header, outside .card-content
  // (.col-sm-12 > p.card-header + p + .card-content > img + .card-btn > a.btn).
  const headerSiblingText = [];
  if (header && header.parentElement && (!content || !content.contains(header))) {
    [...header.parentElement.children].forEach((sib) => {
      if (sib === header || !/^(P|UL|OL|H[1-6])$/.test(sib.tagName)) return;
      if (sib.matches('.card-content, .card-btn') || sib.querySelector('.card-btn, a.btn')) return;
      if (!cleanText(sib)) return;
      headerSiblingText.push(sib);
      textCell.push(sib);
    });
  }
  if (content) {
    [...content.children].forEach((child) => {
      if (child === header || child.classList.contains('card-header')) return;
      if (child.tagName === 'IMG') {
        const img = document.createElement('img');
        img.src = child.getAttribute('src');
        img.alt = child.getAttribute('alt') || '';
        textCell.push(img);
        return;
      }
      if (child.tagName === 'A' && child.classList.contains('btn')) return; // handled as CTA
      if (!cleanText(child) && !child.querySelector('img')) return;
      textCell.push(child);
    });
  }

  // ---- CTA cell ---- (every link outside the text column, plus .btn links anywhere)
  const ctaCell = [];
  const ctaLinks = [...root.querySelectorAll('a[href]')]
    .filter((a) => !content || !content.contains(a) || a.classList.contains('btn'))
    .filter((a) => !headerSiblingText.some((el) => el.contains(a))); // inline text links stay in text
  ctaLinks.forEach((a) => {
    const label = cleanText(a.querySelector('.card-pdf-text') || a);
    if (!label) return;
    const href = a.getAttribute('href');
    const link = document.createElement('a');
    const p = document.createElement('p');
    if (a.closest('.pdf-link') || isDocumentHref(href)) {
      // plain link -> link list (Download card)
      link.href = href;
      link.textContent = label;
      p.append(link);
    } else {
      // button -> bold link -> primary pill CTA
      link.href = href;
      link.textContent = label;
      const strong = document.createElement('strong');
      strong.append(link);
      p.append(strong);
    }
    ctaCell.push(p);
  });

  // Empty-block guard.
  if (!textCell.length && !ctaCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[textCell.length ? textCell : '', ctaCell.length ? ctaCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-callout', cells });
  element.replaceWith(block);
}
