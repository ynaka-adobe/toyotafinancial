/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-card. Base: columns.
 * Source: https://www.toyotafinancial.com/us/en/about_us/company_overview.html
 *         https://www.toyotafinancial.com/us/en/TFS_ThoughtFuel_Blog.html (blog index cards)
 * Selectors (page-templates.json):
 *   about-us:     #main-content .screenFade > .card-component.parbase
 *   content-page: #main-content .screenFade > .card-component.parbase:has(.card.no-pd)
 * Generated: 2026-10-03, extended 2026-10-04 (blog index cards)
 *
 * Content model (blocks/columns-card/README.md): each row = one card, 2 cells [picture | text].
 *
 * 1) About-us community card (single card) — UNCHANGED behaviour (parseSingleCard):
 *   .card.no-pd > .col-sm-6 (image half: .row > img[alt="civic 50"], Scene7 URL live)
 *               > .col-sm-6 (text half: .row > .caption > p + empty a.js-external-tp)
 *   The statistics are baked into the image, so the image alt is kept as-is.
 *   The empty a.js-external-tp (no text, no image) is dropped.
 *
 * 2) Blog index cards (39 sibling .card-component.parbase, same #community-card markup):
 *   .card.no-pd > .col-sm-6 > .row > img (Scene7)
 *               > .col-sm-6 > .row > .caption > p.caption-header + p + a.btn "Learn More"
 *   Detected by a .caption-header or a non-empty .btn link in the caption (the about-us card
 *   has neither). The FIRST matched blog card collects itself and every consecutive blog-card
 *   sibling into ONE block (39 rows) and removes the others; later calls on the detached
 *   siblings are no-ops (the import script skips elements without a parent).
 *   Row: [img] | [h3 title, p description, p > strong > a CTA]. Hrefs kept as found (the links
 *   transformer rewrites absolute site links later).
 */
function cleanText(el) {
  return (el.textContent || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function isBlogCard(el) {
  if (!el || !el.matches || !el.matches('.card-component.parbase, .card-component')) return false;
  const caption = el.querySelector('.card.no-pd .caption, .card .caption');
  if (!caption) return false;
  if (caption.querySelector('.caption-header')) return true;
  return [...caption.querySelectorAll('a.btn[href]')].some((a) => cleanText(a));
}

function buildBlogRow(cardEl, document) {
  const card = cardEl.querySelector('.card') || cardEl;
  const srcImg = card.querySelector('img');
  const caption = card.querySelector('.caption');

  const imageCell = [];
  if (srcImg) {
    const img = document.createElement('img');
    img.setAttribute('src', srcImg.getAttribute('src'));
    img.setAttribute('alt', srcImg.getAttribute('alt') || '');
    imageCell.push(img);
  }

  const textCell = [];
  if (caption) {
    [...caption.children].forEach((child) => {
      if (child.matches('.caption-header')) {
        if (!cleanText(child)) return;
        const h3 = document.createElement('h3');
        h3.textContent = cleanText(child);
        textCell.push(h3);
        return;
      }
      if (child.tagName === 'A') {
        if (!cleanText(child) || !child.getAttribute('href')) return;
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        const a = document.createElement('a');
        a.setAttribute('href', child.getAttribute('href'));
        a.textContent = cleanText(child);
        strong.append(a);
        p.append(strong);
        textCell.push(p);
        return;
      }
      if (!cleanText(child) && !child.querySelector('img')) return;
      if (child.tagName === 'P') {
        const p = document.createElement('p');
        [...child.childNodes].forEach((n) => p.append(n.cloneNode(true)));
        // trim the trailing space the CMS leaves in some descriptions
        if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.textContent = p.lastChild.textContent.replace(/\s+$/, '');
        textCell.push(p);
        return;
      }
      textCell.push(child);
    });
  }

  if (!imageCell.length && !textCell.length) return null;
  return [imageCell.length ? imageCell : '', textCell.length ? textCell : ''];
}

function parseBlogCards(element, document) {
  const siblings = [element];
  let next = element.nextElementSibling;
  while (isBlogCard(next)) {
    siblings.push(next);
    next = next.nextElementSibling;
  }

  const cells = siblings.map((s) => buildBlogRow(s, document)).filter(Boolean);
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  siblings.slice(1).forEach((s) => s.remove());
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-card', cells });
  element.replaceWith(block);
}

// About-us community card — original implementation, kept byte-for-byte in behaviour.
function parseSingleCard(element, document) {
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

export default function parse(element, { document }) {
  if (!element.parentNode) return; // blog card already merged into the block by the first sibling
  if (isBlogCard(element)) {
    parseBlogCards(element, document);
    return;
  }
  parseSingleCard(element, document);
}
