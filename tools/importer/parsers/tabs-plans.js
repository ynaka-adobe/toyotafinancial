/* eslint-disable */
/* global WebImporter */

/**
 * Parser for tabs-plans. Base: tabs.
 * Source: https://www.toyotafinancial.com/us/en/vehicle_protection_plan/prepaid_maintenance_plan.html
 *   (+ vehicle_service_agreements: 4 groups; tire_wheel_protection: 1 tab group, NO dropdown)
 * Selectors (page-templates.json):
 *   #main-content .screenFade .card-component.parbase:has(.materialized-dropdown)   (dropdown card)
 *   #main-content .screenFade .tabcomponent                                          (each tab group)
 * Generated: 2026-10-04
 *
 * Content model (blocks/tabs-plans/README.md "Section-based authoring model (exact)"):
 *   | Tabs Plans |  1 row / 1 cell = dropdown label
 *   then ONE SECTION PER TAB PANEL, each ending with
 *   | Section Metadata | Tab Group | <dropdown option label> |, | Tab | <tab label> |
 *   Sections are separated by <hr>. The panel sections follow the block's section directly; the
 *   next template section (inserted by the sections transformer) has no `Tab`, which ends the set.
 *
 * Source structure (verified in cached source.html + live DOM of the 3 pages):
 *   parent column > div.card-component.parbase (label.select-label + .materialized-dropdown
 *                   li.option[data-value]) + div.tabcomponent (one per group) ...
 *   .tabcomponent > .materialized-dropdown-group.<data-value>      (absent on tire_wheel)
 *                   > ul.nav-tabs li > a[href="#paneId"] (tab label)
 *                   > .tab-content > .tab-pane#paneId > rte / nested-two-column / card-component /
 *                     accordion.parbase ...
 * Blocks inside panels (table-caption, columns-callout, accordion-faq) are parsed BEFORE this
 * parser (tabs-plans is last in blocks[]), so the panel children already hold their block
 * tables; they are MOVED as-is into the panel sections, together with the default content.
 *
 * Flow:
 *   - dropdown card call: build block + every panel of every consecutive sibling .tabcomponent,
 *     remove the tabcomponents (later calls on them are no-ops: detached).
 *   - .tabcomponent call with no dropdown card on the page (tire_wheel): block with a neutral
 *     label (not rendered with a single group) and panels WITHOUT `Tab Group` (plain tab bar),
 *     for this and every consecutive sibling .tabcomponent.
 *   - dropdown card with NO .tabcomponent (how_to_file_a_claim): the card holds one
 *     .materialized-dropdown-group.<data-value> per option (all in the DOM, hidden) and no tab
 *     bar. Label = p.card-header; one panel per group with `Tab Group` = `Tab` = option label;
 *     <b>/<strong> wrapping a heading is unwrapped. Only used when no tab group was found, so
 *     the tabcomponent pages are unaffected.
 *   - An <hr> directly before a removed .tabcomponent (section break added by the sections
 *     transformer for the rc8-tabs section) is removed so it does not create an empty section.
 *   - If authored content follows the last panel inside <main> before the next section break,
 *     an <hr> is added after the last Section Metadata so that content is not folded into the
 *     last panel (the section after the last panel must not carry `Tab`).
 * Validated 2026-10-04 through the full html2md pipeline: PPM 7 panels / 2 groups,
 * VSA 13 panels / 4 groups, tire_wheel 3 panels / no group.
 */
const NEUTRAL_LABEL = 'Select a plan';
const NEUTRAL_GROUP = 'Plans';

