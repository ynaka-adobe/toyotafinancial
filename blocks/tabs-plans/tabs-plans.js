import { loadSection } from '../../scripts/aem.js';

/*
 * tabs-plans: section-based tabs with an optional group dropdown
 * (TFS Prepaid Maintenance Plan: model-year dropdown + tab bar per year group).
 *
 * Authoring:
 *  - The block itself: 1 row, 1 cell = the dropdown label
 *    ("Please select the description that best describes you").
 *  - Each tab panel is its own section placed directly after the block's section, ending with a
 *    Section Metadata block: Tab Group = <dropdown option> (optional), Tab = <tab label>.
 *  - The block collects consecutive following sections that carry a "Tab" value, stopping at the
 *    first section without one. Distinct Tab Group values (in authored order) become the dropdown
 *    options; with a single group (or none) no dropdown is rendered.
 *  - Fallback: rows with 2 cells inside the block ([tab label] | [panel content]) are also accepted
 *    as one group of tabs, as in the boilerplate tabs model.
 *
 * Behaviour: first group and its first tab are active on load; clicking a tab swaps the panel in
 * place (no URL change); arrow keys / Home / End move between tabs; the dropdown swaps groups.
 */
let instanceCount = 0;

function collectSections(block) {
  const section = block.closest('.section');
  const tabs = [];
  if (!section) return tabs;
  let next = section.nextElementSibling;
  while (next && next.classList.contains('section') && next.dataset.tab) {
    tabs.push({
      group: (next.dataset.tabGroup || '').trim(),
      label: next.dataset.tab.trim(),
      section: next,
    });
    next = next.nextElementSibling;
  }
  return tabs;
}

function collectRows(block) {
  return [...block.children]
    .filter((row) => row.children.length >= 2)
    .map((row) => {
      const [label, content] = row.children;
      const holder = document.createElement('div');
      holder.append(...content.childNodes);
      row.remove();
      return { group: '', label: label.textContent.trim(), content: holder };
    });
}

function groupTabs(tabs) {
  const groups = [];
  tabs.forEach((tab) => {
    let group = groups.find((g) => g.name === tab.group);
    if (!group) {
      group = { name: tab.group, items: [] };
      groups.push(group);
    }
    group.items.push(tab);
  });
  return groups;
}

function activateTab(tablist, panels, button, focus) {
  const buttons = [...tablist.querySelectorAll('[role="tab"]')];
  buttons.forEach((btn) => {
    const selected = btn === button;
    btn.setAttribute('aria-selected', selected);
    btn.tabIndex = selected ? 0 : -1;
    const panel = [...panels.children].find((p) => p.id === btn.getAttribute('aria-controls'));
    if (panel) panel.hidden = !selected;
  });
  if (focus) button.focus();
}

function buildGroup(group, gi, prefix) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tabs-plans-group';
  wrapper.id = `${prefix}-group-${gi}`;
  if (group.name) wrapper.dataset.group = group.name;

  const tablist = document.createElement('div');
  tablist.className = 'tabs-plans-list';
  tablist.setAttribute('role', 'tablist');
  if (group.name) tablist.setAttribute('aria-label', group.name);

  const panels = document.createElement('div');
  panels.className = 'tabs-plans-panels';

  group.items.forEach((tab, ti) => {
    const id = `${prefix}-g${gi}-t${ti}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tabs-plans-tab';
    button.id = `${id}-tab`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', `${id}-panel`);
    button.textContent = tab.label;
    tablist.append(button);

    const panel = document.createElement('div');
    panel.className = 'tabs-plans-panel';
    panel.id = `${id}-panel`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', button.id);
    panel.tabIndex = 0;
    panel.append(tab.section || tab.content);
    panels.append(panel);
  });

  tablist.addEventListener('click', (e) => {
    const button = e.target.closest('[role="tab"]');
    if (button) activateTab(tablist, panels, button, false);
  });

  tablist.addEventListener('keydown', (e) => {
    const buttons = [...tablist.querySelectorAll('[role="tab"]')];
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    let target;
    if (e.key === 'ArrowRight') target = (current + 1) % buttons.length;
    else if (e.key === 'ArrowLeft') target = (current - 1 + buttons.length) % buttons.length;
    else if (e.key === 'Home') target = 0;
    else if (e.key === 'End') target = buttons.length - 1;
    else return;
    e.preventDefault();
    activateTab(tablist, panels, buttons[target], true);
  });

  activateTab(tablist, panels, tablist.querySelector('[role="tab"]'), false);
  wrapper.append(tablist, panels);
  return wrapper;
}

export default async function decorate(block) {
  instanceCount += 1;
  const prefix = `tabs-plans-${instanceCount}`;

  const sectionTabs = collectSections(block);
  const tabs = sectionTabs.length ? sectionTabs : collectRows(block);
  const groups = groupTabs(tabs);
  const firstRowLabel = [...block.children]
    .find((row) => row.children.length < 2)?.textContent.trim() || '';

  block.textContent = '';
  if (!groups.length) return;

  const groupEls = groups.map((group, gi) => buildGroup(group, gi, prefix));

  if (groups.length > 1) {
    const picker = document.createElement('div');
    picker.className = 'tabs-plans-picker';
    const label = document.createElement('label');
    label.className = 'tabs-plans-picker-label';
    label.htmlFor = `${prefix}-select`;
    label.textContent = firstRowLabel || 'Select an option';
    const select = document.createElement('select');
    select.className = 'tabs-plans-select';
    select.id = `${prefix}-select`;
    groups.forEach((group, gi) => {
      const option = document.createElement('option');
      option.value = String(gi);
      option.textContent = group.name || `Option ${gi + 1}`;
      select.append(option);
    });
    select.setAttribute('aria-controls', groupEls.map((el) => el.id).join(' '));
    select.addEventListener('change', () => {
      groupEls.forEach((el, gi) => { el.hidden = String(gi) !== select.value; });
    });
    picker.append(label, select);
    block.append(picker);
  }

  groupEls.forEach((el, gi) => {
    el.hidden = gi !== 0;
    block.append(el);
  });

  // panel sections were moved inside the block: load their blocks now (they are no longer
  // reachable as top-level sections, and must not wait for their original turn)
  await Promise.all(sectionTabs.map(({ section }) => loadSection(section)));
}
