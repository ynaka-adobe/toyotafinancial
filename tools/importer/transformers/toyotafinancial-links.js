/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: toyotafinancial link rewriting.
 *
 * The linked pages are not migrated yet, so every link must keep pointing at
 * the ORIGINAL site. Site-relative hrefs are rewritten to absolute
 * https://www.toyotafinancial.com URLs, and the AEM "/content/toyotafinancial"
 * repository prefix is stripped. Query strings and hashes are preserved.
 *
 * Href patterns verified in migration-work/cleaned.html (about-us) and
 * migration-work/archive-homepage-analysis/cleaned.html (homepage):
 *   /us/en/planning_tools/faq.html                      -> https://www.toyotafinancial.com/us/en/planning_tools/faq.html
 *   /dss/login                                          -> https://www.toyotafinancial.com/dss/login
 *   /content/toyotafinancial/us/en/consumer-web.html/... -> https://www.toyotafinancial.com/us/en/consumer-web.html/...
 *   /myaccounts/w/ (any other root-relative path)       -> https://www.toyotafinancial.com/myaccounts/w/
 *   https://www.toyotafinancial.com/content/toyotafinancial/... -> prefix stripped
 * Left untouched: "#..." in-page anchors, "/" (site root), external/absolute
 * links, protocol-relative "//host", mailto:/tel:/javascript: and empty hrefs.
 *
 * Runs in afterTransform only, so links inside parser-built block tables are
 * rewritten too. Register BEFORE the DM transformer.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const SITE_ORIGIN = 'https://www.toyotafinancial.com';
const CONTENT_PREFIX_RE = /^\/content\/toyotafinancial(?=[/?#]|$)/i;
const SITE_ABSOLUTE_RE = /^https?:\/\/(www\.)?toyotafinancial\.com(?=[/?#]|$)/i;

function rewriteHref(rawHref) {
  const href = (rawHref || '').trim();
  if (!href) return null;

  // Absolute URL on the source site that still carries the repository prefix.
  const abs = href.match(SITE_ABSOLUTE_RE);
  if (abs) {
    const rest = href.slice(abs[0].length);
    if (!CONTENT_PREFIX_RE.test(rest)) return null;
    return `${SITE_ORIGIN}${rest.replace(CONTENT_PREFIX_RE, '') || '/'}`;
  }

  // Only root-relative paths (not "/", not protocol-relative "//host").
  if (!href.startsWith('/') || href.startsWith('//') || href === '/') return null;

  const path = href.replace(CONTENT_PREFIX_RE, '');
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  element.querySelectorAll('a[href]').forEach((a) => {
    const next = rewriteHref(a.getAttribute('href'));
    if (next) a.setAttribute('href', next);
  });
}
