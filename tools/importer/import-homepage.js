/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselHeroParser from './parsers/carousel-hero.js';
import cardsServiceParser from './parsers/cards-service.js';
import cardsExploreParser from './parsers/cards-explore.js';
import heroBannerParser from './parsers/hero-banner.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/toyotafinancial-cleanup.js';
import sectionsTransformer from './transformers/toyotafinancial-sections.js';
import dmImagesTransformer from './transformers/toyotafinancial-dm-images.js';

// PARSER REGISTRY
const parsers = {
  'carousel-hero': carouselHeroParser,
  'cards-service': cardsServiceParser,
  'cards-explore': cardsExploreParser,
  'hero-banner': heroBannerParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Toyota Financial homepage: hero banner carousel, promo callout cards grid, financial tools/quiz cards grid, campaign banner, and footer.',
  urls: [
    'https://www.toyotafinancial.com',
  ],
  blocks: [
    {
      name: 'carousel-hero',
      instances: [
        '#carousel_image',
        '#fold-1 .carousel-image.parbase',
      ],
    },
    {
      name: 'cards-service',
      instances: [
        '#fold-2 > div.container > div.row.equal-height-container',
      ],
    },
    {
      name: 'cards-explore',
      instances: [
        '#fold-3 > div.row.equal-height-container',
      ],
    },
    {
      name: 'hero-banner',
      instances: [
        '#fold-4 > div.parallax-campaign-banner.parbase',
      ],
    },
  ],
  sections: [
    {
      id: 'rc7-hero',
      name: 'hero-carousel',
      selector: '#fold-1',
      style: null,
      blocks: ['carousel-hero'],
      defaultContent: [],
    },
    {
      id: 'rc7-promos',
      name: 'promos',
      selector: '#fold-2',
      style: null,
      blocks: ['cards-service'],
      defaultContent: [
        '#fold-2 > div.container > div.row:nth-of-type(2) > div.col-sm-12.col-xs-12',
        '#fold-2 > div.container > div.row:nth-of-type(2) > div.faq-link',
      ],
    },
    {
      id: 'rc7-tools',
      name: 'tools',
      selector: '#fold-3',
      style: 'highlight',
      blocks: ['cards-explore'],
      defaultContent: ['#fold-3 > div.container'],
    },
    {
      id: 'rc7-campaign',
      name: 'campaign',
      selector: '#fold-4',
      style: null,
      blocks: ['hero-banner'],
      defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY - order matters within each hook.
// cleanup runs first (removes chrome so later transformers only touch body
// content), then sections adds <hr> breaks + section metadata, then the DM
// transformer rewrites Scene7 <img> into carrier anchors on the parser-built DOM.
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
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

    // 6. Generate sanitized path. Map the root/homepage URL to `/index` —
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
