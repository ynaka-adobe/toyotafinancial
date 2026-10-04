/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: toyotafinancial section breaks + section metadata.
 *
 * Driven entirely by `payload.template.sections` from page-templates.json, so
 * it is template-agnostic.
 *
 *   homepage: #fold-1 hero-carousel (null) | #fold-2 promos (null) |
 *             #fold-3 tools (highlight)    | #fold-4 campaign (null)
 *             -> 3 <hr>, 1 Section Metadata (highlight)
 *   about-us: .banner-component page-banner (page-banner) | main-text (null) |
 *             .banner.parbase careers-banner (null) | .heading.parbase community (null)
 *             -> company_overview: 3 <hr>, 1 Section Metadata (page-banner).
 *             Other about-us pages only match page-banner + main-text -> 1 <hr>.
 *
 * `section.selector` may be an ARRAY of candidate selectors (tried in order,
 * first match wins) or a legacy single string. Sections whose selectors match
 * nothing on the page are skipped. The first MATCHED section never gets a
 * leading <hr> (even if template section 0 is missing on this page).
 *
 * Why both hooks: block parsers run between beforeTransform and afterTransform
 * and replace the element they target. Some section elements ARE block
 * elements (about-us careers-banner `.banner.parbase` == hero-banner instance),
 * so they no longer exist in afterTransform. Therefore:
 *   beforeTransform: resolve every section element, then (reverse order) insert
 *     an <hr> before each matched section except the first matched, and for
 *     styled sections an empty marker <span> right AFTER the section element.
 *     <hr>/<span> are not <div>s, so div :nth-of-type parser selectors are
 *     unaffected.
 *   afterTransform: (reverse order) replace each marker with the Section
 *     Metadata block, so the metadata sits immediately after the section
 *     element (or whatever the parser replaced it with).
 *
 * Empty sections: each matched section element is also bracketed by comment
 * nodes (start/end). Comments are invisible to CSS selectors, so parser
 * selectors (:nth-of-type, :first-child, +, :has) are unaffected. In
 * afterTransform, a section whose content between the comments is gone or
 * empty (e.g. end-of-lease "dealer-callout" `.footer-card.parbase`, which the
 * fragment parser removes) emits nothing: its <hr>, Section Metadata marker and
 * empty leftovers are removed. If that leaves the first remaining section with
 * a leading <hr>, that <hr> is removed too.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };
const MARKER_ATTR = 'data-tfs-section-meta';
const START_PREFIX = 'tfs-section-start:';
const END_PREFIX = 'tfs-section-end:';

// Comment markers inserted in beforeTransform, keyed by marker id.
function findComments(root) {
  const found = new Map();
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, 128 /* NodeFilter.SHOW_COMMENT */);
  let n = walker.nextNode();
  while (n) {
    const v = n.nodeValue || '';
    if (v.startsWith(START_PREFIX) || v.startsWith(END_PREFIX)) found.set(v, n);
    n = walker.nextNode();
  }
  return found;
}

// No visible text and no media / block table.
function isEmptyNode(node) {
  if (node.nodeType === 3) return node.textContent.replace(/\u00a0/g, ' ').trim() === '';
  if (node.nodeType !== 1) return true; // comments etc.
  if (node.hasAttribute(MARKER_ATTR)) return true;
  if (/^(IMG|PICTURE|VIDEO|IFRAME|SVG|TABLE)$/i.test(node.tagName)) return false;
  return node.textContent.replace(/\u00a0/g, ' ').trim() === ''
    && !node.querySelector('img, picture, video, iframe, svg, table');
}

// Nodes strictly between start and end (null if they are not siblings).
function nodesBetween(start, end) {
  if (!start || !end || start.parentNode !== end.parentNode) return null;
  const nodes = [];
  for (let n = start.nextSibling; n && n !== end; n = n.nextSibling) nodes.push(n);
  return nodes;
}

// The <hr> inserted immediately before the start marker, if any.
function breakBefore(start) {
  const prev = start && start.previousSibling;
  return prev && prev.nodeType === 1 && prev.tagName === 'HR' ? prev : null;
}

function toSelectorList(selector) {
  if (Array.isArray(selector)) return selector.filter((s) => typeof s === 'string' && s.trim());
  if (typeof selector === 'string' && selector.trim()) return [selector];
  return [];
}

// First selector (in order) that matches wins.
function querySection(root, selector) {
  for (const sel of toSelectorList(selector)) {
    let el = null;
    try { el = root.querySelector(sel); } catch (e) { el = null; }
    if (el) return el;
  }
  return null;
}

function markerId(section, index) {
  return String(section.id || section.name || `section-${index}`);
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  const sections = (template && Array.isArray(template.sections)) ? template.sections : [];
  if (!sections.length) return;
  const doc = element.ownerDocument || (payload && payload.document);

  if (hookName === TransformHook.beforeTransform) {
    // Resolve all section elements first (document order of the template), so
    // we know which one is the first MATCHED section. An element already
    // claimed by an earlier section is not reused.
    const claimed = new Set();
    const resolved = sections.map((section) => {
      if (!section) return null;
      const el = querySection(element, section.selector);
      if (!el || claimed.has(el)) return null;
      claimed.add(el);
      return el;
    });
    const firstMatched = resolved.findIndex((el) => el);
    if (firstMatched === -1) return;

    // Reverse order: insertions next to later sections never shift earlier ones.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const el = resolved[i];
      if (!el) continue;
      const section = sections[i];
      const id = markerId(section, i);

      // el, [meta marker], end comment
      el.after(doc.createComment(`${END_PREFIX}${id}`));
      if (section.style) {
        const marker = doc.createElement('span');
        marker.setAttribute(MARKER_ATTR, id);
        el.after(marker);
      }

      // [hr], start comment, el
      const start = doc.createComment(`${START_PREFIX}${id}`);
      el.before(start);
      if (i !== firstMatched) {
        start.before(doc.createElement('hr'));
      }
    }
  }

  if (hookName === TransformHook.afterTransform) {
    const comments = findComments(element);

    // Drop sections whose element was removed by a parser or is empty.
    let firstKept = -1;
    for (let i = 0; i < sections.length; i += 1) {
      const section = sections[i];
      if (!section) continue;
      const id = markerId(section, i);
      const start = comments.get(`${START_PREFIX}${id}`);
      const end = comments.get(`${END_PREFIX}${id}`);
      if (!start && !end) continue; // section not matched on this page
      const between = nodesBetween(start, end);
      if (between && between.every(isEmptyNode)) {
        const hr = breakBefore(start);
        if (hr) hr.remove();
        between.forEach((n) => n.remove()); // includes the meta marker
      } else if (firstKept === -1) {
        firstKept = i;
        // The first matched section never gets a break, so a break here only
        // exists because every earlier matched section was dropped: remove it.
        const hr = breakBefore(start);
        if (hr) hr.remove();
      }
    }
    comments.forEach((c) => c.remove());

    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section || !section.style) continue;
      const marker = element.querySelector(`[${MARKER_ATTR}="${markerId(section, i)}"]`);
      if (!marker) continue; // section not matched on this page — skip, never guess

      const block = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      marker.replaceWith(block);
    }
  }
}
