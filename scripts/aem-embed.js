/* eslint-disable max-classes-per-file */
/*
 * Embeds the site header and footer in other apps (e.g. a Next.js app on another
 * subdomain) using the real header/footer blocks, rendered in Shadow DOM.
 *
 *   <script type="module" src="https://main--toyotafinancial--ynaka-adobe.aem.live/scripts/aem-embed.js"></script>
 *   <aem-header locale="/us/en"></aem-header>
 *   ...
 *   <aem-footer locale="/us/en"></aem-footer>
 *
 * Attributes:
 *   locale     language folder holding the nav/footer documents, e.g. /us/en (default: site root)
 *   link-base  origin that nav/footer links point to (default: the origin serving this script)
 *   base       URL serving code and content; may be a same-origin proxy path such as /aem
 *              (default: the origin serving this script)
 *
 * Cross-origin hosts need CORS headers on the EDS site for the nav/footer
 * .plain.html documents and for /scripts, /blocks and /styles.
 */

const SCRIPT_BASE = new URL('..', import.meta.url).href.replace(/\/$/, '');
const cssCache = new Map();

/**
 * Resolves url(...) references against the stylesheet's own URL, since the
 * rules are injected inline and would otherwise resolve against the host page.
 * @param {string} css stylesheet text
 * @param {string} href stylesheet URL
 * @returns {string}
 */
function absolutizeCssUrls(css, href) {
  return css.replace(/url\((['"]?)([^'")]+)\1\)/g, (match, quote, url) => {
    if (/^(data:|https?:|#)/.test(url)) return match;
    return `url(${quote}${new URL(url, href).href}${quote})`;
  });
}

/**
 * Fetches a stylesheet as text, inlining @imports and mapping :root to :host
 * (design tokens declared on :root never match inside a shadow tree).
 * @param {string} href stylesheet URL
 * @returns {Promise<string>}
 */
function fetchCss(href) {
  if (!cssCache.has(href)) {
    cssCache.set(href, (async () => {
      const resp = await fetch(href);
      if (!resp.ok) return '';
      let css = await resp.text();
      const imports = [...css.matchAll(/@import\s+url\((['"]?)([^'")]+)\1\)\s*;?/g)];
      const inlined = await Promise.all(imports.map((m) => fetchCss(new URL(m[2], href).href)));
      imports.forEach((m, i) => { css = css.replace(m[0], inlined[i]); });
      return absolutizeCssUrls(css, href).replace(/:root\b/g, ':root, :host');
    })());
  }
  return cssCache.get(href);
}

// stands in for the page-level body styles the blocks inherit on the EDS site
const HOST_CSS = `
  :host {
    display: block;
    background-color: var(--background-color);
    color: var(--text-color);
    font-family: var(--body-font-family);
    font-size: var(--body-font-size-m);
    line-height: var(--body-line-height);
    text-align: start;
  }
`;

class AemChrome extends HTMLElement {
  static blockName = '';

  async connectedCallback() {
    if (this.shadowRoot) return;
    const { blockName } = this.constructor;
    const base = new URL(this.getAttribute('base') || SCRIPT_BASE, document.baseURI).href.replace(/\/$/, '');
    const shadow = this.attachShadow({ mode: 'open' });

    try {
      const css = await Promise.all([
        fetchCss(`${base}/styles/styles.css`),
        fetchCss(`${base}/blocks/${blockName}/${blockName}.css`),
      ]);
      const style = document.createElement('style');
      style.textContent = [...css, HOST_CSS].join('\n');

      const wrapper = document.createElement('div');
      wrapper.className = `${blockName}-wrapper`;
      const block = document.createElement('div');
      block.className = `${blockName} block`;
      Object.assign(block.dataset, {
        blockName,
        blockStatus: 'loading',
        embedBase: base,
        embedLocale: this.getAttribute('locale') || '',
        embedLinkBase: (this.getAttribute('link-base') || base).replace(/\/$/, ''),
      });
      wrapper.append(block);
      const landmark = document.createElement(blockName);
      landmark.append(wrapper);
      shadow.append(style, landmark);

      // aem.js resets codeBasePath on first import; icons must load from the EDS origin
      await import(`${base}/scripts/aem.js`);
      window.hlx.codeBasePath = base;
      const mod = await import(`${base}/blocks/${blockName}/${blockName}.js`);
      await mod.default(block);
      block.dataset.blockStatus = 'loaded';
      this.dispatchEvent(new CustomEvent('aem-embed-loaded', { bubbles: true, composed: true }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`aem-embed: failed to load ${blockName}`, error);
    }
  }
}

class AemHeader extends AemChrome {
  static blockName = 'header';
}

class AemFooter extends AemChrome {
  static blockName = 'footer';
}

if (!customElements.get('aem-header')) customElements.define('aem-header', AemHeader);
if (!customElements.get('aem-footer')) customElements.define('aem-footer', AemFooter);
