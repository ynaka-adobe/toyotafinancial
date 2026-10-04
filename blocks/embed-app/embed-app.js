/*
 * embed-app: embeds a third-party web application in an iframe
 * (source: Apply for Credit page, an auto-submitted POST form targeting a named iframe).
 * Authored rows:
 *   row 1 (1 cell): link to the application start URL; link text = accessible frame title
 *   optional row:   method | POST or GET (default POST)
 *   optional row:   height | CSS length, e.g. 51em or 816px (default 51em)
 * POST: a hidden form targeting the iframe is submitted once when the block nears the viewport.
 * GET: the iframe src is set when the block nears the viewport.
 * The authored link stays in place as a fallback until the iframe is created.
 */

const DEFAULT_METHOD = 'post';
const DEFAULT_HEIGHT = '51em';
const LOAD_TIMEOUT = 20000;
const HEIGHT_PATTERN = /^\d+(\.\d+)?(px|em|rem|vh|svh|dvh|lvh)$/;

let instanceCount = 0;

function readConfig(block) {
  const config = { method: DEFAULT_METHOD, height: DEFAULT_HEIGHT };
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const key = cells[0].textContent.trim().toLowerCase();
    const value = cells[1].textContent.trim();
    if (key === 'method') {
      const method = value.toLowerCase();
      if (method === 'post' || method === 'get') config.method = method;
    } else if (key === 'height') {
      const height = value.toLowerCase().replace(/\s+/g, '');
      if (/^\d+(\.\d+)?$/.test(height)) config.height = `${height}px`;
      else if (HEIGHT_PATTERN.test(height)) config.height = height;
    }
  });
  return config;
}

function getAppUrl(link) {
  try {
    const url = new URL(link.getAttribute('href'), window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url : null;
  } catch (e) {
    return null;
  }
}

// true while the frame still shows its initial about:blank document
function isBlankFrame(iframe) {
  try {
    const href = iframe.contentWindow?.location?.href;
    return !href || href === 'about:blank';
  } catch (e) {
    // cross-origin access throws: the frame has navigated to the application
    return false;
  }
}

function buildFrame(name, title) {
  const iframe = document.createElement('iframe');
  iframe.className = 'embed-app-iframe';
  iframe.name = name;
  iframe.title = title;
  iframe.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen; payment');
  return iframe;
}

function buildForm(url, name) {
  const form = document.createElement('form');
  form.className = 'embed-app-form';
  form.method = 'post';
  form.action = url.href;
  form.target = name;
  form.hidden = true;
  return form;
}

function startApp(block, url, title, config) {
  instanceCount += 1;
  const name = `embed-app-${instanceCount}`;

  const frame = document.createElement('div');
  frame.className = 'embed-app-frame';
  const iframe = buildFrame(name, title);

  const done = () => block.classList.remove('embed-app-loading');
  const timer = setTimeout(done, LOAD_TIMEOUT);
  const onLoad = () => {
    if (isBlankFrame(iframe)) return;
    clearTimeout(timer);
    done();
    iframe.removeEventListener('load', onLoad);
  };

  block.classList.add('embed-app-loading');
  block.style.setProperty('--embed-app-height', config.height);

  if (config.method === 'get') {
    iframe.addEventListener('load', onLoad);
    iframe.src = url.href;
    frame.append(iframe);
    block.replaceChildren(frame);
    return;
  }

  // name is set before insertion so the form target resolves to this frame
  frame.append(iframe);
  const form = buildForm(url, name);
  block.replaceChildren(frame, form);
  iframe.addEventListener('load', onLoad);
  form.submit();
}

export default function decorate(block) {
  const link = block.querySelector('a[href]');
  const url = link && getAppUrl(link);
  if (!url) return;

  const config = readConfig(block);
  const linkText = link.textContent.trim();
  const title = linkText && linkText !== link.href ? linkText : `Application from ${url.hostname}`;

  // until the app starts, the authored link remains a usable fallback
  block.classList.add('embed-app-pending');
  block.style.setProperty('--embed-app-height', config.height);

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    block.classList.remove('embed-app-pending');
    startApp(block, url, title, config);
  };

  if (!('IntersectionObserver' in window)) {
    start();
    return;
  }

  // fires immediately for a block that is already in (or near) the viewport
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      start();
    }
  }, { rootMargin: '200px 0px' });
  observer.observe(block);
}
