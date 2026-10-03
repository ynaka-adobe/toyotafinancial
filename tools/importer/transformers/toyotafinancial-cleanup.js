/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: toyotafinancial site-wide cleanup.
 *
 * Removes non-authorable site chrome so the import contains only page-body
 * authorable content. Every selector below was verified against the captured
 * DOM in migration-work/cleaned.html (DOM tree confirmed via depth tracking:
 * <main> is `body > main`, a sibling of the header-wrapper <div> and the
 * footer <div>, so removing header/footer/nav does not touch page content).
 *
 * Verified DOM landmarks (cleaned.html):
 *   body > nav                              -> skip-links list (Skip to menu/banner/...)
 *   body > div.tfs-header-wrapper > header  -> global header (logo, nav#nav_menu, nav#sidebar,
 *                                              loader_wrapper, #emergency_alerts) — auto-populated
 *   body > main                             -> page content (folds live here)
 *   body > div > div.footer > footer#global-footer -> global footer — auto-populated
 *   body > span#kampyleButtonContainer      -> Kampyle "Feedback" widget button
 *   body > div#onetrust-consent-sdk         -> OneTrust cookie consent banner/modal
 *   body > iframe#destination_publishing_iframe_tfs_0 -> Adobe demdex ID-sync iframe
 *   body > div > div.hamburger.parbase > aside.aside -> mobile menu shell (nav#sidebar,
 *                                              mobile login form #login_panel, announcements
 *                                              panel, session-expiry / maintenance / interstitial
 *                                              modals) — all non-authorable site chrome
 * Inside <main> (transient runtime chrome, not authored content):
 *   .upgrade-message      -> scheduled-maintenance notice
 *   #home-loading         -> loading spinner
 *   .bottom-info-modal    -> empty runtime info modal in #fold-1 (live DOM only; "×" close button)
 *   a.carousel-control    -> hero carousel Previous/Next arrows (#fold-1)
 *   .tour-popup           -> empty tour popup container
 *   #scroll_down, #scroll_top, #scroll-to-top -> scroll helper anchors
 * Body-level runtime/placeholder cruft:
 *   #disable-search, #enableDtmHash, #dtmHashValue -> DTM/search runtime hooks
 *   .hiddendiv.common     -> hidden measurement div
 *   .newpar.new.section, .par.iparys_inherited -> empty AEM parsys placeholders (verified empty)
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / consent / feedback widgets that would otherwise interfere with
    // block parsing. Remove before parsers run.
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',        // OneTrust cookie consent banner + preference modal
      '#kampyleButtonContainer',      // Kampyle "Feedback" widget button
      '.hamburger.parbase',           // body-level mobile menu shell: nav#sidebar, mobile
                                      // login form, announcements, session/maintenance/
                                      // interstitial modals — all non-authorable chrome
      '.tour-popup',                  // (empty) guided-tour popup container
      '.upgrade-message',             // scheduled-maintenance notice
      '#home-loading',                // page loading spinner
      '.bottom-info-modal',           // empty runtime info modal in #fold-1 (only a "×" close button)
      'a.carousel-control',           // carousel Previous/Next arrow controls in #fold-1
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome (header, footer, nav) and leftover runtime
    // elements. Runs after block parsers have extracted their cells.
    WebImporter.DOMUtils.remove(element, [
      'nav',                          // body > nav skip-links AND header nav#nav_menu / nav#sidebar
      'div.tfs-header-wrapper',       // global header wrapper (contains <header>)
      'header',                       // global header (defensive; also covered by wrapper)
      '#global-footer',               // global footer (auto-populated)
      'div.footer',                   // footer wrapper div around #global-footer
      '#destination_publishing_iframe_tfs_0', // Adobe demdex ID-sync iframe
      'iframe',                       // any remaining iframes (e.g. onetrust text-resize)
      // scroll helper anchors
      '#scroll_down',
      '#scroll_top',
      '#scroll-to-top',
      // body-level runtime hooks / hidden helpers
      '#disable-search',
      '#enableDtmHash',
      '#dtmHashValue',
      '.hiddendiv.common',
      // empty AEM parsys placeholders (verified empty in captured DOM)
      '.newpar.new.section',
      '.par.iparys_inherited',
      // safe non-content elements
      'link',
      'noscript',
    ]);
  }
}
