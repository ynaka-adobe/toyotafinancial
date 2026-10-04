/* eslint-disable */
/* global WebImporter */

/**
 * Parser for quiz-buy-lease. Base: quiz (custom block, no library convention).
 * Source: https://www.toyotafinancial.com/us/en/financing_options/buy_or_lease.html
 * Selector (page-templates.json): #main-content .screenFade > .generalcolumn .buyleasequizcard
 * Generated: 2026-10-04
 *
 * Content model (blocks/quiz-buy-lease/README.md; first cell = row type):
 *   Image row    (1 cell) : [img]                       quiz card photo (Scene7, absolute URL)
 *   Question rows(4 cells): [qN] | [question text] | [ul > li option label] | [weights or '']
 *   Result rows  (3 cells): [Finance|Lease] | [condition or ''] | [h2, h3, paragraphs]
 *   Products row (2 cells): [Products] | [h3 heading]
 *   Product rows (4 cells): [Product] | [condition] | [img] | [p>strong title, p description…, p>a Learn More]
 *
 * Source structure (verified in cached source.html):
 *   .buyleasequizcard .quiz-card > .card-content img
 *                                > .quiz-section .holder#q1..#q7 > .question p + .answer (input + label span)
 *                                > .buy-quiz-footer Back/Next (dropped)
 *   Results panel lives OUTSIDE the instance element (read via element.ownerDocument):
 *   .one-column-component .secondary-section
 *       > .buyleaseanswer > div#fin1..#fin4, #lease1..#lease5 (h2, h3, p…; fin3 has a bare text node)
 *       > .card-component "Ready to apply?" callout (duplicate of the primary section; dropped)
 *       > .buyleasedisclaimer > h3 + empty #card-carousel shell (dropped)
 *                             + .promo-item > .promo-container > .caption-body (p.promo-header, hr, p#vsa1…)
 *                                                              + a Learn More ; img (sibling of .promo-container)
 *   Weights / result + product conditions come from the source JS (page-structure.json quizBehaviour);
 *   they are not in the DOM, so they are encoded here.
 *   After building the block, the results panel is removed so it does not import as default content.
 */

const WEIGHTS = {
  q1: '3, 1, -3',
  q2: '3, 1, -3',
  q3: '3, 1, -3',
  q4: '3, -3, -4',
  q5: '1, 0, -3',
  q6: '',
  q7: '',
};

// Analysis order: first match within an outcome wins, default (empty condition) last.
const RESULTS = [
  ['fin2', 'Finance', 'q1 = 1'],
  ['fin3', 'Finance', 'q2 = 1'],
  ['fin4', 'Finance', 'q3 = 1'],
  ['fin1', 'Finance', ''],
  ['lease2', 'Lease', 'q1 = 3'],
  ['lease3', 'Lease', 'q2 = 3'],
  ['lease4', 'Lease', 'q3 = 3'],
  ['lease5', 'Lease', 'q5 = 3'],
  ['lease1', 'Lease', ''],
];

// Variant text id -> condition. Promo items without a variant id use 'Always'.
const PRODUCT_VARIANTS = {
  vsa1: 'Finance, q6 = 1 or 2',
  vsa2: 'Finance, q6 = 3',
  ppm1: 'q7 = 1',
  ppm2: 'q7 = 2',
  ppm3: 'q7 = 3',
};

