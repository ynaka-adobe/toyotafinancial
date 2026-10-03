import { decorateIcons } from '../../scripts/aem.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(width >= 900px)');

/**
 * Fetches the nav fragment: /content first (local preview), then the site root (DA/EDS).
 * @returns {Promise<HTMLElement|null>} container holding the fragment sections
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // published documents wrap list-item content in <p>; unwrap so items hold their links directly
  container.querySelectorAll('li > p').forEach((p) => p.replaceWith(...p.childNodes));
  decorateIcons(container);
  return container;
}

/**
 * Sets a toggle button and its panel to the given open state.
 * @param {Element} toggle button controlling the panel
 * @param {Element} panel controlled panel
 * @param {boolean} open whether the panel should be open
 */
function setOpen(toggle, panel, open) {
  if (!toggle || !panel) return;
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  panel.setAttribute('aria-hidden', open ? 'false' : 'true');
}

/**
 * Closes every open header panel (menu, search, mobile sub-menus).
 * @param {Element} nav the nav element
 */
function closeAll(nav) {
  nav.querySelectorAll('[aria-controls]').forEach((toggle) => {
    setOpen(toggle, nav.querySelector(`#${toggle.getAttribute('aria-controls')}`), false);
  });
  nav.querySelectorAll('.nav-mega [aria-expanded="true"]').forEach((heading) => {
    heading.setAttribute('aria-expanded', 'false');
  });
  nav.classList.remove('is-menu-open', 'is-search-open');
}

/**
 * Column headings are static labels on desktop and expand/collapse toggles on mobile.
 * @param {Element} nav the nav element
 */
function syncHeadingToggles(nav) {
  nav.querySelectorAll('.nav-mega-heading, .nav-mega-group-label').forEach((heading) => {
    if (isDesktop.matches) {
      heading.removeAttribute('role');
      heading.removeAttribute('aria-expanded');
      heading.setAttribute('tabindex', '-1');
    } else {
      heading.setAttribute('role', 'button');
      heading.setAttribute('aria-expanded', 'false');
      heading.removeAttribute('tabindex');
    }
  });
}

/**
 * Builds a toggle button labelled by the given fragment paragraph (icons + text).
 * @param {Element} source paragraph carrying the icon images and label text
 * @param {string} className button class
 * @param {string} controls id of the controlled panel
 * @returns {HTMLButtonElement}
 */
function buildToggle(source, className, controls) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('aria-controls', controls);
  button.setAttribute('aria-expanded', 'false');
  if (source) {
    const [openIcon, closeIcon] = source.querySelectorAll('img');
    if (openIcon) {
      openIcon.classList.add('nav-toggle-icon-open');
      button.append(openIcon);
    }
    if (closeIcon) {
      closeIcon.classList.add('nav-toggle-icon-close');
      button.append(closeIcon);
    }
    const text = source.textContent.trim();
    if (text) {
      const label = document.createElement('span');
      label.className = 'nav-toggle-label';
      label.textContent = text;
      button.append(label);
      button.setAttribute('aria-label', text);
    }
  }
  return button;
}

/**
 * Builds the search toggle and search bar from the fragment's search link
 * (link href = results page, link text = placeholder).
 * @param {Element} link search link from the fragment
 * @returns {{ toggle: HTMLButtonElement, panel: HTMLFormElement }}
 */
function buildSearch(link) {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-search-toggle';
  toggle.setAttribute('aria-label', 'Search');
  toggle.setAttribute('aria-controls', 'nav-search');
  toggle.setAttribute('aria-expanded', 'false');

  const panel = document.createElement('form');
  panel.id = 'nav-search';
  panel.className = 'nav-search';
  panel.setAttribute('role', 'search');
  panel.setAttribute('aria-hidden', 'true');
  panel.method = 'get';
  panel.action = link ? link.getAttribute('href') : '';

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'query';
  input.placeholder = link ? link.textContent.trim() : '';
  input.setAttribute('aria-label', input.placeholder || 'Search');

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.setAttribute('aria-label', 'Submit search');

  panel.append(input, submit);
  return { toggle, panel };
}

/**
 * Mobile accordion: toggles one heading and collapses its open siblings (single expand).
 * @param {Element} link heading link acting as the toggle
 * @param {string} siblingSelector selector for the toggles at the same level
 */
function toggleAccordion(link, siblingSelector) {
  const expanded = link.getAttribute('aria-expanded') === 'true';
  const scope = link.closest('.nav-mega-columns, .nav-mega-list');
  scope.querySelectorAll(siblingSelector).forEach((other) => {
    if (other !== link) other.setAttribute('aria-expanded', 'false');
  });
  link.setAttribute('aria-expanded', expanded ? 'false' : 'true');
}

/**
 * Converts the fragment's nested megamenu list into a card of columns.
 * A top-level item with a nested list becomes a column (its link is the heading);
 * a lone link becomes a standalone column link. Emphasised items are sub-group labels.
 * @param {Element} section megamenu fragment section
 * @returns {HTMLElement} the megamenu panel
 */
