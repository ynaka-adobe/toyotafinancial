/*
 * documents: document list rows with file-type icon links
 * (TFS Investor Relations doc-link component, e.g. Unsecured Term Debt prospectuses).
 *
 * Authoring:
 *  - Heading row (1 cell with a heading): starts a group, e.g. "Medium-Term Notes (MTN)".
 *  - Document row: label | links. Each link points at one file of the document (PDF, Word,
 *    HTML, Excel ...); the icon comes from the file extension, the link text is only used
 *    for screen readers.
 *  - Text row (1 cell, no heading): shown as is (e.g. a note under a group).
 *
 * renderDocRow / fileType are shared with blocks/document-library.
 */
// file extension -> [icon key, name]
const TYPES = {
  pdf: ['pdf', 'PDF'],
  doc: ['word', 'Word'],
  docx: ['word', 'Word'],
  htm: ['html', 'HTML'],
  html: ['html', 'HTML'],
  xls: ['excel', 'Excel'],
  xlsx: ['excel', 'Excel'],
  xml: ['xml', 'XML'],
  zip: ['zip', 'ZIP'],
  ppt: ['ppt', 'PowerPoint'],
  pptx: ['ppt', 'PowerPoint'],
};

export function fileType(href) {
  let path = href;
  try {
    path = new URL(href, window.location.href).pathname;
  } catch (e) {
    // keep the raw value
  }
  const ext = decodeURIComponent(path).split('.').pop().toLowerCase();
  const [key, name] = TYPES[ext] || ['file', 'File'];
  return { ext: key, name };
}

/**
 * Builds one document row.
 * @param {string|Node[]} label row label (text or nodes)
 * @param {{href: string}[]} files files of the document
 * @returns {HTMLLIElement}
 */
export function renderDocRow(label, files) {
  const li = document.createElement('li');
  li.className = 'documents-row';
  const name = document.createElement('span');
  name.className = 'documents-label';
  if (typeof label === 'string') name.textContent = label;
  else name.append(...label);
  const links = document.createElement('span');
  links.className = 'documents-files';
  const labelText = name.textContent.trim();
  files.forEach(({ href }) => {
    const type = fileType(href);
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = `documents-file documents-file-${type.ext}`;
    a.setAttribute('aria-label', `${labelText} (${type.name})`);
    a.title = type.name;
    links.append(a);
  });
  li.append(name, links);
  return li;
}

export default function decorate(block) {
  const out = [];
  let list = null;
  const ensureList = () => {
    if (!list) {
      list = document.createElement('ul');
      list.className = 'documents-list';
      out.push(list);
    }
    return list;
  };

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 1) {
      const heading = cells[0].querySelector('h1, h2, h3, h4, h5, h6');
      const holder = document.createElement('div');
      holder.className = heading ? 'documents-heading' : 'documents-text';
      holder.append(...cells[0].childNodes);
      out.push(holder);
      list = null;
      return;
    }
    const [label, linkCell] = cells;
    const files = [...(linkCell || label).querySelectorAll('a[href]')].map((a) => ({ href: a.href }));
    const labelNodes = [...label.childNodes];
    const only = label.children.length === 1 && label.firstElementChild.tagName === 'P' ? label.firstElementChild : null;
    ensureList().append(renderDocRow(only ? [...only.childNodes] : labelNodes, files));
  });

  block.replaceChildren(...out);
}
