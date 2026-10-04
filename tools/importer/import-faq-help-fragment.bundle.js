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
  var LINK_CORRECTIONS = {
    // broken on the original site (404) -> the page they were meant to reach
    "/us/en/planning_tools/faq/account_access_and_password/what_is_the_best_way_to_protect_my_account_s_password": "/us/en/planning-tools/faq/account-access-and-password/how-can-i-protect-my-accounts-password",
    "/us/en/planning_tools/faq/loan_payoff_and_title_lien_release/where_can_i_find_payoff_information_for_my_vehicle_": "/us/en/planning-tools/faq/loan-payoff-and-title-lien-release/where-can-i-find-payoff-information-for-loan-account",
    "/us/en/planning_tools/faq/mileage/how_can_i_see_the_mileage_allowance_in_my_lease_agreement_and_track_progress": "/us/en/planning-tools/faq/mileage/where-can-i-find-my-mileage-allowance",
    "/us/en/financing_options/rebate_finance_programs/college_grad_program": "/us/en/financing-options/rebate-finance-programs/college-rebate-program",
    "/us/en/financing_options/rebate_finance_programs/military_rebate": "/us/en/financing-options/rebate-finance-programs/military-rebate-program",
    // redirects on the original site
    "/us/en/about_us": "/us/en/about-us/company-overview",
    "/us/en/consumer-web/home/login": `${SITE_ORIGIN}/dss/login`,
    "/us/en/external_login": `${SITE_ORIGIN}/dss/login`,
    // credit application form (part of the app, stays on the original site)
    "/us/en/planning_tools/apply_for_credit/application/form": `${SITE_ORIGIN}/us/en/planning_tools/apply_for_credit/application/form`
  };
  function toCorrectedLink(sitePath) {
    const m = sitePath.match(/^([^?#]*)([?#].*)?$/);
    const key = m[1].replace(/\/{2,}/g, "/").replace(/(\.html?)+$/i, "").replace(/\/$/, "").toLowerCase();
    const to = LINK_CORRECTIONS[key];
    return to ? `${to}${m[2] || ""}` : null;
  }
  var NON_PAGE_PREFIXES = ["/dss/", "/myaccounts/", "/pub/", "/content/dam/", "/etc/", "/us/en/search"];
  function isContentPage(pathname) {
    if (NON_PAGE_PREFIXES.some((prefix) => pathname.toLowerCase().startsWith(prefix))) return false;
    const last = pathname.split("/").pop();
    return !/\.[a-z0-9]{2,5}$/i.test(last) || /\.html?$/i.test(last);
  }
  function toNewSitePath(sitePath) {
    const m = sitePath.match(/^([^?#]*)([?#].*)?$/);
    const pathname = m[1].replace(/\/{2,}/g, "/").replace(/(\.html?)+$/i, "").replace(/\/$/, "") || "/";
    if (!isContentPage(m[1])) return null;
    return `${pathname === "/" ? "/" : sanitizePath(pathname)}${m[2] || ""}`;
  }
  function rewriteHref(rawHref) {
    const href = (rawHref || "").trim();
    if (!href) return null;
    const abs = href.match(SITE_ABSOLUTE_RE);
    if (abs) {
      const after = href.slice(abs[0].length);
      const rest = after.replace(CONTENT_PREFIX_RE, "") || "/";
      const page2 = toCorrectedLink(rest) || toMigratedPath(rest) || toNewSitePath(rest);
      if (page2) return page2;
      if (!CONTENT_PREFIX_RE.test(after)) return null;
      return `${SITE_ORIGIN}${rest}`;
    }
    if (!href.startsWith("/") || href.startsWith("//") || href === "/") return null;
    let path = href.replace(CONTENT_PREFIX_RE, "");
    if (!path.startsWith("/")) path = `/${path}`;
    if (isNewSitePath(path)) return path === href ? null : path;
    const page = toCorrectedLink(path) || toMigratedPath(path) || toNewSitePath(path);
    if (page) return page === href ? null : page;
    return `${SITE_ORIGIN}${path}`;
  }
  var NO_HTML_PREFIXES = ["/us/en/fragments/", "/fragments/", ...NON_PAGE_PREFIXES];
  function withHtml(href) {
    if (!href.startsWith("/") || href.startsWith("//")) return href;
    const m = href.match(/^([^?#]*)([?#].*)?$/);
    const path = m[1].replace(/\/+$/, "");
    if (!path || NO_HTML_PREFIXES.some((prefix) => `${path}/`.toLowerCase().startsWith(prefix))) return href;
    if (/\.[a-z0-9]{2,5}$/i.test(path.split("/").pop())) return href;
    return `${path}.html${m[2] || ""}`;
  }
  function transform(hookName, element, payload) {
    if (hookName !== TransformHook.afterTransform) return;
    element.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      const next = withHtml(rewriteHref(href) || href);
      if (next !== href) a.setAttribute("href", next);
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
