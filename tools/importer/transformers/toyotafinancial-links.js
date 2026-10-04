/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: toyotafinancial link rewriting.
 *
 * Links to pages already migrated (MIGRATED_PATHS below) become new-site paths
 * (e.g. /us/en/planning_tools/faq.html -> /us/en/planning-tools/faq). Every other
 * site link keeps pointing at the ORIGINAL site: site-relative hrefs are rewritten
 * to absolute https://www.toyotafinancial.com URLs, and the AEM
 * "/content/toyotafinancial" repository prefix is stripped. Query strings and
 * hashes are preserved.
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

// Source pages that are migrated to the new site, as source paths without
// ".html". Links to these become new-site paths (sanitized like the import
// output paths, e.g. /us/en/about_us/company_overview -> /us/en/about-us/company-overview)
// instead of pointing at the original site. Add pages here as they are migrated.
const FAQ_TOPICS = [
  'about_credit', 'about-tfs', 'about_this_website', 'account_access_and_password', 'account_details',
  'account_registration', 'billing', 'business_solutions', 'bZ4X',
  'consent_to_electronic_communications_and_agreements', 'encrypted-email', 'enrolling_in_pay_online',
  'extension_and_deferral', 'financial-hardship', 'fingerprint_authentication',
  'Guaranteed_Auto_Protection_GAP', 'insurance_in_case_of_accident', 'insurance_requirements',
  'lease_end_process', 'loan_payoff_and_title_lien_release', 'login-faqs', 'managing_pay_online',
  'marketing_preferences', 'mileage', 'military_benefits', 'mobileapp-faqs', 'One_Big_Beautiful_Bill_Act',
  'online_credit_application', 'paperless_billing', 'payments', 'privacy', 'repeat_customers', 'shopping',
  'support_center', 'toyota_insurance', 'financing_and_protection_products',
  'voluntary_protection_products', 'wear_and_use',
];
const MIGRATED_PATHS = new Set([
  '/us/en',
  '/us/en/about_us/company_overview',
  '/us/en/accessibility',
  '/us/en/online_policies_and_agreements',
  '/us/en/online_privacy_policy',
  '/us/en/planning_tools/faq',
  '/us/en/planning_tools/get_started',
  ...FAQ_TOPICS.map((t) => `/us/en/planning_tools/faq/${t}`),
].map((p) => p.toLowerCase()));

// Same rules as the import output paths (WebImporter.FileUtils.sanitizePath).
function sanitizePath(path) {
  if (typeof WebImporter !== 'undefined' && WebImporter.FileUtils && WebImporter.FileUtils.sanitizePath) {
    return WebImporter.FileUtils.sanitizePath(path);
  }
  return path.toLowerCase().split('/').map((s) => s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')).join('/');
}

// Paths that only exist on the new site (e.g. shared fragments) are never rewritten.
const NEW_SITE_PREFIXES = ['/us/en/fragments/'];
const MIGRATED_NEW_PATHS = new Set([...MIGRATED_PATHS].map((p) => sanitizePath(p)));

function isNewSitePath(sitePath) {
  const pathname = sitePath.split(/[?#]/)[0].replace(/\/$/, '');
  return NEW_SITE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    || MIGRATED_NEW_PATHS.has(pathname);
}

// "/us/en/x.html?q#h" -> new-site path when x is migrated, else null.
function toMigratedPath(sitePath) {
  const m = sitePath.match(/^([^?#]*)([?#].*)?$/);
  const pathname = m[1].replace(/\.html?$/i, '').replace(/\/$/, '');
  if (!MIGRATED_PATHS.has(pathname.toLowerCase())) return null;
  return `${sanitizePath(pathname)}${m[2] || ''}`;
}

function rewriteHref(rawHref) {
  const href = (rawHref || '').trim();
  if (!href) return null;

  // Absolute URL on the source site (optionally carrying the repository prefix).
  const abs = href.match(SITE_ABSOLUTE_RE);
  if (abs) {
    const after = href.slice(abs[0].length);
    const rest = after.replace(CONTENT_PREFIX_RE, '') || '/';
    const migrated = toMigratedPath(rest);
    if (migrated) return migrated;
    if (!CONTENT_PREFIX_RE.test(after)) return null;
    return `${SITE_ORIGIN}${rest}`;
  }

  // Only root-relative paths (not "/", not protocol-relative "//host").
  if (!href.startsWith('/') || href.startsWith('//') || href === '/') return null;

  let path = href.replace(CONTENT_PREFIX_RE, '');
  if (!path.startsWith('/')) path = `/${path}`;
  if (isNewSitePath(path)) return path === href ? null : path;
  return toMigratedPath(path) || `${SITE_ORIGIN}${path}`;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  element.querySelectorAll('a[href]').forEach((a) => {
    const next = rewriteHref(a.getAttribute('href'));
    if (next) a.setAttribute('href', next);
  });
}
