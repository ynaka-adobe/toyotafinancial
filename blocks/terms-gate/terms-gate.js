/*
 * terms-gate: terms that must be accepted before the rest of the page is shown
 * (TFS Investor Relations "Terms and Conditions": Sales & Trading, Unsecured Term Debt,
 * Asset-Backed Securities).
 *
 * Authoring: 1 cell per row.
 *  - Rows with the terms text (heading + paragraphs).
 *  - Last row: the actions. A link to "#accept" accepts; any other link (e.g. "Decline" ->
 *    SEC Filings) is a normal link.
 *
 * Behaviour (as on the source): every section after the block's section stays hidden until
 * "Accept" is clicked; then the terms are removed, the content is shown and the page scrolls
 * to the top. Acceptance is not remembered (the source asks on every visit).
 */
export default function decorate(block) {
  const rows = [...block.children];
  const terms = document.createElement('div');
  terms.className = 'terms-gate-text';
  const actions = document.createElement('div');
  actions.className = 'terms-gate-actions';

  rows.forEach((row, i) => {
    const cell = row.firstElementChild || row;
    const target = i === rows.length - 1 && cell.querySelector('a[href]') ? actions : terms;
    target.append(...cell.childNodes);
  });

  const accept = actions.querySelector('a[href="#accept"]');
  actions.querySelectorAll('a[href]').forEach((a) => {
    a.classList.add('button', a === accept ? 'primary' : 'secondary');
    a.closest('p')?.classList.add('button-container');
  });
  block.replaceChildren(terms, actions);

  const section = block.closest('.section');
  if (!section || !accept) return;
  const gated = [];
  for (let next = section.nextElementSibling; next; next = next.nextElementSibling) {
    if (next.classList.contains('section')) {
      next.classList.add('terms-gated');
      gated.push(next);
    }
  }
  accept.setAttribute('role', 'button');
  accept.addEventListener('click', (e) => {
    e.preventDefault();
    gated.forEach((s) => s.classList.remove('terms-gated'));
    section.remove();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // move keyboard focus to the revealed content
    const heading = gated[0]?.querySelector('h1, h2, h3');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  });
}
