import { moveInstrumentation } from '../../scripts/scripts.js';

/*
 * accordion-faq: list of collapsible items with red bold titles, a right chevron and
 * grey dividers (TFS "Other finance programs" accordion).
 * Each row is one item: [title] | [body rich text]. Native details/summary, so every item
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
    summary.className = 'accordion-faq-item-label';
    // a title authored as a single paragraph/heading is unwrapped so it sits inline in summary
    const only = label.children.length === 1 ? label.firstElementChild : null;
    if (only && /^(P|H[1-6])$/.test(only.tagName)) summary.append(...only.childNodes);
    else summary.append(...label.childNodes);

    const content = body || document.createElement('div');
    content.className = 'accordion-faq-item-body';

    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    moveInstrumentation(row, details);
    details.append(summary, content);
    row.replaceWith(details);
  });
}
