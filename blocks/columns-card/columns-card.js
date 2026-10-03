import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/*
 * columns-card: a framed image + text card (TFS "card-component").
 * Each row is one card; each row's cells sit side by side on desktop and stack on mobile.
 * A cell whose only content is a picture becomes the image half, everything else is text.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const colCount = Math.max(0, ...rows.map((row) => row.children.length));
  block.classList.add(`columns-card-${colCount}-cols`);

  rows.forEach((row) => {
    row.classList.add('columns-card-row');
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      const onlyPicture = pic && col.children.length === 1 && col.textContent.trim() === '';
      col.classList.add(onlyPicture ? 'columns-card-img-col' : 'columns-card-text-col');
      // imported cells can hold bare text (no <p>); wrap it so paragraph spacing applies
      if (!onlyPicture && col.textContent.trim() && !col.querySelector('p, h1, h2, h3, h4, h5, h6, ul, ol')) {
        const p = document.createElement('p');
        p.append(...col.childNodes);
        col.append(p);
      }
    });
  });

  block.querySelectorAll('.columns-card-img-col picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [
      { media: '(min-width: 900px)', width: '1000' },
      { width: '750' },
    ]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
}
