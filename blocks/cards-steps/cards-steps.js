import { moveInstrumentation } from '../../scripts/scripts.js';

/*
 * cards-steps: numbered option cards (TFS end-of-lease "Your Options" .card-button list).
 * Each row is one step, 1 cell: [h3 title, p text, p > strong > a CTA, p disclaimer].
 * The circled numbers come from a CSS counter on the <ol>, so authors never type them.
 * Paragraphs that follow the CTA are treated as the step's small-print disclaimer.
 * Extra cells in a row are merged into the step body; empty rows are dropped.
 */
export default function decorate(block) {
  const ol = document.createElement('ol');
  // list-style: none drops list semantics in Safari; keep them explicit
  ol.setAttribute('role', 'list');

  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img')) return;

    const li = document.createElement('li');
    li.className = 'cards-steps-item';
    moveInstrumentation(row, li);

    const body = document.createElement('div');
    body.className = 'cards-steps-body';
    [...row.children].forEach((cell) => body.append(...cell.childNodes));

    // imported cells may hold bare text with no paragraph wrapper
    if (!body.querySelector('p, h1, h2, h3, h4, h5, h6, ul, ol')) {
      const p = document.createElement('p');
      p.append(...body.childNodes);
      body.append(p);
    }

    const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) heading.classList.add('cards-steps-title');

    let afterCta = false;
    [...body.children].forEach((el) => {
      if (el.classList.contains('button-container')) {
        el.classList.add('cards-steps-cta');
        afterCta = true;
      } else if (afterCta && el.tagName === 'P') {
        el.classList.add('cards-steps-disclaimer');
      }
    });

    li.append(body);
    ol.append(li);
  });

  block.textContent = '';
  block.append(ol);
}
