/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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

  // tools/importer/import-faq-help-fragment.js
  var import_faq_help_fragment_exports = {};
  __export(import_faq_help_fragment_exports, {
    default: () => import_faq_help_fragment_default
  });

  // tools/importer/transformers/toyotafinancial-links.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var SITE_ORIGIN = "https://www.toyotafinancial.com";
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
      return `${SITE_ORIGIN}${rest}`;
    }
    if (!href.startsWith("/") || href.startsWith("//") || href === "/") return null;
    let path = href.replace(CONTENT_PREFIX_RE, "");
    if (!path.startsWith("/")) path = `/${path}`;
    if (isNewSitePath(path)) return path === href ? null : path;
    return toMigratedPath(path) || `${SITE_ORIGIN}${path}`;
  }
  function transform(hookName, element, payload) {
    if (hookName !== TransformHook.afterTransform) return;
    element.querySelectorAll("a[href]").forEach((a) => {
      const next = rewriteHref(a.getAttribute("href"));
      if (next) a.setAttribute("href", next);
    });
  }

  // tools/importer/import-faq-help-fragment.js
  function buildHelpFragment(document) {
    const card = document.querySelector("#main-content .screenFade > .questionlist #faqcard");
    if (!card) return null;
    const container = document.createElement("div");
    const header = card.querySelector(".card-header");
    if (header) {
      const h2 = document.createElement("h2");
      h2.textContent = header.textContent.trim();
      container.append(h2);
    }
    card.querySelectorAll(".card-content p:not(.card-header)").forEach((p) => {
      const para = document.createElement("p");
      para.textContent = p.textContent.replace(/\s+/g, " ").trim();
      if (para.textContent) container.append(para);
    });
    card.querySelectorAll("a[href]").forEach((a) => {
      const p = document.createElement("p");
      const link = document.createElement("a");
      link.setAttribute("href", a.getAttribute("href"));
      link.textContent = a.textContent.trim();
      p.append(link);
      container.append(p);
    });
    container.append(WebImporter.Blocks.createBlock(document, {
      name: "Section Metadata",
      cells: { style: "help-card" }
    }));
    return { element: container, path: "/us/en/fragments/faq-help" };
  }
  var import_faq_help_fragment_default = {
    transform: (payload) => {
      const { document } = payload;
      const fragment = buildHelpFragment(document);
      if (!fragment) throw new Error("FAQ help box (#faqcard) not found on this page");
      transform("afterTransform", fragment.element, payload);
      return [{
        element: fragment.element,
        path: fragment.path,
        report: { title: "FAQ help fragment", template: "faq-help-fragment", blocks: [] }
      }];
    }
  };
  return __toCommonJS(import_faq_help_fragment_exports);
})();
