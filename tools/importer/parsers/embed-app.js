/* eslint-disable */
/* global WebImporter */

/**
 * Parser for embed-app. Base: embed.
 * Source: https://www.toyotafinancial.com/us/en/planning_tools/apply_for_credit.html
 * Selector (page-templates.json): #main-content .two-columns-left-one-column-right:has(form[target])
 * Generated: 2026-10-04
 *
 * Content model (Embed library convention, blocks/embed-app/README.md):
 *   Row 1: block name (added by createBlock).
 *   Row 2: one cell — link to the application start URL (link text = frame title).
 *   The block's defaults (method POST, height 51em) match the source, so the
 *   optional method/height rows are not emitted.
 *
 * Source structure (live DOM): a field-less <form method="POST" target="oca_iframe"
 * action="https://apigateway.toyotafinancial.com/.../prefilldata?...">, auto-submitted
 * into <iframe name="oca_iframe" style="width:100%;height:51em">, plus a loading image.
 */

const DEFAULT_TITLE = 'Apply for Credit application';

export default function parse(element, { document }) {
  const form = element.querySelector('form[action][target]');
  if (!form) return;

  const link = document.createElement('a');
  link.setAttribute('href', new URL(form.getAttribute('action'), 'https://www.toyotafinancial.com').href);
  link.textContent = DEFAULT_TITLE;

  const block = WebImporter.Blocks.createBlock(document, { name: 'embed-app', cells: [[link]] });
  element.replaceWith(block);
}
