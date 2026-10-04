/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-video. Base: cards (custom; video tiles).
 * Source: https://www.toyotafinancial.com/us/en/end_of_lease_options/lease-end-videos.html
 * Selector (page-templates.json):
 *   main > .container-fluid.px-0 .lease-end-right-container > .general-column:has(.video-promo):not(.general-column + .general-column)
 * Generated: 2026-10-04
 *
 * Content model (blocks/cards-video/README.md; Cards convention):
 *   N rows, 2 cells: [poster img] | [h3 title, p description, p > a MP4 URL (absolute)]
 *
 * Source structure (verified in cached source.html):
 *   The selector matches only the FIRST .general-column of a run of sibling .general-column rows
 *   (4 rows on lease-end-videos; 3 tiles in the first 2, the rest are empty .col-sm-6 placeholders).
 *   Tiles are collected from the matched row AND its following .general-column siblings, which are
 *   then removed.
 *   .general-column > .row > .col-sm-6 > .video-promo > .promo-item
 *     > .promo-container.video-thumbnail[data-src="/content/dam/…/*.mp4"]
 *       > .promo-content > p.promo-header (title), hr.promo-hr (decorative, dropped),
 *           div.fadeInUp > p (description; empty p dropped)
 *       > img.img-responsive (Scene7 poster)
 */
const ORIGIN = 'https://www.toyotafinancial.com';

function cleanText(el) {
  return ((el && el.textContent) || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function absolute(url) {
  if (!url) return '';
  try {
    return new URL(url.trim(), ORIGIN).href;
  } catch (e) {
    return url.trim();
  }
}

export default function parse(element, { document }) {
  // The matched row plus the contiguous run of following .general-column siblings.
  const rows = [element];
  let next = element.nextElementSibling;
  while (next && next.classList.contains('general-column')) {
    rows.push(next);
    next = next.nextElementSibling;
  }

  // Iterate .video-promo wrappers; empty .col-sm-6 placeholders hold none and are skipped.
  const tiles = rows.flatMap((row) => [...row.querySelectorAll('.video-promo')]);
  const cells = [];

  tiles.forEach((tile) => {
    const thumb = tile.querySelector('.video-thumbnail[data-src], [data-src$=".mp4"]');
    const titleEl = tile.querySelector('p.promo-header, .promo-header');
    const srcImg = tile.querySelector('img.img-responsive') || tile.querySelector('img');
    const descPs = [...new Set(tile.querySelectorAll('div.fadeInUp p, .promo-content > p:not(.promo-header)'))]
      .filter((p) => cleanText(p));

    if (!titleEl && !srcImg && !thumb) return; // empty placeholder

    // Poster cell
    let imageCell = '';
    if (srcImg && srcImg.getAttribute('src')) {
      const img = document.createElement('img');
      img.setAttribute('src', absolute(srcImg.getAttribute('src')));
      img.setAttribute('alt', srcImg.getAttribute('alt') || cleanText(titleEl));
      imageCell = img;
    }

    // Text cell
    const textCell = [];
    if (cleanText(titleEl)) {
      const h3 = document.createElement('h3');
      h3.textContent = cleanText(titleEl);
      textCell.push(h3);
    }
    descPs.forEach((p) => {
      const np = document.createElement('p');
      np.append(...p.childNodes);
      textCell.push(np);
    });
    const mp4 = thumb ? absolute(thumb.getAttribute('data-src')) : '';
    if (mp4) {
      const a = document.createElement('a');
      a.setAttribute('href', mp4);
      a.textContent = mp4;
      const p = document.createElement('p');
      p.append(a);
      textCell.push(p);
    }

    cells.push([imageCell, textCell.length ? textCell : '']);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // The tiles of the sibling rows are now in this block: drop those rows.
  rows.slice(1).forEach((row) => row.remove());

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-video', cells });
  element.replaceWith(block);
}
