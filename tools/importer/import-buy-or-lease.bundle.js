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

  // tools/importer/import-buy-or-lease.js
  var import_buy_or_lease_exports = {};
  __export(import_buy_or_lease_exports, {
    default: () => import_buy_or_lease_default
  });

  // tools/importer/parsers/quiz-buy-lease.js
  var WEIGHTS = {
    q1: "3, 1, -3",
    q2: "3, 1, -3",
    q3: "3, 1, -3",
    q4: "3, -3, -4",
    q5: "1, 0, -3",
    q6: "",
    q7: ""
  };
  var RESULTS = [
    ["fin2", "Finance", "q1 = 1"],
    ["fin3", "Finance", "q2 = 1"],
    ["fin4", "Finance", "q3 = 1"],
    ["fin1", "Finance", ""],
    ["lease2", "Lease", "q1 = 3"],
    ["lease3", "Lease", "q2 = 3"],
    ["lease4", "Lease", "q3 = 3"],
    ["lease5", "Lease", "q5 = 3"],
    ["lease1", "Lease", ""]
  ];
  var PRODUCT_VARIANTS = {
    vsa1: "Finance, q6 = 1 or 2",
    vsa2: "Finance, q6 = 3",
    ppm1: "q7 = 1",
    ppm2: "q7 = 2",
    ppm3: "q7 = 3"
  };
  function cleanText(el) {
    return (el ? el.textContent || "" : "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function absUrl(value, document) {
    if (!value) return "";
    try {
      return new URL(value, document.baseURI || document.location && document.location.href).href;
    } catch (e) {
      return value;
    }
  }
  function makeImg(src, document) {
    if (!src) return "";
    const img = document.createElement("img");
    img.src = absUrl(src.getAttribute("src"), document);
    img.alt = src.getAttribute("alt") || "";
    return img;
  }
  function buildResultContent(div, document) {
    const out = [];
    let loose = null;
    const flushLoose = () => {
      if (loose && cleanText(loose)) out.push(loose);
      loose = null;
    };
    [...div.childNodes].forEach((node) => {
      if (node.nodeType === 1 && /^(H[1-6]|P|UL|OL|DIV)$/.test(node.tagName)) {
        flushLoose();
        if (!cleanText(node)) return;
        if (/^H[1-6]$/.test(node.tagName)) {
          const h = document.createElement(node.tagName.toLowerCase());
          h.innerHTML = node.innerHTML;
          out.push(h);
        } else if (node.tagName === "DIV") {
          const p = document.createElement("p");
          p.innerHTML = node.innerHTML;
          out.push(p);
        } else {
          const clone = node.cloneNode(true);
          clone.removeAttribute("class");
          clone.removeAttribute("id");
          out.push(clone);
        }
      } else if (node.nodeType === 3 || node.nodeType === 1) {
        if (node.nodeType === 3 && !node.textContent.trim() && !loose) return;
        if (!loose) loose = document.createElement("p");
        loose.append(node.cloneNode(true));
      }
    });
    flushLoose();
    return out;
  }
  function splitAtBr(p, document) {
    const paras = [];
    let cur = document.createElement("p");
    [...p.childNodes].forEach((node) => {
      if (node.nodeType === 1 && node.tagName === "BR") {
        if (cleanText(cur)) paras.push(cur);
        cur = document.createElement("p");
      } else {
        cur.append(node.cloneNode(true));
      }
    });
    if (cleanText(cur)) paras.push(cur);
    paras.forEach((para) => {
      const first = para.firstChild;
      if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
      const last = para.lastChild;
      if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, "");
    });
    return paras;
  }
  function buildProductContent(title, paras, link, document) {
    const content = [];
    const tp = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = title;
    tp.append(strong);
    content.push(tp);
    paras.forEach((p) => content.push(p));
    if (link) {
      const lp = document.createElement("p");
      const a = document.createElement("a");
      a.href = link.getAttribute("href");
      a.textContent = cleanText(link) || "Learn More";
      lp.append(a);
      content.push(lp);
    }
    return content;
  }
  function parse(element, { document }) {
    const doc = element.ownerDocument || document;
    const cells = [];
    const holders = [...element.querySelectorAll('.quiz-section .holder[id], .holder[id^="q"]')].filter((h, i, arr) => arr.indexOf(h) === i && /^q\d+$/.test(h.id));
    if (!holders.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const photo = element.querySelector(".card-content img, .quiz-card > div:not(.quiz-section) img");
    if (photo) cells.push([makeImg(photo, document)]);
    holders.forEach((holder) => {
      const id = holder.id;
      const question = cleanText(holder.querySelector(".question p, .question"));
      const ul = document.createElement("ul");
      holder.querySelectorAll(".answer label").forEach((label) => {
        const text = cleanText(label);
        if (!text) return;
        const li = document.createElement("li");
        li.textContent = text;
        ul.append(li);
      });
      cells.push([id, question, ul, WEIGHTS[id] !== void 0 ? WEIGHTS[id] : ""]);
    });
    const answer = doc.querySelector(".buyleaseanswer");
    const panel = answer && (answer.closest(".one-column-component") || answer.closest(".secondary-section")) || null;
    const scope = panel || doc;
    RESULTS.forEach(([id, outcome, condition]) => {
      const div = scope.querySelector(`#${id}`);
      if (!div) return;
      const content = buildResultContent(div, document);
      if (content.length) cells.push([outcome, condition, content]);
    });
    const disclaimer = scope.querySelector(".buyleasedisclaimer");
    if (disclaimer) {
      const heading = disclaimer.querySelector(":scope > h3, :scope > h2, :scope > h4");
      if (heading && cleanText(heading)) {
        const h3 = document.createElement("h3");
        h3.textContent = cleanText(heading);
        cells.push(["Products", h3]);
      }
      disclaimer.querySelectorAll(".promo-item").forEach((item) => {
        const title = cleanText(item.querySelector(".promo-header"));
        const link = item.querySelector(".promo-container a[href], a[href]");
        const imgEl = item.querySelector(":scope > img, img");
        const body = item.querySelector(".caption-body") || item;
        const textParas = [...body.querySelectorAll("p")].filter((p) => !p.classList.contains("promo-header") && cleanText(p));
        const variants = textParas.filter((p) => p.id && PRODUCT_VARIANTS[p.id] !== void 0);
        if (variants.length) {
          variants.forEach((p) => {
            const content = buildProductContent(title, splitAtBr(p, document), link, document);
            cells.push(["Product", PRODUCT_VARIANTS[p.id], makeImg(imgEl, document), content]);
          });
        } else {
          const paras = [];
          textParas.forEach((p) => paras.push(...splitAtBr(p, document)));
          const content = buildProductContent(title, paras, link, document);
          cells.push(["Product", "Always", makeImg(imgEl, document), content]);
        }
      });
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "quiz-buy-lease", cells });
    element.replaceWith(block);
    if (panel && panel.parentNode) panel.remove();
  }

  // tools/importer/parsers/columns-callout.js
  function cleanText2(el) {
    return (el.textContent || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function isDocumentHref(href) {
    return /\.(pdf|docx?|xlsx?|mp4|webm)(\?|#|$)/i.test(href || "") || /\/content\/dam\//.test(href || "");
  }
  function parse2(element, { document }) {
    const root = element.querySelector(".img-card, .card") || element;
    const header = root.querySelector(".card-header");
    const content = root.querySelector(".card-content");
    const textCell = [];
    if (header && cleanText2(header)) {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = cleanText2(header);
      p.append(strong);
      textCell.push(p);
    }
    const headerSiblingText = [];
    if (header && header.parentElement && (!content || !content.contains(header))) {
      [...header.parentElement.children].forEach((sib) => {
        if (sib === header || !/^(P|UL|OL|H[1-6])$/.test(sib.tagName)) return;
        if (sib.matches(".card-content, .card-btn") || sib.querySelector(".card-btn, a.btn")) return;
        if (!cleanText2(sib)) return;
        headerSiblingText.push(sib);
        textCell.push(sib);
      });
    }
    if (content) {
      [...content.children].forEach((child) => {
        if (child === header || child.classList.contains("card-header")) return;
        if (child.tagName === "IMG") {
          const img = document.createElement("img");
          img.src = child.getAttribute("src");
          img.alt = child.getAttribute("alt") || "";
          textCell.push(img);
          return;
        }
        if (child.tagName === "A" && child.classList.contains("btn")) return;
        if (!cleanText2(child) && !child.querySelector("img")) return;
        textCell.push(child);
      });
    }
    const ctaCell = [];
    const ctaLinks = [...root.querySelectorAll("a[href]")].filter((a) => !content || !content.contains(a) || a.classList.contains("btn")).filter((a) => !headerSiblingText.some((el) => el.contains(a)));
    ctaLinks.forEach((a) => {
      const label = cleanText2(a.querySelector(".card-pdf-text") || a);
      if (!label) return;
      const href = a.getAttribute("href");
      const link = document.createElement("a");
      const p = document.createElement("p");
      if (a.closest(".pdf-link") || isDocumentHref(href)) {
        link.href = href;
        link.textContent = label;
        p.append(link);
      } else {
        link.href = href;
        link.textContent = label;
        const strong = document.createElement("strong");
        strong.append(link);
        p.append(strong);
      }
      ctaCell.push(p);
    });
    if (!textCell.length && !ctaCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[textCell.length ? textCell : "", ctaCell.length ? ctaCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-callout", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/toyotafinancial-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
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
  function findBannerImageUrl(topSection) {
    const inline = bgUrlFromStyle(topSection.getAttribute("style"));
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
          const fromComment = bgUrlFromStyle(node.nodeValue);
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
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      const doc = element.ownerDocument;
      element.querySelectorAll(".banner-component .top-section, .faq-banner-component .top-section").forEach((topSection) => {
        const src = resolveImageUrl(findBannerImageUrl(topSection));
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
        ".nav-list-component",
        // empty right-hand nav column
        // hidden at every breakpoint on the source (e.g. the policy pages'
        // "View More" link in .terms-view-extra) — never visible to visitors
        ".hidden-xs.hidden-sm.hidden-md.hidden-lg",
        // newer page shell (apply_for_credit): screen-reader skip links and the
        // credit application's own loading spinner
        "a.sr-only",
        "#oca-loading"
      ]);
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
  var SITE_ORIGIN2 = "https://www.toyotafinancial.com";
  var CONTENT_PREFIX_RE = /^\/content\/toyotafinancial(?=[/?#]|$)/i;
  var SITE_ABSOLUTE_RE = /^https?:\/\/(www\.)?toyotafinancial\.com(?=[/?#]|$)/i;
  var FAQ_TOPICS = [
    "about_credit",
    "about-tfs",
    "about_this_website",
    "account_access_and_password",
    "account_details",
    "account_registration",
    "billing",
    "business_solutions",
    "bZ4X",
    "consent_to_electronic_communications_and_agreements",
    "encrypted-email",
    "enrolling_in_pay_online",
    "extension_and_deferral",
    "financial-hardship",
    "fingerprint_authentication",
    "Guaranteed_Auto_Protection_GAP",
    "insurance_in_case_of_accident",
    "insurance_requirements",
    "lease_end_process",
    "loan_payoff_and_title_lien_release",
    "login-faqs",
    "managing_pay_online",
    "marketing_preferences",
    "mileage",
    "military_benefits",
    "mobileapp-faqs",
    "One_Big_Beautiful_Bill_Act",
    "online_credit_application",
    "paperless_billing",
    "payments",
    "privacy",
    "repeat_customers",
    "shopping",
    "support_center",
    "toyota_insurance",
    "financing_and_protection_products",
    "voluntary_protection_products",
    "wear_and_use"
  ];
  var MIGRATED_PATHS = new Set([
    "/us/en",
    "/us/en/about_us/company_overview",
    "/us/en/accessibility",
    "/us/en/online_policies_and_agreements",
    "/us/en/online_privacy_policy",
    "/us/en/planning_tools/faq",
    "/us/en/planning_tools/get_started",
    "/us/en/contact_us",
    "/us/en/planning_tools/apply_for_credit",
    // batch 2026-10-04: protection plans, planning tools, financing, end of lease, blog
    ...[
      "vehicle_protection_plan/which_plan_is_right_for_me",
      "vehicle_protection_plan/vehicle_service_agreements",
      "vehicle_protection_plan/guaranteed_auto_protection",
      "vehicle_protection_plan/prepaid_maintenance_plan",
      "vehicle_protection_plan/tire_wheel_protection",
      "vehicle_protection_plan/how_to_file_a_claim",
      "planning_tools/ways_to_pay",
      "planning_tools/visiting_the_dealer",
      "financing_options/buy_or_lease",
      "financing_options/buy_a_toyota",
      "financing_options/leasing_a_toyota",
      "financing_options/rebate_finance_programs/find_rebate_finance_programs",
      "financing_options/rebate_finance_programs/college_rebate_program",
      "financing_options/rebate_finance_programs/military_rebate_program",
      "financing_options/rebate_finance_programs/repeat_customers",
      "financing_options/understanding_credit/credit_101",
      "financing_options/understanding_credit/credit_tips",
      "financing_options/for_businesses/business_solutions",
      "financing_options/for_businesses/business_credit_applications",
      "financing_options/toyota_rewards_visa",
      "end_of_lease_options/your_option",
      "end_of_lease_options/lease-end-videos",
      "end_of_lease_options/early_lease_return",
      "end_of_lease_options/mileage",
      "end_of_lease_options/wear_and_use",
      "end_of_lease_options/return_your_vehicle",
      "end_of_lease_options/faqs",
      "TFS_ThoughtFuel_Blog"
    ].map((p) => `/us/en/${p}`),
    ...FAQ_TOPICS.map((t) => `/us/en/planning_tools/faq/${t}`)
  ].map((p) => p.toLowerCase()));
  function sanitizePath(path) {
    if (typeof WebImporter !== "undefined" && WebImporter.FileUtils && WebImporter.FileUtils.sanitizePath) {
      return WebImporter.FileUtils.sanitizePath(path);
    }
    return path.toLowerCase().split("/").map((s) => s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")).join("/");
  }
  var NEW_SITE_PREFIXES = ["/us/en/fragments/"];
  var MIGRATED_NEW_PATHS = new Set([...MIGRATED_PATHS].map((p) => sanitizePath(p)));
  function isNewSitePath(sitePath) {
    const pathname = sitePath.split(/[?#]/)[0].replace(/\/$/, "");
    return NEW_SITE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || MIGRATED_NEW_PATHS.has(pathname);
  }
  function toMigratedPath(sitePath) {
    const m = sitePath.match(/^([^?#]*)([?#].*)?$/);
    const pathname = m[1].replace(/\.html?$/i, "").replace(/\/$/, "");
    if (!MIGRATED_PATHS.has(pathname.toLowerCase())) return null;
    return `${sanitizePath(pathname)}${m[2] || ""}`;
  }
  function rewriteHref(rawHref) {
    const href = (rawHref || "").trim();
    if (!href) return null;
    const abs = href.match(SITE_ABSOLUTE_RE);
    if (abs) {
      const after = href.slice(abs[0].length);
      const rest = after.replace(CONTENT_PREFIX_RE, "") || "/";
      const migrated = toMigratedPath(rest);
      if (migrated) return migrated;
      if (!CONTENT_PREFIX_RE.test(after)) return null;
      return `${SITE_ORIGIN2}${rest}`;
    }
    if (!href.startsWith("/") || href.startsWith("//") || href === "/") return null;
    let path = href.replace(CONTENT_PREFIX_RE, "");
    if (!path.startsWith("/")) path = `/${path}`;
    if (isNewSitePath(path)) return path === href ? null : path;
    return toMigratedPath(path) || `${SITE_ORIGIN2}${path}`;
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

  // tools/importer/import-buy-or-lease.js
  var parsers = {
    "quiz-buy-lease": parse,
    "columns-callout": parse2
  };
  var PAGE_TEMPLATE = {
    "name": "buy-or-lease",
    "description": "Buy or Lease Quiz: banner, heading + intro, scored 7-question quiz with results and product cards (results panel folded into the block), Ready to apply callout.",
    "urls": [
      "https://www.toyotafinancial.com/us/en/financing_options/buy_or_lease.html"
    ],
    "blocks": [
      {
        "name": "quiz-buy-lease",
        "instances": [
          "#main-content .screenFade > .generalcolumn .buyleasequizcard"
        ]
      },
      {
        "name": "columns-callout",
        "instances": [
          "#main-content .screenFade > .generalcolumn .card-component.parbase:has(.card-content, .img-card):not(:has(.thumbnail-card, .materialized-dropdown, .card.no-pd))"
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
        "name": "quiz",
        "selector": [
          "#main-content .screenFade > .generalcolumn"
        ],
        "style": null,
        "blocks": [
          "quiz-buy-lease",
          "columns-callout"
        ],
        "defaultContent": [
          "#main-content .screenFade > .generalcolumn .page-heading",
          "#main-content .screenFade > .generalcolumn .rte"
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
  var import_buy_or_lease_default = {
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
  return __toCommonJS(import_buy_or_lease_exports);
})();
