import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/*
 * cards-video: grid of video tiles (TFS lease-end video series .video-promo).
 * Each row is one tile, 2 cells: [poster picture] | [h3 title, p description, p > a MP4 URL].
 * Cell order is tolerated: the picture and the video link are found anywhere in the row.
 * The poster becomes a play button that opens the MP4 in a shared native <dialog>; playback
 * starts only after that click, and closing the dialog pauses and removes the video.
 * Rows without any content are skipped (source has empty column placeholders).
 */
const VIDEO_RE = /\.(mp4|webm|ogv|ogg|mov)(\?|#|$)/i;

function videoType(href) {
  const ext = new URL(href, window.location.href).pathname.split('.').pop().toLowerCase();
  if (ext === 'webm') return 'video/webm';
  if (ext === 'ogv' || ext === 'ogg') return 'video/ogg';
  return 'video/mp4';
}

let lastTrigger = null;

function getDialog() {
  let dialog = document.querySelector('dialog.cards-video-dialog');
  if (dialog) return dialog;

  dialog = document.createElement('dialog');
  dialog.className = 'cards-video-dialog';
  dialog.setAttribute('aria-label', 'Video');

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'cards-video-dialog-close';
  close.setAttribute('aria-label', 'Close video');
  close.addEventListener('click', () => dialog.close());

  const frame = document.createElement('div');
  frame.className = 'cards-video-dialog-frame';
  dialog.append(close, frame);

  // click on the backdrop (outside the frame) closes
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    const video = frame.querySelector('video');
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.querySelectorAll('source').forEach((s) => s.remove());
      video.load();
    }
    frame.textContent = '';
    if (lastTrigger && lastTrigger.isConnected) lastTrigger.focus();
    lastTrigger = null;
  });

  document.body.append(dialog);
  return dialog;
}

function openVideo(href, title, trigger) {
  const dialog = getDialog();
  const frame = dialog.querySelector('.cards-video-dialog-frame');

  const video = document.createElement('video');
  video.controls = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('aria-label', title);
  const source = document.createElement('source');
  source.src = href;
  source.type = videoType(href);
  video.append(source);

  frame.replaceChildren(video);
  dialog.setAttribute('aria-label', title);
  lastTrigger = trigger;
  dialog.showModal();
  dialog.querySelector('.cards-video-dialog-close').focus();
  // playback was requested by the user's click, so starting it here is not autoplay
  video.play().catch(() => {});
}

function buildTile(row) {
  const img = row.querySelector('picture img, img');
  const link = [...row.querySelectorAll('a[href]')].find((a) => VIDEO_RE.test(a.href));

  const li = document.createElement('li');
  li.className = 'cards-video-tile';
  moveInstrumentation(row, li);

  // body: every cell that is not just the poster, with the video link removed
  const body = document.createElement('div');
  body.className = 'cards-video-tile-body';
  [...row.children].forEach((cell) => {
    if (img && cell.contains(img) && !cell.textContent.trim()) return;
    body.append(...cell.childNodes);
  });
  body.querySelector('picture')?.remove();
  if (link) {
    const holder = link.closest('p, li, div');
    if (holder && holder !== body && holder.textContent.trim() === link.textContent.trim()) {
      holder.remove();
    } else {
      link.remove();
    }
  }
  if (!body.firstElementChild && body.textContent.trim()) {
    const p = document.createElement('p');
    p.append(...body.childNodes);
    body.append(p);
  }

  const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) heading.classList.add('cards-video-tile-title');
  const linkText = link?.textContent.trim();
  const title = heading?.textContent.trim()
    || (linkText && linkText !== link.href ? linkText : '')
    || img?.alt
    || 'Video';

  if (body.textContent.trim()) li.append(body);

  const picture = img
    ? createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }])
    : null;

  if (link) {
    const media = document.createElement('button');
    media.type = 'button';
    media.className = 'cards-video-tile-media';
    media.setAttribute('aria-label', `Play video: ${title}`);
    media.setAttribute('aria-haspopup', 'dialog');
    if (picture) media.append(picture);
    const icon = document.createElement('span');
    icon.className = 'cards-video-play';
    icon.setAttribute('aria-hidden', 'true');
    media.append(icon);
    const { href } = link;
    media.addEventListener('click', () => openVideo(href, title, media));
    li.append(media);
  } else if (picture) {
    const media = document.createElement('div');
    media.className = 'cards-video-tile-media';
    media.append(picture);
    li.append(media);
  }

  return li.children.length ? li : null;
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('img')) return;
    const tile = buildTile(row);
    if (tile) ul.append(tile);
  });
  block.textContent = '';
  block.append(ul);
}