function cleanText(el) {
  return (el.textContent || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

// Consecutive .tabcomponent siblings after `start` (section-break <hr>s in between are skipped).
function collectTabComponents(start, includeStart) {
  const list = includeStart ? [start] : [];
  let next = start.nextElementSibling;
  while (next) {
    if (next.tagName === 'HR') { next = next.nextElementSibling; continue; }
    if (!next.matches('.tabcomponent')) break;
    list.push(next);
    next = next.nextElementSibling;
  }
  return list;
}

// Chrome the cleanup transformer only removes in afterTransform (header/footer/nav/iframes):
// it must not count as content that follows the tab set.
const CHROME = 'nav, header, footer, .footer, .tfs-header-wrapper, iframe, script, style, noscript, link';

// True when authored content (text or media) follows `node` inside <main> before the next
// section break. Without a break that content would land in the LAST panel's section and be
// shown only inside that tab.
function contentFollows(node, document) {
  const root = node.closest('main') || document.body;
  const walker = document.createTreeWalker(root, 1 | 4); // elements + text
  walker.currentNode = node;
  let n = walker.nextNode();
  while (n && node.contains(n)) n = walker.nextNode();
  while (n) {
    if (n.nodeType === 1) {
      if (n.tagName === 'HR') return false;
      if (/^(IMG|PICTURE|VIDEO|TABLE)$/.test(n.tagName) && !n.closest(CHROME)) return true;
    } else if (n.textContent.replace(/ /g, ' ').trim() && !n.parentElement.closest(CHROME)) {
      return true;
    }
    n = walker.nextNode();
  }
  return false;
}

function removeTabComponent(tc) {
  const prev = tc.previousElementSibling;
  if (prev && prev.tagName === 'HR') prev.remove();
  tc.remove();
}

// [{ group, tab, pane }] for one .tabcomponent
function readPanels(tc, optionLabels, fallbackGroup) {
  const panels = [];
  const groupEls = [...tc.querySelectorAll('.materialized-dropdown-group')];
  const scopes = groupEls.length ? groupEls : [tc];
  scopes.forEach((scope) => {
    let group = fallbackGroup;
    if (scope !== tc) {
      const key = [...scope.classList].find((c) => optionLabels.has(c));
      if (key) group = optionLabels.get(key);
    }
    const tabLinks = [...scope.querySelectorAll('.nav-tabs a[href^="#"], .nav-tabs a[data-toggle="tab"]')];
    tabLinks.forEach((a) => {
      const id = (a.getAttribute('href') || '').replace(/^#/, '');
      const label = cleanText(a);
      if (!id || !label) return;
      const pane = [...scope.querySelectorAll('.tab-pane')].find((p) => p.id === id);
      if (!pane) return;
      panels.push({ group, tab: label, pane });
    });
    // Panes without a tab link are not reachable on the source -> not imported.
  });
  return panels;
}

// [{ group, tab, pane }] for a dropdown card whose .materialized-dropdown-group.<data-value>
// panels sit inside the card (no .tabcomponent): Tab Group and Tab are both the option label.
function readCardGroups(card, optionLabels) {
  const panels = [];
  card.querySelectorAll('.materialized-dropdown-group').forEach((pane) => {
    if (pane.closest('.tabcomponent')) return;
    const key = [...pane.classList].find((c) => optionLabels.has(c));
    if (!key) return;
    // Headings authored as <hN><b>text</b></hN>: unwrap the bold so the heading is plain.
    pane.querySelectorAll('h1 > b, h2 > b, h3 > b, h4 > b, h5 > b, h6 > b, h1 > strong, h2 > strong, h3 > strong, h4 > strong, h5 > strong, h6 > strong')
      .forEach((b) => b.replaceWith(...b.childNodes));
    const label = optionLabels.get(key);
    panels.push({ group: label, tab: label, pane });
  });
  return panels;
}

function buildOutput(document, label, panels) {
  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-plans', cells: [[label]] });
  const rest = [];
  panels.forEach(({ group, tab, pane }) => {
    rest.push(document.createElement('hr'));
    const content = [...pane.childNodes].filter((n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim()));
    rest.push(...content);
    const metaCells = {};
    if (group) metaCells['Tab Group'] = group;
    metaCells.Tab = tab;
    rest.push(WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: metaCells }));
  });
  return { block, rest };
}

export default function parse(element, { document }) {
  if (!element.parentNode) return; // tab group already consumed by the dropdown card call

  const isDropdownCard = element.matches('.card-component, .card-component.parbase')
    && !!element.querySelector('.materialized-dropdown');

  let label = NEUTRAL_LABEL;
  const optionLabels = new Map();
  let tabComponents;
  let fallbackGroup = NEUTRAL_GROUP;

  if (isDropdownCard) {
    const labelEl = element.querySelector('label.select-label, label, .card-header');
    if (labelEl && cleanText(labelEl)) label = cleanText(labelEl);
    element.querySelectorAll('.materialized-dropdown li.option, .materialized-dropdown option, select option')
      .forEach((o) => {
        const key = o.getAttribute('data-value') || o.getAttribute('value');
        if (key && cleanText(o)) optionLabels.set(key, cleanText(o));
      });
    tabComponents = collectTabComponents(element, false);
    if (!tabComponents.length && element.parentElement) {
      tabComponents = [...element.parentElement.querySelectorAll(':scope > .tabcomponent')];
    }
    fallbackGroup = optionLabels.size ? [...optionLabels.values()][0] : NEUTRAL_GROUP;
  } else {
    // A .tabcomponent: if a dropdown card precedes it, that card's call owns it.
    let prev = element.previousElementSibling;
    while (prev && (prev.tagName === 'HR' || prev.matches('.tabcomponent'))) prev = prev.previousElementSibling;
    if (prev && prev.matches('.card-component') && prev.querySelector('.materialized-dropdown')) return;
    tabComponents = collectTabComponents(element, true);
    // No dropdown on the source (tire_wheel): omit `Tab Group` on every panel -> plain tab bar
    // (README: "Omit it on every panel for a plain tab bar with no dropdown").
    fallbackGroup = '';
  }

  const panels = [];
  tabComponents.forEach((tc) => panels.push(...readPanels(tc, optionLabels, fallbackGroup)));
  // Dropdown card with NO .tabcomponent (how_to_file_a_claim): the option groups live inside
  // the card itself, one per option, without a tab bar -> one panel per group.
  if (isDropdownCard && !tabComponents.length) panels.push(...readCardGroups(element, optionLabels));

  // Empty-block guard: nothing to build.
  if (!panels.length) {
    if (!isDropdownCard) element.replaceWith(...element.childNodes);
    else element.remove();
    return;
  }

  const { block, rest } = buildOutput(document, label, panels);
  if (isDropdownCard) {
    tabComponents.forEach(removeTabComponent);
    element.replaceWith(block);
  } else {
    tabComponents.slice(1).forEach(removeTabComponent);
    // Same as the dropdown case: the block stays in the section that introduces the tabs,
    // so drop the transformer's section break directly before the first tab group.
    const prev = element.previousElementSibling;
    if (prev && prev.tagName === 'HR') prev.remove();
    element.replaceWith(block);
  }
  block.after(...rest);
  // Close the tab set: content after the last panel (before the next template section break)
  // must start a section without `Tab`, or it would be folded into the last panel.
  const lastMeta = rest[rest.length - 1];
  if (contentFollows(lastMeta, document)) lastMeta.after(document.createElement('hr'));
}
