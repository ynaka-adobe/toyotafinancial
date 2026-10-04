import { moveInstrumentation } from '../../scripts/scripts.js';

/*
 * accordion-boxed: stack of boxed collapsible panels (TFS "Ways to Pay" tmcc-accordion).
 * Grey header bar with a red +/- icon; the open panel gets a red outline.
 * Each row is one panel: [title] | [body rich text]. Native details/summary, so every panel
 * starts closed and several can be open at once.
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [label, body] = row.children;
    if (!label) {
      row.remove();
      return;
    }

    const summary = document.createElement('summary');
    summary.className = 'accordion-boxed-item-label';
    const title = document.createElement('span');
    title.className = 'accordion-boxed-item-title';
    // a title authored as a single paragraph/heading is unwrapped so it sits inline in summary
    const only = label.children.length === 1 ? label.firstElementChild : null;
    if (only && /^(P|H[1-6])$/.test(only.tagName)) title.append(...only.childNodes);
    else title.append(...label.childNodes);
    const icon = document.createElement('span');
    icon.className = 'accordion-boxed-item-icon';
    icon.setAttribute('aria-hidden', 'true');
    summary.append(title, icon);

    const content = body || document.createElement('div');
    content.className = 'accordion-boxed-item-body';

    const details = document.createElement('details');
    details.className = 'accordion-boxed-item';
    moveInstrumentation(row, details);
    details.append(summary, content);
    row.replaceWith(details);
  });
}
