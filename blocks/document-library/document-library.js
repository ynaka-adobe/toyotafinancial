import { loadCSS } from '../../scripts/aem.js';
import { renderDocRow } from '../documents/documents.js';

/*
 * document-library: live document lists read from the TFS document library (AEM Assets HTTP
 * API on www.toyotafinancial.com, CORS-enabled), with a year selector.
 * (Investor Relations: SEC Filings, Asset-Backed Securities.)
 *
 * Authoring: 2-column key/value rows
 *   | Source     | link to the library folder, e.g. https://www.toyotafinancial.com/content/dam/
 *                  tmcc-webcommons/toyotafinancial/documents/investor-relations/sec-filings |
 *   | Layout     | sec-filings | asset-backed |
 *   | Year label | Please select a fiscal year |
 *   | Order      | Quarterly Reports on Form 10-Q, Annual Reports on Form 10-K, ...  (optional) |
 *
 * Library structure: <Source>/<year>/...
 *  - sec-filings: <year>/<report type>/<filing folder with files> -> one heading per report
 *    type (Order first, then the rest), one row per filing.
 *  - asset-backed: <year>/Months/<month>/<deal folder with files> -> one collapsible section
 *    per month (calendar order, loaded when opened); <year>/Prospectuses/... -> a list.
 * A "document" is a folder holding files (one icon per file) or a single file; folders that
 * only hold folders are walked down. Labels are the file names without extension.
 */
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december'];

const cache = new Map();

function apiUrl(source, path = []) {
  const url = new URL(source, 'https://www.toyotafinancial.com');
  const base = url.pathname.replace(/^\/content\/dam\//, '/api/assets/')
    .replace(/\.json$/, '').replace(/\/$/, '');
  const rest = path.map((p) => `/${encodeURIComponent(p)}`).join('');
  return `${url.origin}${base}${rest}.json?limit=200`;
}

async function list(source, path) {
  const url = apiUrl(source, path);
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return r.json();
    }).then((json) => (json.entities || []).map((e) => ({
      name: e.properties?.name || '',
      folder: (e.class || []).includes('assets/folder'),
      href: ((e.links || []).find((l) => (l.rel || []).includes('self')) || (e.links || [])[0] || {}).href || '',
    }))));
  }
  return cache.get(url);
}

