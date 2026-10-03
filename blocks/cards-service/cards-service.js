import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-service-card-image';
      else div.className = 'cards-service-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  /* tiles render <= ~540px wide; Scene7 pads (letterboxes) any wid above the
     asset's native width, so cap renditions and never upscale */
  ul.querySelectorAll('picture source[srcset*="/is/image/"], picture img[src*="/is/image/"]').forEach((el) => {
    const attr = el.tagName === 'IMG' ? 'src' : 'srcset';
    const url = el.getAttribute(attr).replace(/([?&])wid=\d+/, '$1wid=750');
    el.setAttribute(attr, /[?&]fit=/.test(url) ? url : `${url}&fit=constrain`);
  });
  block.textContent = '';
  block.append(ul);
}
