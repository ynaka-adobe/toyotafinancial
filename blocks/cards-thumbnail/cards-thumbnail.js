import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/*
 * cards-thumbnail: 2-column grid of image-top cards (TFS get_started .thumbnail-card).
 * Each row is one card: [picture] | [h3 title, p text, p > a CTA]. A row without a picture cell
 * becomes a centred text-only card (the source "Find Answers" / "Contact Us" cards).
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-thumbnail-card';
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div) => {
      const onlyPicture = div.querySelector('picture') && div.textContent.trim() === '';
      if (onlyPicture) div.className = 'cards-thumbnail-card-image';
      else if (div.textContent.trim() || div.children.length) div.className = 'cards-thumbnail-card-body';
      else div.remove();
    });

    if (!li.children.length) return;
    if (!li.querySelector('.cards-thumbnail-card-image')) li.classList.add('cards-thumbnail-card-text');
    ul.append(li);
  });

  ul.querySelectorAll('.cards-thumbnail-card-image picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimized.querySelector('img'));
    img.closest('picture').replaceWith(optimized);
  });

  block.replaceChildren(ul);
}
