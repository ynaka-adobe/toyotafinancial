import { decorateIcons } from '../../scripts/aem.js';
import { fetchFirstAvailable, getSharedDocumentUrls } from '../../scripts/scripts.js';

const isDesktop = window.matchMedia('(width >= 900px)');

/**
 * Fetches the footer for the page's language folder (e.g. /us/en/footer), falling back to /footer.
 * @returns {Promise<HTMLElement|null>} container holding the fragment sections
 */
async function fetchFooter() {
  const resp = await fetchFirstAvailable(getSharedDocumentUrls('footer'));
  if (!resp) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // published documents wrap list-item content in <p>; unwrap so items hold their links directly
  container.querySelectorAll('li > p').forEach((p) => p.replaceWith(...p.childNodes));
  decorateIcons(container);
  container.querySelectorAll('span.icon > img').forEach((img) => img.parentElement.replaceWith(img));
  // ":icon: Label" links render icon-only; the label becomes the icon's alt text
  container.querySelectorAll('a img[data-icon-name]').forEach((img) => {
    const link = img.closest('a');
    const label = link.textContent.trim();
    if (!label) return;
    img.alt = label;
    link.replaceChildren(img);
  });
  return container;
}

/**
 * Groups each heading with the list that follows it.
 * @param {Element} section fragment section
 * @param {string} className class for each group
 * @returns {HTMLElement[]} groups
 */
function groupByHeading(section, className) {
  const groups = [];
  let current = null;
  [...section.children].forEach((child) => {
    if (/^H[1-6]$/.test(child.tagName)) {
      current = document.createElement('div');
      current.className = className;
      groups.push(current);
    }
    if (current) current.append(child);
  });
  return groups;
}

// production site: pages not yet migrated are linked there and open in the same tab
const SITE_ORIGIN = 'https://www.toyotafinancial.com';

/**
 * Image-only links get an accessible name from their image; links to other hosts open in a new tab.
 * @param {Element} root footer root
 */
function decorateLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const img = a.querySelector('img');
    if (img && !a.textContent.trim() && img.alt) a.setAttribute('aria-label', img.alt);
    const url = new URL(a.href, window.location.href);
    const sameSite = url.origin === window.location.origin || url.origin === SITE_ORIGIN;
    if (!sameSite && url.protocol.startsWith('http')) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
}

/**
 * Builds the fixed back-to-top button from the fragment's in-page link.
 * @param {Element} link anchor pointing at the top of the page
 * @returns {HTMLButtonElement}
 */
function buildBackToTop(link) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'footer-back-to-top';
  button.setAttribute('aria-label', link.textContent.trim());
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  const toggle = () => button.classList.toggle('is-visible', window.scrollY > 100);
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
  return button;
}

/**
 * Opens one link column (closing the others) or closes it if already open.
 * @param {Element} columns link columns container
 * @param {Element} column column to toggle
 */
function toggleColumn(columns, column) {
  const open = !column.classList.contains('is-open');
  columns.querySelectorAll('.footer-column').forEach((col) => {
    const expanded = col === column && open;
    col.classList.toggle('is-open', expanded);
    if (!isDesktop.matches) col.querySelector('h2, h3, h4')?.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Column headings are accordion toggles on mobile and plain headings on desktop.
 * @param {Element} columns link columns container
 */
function syncColumnToggles(columns) {
  columns.querySelectorAll('.footer-column').forEach((col) => {
    const heading = col.querySelector('h2, h3, h4');
    if (!heading) return;
    if (isDesktop.matches) {
      col.classList.remove('is-open');
      heading.removeAttribute('role');
      heading.removeAttribute('tabindex');
      heading.removeAttribute('aria-expanded');
    } else {
      heading.setAttribute('role', 'button');
      heading.setAttribute('tabindex', '0');
      heading.setAttribute('aria-expanded', col.classList.contains('is-open'));
    }
  });
}

/**
 * Wires the mobile accordion behaviour on the link columns.
 * @param {Element} columns link columns container
 */
function decorateColumnAccordions(columns) {
  columns.querySelectorAll('.footer-column').forEach((col) => {
    const heading = col.querySelector('h2, h3, h4');
    if (!heading) return;
    heading.addEventListener('click', () => {
      if (!isDesktop.matches) toggleColumn(columns, col);
    });
    heading.addEventListener('keydown', (e) => {
      if (isDesktop.matches || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      toggleColumn(columns, col);
    });
  });
  syncColumnToggles(columns);
  isDesktop.addEventListener('change', () => syncColumnToggles(columns));
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  const [brandSection, linksSection, legalSection] = [...fragment.querySelectorAll(':scope > div')];

  const wrapper = document.createElement('div');
  wrapper.className = 'footer-main';

  // top band: brand column + link columns
  const top = document.createElement('div');
  top.className = 'footer-top';

  if (brandSection) {
    const brand = document.createElement('div');
    brand.className = 'footer-brand';
    const logo = brandSection.querySelector(':scope > p');
    if (logo) {
      logo.className = 'footer-logo';
      brand.append(logo);
    }
    groupByHeading(brandSection, 'footer-brand-group').forEach((group) => {
      const list = group.querySelector('ul');
      if (list) {
        const icons = [...list.querySelectorAll('img')]
          .every((img) => img.dataset.iconName || /\.svg(\?|$)/.test(img.getAttribute('src')));
        list.classList.add(icons ? 'footer-icon-list' : 'footer-badge-list');
      }
      brand.append(group);
    });
    top.append(brand);
  }

  if (linksSection) {
    const columns = document.createElement('div');
    columns.className = 'footer-columns';
    columns.append(...groupByHeading(linksSection, 'footer-column'));
    decorateColumnAccordions(columns);
    top.append(columns);
  }
  wrapper.append(top);

  // bottom band: copyright + legal disclosure; a paragraph that is only a link is the
  // back-to-top control (publishing may rewrite its #top href, so do not rely on it)
  if (legalSection) {
    const bottom = document.createElement('div');
    bottom.className = 'footer-bottom';
    const inner = document.createElement('div');
    inner.className = 'footer-bottom-inner';
    [...legalSection.querySelectorAll(':scope > p')].forEach((p) => {
      const link = p.querySelector('a');
      if (link && p.textContent.trim() === link.textContent.trim()) {
        block.append(buildBackToTop(link));
      } else {
        p.classList.add('footer-legal-text');
        inner.append(p);
      }
    });
    bottom.append(inner);
    wrapper.append(bottom);
  }

  decorateLinks(wrapper);
  block.prepend(wrapper);
}
