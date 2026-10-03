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

  // tools/importer/import-about-us.js
  var import_about_us_exports = {};
  __export(import_about_us_exports, {
    default: () => import_about_us_default
  });

  // tools/importer/parsers/hero-banner.js
  var SCENE7_HOST = "https://toyotafinancial.scene7.com";
  var SITE_ORIGIN = "https://www.toyotafinancial.com";
  var BG_URL_RE = /background-image\s*:[^;]*?url\(\s*(['"]?)([^'")]+)\1\s*\)/i;
  function resolveImageUrl(raw) {
    const url = (raw || "").trim();
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/ToyotaFinancial/")) return `${SCENE7_HOST}/is/image${url}`;
    if (url.startsWith("/is/image/")) return `${SCENE7_HOST}${url}`;
    if (url.startsWith("/")) return `${SITE_ORIGIN}${url}`;
    return url;
  }
  function bgUrlFromStyle(styleText) {
    const m = (styleText || "").match(BG_URL_RE);
    return m ? m[2].trim() : "";
  }
  function findCareerImageUrl(bannerEl) {
    const inline = bgUrlFromStyle(bannerEl.getAttribute("style"));
    if (inline) return inline;
    try {
      const view = bannerEl.ownerDocument && bannerEl.ownerDocument.defaultView;
      if (view && view.getComputedStyle) {
        const computed = view.getComputedStyle(bannerEl).backgroundImage || "";
        const m = computed.match(/url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
        if (m && m[2]) return m[2].trim();
      }
    } catch (e) {
    }
    const img = bannerEl.querySelector("img[src]");
    const imgSrc = img ? img.getAttribute("src") : "";
    if (/^(https?:)?\/\//i.test(imgSrc) || imgSrc.includes("/is/image/")) return imgSrc;
    const scope = bannerEl.parentNode;
    if (scope) {
      for (const node of scope.childNodes) {
        if (node.nodeType === 8 && /career-banner/.test(node.nodeValue || "")) {
          const fromComment = bgUrlFromStyle(node.nodeValue);
          if (fromComment) return fromComment;
        }
      }
    }
    return imgSrc || "";
  }
  function parseCareerBanner(element, careerBanner, document) {
    const content = careerBanner.querySelector(".career-content") || careerBanner;
    const heading = content.querySelector("h2") || content.querySelector("h1, h3");
    const subheading = [...content.querySelectorAll("h3, h4, p")].find((el) => el !== heading && el.textContent.trim());
    const cta = content.querySelector("a.btn") || content.querySelector("a[href]");
    const src = resolveImageUrl(findCareerImageUrl(careerBanner));
    const existingImg = careerBanner.querySelector("img");
    const alt = careerBanner.getAttribute("alt") || existingImg && existingImg.getAttribute("alt") || (heading ? heading.textContent.trim() : "");
    if (!src && !heading && !subheading && !cta) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const imageFrag = document.createDocumentFragment();
    if (src) {
      const img = document.createElement("img");
      img.setAttribute("src", src);
      img.setAttribute("alt", alt);
      imageFrag.appendChild(img);
    }
    cells.push([imageFrag]);
    const textFrag = document.createDocumentFragment();
    if (heading) {
      const h = document.createElement("h2");
      h.textContent = heading.textContent.trim();
      textFrag.appendChild(h);
    }
    if (subheading) {
      const s = document.createElement(/^H[1-6]$/.test(subheading.tagName) ? "h3" : "p");
      s.textContent = subheading.textContent.trim();
      textFrag.appendChild(s);
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
  function parse(element, { document }) {
    const careerBanner = element.querySelector(".career-banner");
    if (careerBanner && !element.querySelector(".container-fluid.campaign")) {
      parseCareerBanner(element, careerBanner, document);
      return;
    }
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

  // tools/importer/parsers/columns-card.js
  function parse2(element, { document }) {
    const card = element.querySelector(".card") || element;
    const cols = [...card.querySelectorAll(':scope > .col-sm-6, :scope > [class*="col-"]')];
    const imgCol = cols.find((c) => c.querySelector("img")) || card;
    const img = imgCol.querySelector("img");
    const textSource = card.querySelector(".caption") || cols.find((c) => c !== imgCol && !c.querySelector("img"));
    if (!img && !(textSource && textSource.textContent.trim())) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const imageCell = [];
    if (img) {
      const newImg = document.createElement("img");
      newImg.setAttribute("src", img.getAttribute("src"));
      newImg.setAttribute("alt", img.getAttribute("alt") || "");
      imageCell.push(newImg);
    }
    const textCell = [];
    if (textSource) {
      [...textSource.children].forEach((child) => {
        if (child.matches("a") && !child.textContent.trim() && !child.querySelector("img")) return;
        if (!child.textContent.trim() && !child.querySelector("img")) return;
        textCell.push(child);
      });
    }
    const cells = [[imageCell.length ? imageCell : "", textCell.length ? textCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-card", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-policy.js
  function cleanText(el) {
    return (el.textContent || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }
  function stripAttributes(root) {
    [root, ...root.querySelectorAll("*")].forEach((node) => {
      [...node.attributes].forEach((attr) => {
        if (node.tagName === "A" && attr.name === "href") return;
        if (node.tagName === "IMG" && (attr.name === "src" || attr.name === "alt")) return;
        node.removeAttribute(attr.name);
      });
    });
    return root;
  }
  function isSimpleCell(cell) {
    if (cell.querySelector("ul, ol, table, img, a, br")) return false;
    return cell.querySelectorAll("p").length <= 1;
  }
  function buildCell(cell, document) {
    if (isSimpleCell(cell)) return cleanText(cell);
    const frag = document.createDocumentFragment();
    [...cell.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        if (child.textContent.trim()) frag.appendChild(document.createTextNode(child.textContent.trim()));
        return;
      }
      if (child.nodeType !== 1) return;
      frag.appendChild(stripAttributes(child.cloneNode(true)));
    });
    return frag;
  }
  function parse3(element, { document }) {
    const table = element.matches("table") ? element : element.querySelector("table");
    if (!table) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const rows = [...table.rows].filter((tr) => tr.closest("table") === table);
    if (!rows.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = rows.map((tr) => [...tr.cells].map((cell) => buildCell(cell, document)));
    const colCount = Math.max(...cells.map((r) => r.length));
    cells.forEach((r) => {
      while (r.length < colCount) r.push("");
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "table-policy", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/toyotafinancial-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var SCENE7_HOST2 = "https://toyotafinancial.scene7.com";
  var SITE_ORIGIN2 = "https://www.toyotafinancial.com";
  var BG_URL_RE2 = /background-image\s*:[^;]*?url\(\s*(['"]?)([^'")]+)\1\s*\)/i;
  function resolveImageUrl2(raw) {
    const url = (raw || "").trim();
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/ToyotaFinancial/")) return `${SCENE7_HOST2}/is/image${url}`;
    if (url.startsWith("/is/image/")) return `${SCENE7_HOST2}${url}`;
    if (url.startsWith("/")) return `${SITE_ORIGIN2}${url}`;
    return url;
  }
  function bgUrlFromStyle2(styleText) {
    const m = (styleText || "").match(BG_URL_RE2);
    return m ? m[2].trim() : "";
  }
  function findBannerImageUrl(topSection) {
    const inline = bgUrlFromStyle2(topSection.getAttribute("style"));
    if (inline) return inline;
    try {
      const view = topSection.ownerDocument && topSection.ownerDocument.defaultView;
      if (view && view.getComputedStyle) {
        const computed = view.getComputedStyle(topSection).backgroundImage || "";
        const m = computed.match(/url\(\s*(['"]?)([^'")]+)\1\s*\)/i);
        if (m && m[2]) return m[2].trim();
      }
    } catch (e) {
    }
    const img = topSection.querySelector("img[src]");
    const imgSrc = img ? img.getAttribute("src") : "";
    if (/^(https?:)?\/\//i.test(imgSrc) || imgSrc.includes("/is/image/")) return imgSrc;
    const scope = topSection.parentNode;
    if (scope) {
      for (const node of scope.childNodes) {
        if (node.nodeType === 8 && /top-section/.test(node.nodeValue || "")) {
          const fromComment = bgUrlFromStyle2(node.nodeValue);
          if (fromComment) return fromComment;
        }
      }
    }
    return imgSrc || "";
  }
  function isEmptyContainer(el) {
    return el.textContent.replace(/\u00a0/g, " ").trim() === "" && !el.querySelector("img, picture, video, iframe, svg, table, input, select, textarea");
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      const doc = element.ownerDocument;
      element.querySelectorAll(".banner-component .top-section").forEach((topSection) => {
        const src = resolveImageUrl2(findBannerImageUrl(topSection));
        if (!src) return;
        const existingImg = topSection.querySelector("img");
        const alt = topSection.getAttribute("alt") || existingImg && existingImg.getAttribute("alt") || "";
        const img = doc.createElement("img");
        img.setAttribute("src", src);
        img.setAttribute("alt", alt);
        topSection.replaceWith(img);
      });
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
        "a.carousel-control",
        // carousel Previous/Next arrow controls in #fold-1
        // about-us
        ".bread-crumb.parbase",
        // breadcrumb
        ".nav-list-component"
        // empty right-hand nav column
      ]);
      element.querySelectorAll(".one-column-component").forEach((el) => {
        if (isEmptyContainer(el)) el.remove();
      });
      element.querySelectorAll("a.js-external-tp").forEach((a) => {
        if (isEmptyContainer(a)) a.remove();
      });
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
      element.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
        const meaningful = [...heading.childNodes].filter((n) => {
          if (n.nodeType === 3) return n.textContent.trim() !== "";
          if (n.nodeType === 1) return n.tagName !== "BR";
          return false;
        });
        if (meaningful.length !== 1) return;
        const only = meaningful[0];
        if (only.nodeType !== 1 || !["B", "STRONG"].includes(only.tagName)) return;
        only.replaceWith(...only.childNodes);
        heading.querySelectorAll(":scope > br").forEach((br) => br.remove());
      });
    }
  }

  // tools/importer/transformers/toyotafinancial-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var MARKER_ATTR = "data-tfs-section-meta";
  function toSelectorList(selector) {
    if (Array.isArray(selector)) return selector.filter((s) => typeof s === "string" && s.trim());
    if (typeof selector === "string" && selector.trim()) return [selector];
    return [];
  }
  function querySection(root, selector) {
    for (const sel of toSelectorList(selector)) {
      let el = null;
      try {
        el = root.querySelector(sel);
      } catch (e) {
        el = null;
      }
      if (el) return el;
    }
    return null;
  }
  function markerId(section, index) {
    return String(section.id || section.name || `section-${index}`);
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template;
    const sections = template && Array.isArray(template.sections) ? template.sections : [];
    if (!sections.length) return;
    const doc = element.ownerDocument || payload && payload.document;
    if (hookName === TransformHook2.beforeTransform) {
      const claimed = /* @__PURE__ */ new Set();
      const resolved = sections.map((section) => {
        if (!section) return null;
        const el = querySection(element, section.selector);
        if (!el || claimed.has(el)) return null;
        claimed.add(el);
        return el;
      });
      const firstMatched = resolved.findIndex((el) => el);
      if (firstMatched === -1) return;
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const el = resolved[i];
        if (!el) continue;
        const section = sections[i];
        if (section.style) {
          const marker = doc.createElement("span");
          marker.setAttribute(MARKER_ATTR, markerId(section, i));
          el.after(marker);
        }
        if (i !== firstMatched) {
          el.before(doc.createElement("hr"));
        }
      }
    }
    if (hookName === TransformHook2.afterTransform) {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section || !section.style) continue;
        const marker = element.querySelector(`[${MARKER_ATTR}="${markerId(section, i)}"]`);
        if (!marker) continue;
        const block = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        marker.replaceWith(block);
      }
    }
  }

  // tools/importer/transformers/toyotafinancial-links.js
  var TransformHook3 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var SITE_ORIGIN3 = "https://www.toyotafinancial.com";
  var CONTENT_PREFIX_RE = /^\/content\/toyotafinancial(?=[/?#]|$)/i;
  var SITE_ABSOLUTE_RE = /^https?:\/\/(www\.)?toyotafinancial\.com(?=[/?#]|$)/i;
  function rewriteHref(rawHref) {
    const href = (rawHref || "").trim();
    if (!href) return null;
    const abs = href.match(SITE_ABSOLUTE_RE);
    if (abs) {
      const rest = href.slice(abs[0].length);
      if (!CONTENT_PREFIX_RE.test(rest)) return null;
      return `${SITE_ORIGIN3}${rest.replace(CONTENT_PREFIX_RE, "") || "/"}`;
    }
    if (!href.startsWith("/") || href.startsWith("//") || href === "/") return null;
    const path = href.replace(CONTENT_PREFIX_RE, "");
    return `${SITE_ORIGIN3}${path.startsWith("/") ? path : `/${path}`}`;
  }
  function transform3(hookName, element, payload) {
    if (hookName !== TransformHook3.afterTransform) return;
    element.querySelectorAll("a[href]").forEach((a) => {
      const next = rewriteHref(a.getAttribute("href"));
      if (next) a.setAttribute("href", next);
    });
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
  function transform4(hookName, element, payload) {
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

  // tools/importer/import-about-us.js
  var parsers = {
    "hero-banner": parse,
    "columns-card": parse2,
    "table-policy": parse3
  };
  var PAGE_TEMPLATE = {
    "name": "about-us",
    "description": "Text and legal content pages (About TFS, Accessibility, Online Policies & Agreements, Online Privacy Policy): full-width banner image, h1 + long rich text, optional careers banner, community card and policy data table.",
    "urls": [
      "https://www.toyotafinancial.com/us/en/about_us/company_overview.html",
      "https://www.toyotafinancial.com/us/en/accessibility.html",
      "https://www.toyotafinancial.com/us/en/online_policies_and_agreements.html",
      "https://www.toyotafinancial.com/us/en/online_privacy_policy.html"
    ],
    "blocks": [
      {
        "name": "hero-banner",
        "instances": [
          "#main-content .screenFade > .banner.parbase"
        ]
      },
      {
        "name": "columns-card",
        "instances": [
          "#main-content .screenFade > .card-component.parbase"
        ]
      },
      {
        "name": "table-policy",
        "instances": [
          "#main-content .screenFade > .one-column-component table"
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
          "#main-content .screenFade > .banner-component .top-section"
        ]
      },
      {
        "id": "rc8",
        "name": "main-text",
        "selector": [
          "#main-content .screenFade > .two-columns-left-one-column-right",
          "#main-content .screenFade > .one-column",
          "#main-content .screenFade > .one-column-component"
        ],
        "style": null,
        "blocks": [
          "table-policy"
        ],
        "defaultContent": [
          "#main-content .screenFade .page-heading",
          "#main-content .screenFade .rte"
        ]
      },
      {
        "id": "rc9",
        "name": "careers-banner",
        "selector": [
          "#main-content .screenFade > .banner.parbase"
        ],
        "style": null,
        "blocks": [
          "hero-banner"
        ],
        "defaultContent": []
      },
      {
        "id": "rc10+rc11",
        "name": "community",
        "selector": [
          "#main-content .screenFade > .heading.parbase"
        ],
        "style": null,
        "blocks": [
          "columns-card"
        ],
        "defaultContent": [
          "#main-content .screenFade > .heading.parbase h2"
        ]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : [],
    transform3,
    transform4
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
  var import_about_us_default = {
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
  return __toCommonJS(import_about_us_exports);
})();
