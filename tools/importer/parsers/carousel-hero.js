/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-hero. Base: carousel.
 * Source: https://www.toyotafinancial.com
 * Selectors (page-templates.json): #carousel_image, #fold-1 .carousel-image.parbase
 * Generated: 2026-08-06
 *
 * Container block. Each `.item` slide becomes one row with 2 cells matching the
 * carousel-hero-item model:
 *   - Cell 1 (field:media_image): the slide image. media_imageAlt is collapsed
 *     into the <img alt> attribute per hinting rules.
 *   - Cell 2 (field:content_text): title (heading), subtext, CTA, disclaimer.
 *
 * Live-DOM notes verified on the source page:
 *   - Each slide holds a <picture> with a desktop <source srcset> and a mobile
 *     <img src>. We prefer the desktop srcset for the imported image, falling
 *     back to the mobile src.
 *   - Image-only slides (no live-text) wrap the <picture> in an <a href>; we
 *     preserve that link by wrapping the extracted <img> in the anchor.
 *   - Slide images are /content/dam CDN JPG/PNGs (NOT Scene7), so the DM
 *     transformer leaves them alone — a plain <img> is the correct output.
 */
export default function parse(element, { document }) {
  const items = element.querySelectorAll(':scope .carousel-inner > .item, :scope > .carousel-inner > .item, .carousel-inner > .item');

  // Empty-block guard: the instances[] union has two selectors — `#carousel_image`
  // and its parent wrapper `#fold-1 .carousel-image.parbase`. Both match on this
  // page (the wrapper contains #carousel_image). Whichever selector the importer
  // processes second finds no slides left after the first replaced the element, so
  // bail by unwrapping rather than emitting a stray empty carousel block.
  if (!items.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  items.forEach((item) => {
    // ---- Cell 1: image (field:media_image) ----
    const picture = item.querySelector('picture');
    const source = picture ? picture.querySelector('source[srcset]') : null;
    const srcImg = picture ? picture.querySelector('img') : item.querySelector('img');
    const desktopUrl = source ? source.getAttribute('srcset') : '';
    const mobileUrl = srcImg ? srcImg.getAttribute('src') : '';
    const imageUrl = desktopUrl || mobileUrl;
    const alt = (srcImg && srcImg.getAttribute('alt'))
      || (source && source.getAttribute('alt'))
      || '';

    const imageFrag = document.createDocumentFragment();
    if (imageUrl) {
      const img = document.createElement('img');
      img.setAttribute('src', imageUrl);
      img.setAttribute('alt', alt);

      // Image-only slides link the whole picture; preserve that navigation link.
      const slideAnchor = item.querySelector(':scope > a[href]');
      if (slideAnchor && slideAnchor.getAttribute('href')) {
        const a = document.createElement('a');
        a.setAttribute('href', slideAnchor.getAttribute('href'));
        a.appendChild(img);
        imageFrag.appendChild(a);
      } else {
        imageFrag.appendChild(img);
      }
    }

    // ---- Cell 2: content (field:content_text) ----
    const details = item.querySelector('.live-text-details');
    const titleEl = details ? details.querySelector('.live-text') : null;
    const subtextEl = details ? details.querySelector('.live-subtext') : null;
    const ctaEl = details ? details.querySelector('.live-button a[href], .live-buttonc a[href]') : null;
    const disclaimerEl = details ? details.querySelector('.live-disclaimertext') : null;

    const titleText = titleEl ? titleEl.textContent.trim() : '';
    const subtext = subtextEl ? subtextEl.textContent.trim() : '';
    const ctaText = ctaEl ? ctaEl.textContent.trim() : '';
    const disclaimer = disclaimerEl ? disclaimerEl.textContent.trim() : '';

    const contentFrag = document.createDocumentFragment();
    const hasContent = titleText || subtext || ctaText || disclaimer;
    if (hasContent) {
      if (titleText) {
        const h = document.createElement('h2');
        h.textContent = titleText;
        contentFrag.appendChild(h);
      }
      if (subtext) {
        const p = document.createElement('p');
        p.textContent = subtext;
        contentFrag.appendChild(p);
      }
      if (ctaText) {
        const a = document.createElement('a');
        a.setAttribute('href', ctaEl.getAttribute('href'));
        a.textContent = ctaText;
        const p = document.createElement('p');
        p.appendChild(a);
        contentFrag.appendChild(p);
      }
      if (disclaimer) {
        const p = document.createElement('p');
        p.textContent = disclaimer;
        contentFrag.appendChild(p);
      }
    }

    // Keep 2 columns per row even when the content cell is empty.
    cells.push([imageFrag, hasContent ? contentFrag : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
