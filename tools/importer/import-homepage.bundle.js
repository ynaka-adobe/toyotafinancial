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
  function parse4(element, { document }) {
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
  function headingSlug(text) {
    return text.toLowerCase().replace(/['‘’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  var KNOWN_SECTION_TITLES = {
    oasa: "Online Account Services Agreement (applicable to Financial Services Customers with Online Account Services)",
    otou: "Online Terms of Use (applicable to all Website users)"
  };
  function isEmptyContainer(el) {
    return el.textContent.replace(/\u00a0/g, " ").trim() === "" && !el.querySelector("img, picture, video, iframe, svg, table, input, select, textarea");
  }
  function renameElement(el, tagName) {
    const repl = el.ownerDocument.createElement(tagName);
    repl.append(...el.childNodes);
    el.replaceWith(repl);
    return repl;
  }
  function isEmptyText(el) {
    return el.textContent.replace(/\u00a0/g, " ").trim() === "";
  }
  function pageTitle(doc) {
    return (doc && doc.title || "").split("|")[0].replace(/\s+/g, " ").trim();
  }
  function cleanupEndOfLeaseBefore(element, doc) {
    element.querySelectorAll(".banner-image.parbase .your-option-img-container.d-md-block").forEach((box) => {
      const src = resolveImageUrl2(findBannerImageUrl(box));
      let img = box.querySelector("img");
      if (!img && src) {
        img = doc.createElement("img");
        img.setAttribute("src", src);
        box.prepend(img);
      } else if (img && src && !/^(https?:)?\/\//i.test(img.getAttribute("src") || "")) {
        img.setAttribute("src", src);
      }
      if (img) {
        const alt = box.getAttribute("alt") || img.getAttribute("alt") || pageTitle(doc);
        img.setAttribute("alt", alt);
      }
      [...box.childNodes].forEach((n) => {
        if (n.nodeType === 8) n.remove();
      });
      if (img) box.style.removeProperty("background-image");
    });
    WebImporter.DOMUtils.remove(element, [
      ".banner-image.parbase .your-option-img-container.d-md-none",
      // mobile crop of the banner
      ".banner-image.parbase br",
      // stray <br> after the containers
      // chrome
      ".two-columns-right-one-column-left .side-nav-container",
      // left section menu
      "main > .container-fluid.px-0 > .secure-footer",
      // footer wrapper (#global-footer)
      ".lease-end-right-container > .video-modal"
      // #pop_modal_video player shell
    ]);
    element.querySelectorAll([
      ".banner-image.parbase h1",
      ".lease-end-right-container > .card-button > h2",
      ".lease-end-right-container > .accordion.parbase > .row > h4"
    ].join(", ")).forEach((h) => {
      if (isEmptyContainer(h)) h.remove();
    });
    element.querySelectorAll(".lease-end-right-container .accordion.parbase .card-body a[style]").forEach((a) => {
      const style = a.getAttribute("style").split(";").filter((decl) => decl.trim() && !/^\s*background-color\s*:/i.test(decl)).join(";").trim();
      if (style) a.setAttribute("style", style);
      else a.removeAttribute("style");
    });
  }
  function cleanupEndOfLeaseAfter(element, doc) {
    element.querySelectorAll(".lease-end-right-container").forEach((col) => {
      col.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
        if (isEmptyContainer(h)) h.remove();
      });
      const first = [...col.querySelectorAll("h1, h2, h3, h4, h5, h6")].find((h) => !h.closest("table"));
      if (first && first.tagName !== "H1") renameElement(first, "h1");
      col.querySelectorAll([
        ".simpleparagraph h4",
        ".links-section h4",
        ".accordion.parbase > .row > h4"
      ].join(", ")).forEach((h) => renameElement(h, "h3"));
      col.querySelectorAll("div.sub-header").forEach((d) => renameElement(d, "p"));
      col.querySelectorAll(".simpleparagraph a.primary-btn.button-link, .button.parbase a.primary-btn.button-link").forEach((a) => {
        if (a.closest("strong, b")) return;
        const strong = doc.createElement("strong");
        if (a.parentElement && a.parentElement.tagName === "P") {
          a.replaceWith(strong);
          strong.append(a);
          return;
        }
        const p = doc.createElement("p");
        a.replaceWith(p);
        strong.append(a);
        p.append(strong);
      });
      col.querySelectorAll("p").forEach((p) => {
        if (isEmptyText(p) && !p.querySelector("img, picture, video, iframe, svg, table, input")) p.remove();
      });
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      const doc = element.ownerDocument;
      cleanupEndOfLeaseBefore(element, doc);
      element.querySelectorAll(".banner-component .top-section, .faq-banner-component .top-section").forEach((topSection) => {
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
        // hidden at every breakpoint on the source (e.g. the policy pages'
        // "View More" link in .terms-view-extra) — never visible to visitors
        ".hidden-xs.hidden-sm.hidden-md.hidden-lg",
        // newer page shell (apply_for_credit): screen-reader skip links and the
        // credit application's own loading spinner
        "a.sr-only",
        "#oca-loading"
      ]);
      const pageUrl = payload && payload.params && payload.params.originalURL || payload && payload.url || "";
      const isBlogArticle = /\/TFS_ThoughtFuel_Blog\/./i.test(pageUrl);
      element.querySelectorAll(".nav-list-component").forEach((el) => {
        if (!isBlogArticle) el.remove();
      });
      element.querySelectorAll("a.js-comparison-printer").forEach((a) => {
        a.setAttribute("href", "#print");
        if (!a.closest("strong, b")) {
          const strong = doc.createElement("strong");
          a.before(strong);
          strong.append(a);
        }
      });
      if (element.querySelector("#faqcard")) {
        element.querySelectorAll(".rtequestionnaire > .container-fluid:not([id])").forEach((box) => {
          if (box.querySelector(".faq-card") && !box.querySelector("#faqcard")) box.remove();
        });
      }
      element.querySelectorAll(".one-column-component").forEach((el) => {
        if (isEmptyContainer(el)) el.remove();
      });
      element.querySelectorAll("#main-content ul, #main-content ol").forEach((list) => {
        if (isEmptyContainer(list)) list.remove();
      });
      element.querySelectorAll(".two-columns-left-one-column-right").forEach((el) => {
        if (isEmptyContainer(el)) el.remove();
      });
      element.querySelectorAll("p.faq_ques_text").forEach((p) => {
        const back = doc.createElement("p");
        const link = doc.createElement("a");
        link.setAttribute("href", "/us/en/planning_tools/faq.html");
        link.textContent = "Back to FAQs";
        back.append(link);
        const h1 = doc.createElement("h1");
        p.querySelectorAll("a.faq-ques").forEach((a) => a.remove());
        h1.textContent = p.textContent.replace(/\s+/g, " ").trim();
        p.replaceWith(back, h1);
      });
      const sectionSlugs = /* @__PURE__ */ new Map();
      element.querySelectorAll(".policy-scroll-section[id]").forEach((section) => {
        const title = section.matches("p") ? section : section.querySelector(":scope > p");
        if (!title) return;
        const text = title.textContent.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
        if (!text) return;
        const heading = doc.createElement("h3");
        heading.textContent = text;
        title.replaceWith(heading);
        sectionSlugs.set(section.id, headingSlug(text));
      });
      element.querySelectorAll('a[href*="#"]').forEach((a) => {
        const [base, id] = a.getAttribute("href").split("#");
        const slug = sectionSlugs.get(id) || KNOWN_SECTION_TITLES[id] && headingSlug(KNOWN_SECTION_TITLES[id]);
        if (slug) a.setAttribute("href", `${base}#${slug}`);
      });
      element.querySelectorAll("p.faq-para").forEach((p) => {
        const h2 = doc.createElement("h2");
        h2.textContent = p.textContent.trim();
        p.replaceWith(h2);
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
      cleanupEndOfLeaseAfter(element, element.ownerDocument);
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
  var START_PREFIX = "tfs-section-start:";
  var END_PREFIX = "tfs-section-end:";
  function findComments(root) {
    const found = /* @__PURE__ */ new Map();
    const doc = root.ownerDocument;
    const walker = doc.createTreeWalker(
      root,
      128
      /* NodeFilter.SHOW_COMMENT */
    );
    let n = walker.nextNode();
    while (n) {
      const v = n.nodeValue || "";
      if (v.startsWith(START_PREFIX) || v.startsWith(END_PREFIX)) found.set(v, n);
      n = walker.nextNode();
    }
    return found;
  }
  function isEmptyNode(node) {
    if (node.nodeType === 3) return node.textContent.replace(/\u00a0/g, " ").trim() === "";
    if (node.nodeType !== 1) return true;
    if (node.hasAttribute(MARKER_ATTR)) return true;
    if (/^(IMG|PICTURE|VIDEO|IFRAME|SVG|TABLE)$/i.test(node.tagName)) return false;
    return node.textContent.replace(/\u00a0/g, " ").trim() === "" && !node.querySelector("img, picture, video, iframe, svg, table");
  }
  function nodesBetween(start, end) {
    if (!start || !end || start.parentNode !== end.parentNode) return null;
    const nodes = [];
    for (let n = start.nextSibling; n && n !== end; n = n.nextSibling) nodes.push(n);
    return nodes;
  }
  function breakBefore(start) {
    const prev = start && start.previousSibling;
    return prev && prev.nodeType === 1 && prev.tagName === "HR" ? prev : null;
  }
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
        const id = markerId(section, i);
        el.after(doc.createComment(`${END_PREFIX}${id}`));
        if (section.style) {
          const marker = doc.createElement("span");
          marker.setAttribute(MARKER_ATTR, id);
          el.after(marker);
        }
        const start = doc.createComment(`${START_PREFIX}${id}`);
        el.before(start);
        if (i !== firstMatched) {
          start.before(doc.createElement("hr"));
        }
      }
    }
    if (hookName === TransformHook2.afterTransform) {
      const comments = findComments(element);
      let firstKept = -1;
      for (let i = 0; i < sections.length; i += 1) {
        const section = sections[i];
        if (!section) continue;
        const id = markerId(section, i);
        const start = comments.get(`${START_PREFIX}${id}`);
        const end = comments.get(`${END_PREFIX}${id}`);
        if (!start && !end) continue;
        const between = nodesBetween(start, end);
        if (between && between.every(isEmptyNode)) {
          const hr = breakBefore(start);
          if (hr) hr.remove();
          between.forEach((n) => n.remove());
        } else if (firstKept === -1) {
          firstKept = i;
          const hr = breakBefore(start);
          if (hr) hr.remove();
        }
      }
      comments.forEach((c) => c.remove());
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
