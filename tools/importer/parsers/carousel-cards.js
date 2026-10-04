/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-cards. Base: carousel.
 * Source: https://www.toyotafinancial.com/us/en/vehicle_protection_plan/which_plan_is_right_for_me.html
 * Selector (page-templates.json): #main-content .screenFade .secondary-section > .viewplans
 * Generated: 2026-10-04
 *
 * Content model (blocks/carousel-cards/README.md "Authoring model (exact)"):
 *   Row 1 (optional, 1 cell): filter label ("View Plans by...")
 *   Card rows (3 cells): [img (+ absolute MP4 link from data-src)] | [h3, p/ul, p > a More Details]
 *                        | [categories, comma-separated]
 *
 * Source structure (verified in cached source.html):
 *   .dropdown-card > p.card-header (filter label) + .materialized-dropdown li.option (filter values)
 *   #vp_carousel .carousel-inner .item .populate-carousel   <- JS-built copies of the CURRENT filter
 *   .populate-carousel.hide (outside .carousel-inner)       <- the full card pool (authoritative)
 *     classes = category keys: New_Vehicles, Toyota_Certified_Used_Vehicles, Leased_Vehicles
 *     > .thumbnail-card > .thumbnail > (a.video-modal-img[data-src=mp4] >) img (Scene7)
 *                       > .caption > .caption-body (h2 + p | p + ul) + a "More Details"
 * One row per pool card (3 cover cards + 5 product cards). A card's categories are the dropdown
 * option labels whose underscore form is one of its classes (EWU -> "Leased Vehicles" only).
 */
const ORIGIN = 'https://www.toyotafinancial.com';

function cleanText(el) {
  return (el.textContent || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function absolute(href) {
  try { return new URL(href, ORIGIN).href; } catch (e) { return href; }
}

function cleanNode(node) {
  const clone = node.cloneNode(true);
  [clone, ...clone.querySelectorAll('*')].forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (el.tagName === 'A' && attr.name === 'href') return;
      el.removeAttribute(attr.name);
    });
  });
  // trailing <br> inside list items / paragraphs
  clone.querySelectorAll('br').forEach((br) => {
    let n = br.nextSibling;
    while (n && n.nodeType === 3 && !n.textContent.trim()) n = n.nextSibling;
    if (!n) br.remove();
  });
  return clone;
}

export default function parse(element, { document }) {
  // Filter label + option labels.
  const filterLabel = element.querySelector('.dropdown-card .card-header, .dropdown-card p');
  const options = [...element.querySelectorAll('.materialized-dropdown li.option, .materialized-dropdown option')]
    .map(cleanText).filter(Boolean);

  // Card pool: hidden originals outside the carousel; fallback: the rendered carousel items.
  const all = [...element.querySelectorAll('.populate-carousel')];
  let cards = all.filter((c) => !c.closest('.carousel-inner'));
  if (!cards.length) cards = all;

  const cells = [];
  if (filterLabel && cleanText(filterLabel)) cells.push([cleanText(filterLabel)]);

  cards.forEach((card) => {
    // ---- image cell ----
    const imageCell = [];
    const srcImg = card.querySelector('.thumbnail img, img');
    if (srcImg) {
      const img = document.createElement('img');
      img.src = absolute(srcImg.getAttribute('src'));
      img.alt = srcImg.getAttribute('alt') || '';
      imageCell.push(img);
    }
    const videoEl = card.querySelector('[data-src]');
    const videoSrc = videoEl && videoEl.getAttribute('data-src');
    if (videoSrc && /\.(mp4|webm)(\?|#|$)/i.test(videoSrc)) {
      const href = absolute(videoSrc);
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = href;
      p.append(a);
      imageCell.push(p);
    }

    // ---- body cell ----
    const bodyCell = [];
    const captionBody = card.querySelector('.caption-body') || card.querySelector('.caption');
    if (captionBody) {
      [...captionBody.children].forEach((child) => {
        if (!cleanText(child)) return;
        if (/^H[1-6]$/.test(child.tagName)) {
          const h3 = document.createElement('h3');
          h3.textContent = cleanText(child);
          bodyCell.push(h3);
          return;
        }
        if (child.tagName === 'A') return; // links handled below
        bodyCell.push(cleanNode(child));
      });
    }
    const caption = card.querySelector('.caption');
    if (caption) {
      [...caption.querySelectorAll('a[href]')]
        .filter((a) => !captionBody || captionBody === caption || !captionBody.contains(a))
        .forEach((a) => {
          if (!cleanText(a)) return;
          const p = document.createElement('p');
          const link = document.createElement('a');
          link.href = a.getAttribute('href');
          link.textContent = cleanText(a);
          p.append(link);
          bodyCell.push(p);
        });
    }

    // ---- categories cell ----
    const categories = options.filter((label) => card.classList.contains(label.replace(/\s+/g, '_')));

    if (!imageCell.length && !bodyCell.length) return;
    cells.push([imageCell.length ? imageCell : '', bodyCell.length ? bodyCell : '', categories.join(', ')]);
  });

  // Empty-block guard.
  if (!cards.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-cards', cells });
  element.replaceWith(block);
}
