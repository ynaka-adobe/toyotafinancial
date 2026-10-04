import { moveInstrumentation } from '../../scripts/scripts.js';

/*
 * accordion-circle: collapsible Q&A rows with dark grey titles and a filled red circle
 * +/- icon (TFS end-of-lease accordion parbase groups).
 * Each row is one item: [title] | [body rich text]. Native details/summary; every item
 * starts closed and opening one closes the others in the same block (single-expand per block).
 */
let instanceCount = 0;

export default function decorate(block) {
  instanceCount += 1;
  const group = `accordion-circle-${instanceCount}`;

  [...block.children].forEach((row) => {
    const [label, ...rest] = row.children;
    if (!label || !label.textContent.trim()) {
      row.remove();
      return;
    }

    const summary = document.createElement('summary');
    summary.className = 'accordion-circle-item-label';
    const title = document.createElement('span');
    title.className = 'accordion-circle-item-title';
    // a title authored as a single paragraph/heading is unwrapped so it sits inline in summary
    const only = label.children.length === 1 ? label.firstElementChild : null;
    if (only && /^(P|H[1-6])$/.test(only.tagName)) title.append(...only.childNodes);
    else title.append(...label.childNodes);
    const icon = document.createElement('span');
    icon.className = 'accordion-circle-item-icon';
    icon.setAttribute('aria-hidden', 'true');
    summary.append(title, icon);

    const body = document.createElement('div');
    body.className = 'accordion-circle-item-body';
    rest.forEach((cell) => body.append(...cell.childNodes));
    // imported bodies may hold bare text with no paragraph wrapper
    if (body.textContent.trim() && !body.firstElementChild) {
      const p = document.createElement('p');
      p.append(...body.childNodes);
      body.append(p);
    }

    const details = document.createElement('details');
    details.className = 'accordion-circle-item';
    // native exclusive accordion where supported; the toggle handler below covers the rest
    details.name = group;
    moveInstrumentation(row, details);
    details.append(summary, body);
    row.replaceWith(details);
  });

  block.addEventListener('toggle', (e) => {
    const opened = e.target;
    if (!opened.open || !opened.classList?.contains('accordion-circle-item')) return;
    block.querySelectorAll(':scope > details[open]').forEach((item) => {
      if (item !== opened) item.open = false;
    });
  }, true);
}
