/*
 * columns-callout: framed CTA callout (TFS "two-columns" callout, img-card, download card).
 * Authored as 1 row, 2 cells: [title + text] | [CTA]. Extra rows render as further callouts.
 * A cell made only of links becomes the action column (bold link = primary pill CTA, plain
 * links = a stacked link list such as PDF downloads); everything else is text.
 * A paragraph whose only content is <strong> text (no link) is promoted to the callout title.
 */
function isLinkOnly(el) {
  const link = el.querySelector('a[href]');
  if (!link) return false;
  return el.textContent.trim() === link.textContent.trim();
}

function isActionCell(col) {
  const blocks = [...col.children];
  if (!blocks.length) return false;
  return blocks.every((el) => {
    if (el.tagName === 'UL' || el.tagName === 'OL') {
      return el.children.length > 0 && [...el.children].every(isLinkOnly);
    }
    return isLinkOnly(el);
  });
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-callout-row');
    const cols = [...row.children];

    cols.forEach((col) => {
      // imported cells can hold bare text (no <p>); wrap it so paragraph spacing applies
      if (col.textContent.trim() && !col.querySelector('p, h1, h2, h3, h4, h5, h6, ul, ol')) {
        const p = document.createElement('p');
        p.append(...col.childNodes);
        col.append(p);
      }

      const action = cols.length > 1 && isActionCell(col);
      col.classList.add(action ? 'columns-callout-action' : 'columns-callout-text');

      if (action) {
        // plain links (e.g. the Download card's PDF list) stay links; only authored
        // bold/italic links are buttons (decorateButtons already set primary/secondary)
        const plain = [...col.querySelectorAll('a[href]')]
          .filter((a) => !a.classList.contains('primary') && !a.classList.contains('secondary'));
        plain.forEach((a) => a.classList.remove('button'));
        if (plain.length) col.classList.add('columns-callout-links');
      } else {
        const first = col.firstElementChild;
        if (first && first.tagName === 'P' && !first.querySelector('a')
          && first.children.length === 1 && first.firstElementChild.tagName === 'STRONG'
          && first.textContent.trim() === first.firstElementChild.textContent.trim()) {
          first.classList.add('columns-callout-title');
        } else if (first && /^H[1-6]$/.test(first.tagName)) {
          first.classList.add('columns-callout-title');
        }
      }
    });

    if (cols.length === 1) row.classList.add('columns-callout-single');
  });
}
