/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsQuestionsParser from './parsers/cards-questions.js';
import fragmentParser from './parsers/fragment.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/toyotafinancial-cleanup.js';
import sectionsTransformer from './transformers/toyotafinancial-sections.js';
import linksTransformer from './transformers/toyotafinancial-links.js';
import dmImagesTransformer from './transformers/toyotafinancial-dm-images.js';

// PARSER REGISTRY
const parsers = {
  'cards-questions': cardsQuestionsParser,
  fragment: fragmentParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "faq",
  "description": "FAQ topic pages (38): full-width banner image, Back to FAQs link + topic h1, stacked question link tiles, shared Still need help? box (fragment).",
  "urls": [
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/Guaranteed_Auto_Protection_GAP.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/One_Big_Beautiful_Bill_Act.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/about-tfs.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/about_credit.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/about_this_website.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/account_access_and_password.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/account_details.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/account_registration.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/bZ4X.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/billing.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/business_solutions.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/consent_to_electronic_communications_and_agreements.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/encrypted-email.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/enrolling_in_pay_online.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/extension_and_deferral.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/financial-hardship.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/financing_and_protection_products.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/fingerprint_authentication.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/insurance_in_case_of_accident.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/insurance_requirements.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/lease_end_process.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/loan_payoff_and_title_lien_release.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/login-faqs.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/managing_pay_online.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/marketing_preferences.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/mileage.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/military_benefits.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/mobileapp-faqs.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/online_credit_application.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/paperless_billing.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/payments.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/privacy.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/repeat_customers.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/shopping.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/support_center.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/toyota_insurance.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/voluntary_protection_products.html",
    "https://www.toyotafinancial.com/us/en/planning_tools/faq/wear_and_use.html"
  ],
  "blocks": [
    {
      "name": "cards-questions",
      "instances": [
        "#main-content .screenFade > .questionlist div:has(> .faq-question)"
      ]
    },
    {
      "name": "fragment",
      "instances": [
        "#main-content .screenFade > .questionlist #faqcard"
      ]
    }
  ],
  "sections": [
    {
      "id": "rc6",
      "name": "page-banner",
      "selector": [
        "#main-content .screenFade > .faq-banner-component"
      ],
      "style": "page-banner",
      "blocks": [],
      "defaultContent": [
        "#main-content .screenFade > .faq-banner-component .top-section"
      ]
    },
    {
      "id": "rc7",
      "name": "topic-questions",
      "selector": [
        "#main-content .screenFade > .questionlist"
      ],
      "style": null,
      "blocks": [
        "cards-questions"
      ],
      "defaultContent": [
        "#main-content .screenFade > .questionlist h1"
      ]
    },
    {
      "id": "rc8",
      "name": "help-card",
      "selector": [
        "#main-content .screenFade > .questionlist #faqcard"
      ],
      "style": null,
      "blocks": [
        "fragment"
      ],
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
    //    (the shared "Still need help?" box is swapped for a fragment reference by
    //    the fragment parser; the fragment document itself comes from
    //    import-faq-help-fragment.js)
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
    //    (planning_tools/faq/about_credit.html -> planning-tools/faq/about-credit).
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
