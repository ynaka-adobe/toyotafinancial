import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/* the source shows 1 card per slide below 576px, 2 below 992px, and a static grid above */
const TWO_UP = window.matchMedia('(width >= 576px)');
const GRID = window.matchMedia('(width >= 992px)');

function perView() {
  return TWO_UP.matches ? 2 : 1;
}

function setupSlider(block, ul) {
  const dots = document.createElement('div');
  dots.className = 'cards-explore-dots';
  dots.setAttribute('role', 'group');
  dots.setAttribute('aria-label', 'Card slides');

  const pageCount = () => Math.ceil(ul.children.length / perView());
  const currentPage = () => (ul.clientWidth ? Math.round(ul.scrollLeft / ul.clientWidth) : 0);

  const updateActive = () => {
    const active = currentPage();
    [...dots.querySelectorAll('button')].forEach((btn, i) => {
      btn.setAttribute('aria-current', i === active ? 'true' : 'false');
    });
  };

  const render = () => {
    const count = pageCount();
    dots.hidden = GRID.matches || count < 2;
    dots.textContent = '';
    for (let i = 0; i < count; i += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', `Show slide ${i + 1} of ${count}`);
      btn.dataset.page = i;
      dots.append(btn);
    }
    updateActive();
  };

  dots.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-page]');
    if (!btn) return;
    ul.scrollTo({ left: Number(btn.dataset.page) * ul.clientWidth });
  });

  let ticking = false;
  ul.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateActive();
      ticking = false;
    });
  }, { passive: true });

  TWO_UP.addEventListener('change', render);
  GRID.addEventListener('change', render);

  render();
  block.append(dots);
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-explore-card-image';
      else div.className = 'cards-explore-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  /* Scene7 pads renditions requested wider than the master (510px here) with white bars;
     fit=constrain,0 caps the rendition at the master size instead */
  const constrain = (url) => (url.includes('/is/image/') && !url.includes('fit=') ? `${url}&fit=constrain,0` : url);
  ul.querySelectorAll('picture source[srcset], picture img').forEach((el) => {
    if (el.srcset) el.srcset = constrain(el.srcset);
    if (el.tagName === 'IMG' && el.src) el.src = constrain(el.src);
  });
  block.textContent = '';
  block.append(ul);
  setupSlider(block, ul);
}
