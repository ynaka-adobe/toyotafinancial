/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsStepsParser from './parsers/cards-steps.js';
import accordionCircleParser from './parsers/accordion-circle.js';
import cardsVideoParser from './parsers/cards-video.js';
import fragmentParser from './parsers/fragment.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/toyotafinancial-cleanup.js';
import sectionsTransformer from './transformers/toyotafinancial-sections.js';
import linksTransformer from './transformers/toyotafinancial-links.js';
import dmImagesTransformer from './transformers/toyotafinancial-dm-images.js';

// PARSER REGISTRY
// PARSER REGISTRY
const parsers = {
  'cards-steps': cardsStepsParser,
  'accordion-circle': accordionCircleParser,
  'cards-video': cardsVideoParser,
  'fragment': fragmentParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "end-of-lease",
  "description": "End of lease section (newer page design): banner image, two-column layout with section menu, rich text with accordions/videos, footer cards.",
  "urls": [
    "https://www.toyotafinancial.com/us/en/end_of_lease_options/early_lease_return.html",
    "https://www.toyotafinancial.com/us/en/end_of_lease_options/faqs.html",
    "https://www.toyotafinancial.com/us/en/end_of_lease_options/lease-end-videos.html",
    "https://www.toyotafinancial.com/us/en/end_of_lease_options/mileage.html",
    "https://www.toyotafinancial.com/us/en/end_of_lease_options/wear_and_use.html",
    "https://www.toyotafinancial.com/us/en/end_of_lease_options/your_option.html",
    "https://www.toyotafinancial.com/us/en/end_of_lease_options/return_your_vehicle.html"
  ],
  "blocks": [
    {
      "name": "cards-steps",
      "instances": [
        "main > .container-fluid.px-0 .lease-end-right-container > .card-button.parbase"
      ]
    },
    {
      "name": "accordion-circle",
      "instances": [
        "main > .container-fluid.px-0 .lease-end-right-container > .accordion.parbase > .row > div:has(.accordion-card)"
      ]
    },
    {
      "name": "cards-video",
      "instances": [
        "main > .container-fluid.px-0 .lease-end-right-container > .general-column:has(.video-promo):not(.general-column + .general-column)"
      ]
    },
    {
      "name": "fragment",
      "instances": [
        "main > .container-fluid.px-0 .lease-end-right-container > .login-reg-card.parbase"
      ]
    }
  ],
  "sections": [
    {
      "id": "rc5",
      "name": "page-banner",
      "selector": [
        "main > .container-fluid.px-0 > .banner-image.parbase"
      ],
      "style": "page-banner",
      "blocks": [],
      "defaultContent": [
        "main > .container-fluid.px-0 > .banner-image.parbase .your-option-img-container.d-md-block"
      ]
    },
    {
      "id": "rc6",
      "name": "main-column",
      "selector": [
        "main > .container-fluid.px-0 > .two-columns-right-one-column-left"
      ],
      "style": null,
      "blocks": [
        "cards-steps",
        "accordion-circle",
        "cards-video",
        "fragment"
      ],
      "defaultContent": [
        "main > .container-fluid.px-0 > .two-columns-right-one-column-left .lease-end-right-container > .simpleparagraph.parbase",
        "main > .container-fluid.px-0 > .two-columns-right-one-column-left .lease-end-right-container > .links-section",
        "main > .container-fluid.px-0 > .two-columns-right-one-column-left .lease-end-right-container > .button.parbase",
        "main > .container-fluid.px-0 > .two-columns-right-one-column-left .lease-end-right-container > .accordion.parbase > .row > h4"
      ]
    },
    {
      "id": "rc7",
      "name": "dealer-callout",
      "selector": [
        "main > .container-fluid.px-0 > .footer-card.parbase"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": []
    }
  ]
};

// TRANSFORMER REGISTRY - order matters within each hook.
// cleanup runs first (removes chrome, synthesizes the page-banner <img>), then
// sections adds <hr> breaks + section metadata, then links points site links at
// the original site (target pages not migrated yet), then the DM transformer
// rewrites Scene7 <img> into carrier anchors on the parser-built DOM.
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
  linksTransformer,
  dmImagesTransformer,
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        // Guard against the same element matching more than one selector
        // (carousel-hero has two nested instance selectors).
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // already replaced by an earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata + DM images)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path, keeping the /us/en/ locale folder
    //    (end_of_lease_options/your_option.html -> end-of-lease-options/your-option).
    //    Map the root/homepage URL to `/index` —
    //    a pathname of `/` becomes '' after trailing-slash stripping, which
    //    crashes the bundled importer's path polyfill (.cwd is not a function).
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
