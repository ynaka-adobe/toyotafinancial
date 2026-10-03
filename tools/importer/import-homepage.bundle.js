/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel-hero.js
  function parse(element, { document }) {
    const items = element.querySelectorAll(":scope .carousel-inner > .item, :scope > .carousel-inner > .item, .carousel-inner > .item");
    if (!items.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach((item) => {
      const picture = item.querySelector("picture");
      const source = picture ? picture.querySelector("source[srcset]") : null;
      const srcImg = picture ? picture.querySelector("img") : item.querySelector("img");
      const desktopUrl = source ? source.getAttribute("srcset") : "";
      const mobileUrl = srcImg ? srcImg.getAttribute("src") : "";
      const imageUrl = desktopUrl || mobileUrl;
      const alt = srcImg && srcImg.getAttribute("alt") || source && source.getAttribute("alt") || "";
      const imageFrag = document.createDocumentFragment();
      if (imageUrl) {
        const img = document.createElement("img");
        img.setAttribute("src", imageUrl);
        img.setAttribute("alt", alt);
        const slideAnchor = item.querySelector(":scope > a[href]");
        if (slideAnchor && slideAnchor.getAttribute("href")) {
          const a = document.createElement("a");
          a.setAttribute("href", slideAnchor.getAttribute("href"));
          a.appendChild(img);
          imageFrag.appendChild(a);
        } else {
          imageFrag.appendChild(img);
        }
      }
      const details = item.querySelector(".live-text-details");
      const titleEl = details ? details.querySelector(".live-text") : null;
      const subtextEl = details ? details.querySelector(".live-subtext") : null;
      const ctaEl = details ? details.querySelector(".live-button a[href], .live-buttonc a[href]") : null;
      const disclaimerEl = details ? details.querySelector(".live-disclaimertext") : null;
      const titleText = titleEl ? titleEl.textContent.trim() : "";
      const subtext = subtextEl ? subtextEl.textContent.trim() : "";
      const ctaText = ctaEl ? ctaEl.textContent.trim() : "";
      const disclaimer = disclaimerEl ? disclaimerEl.textContent.trim() : "";
      const contentFrag = document.createDocumentFragment();
      const hasContent = titleText || subtext || ctaText || disclaimer;
      if (hasContent) {
        if (titleText) {
          const h = document.createElement("h2");
          h.textContent = titleText;
          contentFrag.appendChild(h);
        }
        if (subtext) {
          const p = document.createElement("p");
          p.textContent = subtext;
          contentFrag.appendChild(p);
        }
        if (ctaText) {
          const a = document.createElement("a");
          a.setAttribute("href", ctaEl.getAttribute("href"));
          a.textContent = ctaText;
          const p = document.createElement("p");
          p.appendChild(a);
          contentFrag.appendChild(p);
        }
        if (disclaimer) {
          const p = document.createElement("p");
          p.textContent = disclaimer;
          contentFrag.appendChild(p);
        }
      }
      cells.push([imageFrag, hasContent ? contentFrag : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-service.js
  function parse2(element, { document }) {
    const tiles = element.querySelectorAll(":scope .promo-container, .promo-container");
    const cells = [];
    tiles.forEach((tile) => {
      const img = tile.querySelector("img.img-responsive, img");
      const imageFrag = document.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(img);
      }
      const header = tile.querySelector(".promo-header");
      const descEl = tile.querySelector(".promo-content .fadeInUp p, .promo-content > div p, .promo-content p:not(.promo-header)");
      const href = tile.getAttribute("data-link");
      const textFrag = document.createDocumentFragment();
      if (header) {
        const h = document.createElement("h3");
        const titleText = header.textContent.trim();
        if (href) {
          const link = document.createElement("a");
          link.setAttribute("href", href);
          link.textContent = titleText;
          h.appendChild(link);
        } else {
          h.textContent = titleText;
        }
        textFrag.appendChild(h);
      }
      if (descEl && descEl.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = descEl.textContent.trim();
        textFrag.appendChild(p);
      }
      cells.push([imageFrag, textFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-service", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-explore.js
  function parse3(element, { document }) {
    let cards = element.querySelectorAll("#promo-carousel .item.active .promo-container-1");
    if (!cards.length) {
      cards = element.querySelectorAll(".promo-item-1:not(.hidden) .promo-container-1");
    }
    if (!cards.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cards.forEach((card) => {
      const img = card.querySelector(".img-container img, img.img-responsive, img");
      const imageFrag = document.createDocumentFragment();
      if (img) {
        imageFrag.appendChild(img);
      }
      const header = card.querySelector(".promo-header");
      const descEl = card.querySelector(".promo-content .fadeInUp p, .promo-content > div p, .promo-content p:not(.promo-header)");
      const href = card.getAttribute("data-link");
      const textFrag = document.createDocumentFragment();
      if (header) {
        const h = document.createElement("h3");
        const titleText = header.textContent.trim();
        if (href) {
          const link = document.createElement("a");
          link.setAttribute("href", href);
          link.textContent = titleText;
          h.appendChild(link);
        } else {
          h.textContent = titleText;
        }
        textFrag.appendChild(h);
      }
      if (descEl && descEl.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = descEl.textContent.trim();
        textFrag.appendChild(p);
      }
      cells.push([imageFrag, textFrag]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-explore", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-banner.js
  function parse4(element, { document }) {
    const banner = element.querySelector(".container-fluid.campaign.visible-lg") || element.querySelector(".container-fluid.campaign") || element;
    const content = banner.querySelector(".campaign-content") || banner;
    const heading = content.querySelector("h1, h2, h3");
    const subheading = content.querySelector("p");
    const cta = content.querySelector('a.btn, a[class*="btn"], a[href]');
    const bgStyle = banner.getAttribute("style") || "";
    const urlMatch = bgStyle.match(/background-image\s*:[^;]*url\((['"]?)([^'")]+)\1\)/i);
    const bgUrl = urlMatch ? urlMatch[2].trim() : "";
    if (!bgUrl && !heading && !subheading && !cta) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const imageFrag = document.createDocumentFragment();
    if (bgUrl) {
      const img = document.createElement("img");
      img.setAttribute("src", bgUrl);
      img.setAttribute("alt", heading ? heading.textContent.trim() : "");
      imageFrag.appendChild(img);
    }
    cells.push([imageFrag]);
    const textFrag = document.createDocumentFragment();
    if (heading) {
      const h = document.createElement("h2");
      h.textContent = heading.textContent.trim();
      textFrag.appendChild(h);
    }
    if (subheading && subheading.textContent.trim()) {
      const p = document.createElement("p");
      p.textContent = subheading.textContent.trim();
      textFrag.appendChild(p);
    }
    if (cta && cta.getAttribute("href")) {
      const a = document.createElement("a");
      a.setAttribute("href", cta.getAttribute("href"));
      a.textContent = cta.textContent.trim();
      const p = document.createElement("p");
      p.appendChild(a);
      textFrag.appendChild(p);
    }
    cells.push([textFrag]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/toyotafinancial-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        // OneTrust cookie consent banner + preference modal
        "#kampyleButtonContainer",
        // Kampyle "Feedback" widget button
        ".hamburger.parbase",
        // body-level mobile menu shell: nav#sidebar, mobile
        // login form, announcements, session/maintenance/
        // interstitial modals — all non-authorable chrome
        ".tour-popup",
        // (empty) guided-tour popup container
        ".upgrade-message",
        // scheduled-maintenance notice
        "#home-loading",
        // page loading spinner
        ".bottom-info-modal",
        // empty runtime info modal in #fold-1 (only a "×" close button)
        "a.carousel-control"
        // carousel Previous/Next arrow controls in #fold-1
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "nav",
        // body > nav skip-links AND header nav#nav_menu / nav#sidebar
        "div.tfs-header-wrapper",
        // global header wrapper (contains <header>)
        "header",
        // global header (defensive; also covered by wrapper)
        "#global-footer",
        // global footer (auto-populated)
        "div.footer",
        // footer wrapper div around #global-footer
        "#destination_publishing_iframe_tfs_0",
        // Adobe demdex ID-sync iframe
        "iframe",
        // any remaining iframes (e.g. onetrust text-resize)
        // scroll helper anchors
        "#scroll_down",
        "#scroll_top",
        "#scroll-to-top",
        // body-level runtime hooks / hidden helpers
        "#disable-search",
        "#enableDtmHash",
        "#dtmHashValue",
        ".hiddendiv.common",
        // empty AEM parsys placeholders (verified empty in captured DOM)
        ".newpar.new.section",
        ".par.iparys_inherited",
        // safe non-content elements
        "link",
        "noscript"
      ]);
    }
  }

  // tools/importer/transformers/toyotafinancial-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const { document, template } = payload;
    const sections = template && template.sections || [];
    if (!Array.isArray(sections) || sections.length < 2) return;
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section || !section.selector) continue;
      const el = element.querySelector(section.selector);
      if (!el) continue;
      if (section.style) {
        const block = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        el.after(block);
      }
      if (i > 0) {
        const hr = document.createElement("hr");
        el.before(hr);
      }
    }
  }

  // tools/importer/transformers/toyotafinancial-dm-images.js
  function detectDynamicMediaUrl(urlStr) {
    let u;
    try {
      u = new URL(urlStr, "https://x/");
    } catch (e) {
      return false;
    }
    if (u.pathname.startsWith("/is/image/")) {
      return "scene7";
    }
    if (/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname) && u.pathname.startsWith("/adobe/assets/urn:")) {
      return "dm-openapi";
    }
    return false;
  }
  var LINKED_DM_INLINE_WRAPPER_TAGS = /* @__PURE__ */ new Set(["PICTURE"]);
  var LINKED_DM_WRAPPER_SIBLING_TAGS = /* @__PURE__ */ new Set(["SOURCE"]);
  function findLinkedDmCarrier(img) {
    if (!img || !img.parentElement) return null;
    let node = img;
    let parent = img.parentElement;
    while (parent && LINKED_DM_INLINE_WRAPPER_TAGS.has(parent.tagName)) {
      let foundNode = false;
      for (const child of parent.children) {
        if (child === node) {
          foundNode = true;
        } else if (!LINKED_DM_WRAPPER_SIBLING_TAGS.has(child.tagName)) {
          return null;
        }
      }
      if (!foundNode) return null;
      node = parent;
      parent = parent.parentElement;
    }
    if (!parent || parent.tagName !== "A") return null;
    if (parent.children.length !== 1 || parent.children[0] !== node) return null;
    if (parent.textContent.trim() !== "") return null;
    return parent;
  }
  var EMPTY_ALT_SENTINEL = "Image without alt text";
  function altToLinkText(alt) {
    return alt || EMPTY_ALT_SENTINEL;
  }
  function transform3(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const doc = element.ownerDocument;
    element.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!detectDynamicMediaUrl(src)) return;
      const alt = img.getAttribute("alt") || "";
      const linkedAnchor = findLinkedDmCarrier(img);
      if (linkedAnchor) {
        linkedAnchor.setAttribute("title", src);
        linkedAnchor.textContent = altToLinkText(alt);
        return;
      }
      const parent = img.parentElement;
      if (parent && parent.tagName === "A") {
        console.warn("DM image inside mixed-content anchor, skipped:", src);
        return;
      }
      const a = doc.createElement("a");
      a.href = src;
      a.textContent = altToLinkText(alt);
      img.replaceWith(a);
    });
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "carousel-hero": parse,
    "cards-service": parse2,
    "cards-explore": parse3,
    "hero-banner": parse4
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Toyota Financial homepage: hero banner carousel, promo callout cards grid, financial tools/quiz cards grid, campaign banner, and footer.",
    urls: [
      "https://www.toyotafinancial.com"
    ],
    blocks: [
      {
        name: "carousel-hero",
        instances: [
          "#carousel_image",
          "#fold-1 .carousel-image.parbase"
        ]
      },
      {
        name: "cards-service",
        instances: [
          "#fold-2 > div.container > div.row.equal-height-container"
        ]
      },
      {
        name: "cards-explore",
        instances: [
          "#fold-3 > div.row.equal-height-container"
        ]
      },
      {
        name: "hero-banner",
        instances: [
          "#fold-4 > div.parallax-campaign-banner.parbase"
        ]
      }
    ],
    sections: [
      {
        id: "rc7-hero",
        name: "hero-carousel",
        selector: "#fold-1",
        style: null,
        blocks: ["carousel-hero"],
        defaultContent: []
      },
      {
        id: "rc7-promos",
        name: "promos",
        selector: "#fold-2",
        style: null,
        blocks: ["cards-service"],
        defaultContent: [
          "#fold-2 > div.container > div.row:nth-of-type(2) > div.col-sm-12.col-xs-12",
          "#fold-2 > div.container > div.row:nth-of-type(2) > div.faq-link"
        ]
      },
      {
        id: "rc7-tools",
        name: "tools",
        selector: "#fold-3",
        style: "highlight",
        blocks: ["cards-explore"],
        defaultContent: ["#fold-3 > div.container"]
      },
      {
        id: "rc7-campaign",
        name: "campaign",
        selector: "#fold-4",
        style: null,
        blocks: ["hero-banner"],
        defaultContent: []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : [],
    transform3
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
