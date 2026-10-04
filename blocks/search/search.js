import { decorateIcons, fetchPlaceholders } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const PAGE_SIZE = 20;
const QUERY_PARAMS = ['query', 'q'];
const STOPWORDS = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'for', 'from', 'how', 'i', 'if', 'in', 'is', 'it', 'my', 'of', 'on', 'or', 'the', 'to', 'what', 'when', 'where', 'why', 'with', 'you', 'your']);
const LABEL_OVERRIDES = {
  'financing-options': 'Explore Financing',
  'vehicle-protection-plan': 'Vehicle Protection',
  'tfs-thoughtfuel-blog': 'TFS ThoughtFuel Blog',
  'mobileapp-faqs': 'Mobile App',
  'login-faqs': 'Login',
  'guaranteed-auto-protection-gap': 'Guaranteed Auto Protection (GAP)',
  bz4x: 'bZ4X',
  faq: 'Frequently Asked Questions',
};
const WORD_OVERRIDES = { tfs: 'TFS', faqs: 'FAQs', gap: 'GAP' };
const SMALL_WORDS = new Set(['a', 'and', 'in', 'of', 'or', 'the', 'to', 'for']);

function slugToLabel(slug) {
  if (LABEL_OVERRIDES[slug]) return LABEL_OVERRIDES[slug];
  return slug.split('-').map((w, i) => {
    if (WORD_OVERRIDES[w]) return WORD_OVERRIDES[w];
    if (i > 0 && SMALL_WORDS.has(w)) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}

/** Category: FAQ sub-folder for FAQ entries, otherwise the top-level section. */
function getCategory(path) {
  const segs = path.split('/').filter(Boolean).slice(2);
  if (segs[0] === 'planning-tools' && segs[1] === 'faq' && segs.length > 3) return slugToLabel(segs[2]);
  if (segs.length > 1 || ['end-of-lease-options', 'financing-options', 'vehicle-protection-plan',
    'tfs-thoughtfuel-blog', 'investor-relations', 'planning-tools'].includes(segs[0])) {
    return slugToLabel(segs[0]);
  }
  return 'General';
}

function cleanTitle(result) {
  return (result.header || result.title || '').replace(/\s*\|\s*Toyota Financial.*$/i, '').trim();
}

function normalize(text) {
  return (text || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function stem(word) {
  return word.length > 3 ? word.replace(/(ies|es|s)$/, (m) => (m === 'ies' ? 'y' : '')) : word;
}

function tokenize(text) {
  return normalize(text).split(' ').filter((w) => w && !STOPWORDS.has(w)).map(stem);
}

function scoreResult(entry, terms, phrase) {
  const fields = [
    [entry.titleTokens, 4],
    [entry.categoryTokens, 2],
    [entry.descriptionTokens, 1],
    [entry.pathTokens, 1],
  ];
  let score = 0;
  let matched = 0;
  terms.forEach((term) => {
    let best = 0;
    fields.forEach(([tokens, weight]) => {
      if (tokens.some((t) => t === term || (term.length > 3 && t.startsWith(term)))) {
        best = Math.max(best, weight);
      }
    });
    if (best) matched += 1;
    score += best;
  });
  if (phrase && normalize(entry.title).includes(phrase)) score += 10;
  if (phrase && normalize(entry.category) === phrase) score += 6;
  return { score, matched };
}

function search(index, query) {
  const terms = [...new Set(tokenize(query))];
  if (!terms.length) return [];
  const phrase = normalize(query);
  const scored = index.map((entry) => ({ entry, ...scoreResult(entry, terms, phrase) }))
    .filter((r) => r.score > 0);
  const all = scored.filter((r) => r.matched === terms.length);
  const pool = all.length ? all : scored;
  return pool
    .sort((a, b) => b.matched - a.matched
      || b.score - a.score
      || a.entry.title.localeCompare(b.entry.title))
    .map((r) => r.entry);
}

async function fetchIndex(source) {
  const resp = await fetch(`${source}${source.includes('?') ? '&' : '?'}limit=5000`);
  if (!resp.ok) return [];
  const { data = [] } = await resp.json();
  return data
    .filter((r) => !/noindex/i.test(r.robots || ''))
    .map((r) => {
      const title = cleanTitle(r);
      const category = getCategory(r.path);
      return {
        ...r,
        title,
        category,
        titleTokens: tokenize(title),
        categoryTokens: tokenize(category),
        descriptionTokens: tokenize(r.description),
        pathTokens: tokenize(r.path.split('/').slice(3).join(' ')),
      };
    });
}

/** Answer = default content of the page's main text section (minus back link + h1). */
async function loadAnswer(entry) {
  const pageUrl = new URL(entry.path, window.location.origin);
  const resp = await fetch(`${entry.path}.plain.html`);
  if (!resp.ok) return null;
  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  const sections = [...doc.body.children].filter((s) => !s.classList.contains('page-banner'));
  const section = sections.find((s) => s.querySelector(':scope > h1')) || sections[0];
  if (!section) return null;
  const isFaq = /\/faq\/[^/]+\/[^/]+$/.test(entry.path);
  const allowed = ['P', 'UL', 'OL', 'H2', 'H3', 'H4', 'H5', 'H6', 'TABLE', 'BLOCKQUOTE'];
  const nodes = [...section.children].filter((n) => allowed.includes(n.tagName)
    && !n.querySelector('picture, img')
    && !(n.tagName === 'P' && /^back to /i.test(n.textContent.trim())));
  const picked = isFaq ? nodes : nodes.slice(0, 3);
  const frag = document.createDocumentFragment();
  picked.forEach((node) => {
    node.querySelectorAll('a[href]').forEach((a) => {
      a.href = new URL(a.getAttribute('href'), pageUrl).href;
    });
    node.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    frag.append(document.importNode(node, true));
  });
  return frag.childNodes.length ? frag : null;
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  });
  node.append(...children.filter(Boolean));
  return node;
}

// Page links on the site use .html (/us/en/glossary.html); index paths are extensionless.
function toPageHref(path) {
  if (!path || path === '/' || /\.[a-z0-9]{2,5}$/i.test(path.split('/').pop())) return path;
  return `${path.replace(/\/+$/, '')}.html`;
}

function renderResult(entry, ph) {
  const summary = el('summary', {}, el('span', { class: 'search-result-title', text: entry.title }));
  const body = el('div', { class: 'search-result-answer' });
  const details = el('details', { class: 'search-result' }, summary, body);
  details.addEventListener('toggle', async () => {
    if (!details.open || body.dataset.loaded) return;
    body.dataset.loaded = 'true';
    body.setAttribute('aria-busy', 'true');
    const answer = await loadAnswer(entry).catch(() => null);
    if (answer) body.append(answer);
    else if (entry.description) body.append(el('p', { text: entry.description }));
    body.append(el('p', { class: 'button-wrapper' }, el('a', {
      class: 'button', href: toPageHref(entry.path), text: ph.searchLearnMore || 'Learn More',
    })));
    body.removeAttribute('aria-busy');
  });
  return el('li', {}, details);
}

function readState() {
  const params = new URLSearchParams(window.location.search);
  const query = QUERY_PARAMS.map((p) => params.get(p)).find((v) => v) || '';
  const categories = params.getAll('category');
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  return { query, categories, page };
}

function writeState({ query, categories, page }, push) {
  const url = new URL(window.location.href);
  [...QUERY_PARAMS, 'category', 'page'].forEach((p) => url.searchParams.delete(p));
  if (query) url.searchParams.set('query', query);
  categories.forEach((c) => url.searchParams.append('category', c));
  if (page > 1) url.searchParams.set('page', page);
  window.history[push ? 'pushState' : 'replaceState']({}, '', url);
}

export default async function decorate(block) {
  const links = [...block.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
  const source = links.find((h) => /\.json(\?|$)/.test(h)) || '/query-index.json';
  const helpPath = links.find((h) => !/\.json(\?|$)/.test(h));
  const ph = await fetchPlaceholders();
  const indexPromise = fetchIndex(source);

  const searchLabel = ph.searchPlaceholder || 'Search';
  const input = el('input', {
    type: 'search',
    name: 'query',
    class: 'search-input',
    autocomplete: 'off',
    placeholder: searchLabel,
    'aria-label': searchLabel,
  });
  const clear = el('button', { type: 'button', class: 'search-clear', 'aria-label': 'Clear search' });
  const submit = el(
    'button',
    { type: 'submit', class: 'search-submit', 'aria-label': 'Search' },
    el('span', { class: 'icon icon-search' }),
  );
  const form = el('form', { class: 'search-bar', role: 'search' }, input, clear, submit);

  const facetList = el('ul', { class: 'search-facet-options' });
  const facets = el(
    'aside',
    { class: 'search-facets', 'aria-label': 'Filters' },
    el('fieldset', {}, el('legend', { text: ph.searchCategory || 'Category' }), facetList),
  );
  const count = el('p', { class: 'search-count', 'aria-live': 'polite' });
  const chips = el('ul', { class: 'search-chips' });
  const filtersToggle = el('button', {
    type: 'button',
    class: 'search-filters-toggle',
    'aria-expanded': 'false',
    text: ph.searchFilters || 'Filters',
  });
  const results = el('ul', { class: 'search-results' });
  const pagination = el('nav', { class: 'search-pagination', 'aria-label': 'Search results pages' });
  const help = el('div', { class: 'search-help' });
  const summary = el('div', { class: 'search-summary' }, count, chips, filtersToggle);
  const main = el('div', { class: 'search-main' }, summary, results, pagination, help);
  const layout = el('div', { class: 'search-layout' }, facets, main);

  block.replaceChildren(form, layout);
  decorateIcons(block);

  if (helpPath) {
    loadFragment(new URL(helpPath, window.location.href).pathname).then((fragment) => {
      if (fragment) help.append(...fragment.childNodes);
    });
  }

  let state = readState();

  const render = async () => {
    input.value = state.query;
    clear.hidden = !state.query;
    const index = await indexPromise;
    const hits = state.query ? search(index, state.query) : [];
    block.classList.toggle('has-query', !!state.query);
    block.classList.toggle('no-results', !!state.query && !hits.length);

    // facets (counts from the query hits, independent of the category selection)
    const counts = new Map();
    hits.forEach((h) => counts.set(h.category, (counts.get(h.category) || 0) + 1));
    state.categories = state.categories.filter((c) => counts.has(c));
    facetList.replaceChildren(...[...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, n]) => {
        const cb = el('input', { type: 'checkbox', value: label });
        cb.checked = state.categories.includes(label);
        cb.addEventListener('change', () => {
          state.categories = cb.checked
            ? [...state.categories, label] : state.categories.filter((c) => c !== label);
          state.page = 1;
          writeState(state, true);
          render();
        });
        return el('li', {}, el('label', {}, cb, el('span', { text: `${label} (${n})` })));
      }));
    facets.hidden = !counts.size;
    filtersToggle.hidden = !counts.size;

    const filtered = state.categories.length
      ? hits.filter((h) => state.categories.includes(h.category)) : hits;
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * PAGE_SIZE;
    const pageHits = filtered.slice(start, start + PAGE_SIZE);

    if (!state.query) count.textContent = '';
    else if (!filtered.length) {
      count.textContent = (ph.searchNoResults || 'No results found for “{query}”.').replace('{query}', state.query);
    } else count.textContent = `${start + 1} - ${start + pageHits.length} of ${filtered.length}`;

    const chipFor = (label, onRemove) => {
      const btn = el('button', { type: 'button', 'aria-label': `Remove ${label}` }, el('span', { text: label }));
      btn.addEventListener('click', onRemove);
      return el('li', {}, btn);
    };
    chips.replaceChildren(...(state.query && filtered.length ? [
      chipFor(state.query, () => {
        state = { query: '', categories: [], page: 1 };
        writeState(state, true);
        render();
        input.focus();
      }),
      ...state.categories.map((c) => chipFor(c, () => {
        state.categories = state.categories.filter((x) => x !== c);
        writeState(state, true);
        render();
      })),
    ] : []));

    results.replaceChildren(...pageHits.map((h) => renderResult(h, ph)));

    pagination.replaceChildren();
    if (pages > 1) {
      const go = (p) => () => {
        state.page = p;
        writeState(state, true);
        render();
        block.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      const pageBtn = (label, p, attrs = {}) => {
        const b = el('button', { type: 'button', ...attrs, text: label });
        if (p === state.page) b.setAttribute('aria-current', 'page');
        b.disabled = p < 1 || p > pages;
        b.addEventListener('click', go(p));
        return b;
      };
      pagination.append(pageBtn('‹', state.page - 1, { 'aria-label': 'Previous page', class: 'prev' }));
      for (let p = 1; p <= pages; p += 1) pagination.append(pageBtn(String(p), p));
      pagination.append(pageBtn('›', state.page + 1, { 'aria-label': 'Next page', class: 'next' }));
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state = { query: input.value.trim(), categories: [], page: 1 };
    writeState(state, true);
    render();
  });
  input.addEventListener('input', () => { clear.hidden = !input.value; });
  clear.addEventListener('click', () => {
    input.value = '';
    clear.hidden = true;
    input.focus();
  });
  filtersToggle.addEventListener('click', () => {
    const open = !block.classList.contains('facets-open');
    block.classList.toggle('facets-open', open);
    filtersToggle.setAttribute('aria-expanded', open);
  });
  window.addEventListener('popstate', () => {
    state = readState();
    render();
  });

  writeState(state, false);
  render();
}