function cleanText(el) {
  return (el ? el.textContent || '' : '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function absUrl(value, document) {
  if (!value) return '';
  try {
    return new URL(value, document.baseURI || (document.location && document.location.href)).href;
  } catch (e) {
    return value;
  }
}

function makeImg(src, document) {
  if (!src) return '';
  const img = document.createElement('img');
  img.src = absUrl(src.getAttribute('src'), document);
  img.alt = src.getAttribute('alt') || '';
  return img;
}

/** Copy a result div's content: headings, paragraphs; bare text runs are wrapped in <p>. */
function buildResultContent(div, document) {
  const out = [];
  let loose = null;
  const flushLoose = () => {
    if (loose && cleanText(loose)) out.push(loose);
    loose = null;
  };
  [...div.childNodes].forEach((node) => {
    if (node.nodeType === 1 && /^(H[1-6]|P|UL|OL|DIV)$/.test(node.tagName)) {
      flushLoose();
      if (!cleanText(node)) return;
      if (/^H[1-6]$/.test(node.tagName)) {
        const h = document.createElement(node.tagName.toLowerCase());
        h.innerHTML = node.innerHTML;
        out.push(h);
      } else if (node.tagName === 'DIV') {
        const p = document.createElement('p');
        p.innerHTML = node.innerHTML;
        out.push(p);
      } else {
        const clone = node.cloneNode(true);
        clone.removeAttribute('class');
        clone.removeAttribute('id');
        out.push(clone);
      }
    } else if (node.nodeType === 3 || node.nodeType === 1) {
      // bare text / inline element (fin3's second paragraph)
      if (node.nodeType === 3 && !node.textContent.trim() && !loose) return;
      if (!loose) loose = document.createElement('p');
      loose.append(node.cloneNode(true));
    }
  });
  flushLoose();
  return out;
}

/** Split a paragraph at <br> into separate <p> elements. */
function splitAtBr(p, document) {
  const paras = [];
  let cur = document.createElement('p');
  [...p.childNodes].forEach((node) => {
    if (node.nodeType === 1 && node.tagName === 'BR') {
      if (cleanText(cur)) paras.push(cur);
      cur = document.createElement('p');
    } else {
      cur.append(node.cloneNode(true));
    }
  });
  if (cleanText(cur)) paras.push(cur);
  paras.forEach((para) => {
    // trim leading/trailing whitespace text left over from the split
    const first = para.firstChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
    const last = para.lastChild;
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
  });
  return paras;
}

function buildProductContent(title, paras, link, document) {
  const content = [];
  const tp = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = title;
  tp.append(strong);
  content.push(tp);
  paras.forEach((p) => content.push(p));
  if (link) {
    const lp = document.createElement('p');
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.textContent = cleanText(link) || 'Learn More';
    lp.append(a);
    content.push(lp);
  }
  return content;
}

export default function parse(element, { document }) {
  const doc = element.ownerDocument || document;
  const cells = [];

  const holders = [...element.querySelectorAll('.quiz-section .holder[id], .holder[id^="q"]')]
    .filter((h, i, arr) => arr.indexOf(h) === i && /^q\d+$/.test(h.id));

  // Empty-block guard.
  if (!holders.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // ---- Image row ----
  const photo = element.querySelector('.card-content img, .quiz-card > div:not(.quiz-section) img');
  if (photo) cells.push([makeImg(photo, document)]);

  // ---- Question rows ----
  holders.forEach((holder) => {
    const id = holder.id;
    const question = cleanText(holder.querySelector('.question p, .question'));
    const ul = document.createElement('ul');
    holder.querySelectorAll('.answer label').forEach((label) => {
      const text = cleanText(label);
      if (!text) return;
      const li = document.createElement('li');
      li.textContent = text;
      ul.append(li);
    });
    cells.push([id, question, ul, WEIGHTS[id] !== undefined ? WEIGHTS[id] : '']);
  });

  // ---- Results panel (outside the instance element) ----
  const answer = doc.querySelector('.buyleaseanswer');
  const panel = (answer && (answer.closest('.one-column-component') || answer.closest('.secondary-section')))
    || null;
  const scope = panel || doc;

  // ---- Result rows ----
  RESULTS.forEach(([id, outcome, condition]) => {
    const div = scope.querySelector(`#${id}`);
    if (!div) return;
    const content = buildResultContent(div, document);
    if (content.length) cells.push([outcome, condition, content]);
  });

  // ---- Products heading + product rows ----
  const disclaimer = scope.querySelector('.buyleasedisclaimer');
  if (disclaimer) {
    const heading = disclaimer.querySelector(':scope > h3, :scope > h2, :scope > h4');
    if (heading && cleanText(heading)) {
      const h3 = document.createElement('h3');
      h3.textContent = cleanText(heading);
      cells.push(['Products', h3]);
    }

    disclaimer.querySelectorAll('.promo-item').forEach((item) => {
      const title = cleanText(item.querySelector('.promo-header'));
      const link = item.querySelector('.promo-container a[href], a[href]');
      const imgEl = item.querySelector(':scope > img, img');
      const body = item.querySelector('.caption-body') || item;
      const textParas = [...body.querySelectorAll('p')]
        .filter((p) => !p.classList.contains('promo-header') && cleanText(p));

      const variants = textParas.filter((p) => p.id && PRODUCT_VARIANTS[p.id] !== undefined);
      if (variants.length) {
        // one Product row per text variant, each with its own image + link copy
        variants.forEach((p) => {
          const content = buildProductContent(title, splitAtBr(p, document), link, document);
          cells.push(['Product', PRODUCT_VARIANTS[p.id], makeImg(imgEl, document), content]);
        });
      } else {
        const paras = [];
        textParas.forEach((p) => paras.push(...splitAtBr(p, document)));
        const content = buildProductContent(title, paras, link, document);
        cells.push(['Product', 'Always', makeImg(imgEl, document), content]);
      }
    });
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'quiz-buy-lease', cells });
  element.replaceWith(block);

  // Remove the results panel (incl. its duplicate "Ready to apply?" callout and carousel shell)
  // so it does not import as default content.
  if (panel && panel.parentNode) panel.remove();
}
