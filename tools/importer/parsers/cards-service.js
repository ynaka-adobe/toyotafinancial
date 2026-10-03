/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-service. Base: cards.
 * Source: https://www.toyotafinancial.com
 * Selector (page-templates.json): #fold-2 > div.container > div.row.equal-height-container
 * Generated: 2026-08-06
 *
 * Container block. Each `.promo-container` promo tile becomes one row with 2
 * cells matching the card-service model (image, text):
 *   - Cell 1 (field:image): the tile image. imageAlt collapses into <img alt>.
 *   - Cell 2 (field:text): title (heading) + description. The whole tile is
 *     clickable on the source (role="link" data-link="…"); we preserve that
 *     navigation by rendering the title as a linked heading.
 *
 * Live-DOM notes verified on the source page:
 *   - Tile image is a Scene7 <img src="https://toyotafinancial.scene7.com/...">.
 *     We emit it as a plain <img>; the afterTransform DM/Scene7 transformer
 *     rewrites it to a carrier anchor later. No DM handling belongs here.
 *   - Image sits AFTER the text (.promo-content) in DOM order; the cards model
 *     still expects the image in cell 1, so we place it first regardless.
 *   - The clickable target lives in data-link (an AEM /content path).
 */
export default function parse(element, { document }) {
  const tiles = element.querySelectorAll(':scope .promo-container, .promo-container');

  const cells = [];

  tiles.forEach((tile) => {
    // ---- Cell 1: image (field:image) ----
    const img = tile.querySelector('img.img-responsive, img');
    const imageFrag = document.createDocumentFragment();
    if (img) {
      imageFrag.appendChild(img);
    }

    // ---- Cell 2: text (field:text) ----
    const header = tile.querySelector('.promo-header');
    const descEl = tile.querySelector('.promo-content .fadeInUp p, .promo-content > div p, .promo-content p:not(.promo-header)');
    const href = tile.getAttribute('data-link');

    const textFrag = document.createDocumentFragment();

    if (header) {
      const h = document.createElement('h3');
      const titleText = header.textContent.trim();
      if (href) {
        const link = document.createElement('a');
        link.setAttribute('href', href);
        link.textContent = titleText;
        h.appendChild(link);
      } else {
        h.textContent = titleText;
      }
      textFrag.appendChild(h);
    }

    if (descEl && descEl.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = descEl.textContent.trim();
      textFrag.appendChild(p);
    }

    cells.push([imageFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-service', cells });
  element.replaceWith(block);
}
