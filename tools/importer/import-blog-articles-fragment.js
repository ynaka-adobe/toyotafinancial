/* eslint-disable */
/* global WebImporter */

// Produces the shared blog article list fragment (/us/en/fragments/blog-articles) from
// the right-hand "TFS ThoughtFuel Blog" nav list (.nav-list-component) that is
// identical on every TFS_ThoughtFuel_Blog article. Run against ONE article; the
// articles themselves reference this fragment (see parsers/fragment.js).
//   Heading: TFS ThoughtFuel Blog
//   List: one link per article (the source shows the current article as plain
//   text, so it is linked to the source page here)

import linksTransformer from './transformers/toyotafinancial-links.js';

const P = '#main-content .screenFade .two-columns-left-one-column-right .nav-list-component';

const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

export default {
  transform: (payload) => {
    const { document, params } = payload;
    const nav = document.querySelector(P);
    if (!nav) throw new Error('blog article list (.nav-list-component) not found on this page');

    const container = document.createElement('div');
    const h2 = document.createElement('h2');
    h2.textContent = text(nav.querySelector('.navigation-header')) || 'TFS ThoughtFuel Blog';
    container.append(h2);

    const ul = document.createElement('ul');
    nav.querySelectorAll('ul.sub-menu > li').forEach((li) => {
      const src = li.querySelector('a[href]');
      const label = text(src || li);
      if (!label) return;
      const a = document.createElement('a');
      const sourcePath = src ? src.getAttribute('href') : new URL(params.originalURL).pathname;
      a.setAttribute('href', sourcePath);
      a.textContent = label;
      const item = document.createElement('li');
      item.append(a);
      ul.append(item);
    });
    container.append(ul);
    // same link rewriting as page links (articles -> new-site paths)
    linksTransformer('afterTransform', container, payload);

    return [{
      element: container,
      path: '/us/en/fragments/blog-articles',
      report: { title: 'Blog article list fragment', template: 'blog-articles-fragment', blocks: [] },
    }];
  },
};