const fileHref = (href) => href.replace(/\.json(\?.*)?$/, '').replace(/\/api\/assets\//i, '/content/dam/');
const baseName = (name) => name.replace(/\.[a-z0-9]+$/i, '');

// runs fn over items with at most `limit` requests in flight, keeping order
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const worker = async () => {
    while (i < items.length) {
      const n = i;
      i += 1;
      // eslint-disable-next-line no-await-in-loop
      out[n] = await fn(items[n], n);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/** Collects the documents under a folder: [{ label, files: [{ href }] }] */
async function collect(source, path) {
  const entries = await list(source, path);
  const files = entries.filter((e) => !e.folder);
  const folders = entries.filter((e) => e.folder);
  if (files.length) {
    // a document folder: its files, plus files of sub-folders (e.g. exhibits)
    const extra = await mapLimit(folders, 4, (f) => list(source, [...path, f.name]));
    const all = [...files, ...extra.flat().filter((e) => !e.folder)];
    const hrefs = all.map((f) => ({ href: fileHref(f.href) }));
    return [{ label: baseName(files[0].name), files: hrefs }];
  }
  const nested = await mapLimit(folders, 6, (f) => collect(source, [...path, f.name]));
  return nested.flat();
}

// top-level documents of a folder: each file is its own document, each folder is collected;
// sorted: entries in name order (asset-backed months), otherwise library order
async function documentsOf(source, path, sorted = false) {
  const listed = await list(source, path);
  const entries = sorted ? [...listed].sort((x, y) => x.name.localeCompare(y.name)) : listed;
  const nested = await mapLimit(entries, 6, (e) => (e.folder
    ? collect(source, [...path, e.name])
    : [{ label: baseName(e.name), files: [{ href: fileHref(e.href) }] }]));
  return nested.flat();
}

function docList(docs) {
  const ul = document.createElement('ul');
  ul.className = 'documents-list';
  docs.forEach((d) => ul.append(renderDocRow(d.label, d.files)));
  return ul;
}

function message(text) {
  const p = document.createElement('p');
  p.className = 'document-library-message';
  p.textContent = text;
  return p;
}

async function renderSec(container, cfg, year) {
  const types = (await list(cfg.source, [year])).filter((e) => e.folder);
  const rank = (name) => {
    const i = cfg.order.findIndex((o) => o.toLowerCase() === name.toLowerCase());
    return i === -1 ? cfg.order.length : i;
  };
  types.sort((a, b) => rank(a.name) - rank(b.name));
  const groups = await mapLimit(types, 2, async (t) => ({
    name: t.name,
    docs: await documentsOf(cfg.source, [year, t.name]),
  }));
  const out = [];
  groups.forEach((g) => {
    const h = document.createElement('h2');
    h.textContent = g.name;
    out.push(h, docList(g.docs));
  });
  container.replaceChildren(...(out.length ? out : [message('No documents for this year.')]));
}

async function renderAbs(container, cfg, year) {
  const top = await list(cfg.source, [year]);
  const out = [];
  const monthsFolder = top.find((e) => e.folder && /^months$/i.test(e.name));
  if (monthsFolder) {
    const months = (await list(cfg.source, [year, monthsFolder.name])).filter((e) => e.folder);
    const idx = (n) => MONTHS.indexOf(n.toLowerCase());
    months.sort((a, b) => idx(a.name) - idx(b.name));
    const acc = document.createElement('div');
    acc.className = 'document-library-months';
    months.forEach((m) => {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = `${m.name.charAt(0).toUpperCase()}${m.name.slice(1).toLowerCase()} ${year}`;
      const body = document.createElement('div');
      body.className = 'document-library-month';
      details.append(summary, body);
      details.addEventListener('toggle', async () => {
        if (!details.open || body.dataset.loaded) return;
        body.dataset.loaded = 'true';
        body.append(message('Loading…'));
        try {
          const docs = await documentsOf(cfg.source, [year, monthsFolder.name, m.name], true);
          body.replaceChildren(docs.length ? docList(docs) : message('No documents.'));
        } catch (e) {
          body.replaceChildren(message('Documents are temporarily unavailable. Please try again later.'));
        }
      });
      acc.append(details);
    });
    out.push(acc);
  }
  const others = top.filter((e) => e !== monthsFolder);
  const groups = await mapLimit(others, 2, async (g) => ({
    name: g.name,
    docs: g.folder
      ? await documentsOf(cfg.source, [year, g.name])
      : [{ label: baseName(g.name), files: [{ href: fileHref(g.href) }] }],
  }));
  groups.forEach((g) => {
    const h = document.createElement('h3');
    h.textContent = g.name;
    out.push(h, docList(g.docs));
  });
  container.replaceChildren(...(out.length ? out : [message('No documents for this year.')]));
}

function readConfig(block) {
  const cfg = {
    source: '', layout: 'sec-filings', label: 'Please select a year', order: [],
  };
  [...block.children].forEach((row) => {
    const [k, v] = row.children;
    if (!k || !v) return;
    const key = k.textContent.trim().toLowerCase();
    const link = v.querySelector('a[href]');
    const val = v.textContent.trim();
    if (key === 'source') cfg.source = link ? link.href : val;
    else if (key === 'layout') cfg.layout = val.toLowerCase();
    else if (key === 'year label') cfg.label = val;
    else if (key === 'order') cfg.order = val.split(/\s*[,\n]\s*/).filter(Boolean);
  });
  return cfg;
}

export default async function decorate(block) {
  const cfg = readConfig(block);
  loadCSS(`${window.hlx.codeBasePath}/blocks/documents/documents.css`);

  const picker = document.createElement('div');
  picker.className = 'document-library-picker';
  const id = `document-library-year-${Math.random().toString(36).slice(2, 8)}`;
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = cfg.label;
  const select = document.createElement('select');
  select.id = id;
  picker.append(label, select);
  const results = document.createElement('div');
  results.className = 'document-library-results';
  results.setAttribute('aria-live', 'polite');
  block.replaceChildren(picker, results);

  const render = cfg.layout === 'asset-backed' ? renderAbs : renderSec;
  const show = async (year) => {
    results.setAttribute('aria-busy', 'true');
    results.replaceChildren(message('Loading…'));
    try {
      await render(results, cfg, year);
    } catch (e) {
      results.replaceChildren(message('Documents are temporarily unavailable. Please try again later.'));
    }
    results.removeAttribute('aria-busy');
  };

  try {
    const years = (await list(cfg.source, [])).filter((e) => e.folder && /^\d{4}$/.test(e.name))
      .map((e) => e.name).sort((a, b) => b - a);
    years.forEach((y) => select.append(new Option(y, y)));
    select.addEventListener('change', () => show(select.value));
    if (years.length) await show(years[0]);
    else results.replaceChildren(message('No documents available.'));
  } catch (e) {
    picker.remove();
    results.replaceChildren(message('Documents are temporarily unavailable. Please try again later.'));
  }
}
