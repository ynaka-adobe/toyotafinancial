import { moveInstrumentation } from '../../scripts/scripts.js';

/*
 * cards-questions: vertical stack of full-width question link tiles (source FAQ .questionlist).
 * Each row is one tile; its cell holds a single link (p > a). The link itself becomes
 * the tile so the whole box is clickable. Rows without a link render as plain text tiles.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    const link = row.querySelector('a[href]');
    if (link) {
      // decorateButtons promotes a sole-child link to a button before blocks load; undo it
      link.classList.remove('button', 'primary', 'secondary');
      if (!link.textContent.trim()) link.textContent = link.title || link.href;
      link.classList.add('cards-questions-tile');
      li.append(link);
    } else if (row.textContent.trim()) {
      const span = document.createElement('span');
      span.className = 'cards-questions-tile';
      span.textContent = row.textContent.trim();
      li.append(span);
    } else {
      return;
    }

    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
