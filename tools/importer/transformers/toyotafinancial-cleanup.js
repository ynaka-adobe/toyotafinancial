/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: toyotafinancial site-wide cleanup.
 *
 * Removes non-authorable site chrome so the import contains only page-body
 * authorable content. Every selector below was verified against the captured
 * DOM in migration-work/cleaned.html (DOM tree confirmed via depth tracking:
 * <main> is `body > main`, a sibling of the header-wrapper <div> and the
 * footer <div>, so removing header/footer/nav does not touch page content).
 *
 * Verified DOM landmarks (cleaned.html):
 *   body > nav                              -> skip-links list (Skip to menu/banner/...)
 *   body > div.tfs-header-wrapper > header  -> global header (logo, nav#nav_menu, nav#sidebar,
 *                                              loader_wrapper, #emergency_alerts) — auto-populated
 *   body > main                             -> page content (folds live here)
 *   body > div > div.footer > footer#global-footer -> global footer — auto-populated
 *   body > span#kampyleButtonContainer      -> Kampyle "Feedback" widget button
 *   body > div#onetrust-consent-sdk         -> OneTrust cookie consent banner/modal
 *   body > iframe#destination_publishing_iframe_tfs_0 -> Adobe demdex ID-sync iframe
 *   body > div > div.hamburger.parbase > aside.aside -> mobile menu shell (nav#sidebar,
 *                                              mobile login form #login_panel, announcements
 *                                              panel, session-expiry / maintenance / interstitial
 *                                              modals) — all non-authorable site chrome
 * Inside <main> (transient runtime chrome, not authored content):
 *   .upgrade-message      -> scheduled-maintenance notice
 *   #home-loading         -> loading spinner
 *   .bottom-info-modal    -> empty runtime info modal in #fold-1 (live DOM only; "×" close button)
 *   a.carousel-control    -> hero carousel Previous/Next arrows (#fold-1)
 *   .tour-popup           -> empty tour popup container
 *   #scroll_down, #scroll_top, #scroll-to-top -> scroll helper anchors
 * Body-level runtime/placeholder cruft:
 *   #disable-search, #enableDtmHash, #dtmHashValue -> DTM/search runtime hooks
 *   .hiddendiv.common     -> hidden measurement div
 *   .newpar.new.section, .par.iparys_inherited -> empty AEM parsys placeholders (verified empty)
 *
 * about-us template additions (verified in migration-work/cleaned.html, scrape of
 * /us/en/about_us/company_overview.html; none of these exist on the homepage):
 *   #main-content .screenFade > .bread-crumb.parbase -> breadcrumb ("Company Overview")
 *   .nav-list-component.parbase   -> empty right-hand nav column (inside col-sm-3 hidden-xs)
 *   .one-column-component         -> REMOVED ONLY WHEN EMPTY (no text / images), e.g.
 *                                    #fair_lending.fair-lending on company_overview. The
 *                                    non-empty one-column-component holding the legal text /
 *                                    policy table on the policy pages is kept.
 *   a.js-external-tp (empty)      -> empty anchor in the community card caption
 *   h1-h6 > b|strong (sole child) -> unwrapped so headings are plain
 *                                    (e.g. <h3><b>Our Passion</b><br></h3>)
 *   p.faq-para                    -> h2 (FAQ landing "Popular Topics" label)
 *   .policy-scroll-section[id]    -> policy pages: section title paragraph becomes h3 and
 *                                    "#id" table-of-contents links point at the heading's
 *                                    generated id (ids themselves don't survive import)
 *   .two-columns-left-one-column-right -> REMOVED ONLY WHEN EMPTY (FAQ topic pages)
 *   p.faq_ques_text               -> FAQ topic title: "Back to FAQs" link (landing page) + h1;
 *                                    the icon-only a.faq-ques "#" back arrow is dropped
 *   .banner-component .top-section, .faq-banner-component .top-section
 *                                 -> page banner. The live page has NO <img>; the image is an
 *                                    inline (or computed) CSS background-image with a Scene7 URL.
 *                                    It is replaced by a real <img> (alt from the element's alt
 *                                    attribute) so the DM transformer rewrites it like any other
 *                                    Scene7 image. .banner-component itself is kept (section anchor).
 *
 * end-of-lease template additions (newer Bootstrap-4 design: main > .container-fluid.px-0,
 * no #main-content .screenFade). Verified in migration-work/cleaned.html (your_option) and
 * the live end_of_lease_options pages; none of these classes exist on the other templates:
 *   .two-columns-right-one-column-left .side-nav-container -> left section menu (duplicates
 *                                    the header menu, hidden on mobile)
 *   main > .container-fluid.px-0 > .secure-footer -> wrapper around #global-footer
 *   .lease-end-right-container > .video-modal     -> #pop_modal_video player shell (lease-end-videos)
 *   .banner-image.parbase .your-option-img-container.d-md-block
 *                                 -> page banner: inline Scene7 background-image becomes an
 *                                    <img> INSIDE the container (alt from the element's alt
 *                                    attribute, else the page title). The .d-md-none mobile crop,
 *                                    the empty <h1>s and the stray <br> are removed.
 *   .lease-end-right-container    -> main column. First heading -> h1; h4 -> h3 in rich text
 *                                    (.simpleparagraph), .links-section and accordion group titles
 *                                    (.accordion.parbase > .row > h4); empty headings dropped;
 *                                    div.sub-header -> p; empty/&nbsp; <p> removed;
 *                                    a.primary-btn.button-link (in .simpleparagraph / .button.parbase)
 *                                    -> p > strong > a; inline background-color on accordion-body
 *                                    links stripped.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const SCENE7_HOST = 'https://toyotafinancial.scene7.com';
const SITE_ORIGIN = 'https://www.toyotafinancial.com';
const BG_URL_RE = /background-image\s*:[^;]*?url\(\s*(['"]?)([^'")]+)\1\s*\)/i;

// Resolve a banner image URL to an absolute URL. Relative Scene7 asset paths
// (/ToyotaFinancial/xxx, as used in the source's commented-out markup) map to
// the toyotafinancial.scene7.com /is/image/ host.
function resolveImageUrl(raw) {
  const url = (raw || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/ToyotaFinancial/')) return `${SCENE7_HOST}/is/image${url}`;
  if (url.startsWith('/is/image/')) return `${SCENE7_HOST}${url}`;
  if (url.startsWith('/')) return `${SITE_ORIGIN}${url}`;
  return url; // e.g. ./images/<hash>.png from an offline scrape — leave as-is
}

function bgUrlFromStyle(styleText) {
  const m = (styleText || '').match(BG_URL_RE);
  return m ? m[2].trim() : '';
}

// Banner background URL lookup order: inline style -> computed style ->
// existing absolute/Scene7 <img> -> commented-out source markup -> any <img>.
function findBannerImageUrl(topSection) {
  const inline = bgUrlFromStyle(topSection.getAttribute('style'));
  if (inline) return inline;

  try {
    const view = topSection.ownerDocument && topSection.ownerDocument.defaultView;
    if (view && view.getComputedStyle) {
      const computed = view.getComputedStyle(topSection).backgroundImage || '';
      const m = computed.match(/url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
      if (m && m[2]) return m[2].trim();
    }
  } catch (e) { /* no computed styles in a parsed/detached document */ }

  const img = topSection.querySelector('img[src]');
  const imgSrc = img ? img.getAttribute('src') : '';
  if (/^(https?:)?\/\//i.test(imgSrc) || imgSrc.includes('/is/image/')) return imgSrc;

  // Commented-out markup next to the banner, e.g.
  // <!-- <div class="col-sm-12 top-section center-focus" style="background-image: url(/ToyotaFinancial/TFS_About_Us_Banner?$MFS$);" alt="About Us"> -->
  const scope = topSection.parentNode;
  if (scope) {
    for (const node of scope.childNodes) {
      if (node.nodeType === 8 && /top-section/.test(node.nodeValue || '')) {
        const fromComment = bgUrlFromStyle(node.nodeValue);
        if (fromComment) return fromComment;
      }
    }
  }

  return imgSrc || '';
}

// Heading id as generated by the site from the heading text (lowercase, punctuation
// dropped, runs of other characters joined with "-").
function headingSlug(text) {
  return text.toLowerCase()
    .replace(/['‘’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Policy sections linked from OTHER pages (e.g. the privacy policy links to
// online_policies_and_agreements.html#oasa), so their titles aren't in this DOM.
const KNOWN_SECTION_TITLES = {
  oasa: 'Online Account Services Agreement (applicable to Financial Services Customers with Online Account Services)',
  otou: 'Online Terms of Use (applicable to all Website users)',
};

// No visible text and no media/table content.
function isEmptyContainer(el) {
  return el.textContent.replace(/\u00a0/g, ' ').trim() === ''
    && !el.querySelector('img, picture, video, iframe, svg, table, input, select, textarea');
}

// Replace an element with a new tag, keeping its child nodes (attributes dropped).
function renameElement(el, tagName) {
  const repl = el.ownerDocument.createElement(tagName);
  repl.append(...el.childNodes);
  el.replaceWith(repl);
  return repl;
}

function isEmptyText(el) {
  return el.textContent.replace(/\u00a0/g, ' ').trim() === '';
}

// Page title without the " | Toyota Financial Services" suffix (banner alt fallback).
function pageTitle(doc) {
  return ((doc && doc.title) || '').split('|')[0].replace(/\s+/g, ' ').trim();
}

// end-of-lease (newer design) — before block parsing.
function cleanupEndOfLeaseBefore(element, doc) {
  // Banner: desktop container's inline Scene7 background-image -> <img> inside the
  // same container, so the template's defaultContent selector still matches.
  element.querySelectorAll('.banner-image.parbase .your-option-img-container.d-md-block').forEach((box) => {
    const src = resolveImageUrl(findBannerImageUrl(box));
    let img = box.querySelector('img');
    if (!img && src) {
      img = doc.createElement('img');
      img.setAttribute('src', src);
      box.prepend(img);
    } else if (img && src && !/^(https?:)?\/\//i.test(img.getAttribute('src') || '')) {
      img.setAttribute('src', src);
    }
    if (img) {
      const alt = box.getAttribute('alt') || img.getAttribute('alt') || pageTitle(doc);
      img.setAttribute('alt', alt);
    }
    // commented-out legacy <img> markup inside the container
    [...box.childNodes].forEach((n) => { if (n.nodeType === 8) n.remove(); });
    // the image is extracted now; drop the inline background so the importer's
    // transformBackgroundImages rule doesn't add a second (non-carrier) copy
    if (img) box.style.removeProperty('background-image');
  });
  WebImporter.DOMUtils.remove(element, [
    '.banner-image.parbase .your-option-img-container.d-md-none', // mobile crop of the banner
    '.banner-image.parbase br',                                    // stray <br> after the containers
    // chrome
    '.two-columns-right-one-column-left .side-nav-container',      // left section menu
    'main > .container-fluid.px-0 > .secure-footer',               // footer wrapper (#global-footer)
    '.lease-end-right-container > .video-modal',                   // #pop_modal_video player shell
  ]);

  // Empty headings (banner h1, card-button h2, empty accordion group title).
  element.querySelectorAll([
    '.banner-image.parbase h1',
    '.lease-end-right-container > .card-button > h2',
    '.lease-end-right-container > .accordion.parbase > .row > h4',
  ].join(', ')).forEach((h) => {
    if (isEmptyContainer(h)) h.remove();
  });

  // Inline background-color on links inside accordion bodies.
  element.querySelectorAll('.lease-end-right-container .accordion.parbase .card-body a[style]').forEach((a) => {
    const style = a.getAttribute('style')
      .split(';')
      .filter((decl) => decl.trim() && !/^\s*background-color\s*:/i.test(decl))
      .join(';')
      .trim();
    if (style) a.setAttribute('style', style);
    else a.removeAttribute('style');
  });
}

// end-of-lease (newer design) — after block parsing (default content in the main column).
// Runs in afterTransform so the template's defaultContent selectors (h4, .sub-header)
// still match while parsers run; block tables inside the column are left untouched
// except for empty <p> removal.
function cleanupEndOfLeaseAfter(element, doc) {
  element.querySelectorAll('.lease-end-right-container').forEach((col) => {
    // drop empty headings
    col.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      if (isEmptyContainer(h)) h.remove();
    });

    // first heading in the main column (outside block tables) becomes the page h1
    const first = [...col.querySelectorAll('h1, h2, h3, h4, h5, h6')].find((h) => !h.closest('table'));
    if (first && first.tagName !== 'H1') renameElement(first, 'h1');

    // h4 -> h3 in rich text, links section and accordion group titles
    col.querySelectorAll([
      '.simpleparagraph h4',
      '.links-section h4',
      '.accordion.parbase > .row > h4',
    ].join(', ')).forEach((h) => renameElement(h, 'h3'));

    // lead text: div.sub-header -> p
    col.querySelectorAll('div.sub-header').forEach((d) => renameElement(d, 'p'));

    // CTA buttons in rich text -> p > strong > a
    col.querySelectorAll('.simpleparagraph a.primary-btn.button-link, .button.parbase a.primary-btn.button-link').forEach((a) => {
      if (a.closest('strong, b')) return;
      const strong = doc.createElement('strong');
      if (a.parentElement && a.parentElement.tagName === 'P') {
        a.replaceWith(strong);
        strong.append(a);
        return;
      }
      const p = doc.createElement('p');
      a.replaceWith(p);
      strong.append(a);
      p.append(strong);
    });

    // empty and &nbsp;-only paragraphs
    col.querySelectorAll('p').forEach((p) => {
      if (isEmptyText(p) && !p.querySelector('img, picture, video, iframe, svg, table, input')) p.remove();
    });
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    const doc = element.ownerDocument;

    cleanupEndOfLeaseBefore(element, doc);

    // page banners (about-us .banner-component, FAQ .faq-banner-component):
    // CSS background-image -> real <img>.
    element.querySelectorAll('.banner-component .top-section, .faq-banner-component .top-section').forEach((topSection) => {
      const src = resolveImageUrl(findBannerImageUrl(topSection));
      if (!src) return;
      const existingImg = topSection.querySelector('img');
      const alt = topSection.getAttribute('alt')
        || (existingImg && existingImg.getAttribute('alt')) || '';
      const img = doc.createElement('img');
      img.setAttribute('src', src);
      img.setAttribute('alt', alt);
      topSection.replaceWith(img);
    });

    // Overlays / consent / feedback widgets that would otherwise interfere with
    // block parsing. Remove before parsers run.
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',        // OneTrust cookie consent banner + preference modal
      '#kampyleButtonContainer',      // Kampyle "Feedback" widget button
      '.hamburger.parbase',           // body-level mobile menu shell: nav#sidebar, mobile
                                      // login form, announcements, session/maintenance/
                                      // interstitial modals — all non-authorable chrome
      '.tour-popup',                  // (empty) guided-tour popup container
      '.upgrade-message',             // scheduled-maintenance notice
      '#home-loading',                // page loading spinner
      '.bottom-info-modal',           // empty runtime info modal in #fold-1 (only a "×" close button)
      'a.carousel-control',           // carousel Previous/Next arrow controls in #fold-1
      // about-us
      '.bread-crumb.parbase',         // breadcrumb
      // hidden at every breakpoint on the source (e.g. the policy pages'
      // "View More" link in .terms-view-extra) — never visible to visitors
      '.hidden-xs.hidden-sm.hidden-md.hidden-lg',
      // newer page shell (apply_for_credit): screen-reader skip links and the
      // credit application's own loading spinner
      'a.sr-only',
      '#oca-loading',
    ]);

    // Right-hand nav column (.nav-list-component): section menus, dropped. Blog
    // articles keep theirs — the article list becomes the shared
    // /us/en/fragments/blog-articles fragment (parsers/fragment.js).
    const pageUrl = (payload && payload.params && payload.params.originalURL) || (payload && payload.url) || '';
    const isBlogArticle = /\/TFS_ThoughtFuel_Blog\/./i.test(pageUrl);
    element.querySelectorAll('.nav-list-component').forEach((el) => {
      if (!isBlogArticle) el.remove();
    });

    // VSA comparison "View Printer Friendly Version" (a.js-comparison-printer, href "#") is a
    // print button: bold link to #print = primary CTA; blocks/compare-plans prints the page.
    element.querySelectorAll('a.js-comparison-printer').forEach((a) => {
      a.setAttribute('href', '#print');
      if (!a.closest('strong, b')) {
        const strong = doc.createElement('strong');
        a.before(strong);
        strong.append(a);
      }
    });

    // FAQ answers: some pages carry a second, id-less copy of the help card inside
    // .rtequestionnaire next to the real #faqcard (shared faq-help fragment).
    if (element.querySelector('#faqcard')) {
      element.querySelectorAll('.rtequestionnaire > .container-fluid:not([id])').forEach((box) => {
        if (box.querySelector('.faq-card') && !box.querySelector('#faqcard')) box.remove();
      });
    }

    // about-us: empty .one-column-component containers only (e.g. #fair_lending).
    // Removed before sections/parsers so an empty one can never be picked as the
    // main-text section fallback. Non-empty ones (policy text/table) are kept.
    element.querySelectorAll('.one-column-component').forEach((el) => {
      if (isEmptyContainer(el)) el.remove();
    });
    // Empty lists left in rich text (e.g. contact_us has an <ul> holding only an empty <p>).
    element.querySelectorAll('#main-content ul, #main-content ol').forEach((list) => {
      if (isEmptyContainer(list)) list.remove();
    });

    // FAQ topic pages (e.g. bZ4X, support_center) carry an empty two-column
    // container; on about-us the same class holds the main text, so only empty ones go.
    element.querySelectorAll('.two-columns-left-one-column-right').forEach((el) => {
      if (isEmptyContainer(el)) el.remove();
    });

    // FAQ topic pages: the title paragraph (icon-only "#" back arrow + topic name)
    // becomes a "Back to FAQs" link to the FAQ landing page followed by the h1.
    element.querySelectorAll('p.faq_ques_text').forEach((p) => {
      const back = doc.createElement('p');
      const link = doc.createElement('a');
      link.setAttribute('href', '/us/en/planning_tools/faq.html');
      link.textContent = 'Back to FAQs';
      back.append(link);
      const h1 = doc.createElement('h1');
      p.querySelectorAll('a.faq-ques').forEach((a) => a.remove());
      h1.textContent = p.textContent.replace(/\s+/g, ' ').trim();
      p.replaceWith(back, h1);
    });

    // Policy pages: table-of-contents links (#inf, #oasa, ...) target sections whose
    // title is a styled paragraph, and element ids don't survive import. Make each
    // title a heading and point the links at the id the site generates from its text.
    const sectionSlugs = new Map();
    element.querySelectorAll('.policy-scroll-section[id]').forEach((section) => {
      const title = section.matches('p') ? section : section.querySelector(':scope > p');
      if (!title) return;
      const text = title.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
      if (!text) return;
      const heading = doc.createElement('h3');
      heading.textContent = text;
      title.replaceWith(heading);
      sectionSlugs.set(section.id, headingSlug(text));
    });
    element.querySelectorAll('a[href*="#"]').forEach((a) => {
      const [base, id] = a.getAttribute('href').split('#');
      const slug = sectionSlugs.get(id) || (KNOWN_SECTION_TITLES[id] && headingSlug(KNOWN_SECTION_TITLES[id]));
      if (slug) a.setAttribute('href', `${base}#${slug}`);
    });

    // FAQ landing: the "Popular Topics" label is a styled <p>; author it as a heading.
    element.querySelectorAll('p.faq-para').forEach((p) => {
      const h2 = doc.createElement('h2');
      h2.textContent = p.textContent.trim();
      p.replaceWith(h2);
    });

    // about-us: empty external-link anchors (no text, no image) — removed before
    // parsers so they don't end up in block cells (community card caption).
    element.querySelectorAll('a.js-external-tp').forEach((a) => {
      if (isEmptyContainer(a)) a.remove();
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome (header, footer, nav) and leftover runtime
    // elements. Runs after block parsers have extracted their cells.
    WebImporter.DOMUtils.remove(element, [
      'nav',                          // body > nav skip-links AND header nav#nav_menu / nav#sidebar
      'div.tfs-header-wrapper',       // global header wrapper (contains <header>)
      'header',                       // global header (defensive; also covered by wrapper)
      '#global-footer',               // global footer (auto-populated)
      'div.footer',                   // footer wrapper div around #global-footer
      '#destination_publishing_iframe_tfs_0', // Adobe demdex ID-sync iframe
      'iframe',                       // any remaining iframes (e.g. onetrust text-resize)
      // scroll helper anchors
      '#scroll_down',
      '#scroll_top',
      '#scroll-to-top',
      // body-level runtime hooks / hidden helpers
      '#disable-search',
      '#enableDtmHash',
      '#dtmHashValue',
      '.hiddendiv.common',
      // empty AEM parsys placeholders (verified empty in captured DOM)
      '.newpar.new.section',
      '.par.iparys_inherited',
      // safe non-content elements
      'link',
      'noscript',
    ]);

    cleanupEndOfLeaseAfter(element, element.ownerDocument);

    // Plain headings: unwrap <b>/<strong> when it is the heading's sole content
    // (ignoring whitespace and <br>), e.g. <h3><b>Our Passion</b><br></h3>.
    element.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
      const meaningful = [...heading.childNodes].filter((n) => {
        if (n.nodeType === 3) return n.textContent.trim() !== '';
        if (n.nodeType === 1) return n.tagName !== 'BR';
        return false;
      });
      if (meaningful.length !== 1) return;
      const only = meaningful[0];
      if (only.nodeType !== 1 || !['B', 'STRONG'].includes(only.tagName)) return;
      only.replaceWith(...only.childNodes);
      // Drop the now-meaningless <br> directly inside the heading.
      heading.querySelectorAll(':scope > br').forEach((br) => br.remove());
    });
  }
}
