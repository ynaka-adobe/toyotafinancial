import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * carousel-cards: filterable carousel of image-top cards, 3 cards per slide, dot navigation only,
 * no autoplay (TFS "View Plans by..." vehicle-protection carousel).
 *
 * Authored rows:
 *  - Filter row (optional): 1 cell = filter label, e.g. "View Plans by...".
 *  - Card rows, 3 cells: [picture (+ optional link to an MP4 = play in a modal)] |
 *    [h3 title, p text or ul, "More Details" link] | [categories, comma-separated (optional)].
 * The distinct categories (authored order) become the filter options; the first is selected on
 * load. A card without categories shows under every filter. Without any categories no filter is
 * rendered. Changing the filter rebuilds the slides and returns to slide 1.
 */
const CARDS_PER_SLIDE = 3;
const VIDEO_RE = /\.(mp4|webm|ogv|ogg)(\?|#|$)/i;
let instanceCount = 0;

const norm = (value) => value.trim().toLowerCase();

function getDialog() {
  let dialog = document.querySelector('dialog.carousel-cards-dialog');
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.className = 'carousel-cards-dialog';
  dialog.setAttribute('aria-label', 'Video');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'carousel-cards-dialog-close';
  close.setAttribute('aria-label', 'Close video');
  close.addEventListener('click', () => dialog.close());
  const frame = document.createElement('div');
  frame.className = 'carousel-cards-dialog-frame';
  dialog.append(close, frame);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    const video = frame.querySelector('video');
    if (video) video.pause();
    frame.textContent = '';
  });
  document.body.append(dialog);
  return dialog;
}

function openVideo(href, title) {
  const dialog = getDialog();
  const frame = dialog.querySelector('.carousel-cards-dialog-frame');
  const video = document.createElement('video');
  video.controls = true;
  video.playsInline = true;
  // opened by a user click, so starting playback straight away is expected
  video.autoplay = true;
  video.setAttribute('aria-label', title);
  const source = document.createElement('source');
  source.src = href;
  source.type = href.toLowerCase().includes('.webm') ? 'video/webm' : 'video/mp4';
  video.append(source);
  frame.replaceChildren(video);
  dialog.setAttribute('aria-label', title);
  dialog.showModal();
  video.play().catch(() => {});
}

function buildCard(row) {
  const [imageCell, bodyCell, categoryCell] = row.children;
  const card = document.createElement('li');
  card.className = 'carousel-cards-card';

  const body = bodyCell || document.createElement('div');
  body.className = 'carousel-cards-card-body';
  const title = body.querySelector('h1, h2, h3, h4, h5, h6')?.textContent.trim() || 'Video';

  if (imageCell) {
    const media = document.createElement('div');
    media.className = 'carousel-cards-card-image';
    const img = imageCell.querySelector('img');
    const link = [...imageCell.querySelectorAll('a[href]')].find((a) => VIDEO_RE.test(a.href));
    let picture = null;
    if (img) {
      picture = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]);
    }
    if (link) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'carousel-cards-play';
      button.setAttribute('aria-label', `Play video: ${title}`);
      button.setAttribute('aria-haspopup', 'dialog');
      if (picture) button.append(picture);
      const icon = document.createElement('span');
      icon.className = 'carousel-cards-play-icon';
      icon.setAttribute('aria-hidden', 'true');
      button.append(icon);
      const { href } = link;
      button.addEventListener('click', () => openVideo(href, title));
      media.append(button);
    } else if (picture) {
      media.append(picture);
    }
    if (media.children.length) card.append(media);
  }

  card.append(body);
  const categories = categoryCell
    ? categoryCell.textContent.split(',').map((c) => c.trim()).filter(Boolean)
    : [];
  return { card, categories };
}

export default function decorate(block) {
  instanceCount += 1;
  const prefix = `carousel-cards-${instanceCount}`;

  let filterLabel = '';
  const cards = [];
  [...block.children].forEach((row) => {
    if (row.children.length < 2) {
      if (!filterLabel && !row.querySelector('picture')) filterLabel = row.textContent.trim();
      return;
    }
    cards.push(buildCard(row));
  });

  const categories = [];
  cards.forEach(({ categories: cats }) => cats.forEach((c) => {
    if (!categories.some((x) => norm(x) === norm(c))) categories.push(c);
  }));

  block.textContent = '';
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', filterLabel || 'Plans');

  let select = null;
  if (categories.length) {
    const filter = document.createElement('div');
    filter.className = 'carousel-cards-filter';
    const label = document.createElement('label');
    label.className = 'carousel-cards-filter-label';
    label.htmlFor = `${prefix}-filter`;
    label.textContent = filterLabel || 'Filter';
    select = document.createElement('select');
    select.className = 'carousel-cards-select';
    select.id = `${prefix}-filter`;
    categories.forEach((c) => {
      const option = document.createElement('option');
      option.value = c;
      option.textContent = c;
      select.append(option);
    });
    filter.append(label, select);
    block.append(filter);
  } else if (filterLabel) {
    const heading = document.createElement('p');
    heading.className = 'carousel-cards-filter-label';
    heading.textContent = filterLabel;
    block.append(heading);
  }

  const viewport = document.createElement('ul');
  viewport.className = 'carousel-cards-slides';
  viewport.id = `${prefix}-slides`;

  const nav = document.createElement('div');
  nav.className = 'carousel-cards-dots';
  nav.setAttribute('role', 'group');
  nav.setAttribute('aria-label', 'Choose slide');

  block.append(viewport, nav);

  let active = 0;

  function setActive(index, scroll) {
    const slides = [...viewport.children];
    if (!slides.length) return;
    active = Math.max(0, Math.min(index, slides.length - 1));
    slides.forEach((slide, i) => {
      const current = i === active;
      slide.setAttribute('aria-hidden', !current);
      slide.inert = !current;
    });
    [...nav.children].forEach((dot, i) => {
      if (i === active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    if (scroll) {
      viewport.scrollTo({ left: slides[active].offsetLeft, behavior: 'smooth' });
    }
  }

  function build() {
    const value = select ? norm(select.value) : '';
    const visible = cards.filter(({ categories: cats }) => !value
      || !cats.length || cats.some((c) => norm(c) === value));
    const slideCount = Math.ceil(visible.length / CARDS_PER_SLIDE);

    viewport.replaceChildren();
    nav.replaceChildren();
    for (let s = 0; s < slideCount; s += 1) {
      const slide = document.createElement('li');
      slide.className = 'carousel-cards-slide';
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${s + 1} of ${slideCount}`);
      const list = document.createElement('ul');
      list.className = 'carousel-cards-cards';
      visible.slice(s * CARDS_PER_SLIDE, (s + 1) * CARDS_PER_SLIDE)
        .forEach(({ card }) => list.append(card));
      slide.append(list);
      viewport.append(slide);

      if (slideCount > 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-cards-dot';
        dot.setAttribute('aria-label', `Show slide ${s + 1} of ${slideCount}`);
        dot.setAttribute('aria-controls', viewport.id);
        dot.addEventListener('click', () => setActive(s, true));
        nav.append(dot);
      }
    }
    nav.hidden = slideCount < 2;
    viewport.scrollLeft = 0;
    setActive(0, false);
  }

  // keep the dots in sync when the slides are swiped
  let scrollTimer;
  viewport.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const width = viewport.clientWidth || 1;
      const index = Math.round(viewport.scrollLeft / width);
      if (index !== active) setActive(index, false);
    }, 100);
  }, { passive: true });

  if (select) select.addEventListener('change', build);
  build();
}
