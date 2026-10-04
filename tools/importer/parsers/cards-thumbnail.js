/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-thumbnail. Base: cards.
 * Source: https://www.toyotafinancial.com/us/en/planning_tools/get_started.html
 * Selector (page-templates.json): #main-content .screenFade .generalcolumn.parbase:has(.thumbnail-card)
 * Generated: 2026-10-04
 *
 * Content model (blocks/cards-thumbnail/README.md + cards-thumbnail.js):
 *   One block per .generalcolumn instance. N rows (one per card):
 *     image card:     [img (absolute Scene7 src + alt)] | [h3 title, p text, p > a CTA]
 *     text-only card: [h3 title, p text, p > a CTA]   (single cell; block renders a centred text card)
 *
 * Source structure (verified in cached source.html, 5 matches on get_started):
 *   .generalcolumn > div > .row.equal-card > .col-sm-6 (x2; the 2nd may be empty)
 *     > (.promo-box | .card-component).parbase ... .thumbnail-card
 *         > .thumbnail > img.img-responsive (Scene7)     [absent on card-component cards]
 *         > .caption > .caption-body (h2.font-30 + p...) + a (CTA; a.btn on card-component)
 * Iteration key: .thumbnail-card (block-level div; no nested interactive elements, digest has no warnings).
 * Source card titles are h2; emitted as h3 (the page's own section headings stay default content).
 */
function cleanText(el) {
  return (el.textContent || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

// Copy a paragraph keeping inline markup (and link hrefs) but dropping attributes and trailing <br>s.
function cleanParagraph(p, document) {
  const np = document.createElement('p');
  [...p.childNodes].forEach((n) => np.append(n.cloneNode(true)));
  np.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (el.tagName === 'A' && attr.name === 'href') return;
      el.removeAttribute(attr.name);
    });
  });
  let last = np.lastChild;
  while (last && ((last.nodeType === 3 && !last.textContent.replace(/ /g, ' ').trim())
    || (last.nodeType === 1 && last.tagName === 'BR'))) {
    np.removeChild(last);
    last = np.lastChild;
  }
  return np;
}

function absoluteUrl(src, document) {
  if (!src) return src;
  try {
    const base = (document.location && document.location.href) || 'https://www.toyotafinancial.com/';
    return new URL(src, base).href;
  } catch (e) {
    return src;
  }
}

export default function parse(element, { document }) {
  const cards = [...element.querySelectorAll('.thumbnail-card')];
  const cells = [];

  cards.forEach((card) => {
    // Image cell
    const srcImg = card.querySelector('.thumbnail img, img.img-responsive');
    let img = null;
    if (srcImg && srcImg.getAttribute('src')) {
      img = document.createElement('img');
      img.src = absoluteUrl(srcImg.getAttribute('src'), document);
      img.alt = (srcImg.getAttribute('alt') || '').trim();
    }

    // Text cell
    const textCell = [];
    const caption = card.querySelector('.caption') || card;
    const body = caption.querySelector('.caption-body');
    const bodyNodes = body ? [...body.children] : [...caption.children].filter((c) => c.tagName !== 'A');
    bodyNodes.forEach((child) => {
      if (!cleanText(child)) return;
      if (/^H[1-6]$/.test(child.tagName)) {
        const h3 = document.createElement('h3');
        h3.textContent = cleanText(child);
        textCell.push(h3);
      } else if (child.tagName === 'P') {
        textCell.push(cleanParagraph(child, document));
      } else if (child.tagName !== 'A') {
        textCell.push(child);
      }
    });

    // CTA links: anchors in the caption outside the caption-body
    [...caption.querySelectorAll('a[href]')]
      .filter((a) => !body || !body.contains(a))
      .forEach((a) => {
        const label = cleanText(a);
        if (!label) return;
        const p = document.createElement('p');
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        link.textContent = label;
        p.append(link);
        textCell.push(p);
      });

    if (!img && !textCell.length) return;
    if (img) cells.push([img, textCell.length ? textCell : '']);
    else cells.push([textCell]);
  });

  // Empty-block guard
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-thumbnail', cells });
  element.replaceWith(block);
}
