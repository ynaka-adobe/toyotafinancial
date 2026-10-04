/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsCalloutParser from './parsers/columns-callout.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import accordionBoxedParser from './parsers/accordion-boxed.js';
import videoPosterParser from './parsers/video-poster.js';
import quizPlansParser from './parsers/quiz-plans.js';
import carouselCardsParser from './parsers/carousel-cards.js';
import cardsThumbnailParser from './parsers/cards-thumbnail.js';
import tableCaptionParser from './parsers/table-caption.js';
import columnsCardParser from './parsers/columns-card.js';
import tabsPlansParser from './parsers/tabs-plans.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/toyotafinancial-cleanup.js';
import sectionsTransformer from './transformers/toyotafinancial-sections.js';
import linksTransformer from './transformers/toyotafinancial-links.js';
import dmImagesTransformer from './transformers/toyotafinancial-dm-images.js';

// PARSER REGISTRY
// tabs-plans runs last (blocks[] order): it moves panel content that the
// other parsers have already turned into blocks.
const parsers = {
  'columns-callout': columnsCalloutParser,
  'accordion-faq': accordionFaqParser,
  'accordion-boxed': accordionBoxedParser,
  'video-poster': videoPosterParser,
  'quiz-plans': quizPlansParser,
  'carousel-cards': carouselCardsParser,
  'cards-thumbnail': cardsThumbnailParser,
  'table-caption': tableCaptionParser,
  'columns-card': columnsCardParser,
  'tabs-plans': tabsPlansParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "content-page",
  "description": "Older-design content pages: banner image, main text column with embedded components (accordions, tabs, videos, cards, tables, carousel), blog index and article.",
  "urls": [
    "https://www.toyotafinancial.com/us/en/TFS_ThoughtFuel_Blog.html",
    "https://www.toyotafinancial.com/us/en/TFS_ThoughtFuel_Blog/Weighing_Your_Options_Buy_vs_Lease.html",
    "https://www.toyotafinancial.com/us/en/financing_options/buy_a_toyota.html",
    "https://www.toyotafinancial.com/us/en/financing_options/for_businesses.html",
    "https://www.toyotafinancial.com/us/en/financing_options/for_businesses/business_solutions.html",
    "https://www.toyotafinancial.com/us/en/financing_options/leasing_a_toyota.html",
    "https://www.toyotafinancial.com/us/en/financing_options/rebate_finance_programs.html",
    "https://www.toyotafinancial.com/us/en/financing_options/rebate_finance_programs/find_rebate_finance_programs.html",
    "https://www.toyotafinancial.com/us/en/financing_options/rebate_finance_programs/repeat_customers.html",
    "https://www.toyotafinancial.com/us/en/financing_options/toyota_rewards_visa.html",
    "https://www.toyotafinancial.com/us/en/financing_options/understanding_credit.html",
    "https://www.toyotafinancial.com/us/en/financing_options/understanding_credit/credit_101.html",
    "https://www.toyotafinancial.com/us/en/financing_options/understanding_credit/credit_tips.html",
    "https://www.toyotafinancial.com/us/en/financing_options/understanding_credit/your_credit.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/get_started.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/ways_to_pay.html",
    "https://www.toyotafinancial.com/us/en/vehicle_protection_plan/guaranteed_auto_protection.html",
    "https://www.toyotafinancial.com/us/en/vehicle_protection_plan/prepaid_maintenance_plan.html",
    "https://www.toyotafinancial.com/us/en/vehicle_protection_plan/tire_wheel_protection.html",
    "https://www.toyotafinancial.com/us/en/vehicle_protection_plan/vehicle_service_agreements.html",
    "https://www.toyotafinancial.com/us/en/vehicle_protection_plan/which_plan_is_right_for_me.html",
    "https://www.toyotafinancial.com/us/en/contact_us.html",
    "https://www.toyotafinancial.com/us/en/vehicle_protection_plan/how_to_file_a_claim.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/visiting_the_dealer.html",
    "https://www.toyotafinancial.com/us/en/financing_options/rebate_finance_programs/college_rebate_program.html",
    "https://www.toyotafinancial.com/us/en/financing_options/rebate_finance_programs/military_rebate_program.html",
    "https://www.toyotafinancial.com/us/en/financing_options/for_businesses/business_credit_applications.html"
  ],
  "blocks": [
    {
      "name": "columns-callout",
      "instances": [
        "#main-content .screenFade .card-component.parbase:has(.card-content, .img-card):not(:has(.thumbnail-card, .materialized-dropdown, .card.no-pd))"
      ]
    },
    {
      "name": "accordion-faq",
      "instances": [
        "#main-content .screenFade .accordion.parbase ul.custom-faq-accordion"
      ]
    },
    {
      "name": "accordion-boxed",
      "instances": [
        "#main-content .screenFade .compContainer.parbase .tmcc-accordion > .newAccordion.parbase"
      ]
    },
    {
      "name": "video-poster",
      "instances": [
        "#main-content .screenFade .video-component.parbase:has(video)"
      ]
    },
    {
      "name": "quiz-plans",
      "instances": [
        "#main-content .screenFade .quiz-component.parbase .quiz-card"
      ]
    },
    {
      "name": "carousel-cards",
      "instances": [
        "#main-content .screenFade .secondary-section > .viewplans"
      ]
    },
    {
      "name": "cards-thumbnail",
      "instances": [
        "#main-content .screenFade .generalcolumn.parbase:has(.thumbnail-card)"
      ]
    },
    {
      "name": "table-caption",
      "instances": [
        "#main-content .screenFade .table.parbase:has(table)"
      ]
    },
    {
      "name": "columns-card",
      "instances": [
        "#main-content .screenFade > .card-component.parbase:has(.card.no-pd)"
      ]
    },
    {
      "name": "tabs-plans",
      "instances": [
        "#main-content .screenFade .card-component.parbase:has(.materialized-dropdown)",
        "#main-content .screenFade .tabcomponent"
      ]
    }
  ],
  "sections": [
    {
      "id": "rc7",
      "name": "page-banner",
      "selector": [
        "#main-content .screenFade > .banner-component"
      ],
      "style": "page-banner",
      "blocks": [],
      "defaultContent": [
        "#main-content .screenFade > .banner-component img"
      ]
    },
    {
      "id": "rc8",
      "name": "main-text",
      "selector": [
        "#main-content .screenFade > .two-columns-left-one-column-right"
      ],
      "style": null,
      "blocks": [
        "columns-callout",
        "accordion-faq",
        "accordion-boxed",
        "video-poster",
        "quiz-plans",
        "cards-thumbnail",
        "table-caption",
        "tabs-plans"
      ],
      "defaultContent": [
        "#main-content .screenFade > .two-columns-left-one-column-right .page-heading",
        "#main-content .screenFade > .two-columns-left-one-column-right .rte.parbase",
        "#main-content .screenFade > .two-columns-left-one-column-right .list.parbase",
        "#main-content .screenFade > .two-columns-left-one-column-right .image.parbase figure",
        "#main-content .screenFade > .two-columns-left-one-column-right .accordion.parbase > div > h2",
        "#main-content .screenFade > .two-columns-left-one-column-right .accordion.parbase > div > p",
        "#main-content .screenFade > .two-columns-left-one-column-right .accordion.parbase .btn-primary-center",
        "#main-content .screenFade > .two-columns-left-one-column-right .accordion.parbase .disclaimer-note",
        "#main-content .screenFade > .two-columns-left-one-column-right .accordion.parbase ol.disclaimer",
        "#main-content .screenFade > .two-columns-left-one-column-right .quiz-component.parbase > div > h2",
        "#main-content .screenFade > .two-columns-left-one-column-right .quiz-component.parbase > div > h3",
        "#main-content .screenFade > .two-columns-left-one-column-right .quiz-component.parbase > div > p"
      ]
    },
    {
      "id": "rc8-tabs",
      "name": "plan-tab-panels",
      "selector": [
        "#main-content .screenFade .tabcomponent"
      ],
      "style": null,
      "blocks": [
        "table-caption",
        "columns-callout",
        "accordion-faq"
      ],
      "defaultContent": [
        "#main-content .screenFade .tabcomponent .tab-pane .rte.parbase",
        "#main-content .screenFade .tabcomponent .tab-pane .accordion.parbase > div > h2",
        "#main-content .screenFade .tabcomponent .tab-pane .accordion.parbase .disclaimer-note",
        "#main-content .screenFade .tabcomponent .tab-pane .accordion.parbase ol.disclaimer"
      ]
    },
    {
      "id": "rc9",
      "name": "secondary-faq",
      "selector": [
        "#main-content .screenFade > .one-column:has(.parbase)"
      ],
      "style": null,
      "blocks": [
        "accordion-faq",
        "columns-callout"
      ],
      "defaultContent": [
        "#main-content .screenFade > .one-column .accordion.parbase > div > h2",
        "#main-content .screenFade > .one-column .accordion.parbase > div > p",
        "#main-content .screenFade > .one-column .accordion.parbase .btn-primary-center",
        "#main-content .screenFade > .one-column .accordion.parbase ol.disclaimer"
      ]
    },
    {
      "id": "rc9-carousel",
      "name": "plans-carousel",
      "selector": [
        "#main-content .screenFade > .one-column-component:has(.viewplans)"
      ],
      "style": null,
      "blocks": [
        "carousel-cards",
        "columns-callout"
      ],
      "defaultContent": []
    },
    {
      "id": "rc9-rc49",
      "name": "blog-index",
      "selector": [
        "#main-content .screenFade > .one-column-component:not(:has(.viewplans))"
      ],
      "style": null,
      "blocks": [
        "columns-card"
      ],
      "defaultContent": [
        "#main-content .screenFade > .one-column-component .rte.parbase"
      ]
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
    //    (planning_tools/get_started.html -> planning-tools/get-started).
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