function buildMegamenu(section) {
  const panel = document.createElement('div');
  panel.id = 'nav-mega';
  panel.className = 'nav-mega nav-megamenu';
  panel.setAttribute('aria-hidden', 'true');

  const columns = document.createElement('ul');
  columns.className = 'nav-mega-columns';

  const topList = section ? section.querySelector(':scope > ul') : null;
  if (topList) {
    [...topList.children].forEach((item) => {
      const column = document.createElement('li');
      column.className = 'nav-mega-column';
      const subList = item.querySelector(':scope > ul');
      const link = item.querySelector(':scope > a');

      if (!subList) {
        column.classList.add('nav-mega-column-link');
        if (link) column.append(link);
        columns.append(column);
        return;
      }

      let heading = link;
      if (heading) {
        heading.addEventListener('click', (e) => {
          e.preventDefault();
          if (!isDesktop.matches) toggleAccordion(heading, ':scope > .nav-mega-column > .nav-mega-heading');
        });
      } else {
        heading = document.createElement('p');
        heading.textContent = item.firstChild ? item.firstChild.textContent.trim() : '';
      }
      heading.classList.add('nav-mega-heading');
      subList.classList.add('nav-mega-list');
      subList.querySelectorAll(':scope > li').forEach((li) => {
        const em = li.querySelector(':scope > em');
        const groupLink = em ? em.querySelector('a') : null;
        if (!groupLink) return;
        // the label link sits directly before its nested list (accordion toggle + panel)
        em.replaceWith(groupLink);
        groupLink.classList.add('nav-mega-group-label');
        li.classList.add('nav-mega-group');
        const nested = li.querySelector(':scope > ul');
        if (nested) nested.classList.add('nav-mega-sublist');
        // the trailing colon is shown on desktop only
        const last = groupLink.lastChild;
        if (last && last.nodeType === Node.TEXT_NODE && last.textContent.trim().endsWith(':')) {
          last.textContent = last.textContent.replace(/:\s*$/, '');
          const colon = document.createElement('span');
          colon.className = 'nav-mega-colon';
          colon.textContent = ':';
          groupLink.append(colon);
        }
        groupLink.addEventListener('click', (e) => {
          e.preventDefault();
          if (!isDesktop.matches) toggleAccordion(groupLink, ':scope > .nav-mega-group > .nav-mega-group-label');
        });
      });
      column.append(heading, subList);
      columns.append(column);
    });
  }

  panel.append(columns);
  return panel;
}

/**
 * Decorates the header, loading the nav fragment and wiring behaviors.
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const [brandSection, toolsSection, megaSection] = [...fragment.querySelectorAll(':scope > div')];

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main site navigation');

  const bar = document.createElement('div');
  bar.className = 'nav-bar';

  // brand
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (brandSection) brand.append(...brandSection.children);
  bar.append(brand);

  // tools: utility links, search toggle, menu toggle
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  const utilityList = toolsSection ? toolsSection.querySelector(':scope > ul') : null;
  if (utilityList) {
    utilityList.classList.add('nav-utility');
    utilityList.querySelectorAll('a').forEach((a) => {
      const label = document.createElement('span');
      [...a.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .forEach((n) => label.append(n));
      a.append(label);
      const icon = a.querySelector('img');
      if (icon) {
        icon.classList.add('nav-utility-icon');
        a.setAttribute('aria-label', label.textContent.trim());
        a.closest('li').classList.add('nav-utility-has-icon');
      }
    });
    tools.append(utilityList);
  }
  const paragraphs = toolsSection ? [...toolsSection.querySelectorAll(':scope > p')] : [];
  const searchLink = paragraphs.map((p) => p.querySelector('a')).find(Boolean);
  const menuSource = paragraphs.find((p) => p.querySelector('img'));

  const search = buildSearch(searchLink);
  const menuToggle = buildToggle(menuSource, 'nav-menu-toggle', 'nav-mega');
  tools.append(search.toggle, menuToggle);
  bar.append(tools);

  const mega = buildMegamenu(megaSection);
  nav.append(bar, search.panel, mega);
  syncHeadingToggles(nav);

  // dimmed backdrop behind the mobile menu card
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  backdrop.addEventListener('click', () => {
    closeAll(nav);
  });

  // behaviors
  menuToggle.addEventListener('click', () => {
    const open = mega.getAttribute('aria-hidden') !== 'false';
    closeAll(nav);
    setOpen(menuToggle, mega, open);
    nav.classList.toggle('is-menu-open', open);
  });

  search.toggle.addEventListener('click', () => {
    const open = search.panel.getAttribute('aria-hidden') !== 'false';
    closeAll(nav);
    setOpen(search.toggle, search.panel, open);
    nav.classList.toggle('is-search-open', open);
    if (open) search.panel.querySelector('input').focus();
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      closeAll(nav);
    }
  });

  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      closeAll(nav);
    }
  });

  // reset open panels when crossing the desktop/mobile breakpoint
  isDesktop.addEventListener('change', () => {
    closeAll(nav);
    syncHeadingToggles(nav);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper, backdrop);
}
