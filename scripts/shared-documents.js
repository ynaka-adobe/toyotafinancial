/*
 * Loads shared documents (nav, footer) for the header and footer blocks.
 * Kept free of side effects so the blocks can also run embedded in other apps
 * (see scripts/aem-embed.js), where scripts.js must not be imported.
 */

/**
 * Embed options a block carries when rendered outside the EDS site.
 * @param {Element} block header or footer block
 * @returns {{ base: string, locale: string, linkBase: string } | null}
 */
export function getEmbedOptions(block) {
  const { embedBase, embedLocale, embedLinkBase } = block?.dataset || {};
  if (!embedBase) return null;
  return { base: embedBase, locale: embedLocale || '', linkBase: embedLinkBase || embedBase };
}

/**
 * URLs to try for a shared document such as the nav or footer, most specific first:
 * the page's language folder (e.g. /us/en/nav), then the site root (/nav).
 * Local preview serves authored content under /content.
 * @param {string} name document name, e.g. 'nav'
 * @param {{ base?: string, locale?: string }} [embed] embed options; defaults to the current page
 * @returns {string[]} .plain.html URLs in lookup order
 */
export function getSharedDocumentUrls(name, embed = null) {
  if (embed) {
    const locale = embed.locale.replace(/\/$/, '');
    const paths = locale ? [`${locale}/${name}`, `/${name}`] : [`/${name}`];
    return paths.map((path) => `${embed.base}${path}.plain.html`);
  }
  const { pathname } = window.location;
  const local = pathname.startsWith('/content/');
  const base = local ? '/content' : '';
  const pagePath = local ? pathname.slice(base.length) : pathname;
  const locale = pagePath.match(/^\/[a-z]{2}\/[a-z]{2}(?=\/|$)/i);
  const paths = locale ? [`${locale[0].toLowerCase()}/${name}`, `/${name}`] : [`/${name}`];
  return paths.map((path) => `${base}${path}.plain.html`);
}

/**
 * Fetches the first URL that responds OK.
 * @param {string[]} urls URLs in lookup order
 * @returns {Promise<Response|null>}
 */
export async function fetchFirstAvailable(urls) {
  if (!urls.length) return null;
  const resp = await fetch(urls[0]);
  return resp.ok ? resp : fetchFirstAvailable(urls.slice(1));
}

/**
 * Rewrites relative URLs in fetched markup so they keep pointing at the EDS site
 * when rendered on another origin: media resolve against the document URL,
 * root-relative links against the link base.
 * @param {DocumentFragment} root parsed markup
 * @param {string} documentUrl URL the markup was fetched from
 * @param {string} linkBase origin that page links should point to
 */
function resolveUrls(root, documentUrl, linkBase) {
  root.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), documentUrl).href;
  });
  root.querySelectorAll('source[srcset]').forEach((source) => {
    source.srcset = source.getAttribute('srcset').split(',').map((candidate) => {
      const [url, ...descriptor] = candidate.trim().split(/\s+/);
      return [new URL(url, documentUrl).href, ...descriptor].join(' ');
    }).join(', ');
  });
  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (/^(#|[a-z][a-z0-9+.-]*:)/i.test(href)) return;
    a.href = new URL(href, `${linkBase}/`).href;
  });
}

/**
 * Fetches a shared document and returns its sections in a detached container.
 * @param {string} name document name, e.g. 'nav'
 * @param {Element} block the block requesting it (carries embed options, if any)
 * @returns {Promise<HTMLElement|null>}
 */
export async function loadSharedDocument(name, block) {
  const embed = getEmbedOptions(block);
  const resp = await fetchFirstAvailable(getSharedDocumentUrls(name, embed));
  if (!resp) return null;
  // parse into an inert template so relative media are not requested from the wrong origin
  const template = document.createElement('template');
  template.innerHTML = await resp.text();
  if (embed) resolveUrls(template.content, resp.url, embed.linkBase);
  const container = document.createElement('div');
  container.append(template.content);
  return container;
}
