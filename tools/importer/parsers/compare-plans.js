/* eslint-disable */
/* global WebImporter */

/**
 * Parser for compare-plans. Base: table (no library convention; custom block).
 * Source: https://www.toyotafinancial.com/us/en/vehicle_protection_plan/new_vehicle.html
 *   (+ used_vehicle). Components tab and Features tab of the VSA comparison.
 * Selectors (page-templates.json, content-page):
 *   #main-content .screenFade .compare-table-component.parbase   (Components)
 *   #main-content .screenFade .feature_accordion.parbase         (Features)
 * Generated: 2026-10-05
 *
 * Content model (blocks/compare-plans/compare-plans.js):
 *   [intro rows, 1 cell]      legend list "✓ Included Component" / "✗ Excluded Component"
 *   [ "" | plan | plan ... ]  header row
 *   [ <h3>category</h3> ]     category row -> collapsible group
 *   [ name | ✓ | ✗ ... ]      component row (Components)
 *   [ "" | text | text ... ]  value row (Features)
 *   [ note ]                  note row (p.small intro line, footnotes)
 *
 * Source structure (verified on the live DOM of both pages):
 *   .tab-pane > .rte.parbase (ul.list-inline: span.icon-check-red / span.icon-cross-gray legend)
 *             + .compare-table-component.parbase .panel-group > .panel
 *                 .panel-heading .panel-title a (title, <sup>, <i> chevron)
 *                 .panel-body > .compare-table-header .support .plan (plan names)
 *                             > p.small / p (notes) and .sub-components > .component
 *                                 (.name + .support .plan > span.icon-check-red|icon-cross-gray)
 *   .tab-pane > .feature_accordion.parbase .panel-group > .panel
 *                 .panel-heading .panel-title a
 *                 .panel-body .thumbnail-card .caption-body (h2 plan name + p text) per plan
 */
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

function titleCell(document, panel) {
  // the link inside the title (not the h3 itself, which comes first in document order)
  const a = panel.querySelector('.panel-heading .panel-title a') || panel.querySelector('.panel-heading .panel-title');
  const h3 = document.createElement('h3');
  if (a) {
    const clone = a.cloneNode(true);
    clone.querySelectorAll('i, .glyphicon').forEach((i) => i.remove());
    h3.innerHTML = clone.innerHTML.replace(/\s+/g, ' ').trim();
  }
  return h3;
}

function noteCell(document, el) {
  const p = document.createElement('p');
  p.innerHTML = el.innerHTML.replace(/<br\s*\/?>\s*$/i, '').trim();
  return p;
}

function legendRow(document, element) {
  const prev = element.previousElementSibling;
  const list = prev && prev.matches('.rte.parbase') && prev.querySelector('ul.list-inline');
  if (!list || !list.querySelector('[class*="icon-check"], [class*="icon-cross"]')) return null;
  const ul = document.createElement('ul');
  list.querySelectorAll(':scope > li').forEach((li) => {
    const item = document.createElement('li');
    const sym = li.querySelector('[class*="icon-check"]') ? '✓' : li.querySelector('[class*="icon-cross"]') ? '✗' : '';
    item.textContent = `${sym} ${text(li)}`.trim();
    ul.append(item);
  });
  prev.remove();
  return [ul];
}

function parseComponents(document, element) {
  const cells = [];
  const legend = legendRow(document, element);
  if (legend) cells.push(legend);
  const panels = [...element.querySelectorAll('.panel')];
  const plans = [...(element.querySelector('.compare-table-header') || element).querySelectorAll('.support .plan')].map(text);
  cells.push(['', ...plans]);
  panels.forEach((panel) => {
    cells.push([titleCell(document, panel)]);
    const body = panel.querySelector('.panel-body');
    if (!body) return;
    [...body.children].forEach((child) => {
      if (child.matches('.compare-table-header')) return;
      if (child.matches('.sub-components')) {
        child.querySelectorAll(':scope > .component').forEach((comp) => {
          const marks = [...comp.querySelectorAll('.support .plan')].map((pl) => {
            if (pl.querySelector('[class*="icon-check"]')) return '✓';
            if (pl.querySelector('[class*="icon-cross"]')) return '✗';
            return text(pl);
          });
          cells.push([text(comp.querySelector('.name')), ...marks]);
        });
        return;
      }
      if (text(child)) cells.push([noteCell(document, child)]);
    });
  });
  return cells;
}

function parseFeatures(document, element) {
  const panels = [...element.querySelectorAll('.panel')];
  const plans = [];
  const rows = panels.map((panel) => {
    const values = {};
    const notes = [];
    panel.querySelectorAll('.panel-body .caption-body').forEach((cap) => {
      const name = text(cap.querySelector('h1, h2, h3, h4, h5, h6'));
      if (!name) return;
      if (!plans.includes(name)) plans.push(name);
      const holder = document.createElement('div');
      [...cap.children].filter((c) => !/^H[1-6]$/.test(c.tagName)).forEach((c) => {
        if (text(c) || c.querySelector('a, img')) holder.append(noteCell(document, c));
      });
      values[name] = holder;
    });
    // anything in the panel body outside the plan cards (e.g. a closing note)
    panel.querySelectorAll('.panel-body > div > p, .panel-body > p').forEach((p) => { if (text(p)) notes.push(noteCell(document, p)); });
    return { title: titleCell(document, panel), values, notes };
  });
  const cells = [['', ...plans]];
  rows.forEach((r) => {
    cells.push([r.title]);
    cells.push(['', ...plans.map((pl) => r.values[pl] || '')]);
    r.notes.forEach((n) => cells.push([n]));
  });
  return cells;
}

export default function parse(element, { document }) {
  const isFeatures = element.matches('.feature_accordion');
  const cells = isFeatures ? parseFeatures(document, element) : parseComponents(document, element);
  if (cells.length < 2) return;
  const block = WebImporter.Blocks.createBlock(document, { name: 'Compare Plans', cells });
  element.replaceWith(block);
}
