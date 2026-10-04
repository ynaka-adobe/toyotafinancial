/* eslint-disable */
/* global WebImporter */

// Produces the shared end-of-lease help fragment (/us/en/fragments/lease-end-help) from
// the login card (.login-reg-card) and the dealer callout (.footer-card) that are
// identical on every end_of_lease_options page. Run against ONE end-of-lease page;
// the pages themselves reference this fragment (see parsers/fragment.js).
//   Section 1: Columns Card  [picture] | [text, Log in/Register link]
//   Section 2: Columns Callout (grey)  [title] | [Contact a Dealer button]

import linksTransformer from './transformers/toyotafinancial-links.js';

const SITE_ORIGIN = 'https://www.toyotafinancial.com';
const P = 'main > .container-fluid.px-0';

const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

function link(document, a, bold) {
  const p = document.createElement('p');
  const anchor = document.createElement('a');
  anchor.setAttribute('href', a.getAttribute('href'));
  anchor.textContent = text(a);
  if (bold) {
    const strong = document.createElement('strong');
    strong.append(anchor);
    p.append(strong);
  } else {
    p.append(anchor);
  }
  return p;
}

function buildLoginCard(document, card) {
  const img = card.querySelector('img');
  const picture = document.createElement('img');
  picture.setAttribute('src', new URL(img.getAttribute('src'), SITE_ORIGIN).href);
  picture.setAttribute('alt', img.getAttribute('alt') || '');
  const body = document.createElement('div');
  const copy = card.querySelector('.lease-end__login_text > div:first-child');
  if (copy) {
    const p = document.createElement('p');
    p.textContent = text(copy);
    body.append(p);
  }
  const a = card.querySelector('.lease-end__login_text a[href]');
  if (a) body.append(link(document, a, false));
  return WebImporter.Blocks.createBlock(document, { name: 'Columns Card', cells: [[picture, body]] });
}

function buildDealerCallout(document, card) {
  const title = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = text(card.querySelector('h1, h2, h3, h4'));
  title.append(strong);
  const a = card.querySelector('a[href]');
  return WebImporter.Blocks.createBlock(document, {
    name: 'Columns Callout (grey)',
    cells: [[title, a ? link(document, a, true) : '']],
  });
}

export default {
  transform: (payload) => {
    const { document } = payload;
    const login = document.querySelector(`${P} .lease-end-right-container > .login-reg-card`);
    const dealer = document.querySelector(`${P} > .footer-card`);
    if (!login || !dealer) throw new Error('lease-end login card or footer card not found on this page');

    const container = document.createElement('div');
    container.append(buildLoginCard(document, login), document.createElement('hr'), buildDealerCallout(document, dealer));
    // same link rewriting as page links (Log in/Register -> original site /dss/login)
    linksTransformer('afterTransform', container, payload);

    return [{
      element: container,
      path: '/us/en/fragments/lease-end-help',
      report: { title: 'Lease-end help fragment', template: 'lease-end-help-fragment', blocks: ['columns-card', 'columns-callout'] },
    }];
  },
};
