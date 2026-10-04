/* eslint-disable */
/* global WebImporter */

/**
 * Parser for quiz-plans. Base: quiz (custom block, no library convention).
 * Source: https://www.toyotafinancial.com/us/en/vehicle_protection_plan/which_plan_is_right_for_me.html
 * Selector (page-templates.json): #main-content .screenFade .quiz-component.parbase .quiz-card
 * Generated: 2026-10-04
 *
 * Content model (blocks/quiz-plans/README.md "Authoring model (exact)"):
 *   Row 1 (optional, 1 cell): picture
 *   Question rows (3 cells): [id e.g. q1] | [question text] | [ul > li > a href="#<data-target id>">answer</a>]
 *   Result rows   (3 cells): [id e.g. a4a] | Result | [ul: li = h3 > a product link + p description]
 *
 * Source structure (verified in cached source.html):
 *   .quiz-card > .card-content > img (Scene7 photo)
 *              > .quiz-section .holder#q1… > .question p + .answer (input[data-target] + label span)…
 *              > .holder.answers#a4a… > ul.list > li (a + p), separated by <hr> (dropped)
 *              > .quiz-footer Back/Next buttons (dropped — the block renders its own nav)
 * Answers without data-target (input.disabled, e.g. "Certified Used" for lease) are kept as
 * plain-text list items (no link) so the authored option text is not lost.
 * The surrounding h2 / p / h3 of .quiz-component stay default content (not part of this element).
 */
function cleanText(el) {
  return (el.textContent || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  const cells = [];

  // Optional image row.
  const photo = element.querySelector('.card-content img, :scope > div:not(.quiz-section) img');
  if (photo) {
    const img = document.createElement('img');
    img.src = photo.getAttribute('src');
    img.alt = photo.getAttribute('alt') || '';
    cells.push([img]);
  }

  const holders = [...element.querySelectorAll('.holder[id]')];
  holders.forEach((holder) => {
    const id = holder.id;
    if (holder.classList.contains('answers')) {
      // ---- Result row ----
      const ul = document.createElement('ul');
      holder.querySelectorAll('li').forEach((li) => {
        const link = li.querySelector('a[href]');
        const item = document.createElement('li');
        if (link) {
          const h3 = document.createElement('h3');
          const a = document.createElement('a');
          a.href = link.getAttribute('href');
          a.textContent = cleanText(link);
          h3.append(a);
          item.append(h3);
        }
        li.querySelectorAll('p').forEach((p) => {
          if (!cleanText(p)) return;
          const np = document.createElement('p');
          np.textContent = cleanText(p);
          item.append(np);
        });
        if (item.childNodes.length) ul.append(item);
      });
      if (ul.children.length) cells.push([id, 'Result', ul]);
      return;
    }

    // ---- Question row ----
    const question = cleanText(holder.querySelector('.question') || document.createElement('p'));
    const ul = document.createElement('ul');
    holder.querySelectorAll('.answer input').forEach((input) => {
      const label = (input.id && holder.querySelector(`label[for="${input.id}"]`))
        || input.nextElementSibling;
      const text = label ? cleanText(label) : (input.getAttribute('value') || '');
      if (!text) return;
      const li = document.createElement('li');
      const target = input.getAttribute('data-target');
      if (target) {
        const a = document.createElement('a');
        a.href = target.startsWith('#') ? target : `#${target}`;
        a.textContent = text;
        li.append(a);
      } else {
        li.textContent = text;
      }
      ul.append(li);
    });
    if (question || ul.children.length) cells.push([id, question, ul]);
  });

  // Empty-block guard.
  if (!holders.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'quiz-plans', cells });
  element.replaceWith(block);
}
