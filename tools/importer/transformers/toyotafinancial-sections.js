/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: toyotafinancial section breaks + section metadata.
 *
 * Driven entirely by `payload.template.sections` from page-templates.json, so
 * it is template-agnostic. For the homepage template the sections are
 * (in document order):
 *   #fold-1 hero-carousel  style=null      -> SKIP section-metadata (full-bleed block bg)
 *   #fold-2 promos         style=null      -> no section-metadata
 *   #fold-3 tools          style=highlight -> Section Metadata (style: highlight)
 *   #fold-4 campaign       style=null      -> SKIP section-metadata (full-bleed block bg)
 *
 * Behaviour (canonical section-transformer pattern; runs in afterTransform):
 *   - Sections processed in REVERSE order so DOM insertions never shift the
 *     positions of sections not yet processed.
 *   - For every section with a truthy `style`: build a Section Metadata block
 *     via WebImporter.Blocks.createBlock and insert it immediately AFTER the
 *     section element, so the metadata sits inside that section (before the
 *     following section break) in the generated markdown.
 *   - For every section except the first: insert an <hr> immediately BEFORE the
 *     section element to create the section break.
 *
 * Expected for the homepage template: 3 <hr> (sections.length - 1) and
 * 1 Section Metadata block (only #fold-3 has a style). Section selectors
 * (#fold-1..#fold-4) verified present in migration-work/cleaned.html.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const { document, template } = payload;
  const sections = (template && template.sections) || [];
  if (!Array.isArray(sections) || sections.length < 2) return;

  // Reverse order: inserting <hr>/metadata for later sections first keeps the
  // DOM positions of earlier, not-yet-processed sections stable.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    if (!section || !section.selector) continue;

    const el = element.querySelector(section.selector);
    if (!el) continue;

    // Section metadata (only sections that carry a style, e.g. #fold-3 highlight).
    if (section.style) {
      const block = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      el.after(block);
    }

    // Section break before every section except the first.
    if (i > 0) {
      const hr = document.createElement('hr');
      el.before(hr);
    }
  }
}
