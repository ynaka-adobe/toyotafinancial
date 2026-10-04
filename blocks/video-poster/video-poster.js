import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * video-poster: poster image that swaps to an inline HTML5 player on click
 * (TFS video-component with a self-hosted MP4 on toyotafinancial.com).
 * Authored rows (order-independent): a link to the video file | a poster picture.
 * Without a poster the player is rendered directly (controls, no autoplay, metadata preload).
 */
function videoType(href) {
  const ext = new URL(href, window.location.href).pathname.split('.').pop().toLowerCase();
  if (ext === 'webm') return 'video/webm';
  if (ext === 'ogv' || ext === 'ogg') return 'video/ogg';
  return 'video/mp4';
}

function buildVideo(href, title, autoplay) {
  const video = document.createElement('video');
  video.className = 'video-poster-player';
  video.controls = true;
  video.playsInline = true;
  video.preload = autoplay ? 'auto' : 'metadata';
  if (title) video.setAttribute('aria-label', title);
  const source = document.createElement('source');
  source.src = href;
  source.type = videoType(href);
  video.append(source);
  return video;
}

export default function decorate(block) {
  const link = block.querySelector('a[href]');
  const img = block.querySelector('picture img, img');
  if (!link) return;

  const { href } = link;
  const linkText = link.textContent.trim();
  const title = linkText && linkText !== href ? linkText : (img?.alt || 'Video');
  block.textContent = '';

  if (!img) {
    block.append(buildVideo(href, title, false));
    return;
  }

  const poster = createOptimizedPicture(img.src, img.alt || '', false, [
    { media: '(min-width: 900px)', width: '1200' },
    { width: '750' },
  ]);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'video-poster-trigger';
  button.setAttribute('aria-label', `Play video: ${title}`);
  const icon = document.createElement('span');
  icon.className = 'video-poster-play';
  icon.setAttribute('aria-hidden', 'true');
  button.append(poster, icon);

  button.addEventListener('click', () => {
    const video = buildVideo(href, title, true);
    button.replaceWith(video);
    // playback was requested by the user's click, so starting it here is not autoplay
    video.play().catch(() => {});
    video.focus();
  }, { once: true });

  block.append(button);
}
