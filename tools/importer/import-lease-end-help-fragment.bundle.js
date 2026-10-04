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

  // tools/importer/import-lease-end-help-fragment.js
  var import_lease_end_help_fragment_exports = {};
  __export(import_lease_end_help_fragment_exports, {
    default: () => import_lease_end_help_fragment_default
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
  var NON_PAGE_PREFIXES = ["/dss/", "/myaccounts/", "/pub/", "/content/dam/", "/etc/", "/us/en/search"];
  function isContentPage(pathname) {
    if (NON_PAGE_PREFIXES.some((prefix) => pathname.toLowerCase().startsWith(prefix))) return false;
    const last = pathname.split("/").pop();
    return !/\.[a-z0-9]{2,5}$/i.test(last) || /\.html?$/i.test(last);
  }
  function toNewSitePath(sitePath) {
    const m = sitePath.match(/^([^?#]*)([?#].*)?$/);
    const pathname = m[1].replace(/\/{2,}/g, "/").replace(/\.html?$/i, "").replace(/\/$/, "") || "/";
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
      const page2 = toMigratedPath(rest) || toNewSitePath(rest);
      if (page2) return page2;
      if (!CONTENT_PREFIX_RE.test(after)) return null;
      return `${SITE_ORIGIN}${rest}`;
    }
    if (!href.startsWith("/") || href.startsWith("//") || href === "/") return null;
    let path = href.replace(CONTENT_PREFIX_RE, "");
    if (!path.startsWith("/")) path = `/${path}`;
    if (isNewSitePath(path)) return path === href ? null : path;
    const page = toMigratedPath(path) || toNewSitePath(path);
    if (page) return page === href ? null : page;
    return `${SITE_ORIGIN}${path}`;
  }
  function transform(hookName, element, payload) {
    if (hookName !== TransformHook.afterTransform) return;
    element.querySelectorAll("a[href]").forEach((a) => {
      const next = rewriteHref(a.getAttribute("href"));
      if (next) a.setAttribute("href", next);
    });
  }

  // tools/importer/import-lease-end-help-fragment.js
  var SITE_ORIGIN2 = "https://www.toyotafinancial.com";
  var P = "main > .container-fluid.px-0";
  var text = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  function link(document, a, bold) {
    const p = document.createElement("p");
    const anchor = document.createElement("a");
    anchor.setAttribute("href", a.getAttribute("href"));
    anchor.textContent = text(a);
    if (bold) {
      const strong = document.createElement("strong");
      strong.append(anchor);
      p.append(strong);
    } else {
      p.append(anchor);
    }
    return p;
  }
  function buildLoginCard(document, card) {
    const img = card.querySelector("img");
    const picture = document.createElement("img");
    picture.setAttribute("src", new URL(img.getAttribute("src"), SITE_ORIGIN2).href);
    picture.setAttribute("alt", img.getAttribute("alt") || "");
    const body = document.createElement("div");
    const copy = card.querySelector(".lease-end__login_text > div:first-child");
    if (copy) {
      const p = document.createElement("p");
      p.textContent = text(copy);
      body.append(p);
    }
    const a = card.querySelector(".lease-end__login_text a[href]");
    if (a) body.append(link(document, a, false));
    return WebImporter.Blocks.createBlock(document, { name: "Columns Card", cells: [[picture, body]] });
  }
  function buildDealerCallout(document, card) {
    const title = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = text(card.querySelector("h1, h2, h3, h4"));
    title.append(strong);
    const a = card.querySelector("a[href]");
    return WebImporter.Blocks.createBlock(document, {
      name: "Columns Callout (grey)",
      cells: [[title, a ? link(document, a, true) : ""]]
    });
  }
  var import_lease_end_help_fragment_default = {
    transform: (payload) => {
      const { document } = payload;
      const login = document.querySelector(`${P} .lease-end-right-container > .login-reg-card`);
      const dealer = document.querySelector(`${P} > .footer-card`);
      if (!login || !dealer) throw new Error("lease-end login card or footer card not found on this page");
      const container = document.createElement("div");
      container.append(buildLoginCard(document, login), document.createElement("hr"), buildDealerCallout(document, dealer));
      transform("afterTransform", container, payload);
      return [{
        element: container,
        path: "/us/en/fragments/lease-end-help",
        report: { title: "Lease-end help fragment", template: "lease-end-help-fragment", blocks: ["columns-card", "columns-callout"] }
      }];
    }
  };
  return __toCommonJS(import_lease_end_help_fragment_exports);
})();
