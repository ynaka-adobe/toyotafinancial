/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-circle. Base: accordion.
 * Source: https://www.toyotafinancial.com/us/en/end_of_lease_options/mileage.html
 *         (also faqs.html: 3 groups, wear_and_use.html: 4 groups, return_your_vehicle.html, early_lease_return.html)
 * Selector (page-templates.json):
 *   main > .container-fluid.px-0 .lease-end-right-container > .accordion.parbase > .row > div:has(.accordion-card)
 * Generated: 2026-10-04
 *
 * Content model (blocks/accordion-circle/README.md; Accordion convention):
 *   N rows, 2 cells: [title text] | [body rich text: p, ul/ol (nested), sup, em, links, p > strong > a buttons]
 *   One block per source group; the group h4 (.row > h4) is a sibling of the matched element and
 *   stays outside the block as default content.
 *
 * Source structure (verified in cached source.html, 3 instances):
 *   div#accordionaccordion[_N] > div > .accordion-card (xN)
 *     > .card-header > h5 > button > div (title text) + span.icon-circle-plus (icon, dropped)
 *     > .collapse > .card-body (rich content: p, ul, ol, div > b, p.disclaimer-text,
 *         div.w-100 > a.primary-btn.button-link (button), <p>&nbsp;</p> spacers, <a> without href around <sup>)
 */
function cleanText(el) {
  return (el.textContent || '').replace(/[ ​]/g, ' ').replace(/\s+/g, ' ').trim();
}

const BTN = 'a.primary-btn, a.button-link';
const BLOCK_CHILD = ':scope > p, :scope > ul, :scope > ol, :scope > div, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6';

function buildButton(a, document) {
  const link = document.createElement('a');
  link.setAttribute('href', a.getAttribute('href') || '');
  link.textContent = cleanText(a);
  const strong = document.createElement('strong');
  strong.append(link);
  const p = document.createElement('p');
  p.append(strong);
  return p;
}

function hasContent(el) {
  return !!cleanText(el) || !!el.querySelector('img, picture, video, iframe');
}

// Normalise the children of a body container into a flat list of block-level nodes.
function collectBody(container, document, out) {
  [...container.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      const t = node.textContent.replace(/\s+/g, ' ').trim();
      if (t) {
        const p = document.createElement('p');
        p.textContent = t;
        out.push(p);
      }
      return;
    }
    if (node.nodeType !== 1) return;
    if (!hasContent(node)) return; // <p>&nbsp;</p> spacers, empty wrappers

    if (node.tagName === 'A' && node.matches(BTN)) {
      out.push(buildButton(node, document));
      return;
    }

    if (node.tagName === 'DIV') {
      // Button wrapper (div.w-100 > a.primary-btn.button-link) -> p > strong > a
      const btns = [...node.querySelectorAll(BTN)];
      if (btns.length && cleanText(node) === btns.map(cleanText).join(' ')) {
        btns.forEach((b) => out.push(buildButton(b, document)));
        return;
      }
      if (node.querySelector(BLOCK_CHILD)) {
        collectBody(node, document, out); // flatten wrapper divs
      } else {
        const p = document.createElement('p'); // inline-only div (e.g. <div><b>…</b></div>) -> p
        p.append(...node.childNodes);
        out.push(p);
      }
      return;
    }
    out.push(node);
  });
}

export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('.accordion-card')];
  const cells = [];

  items.forEach((item) => {
    const titleEl = item.querySelector('.card-header button > div')
      || item.querySelector('.card-header button, .card-header h5, .card-header');
    const body = item.querySelector('.card-body') || item.querySelector('.collapse');
    if (!titleEl || !cleanText(titleEl)) return;

    if (body) {
      // Anchors without href (e.g. <a><sup>1</sup></a>) carry no link: unwrap them.
      body.querySelectorAll('a:not([href])').forEach((a) => a.replaceWith(...a.childNodes));
    }

    const bodyCell = [];
    if (body) collectBody(body, document, bodyCell);
    cells.push([cleanText(titleEl), bodyCell.length ? bodyCell : '']);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-circle', cells });
  element.replaceWith(block);
}
