/* eslint-disable */
/* global WebImporter */

/**
 * Parser for video-poster. Base: video.
 * Source: https://www.toyotafinancial.com/us/en/vehicle_protection_plan/prepaid_maintenance_plan.html
 * Selector (page-templates.json): #main-content .screenFade .video-component.parbase:has(video)
 * Generated: 2026-10-04
 *
 * Content model (blocks/video-poster/README.md + video-poster.js):
 *   Row 1: link to the MP4 (absolute https://www.toyotafinancial.com/... URL)
 *   Row 2: poster picture (Scene7 <img>; the dm-images transformer rewrites it afterwards)
 *
 * Source structure (verified in cached source.html):
 *   .video-banner > .video-content > a.video-thumbnail > img (Scene7 poster)
 *                 > .embedded-video.hidden > video > source[src="/content/dam/…/*.mp4"]
 */
const ORIGIN = 'https://www.toyotafinancial.com';

function absolute(href) {
  try { return new URL(href, ORIGIN).href; } catch (e) { return href; }
}

export default function parse(element, { document }) {
  const video = element.querySelector('video');
  const source = video && (video.querySelector('source[src]') || (video.hasAttribute('src') ? video : null));
  const rawSrc = (source && source.getAttribute('src'))
    || (video && video.getAttribute('data-src'))
    || (element.querySelector('[data-src$=".mp4"], [data-video-src]') || { getAttribute: () => null })
      .getAttribute('data-src');
  const poster = element.querySelector('.video-thumbnail img, .video-content img, img');
  const posterSrc = (poster && poster.getAttribute('src')) || (video && video.getAttribute('poster'));

  // Empty-block guard.
  if (!rawSrc && !posterSrc) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (rawSrc) {
    const href = absolute(rawSrc);
    const link = document.createElement('a');
    link.href = href;
    link.textContent = href;
    cells.push([link]);
  }
  if (posterSrc) {
    const img = document.createElement('img');
    img.src = absolute(posterSrc);
    img.alt = (poster && poster.getAttribute('alt')) || '';
    cells.push([img]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'video-poster', cells });
  element.replaceWith(block);
}
