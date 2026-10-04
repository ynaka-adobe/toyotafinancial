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
 *     label + one Tab Group for this and every consecutive sibling .tabcomponent.
 *   - An <hr> directly before a removed .tabcomponent (section break added by the sections
 *     transformer for the rc8-tabs section) is removed so it does not create an empty section.
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
  }

  const panels = [];
  tabComponents.forEach((tc) => panels.push(...readPanels(tc, optionLabels, fallbackGroup)));

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
}
