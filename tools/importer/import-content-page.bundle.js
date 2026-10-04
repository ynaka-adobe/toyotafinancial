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

  // tools/importer/import-content-page.js
  var import_content_page_exports = {};
  __export(import_content_page_exports, {
    default: () => import_content_page_default
  });

  // tools/importer/parsers/columns-callout.js
  function cleanText(el) {
    return (el.textContent || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function isDocumentHref(href) {
    return /\.(pdf|docx?|xlsx?|mp4|webm)(\?|#|$)/i.test(href || "") || /\/content\/dam\//.test(href || "");
  }
  function parse(element, { document }) {
    const root = element.querySelector(".img-card, .card") || element;
    const header = root.querySelector(".card-header");
    const content = root.querySelector(".card-content");
    const textCell = [];
    if (header && cleanText(header)) {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = cleanText(header);
      p.append(strong);
      textCell.push(p);
    }
    const headerSiblingText = [];
    if (header && header.parentElement && (!content || !content.contains(header))) {
      [...header.parentElement.children].forEach((sib) => {
        if (sib === header || !/^(P|UL|OL|H[1-6])$/.test(sib.tagName)) return;
        if (sib.matches(".card-content, .card-btn") || sib.querySelector(".card-btn, a.btn")) return;
        if (!cleanText(sib)) return;
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
        if (!cleanText(child) && !child.querySelector("img")) return;
        textCell.push(child);
      });
    }
    const ctaCell = [];
    const ctaLinks = [...root.querySelectorAll("a[href]")].filter((a) => !content || !content.contains(a) || a.classList.contains("btn")).filter((a) => !headerSiblingText.some((el) => el.contains(a)));
    ctaLinks.forEach((a) => {
      const label = cleanText(a.querySelector(".card-pdf-text") || a);
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

  // tools/importer/parsers/accordion-faq.js
  function cleanText2(el) {
    return (el.textContent || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function buildTitle(heading, document) {
    const src = heading.querySelector("a") || heading;
    const frag = document.createDocumentFragment();
    [...src.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        const t = node.textContent.replace(/ /g, " ").replace(/\s+/g, " ");
        if (t.trim()) frag.append(document.createTextNode(t));
        return;
      }
      if (node.nodeType !== 1) return;
      if (node.tagName === "I") return;
      if (!cleanText2(node)) return;
      if (node.tagName === "SUP") {
        const sup = document.createElement("sup");
        sup.textContent = cleanText2(node);
        frag.append(sup);
        return;
      }
      frag.append(document.createTextNode(cleanText2(node)));
    });
    if (frag.firstChild && frag.firstChild.nodeType === 3) frag.firstChild.textContent = frag.firstChild.textContent.replace(/^\s+/, "");
    if (frag.lastChild && frag.lastChild.nodeType === 3) frag.lastChild.textContent = frag.lastChild.textContent.replace(/\s+$/, "");
    return frag;
  }
  function parse2(element, { document }) {
    const items = [...element.querySelectorAll(":scope > li.panel, :scope > li")];
    const cells = [];
    items.forEach((item) => {
      const heading = item.querySelector(".panel-heading .panel-title, .panel-heading");
      const body = item.querySelector(".panel-collapse .panel-body, .panel-body, .panel-collapse");
      if (!heading || !cleanText2(heading)) return;
      const bodyCell = [];
      if (body) {
        [...body.childNodes].forEach((node) => {
          if (node.nodeType === 3) {
            if (node.textContent.trim()) {
              const p = document.createElement("p");
              p.textContent = node.textContent.trim();
              bodyCell.push(p);
            }
            return;
          }
          if (node.nodeType !== 1) return;
          if (!cleanText2(node) && !node.querySelector("img")) return;
          bodyCell.push(node);
        });
      }
      cells.push([buildTitle(heading, document), bodyCell.length ? bodyCell : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-faq", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-boxed.js
  var PANEL_SELECTOR = ".newAccordion.parbase, .newAccordion";
  function cleanText3(el) {
    return (el.textContent || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function stripAttributes(root) {
    [root, ...root.querySelectorAll("*")].forEach((node) => {
      [...node.attributes].forEach((attr) => {
        if (node.tagName === "A" && attr.name === "href") return;
        if (node.tagName === "IMG" && (attr.name === "src" || attr.name === "alt")) return;
        node.removeAttribute(attr.name);
      });
    });
    root.querySelectorAll("b, strong").forEach((b) => {
      if (!b.textContent.trim() && !b.querySelector("img")) b.remove();
    });
    return root;
  }
  function flattenColumn(col, document) {
    const out = [];
    col.querySelectorAll("p").forEach((p) => {
      const first = p.firstElementChild;
      const startsBold = first && /^(B|STRONG)$/.test(first.tagName) && p.textContent.trim().startsWith(first.textContent.trim());
      if (startsBold && first.textContent.trim()) {
        const h3 = document.createElement("h3");
        h3.textContent = cleanText3(first);
        out.push(h3);
        const rest = p.cloneNode(true);
        rest.removeChild(rest.firstElementChild);
        while (rest.firstChild && (rest.firstChild.nodeType === 3 && !rest.firstChild.textContent.trim() || rest.firstChild.nodeType === 1 && rest.firstChild.tagName === "BR")) {
          rest.removeChild(rest.firstChild);
        }
        if (cleanText3(rest)) out.push(stripAttributes(rest));
      } else if (cleanText3(p)) {
        out.push(stripAttributes(p.cloneNode(true)));
      }
    });
    return out;
  }
  function flattenTable(table, document) {
    const out = [];
    [...table.querySelectorAll("tr")].forEach((tr, i) => {
      const values = [...tr.children].map(cleanText3).filter(Boolean);
      if (!values.length) return;
      const p = document.createElement("p");
      const isHeader = i === 0 && (tr.querySelector("th") || [...tr.children].every((c) => c.querySelector("b, strong")));
      if (isHeader) {
        const strong = document.createElement("strong");
        strong.textContent = values.join(": ");
        p.append(strong);
      } else {
        p.textContent = values.join(": ");
      }
      out.push(p);
    });
    return out;
  }
  function flattenBody(node, document, out) {
    [...node.children].forEach((child) => {
      if (child.matches(".generalcolumn, .generalcolumn.parbase")) {
        const COL = '[class*="col-sm-"], [class*="col-xs-"]';
        const cols = [...child.querySelectorAll(COL)].filter((c) => !c.querySelector(COL) && c.querySelector("p"));
        if (cols.length) cols.forEach((col) => out.push(...flattenColumn(col, document)));
        else flattenBody(child, document, out);
        return;
      }
      if (child.tagName === "TABLE") {
        out.push(...flattenTable(child, document));
        return;
      }
      if (/^(P|UL|OL|H1|H2|H3|H4|H5|H6|BLOCKQUOTE)$/.test(child.tagName)) {
        if (!cleanText3(child) && !child.querySelector("img")) return;
        out.push(stripAttributes(child.cloneNode(true)));
        return;
      }
      if (child.tagName === "IMG") {
        out.push(stripAttributes(child.cloneNode(true)));
        return;
      }
      if (child.tagName === "DIV" || child.tagName === "SECTION" || child.tagName === "SPAN") {
        const hasBlockChild = child.querySelector("p, ul, ol, h1, h2, h3, h4, h5, h6, table, div");
        if (!hasBlockChild && cleanText3(child)) {
          const p = document.createElement("p");
          p.append(...[...child.childNodes].map((n) => n.cloneNode(true)));
          out.push(stripAttributes(p));
          return;
        }
        flattenBody(child, document, out);
      }
    });
  }
  function panelTitle(panel) {
    const heading = panel.querySelector(".panel-heading .panel-title, .panel-heading");
    if (!heading) return "";
    const text = heading.querySelector(".col-xs-9, .pad_left_0") || heading.querySelector("a") || heading;
    return cleanText3(text);
  }
  function parse3(element, { document }) {
    if (!element.parentNode) return;
    const panels = [element];
    let next = element.nextElementSibling;
    while (next && next.matches(PANEL_SELECTOR)) {
      panels.push(next);
      next = next.nextElementSibling;
    }
    const cells = [];
    panels.forEach((panel) => {
      const title = panelTitle(panel);
      if (!title) return;
      const body = panel.querySelector(".panel-collapse .tcom-accordion-content-wrapper, .panel-collapse, .panel-body");
      const bodyCell = [];
      if (body) flattenBody(body, document, bodyCell);
      cells.push([title, bodyCell.length ? bodyCell : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    panels.slice(1).forEach((p) => p.remove());
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-boxed", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/video-poster.js
  var ORIGIN = "https://www.toyotafinancial.com";
  function absolute(href) {
    try {
      return new URL(href, ORIGIN).href;
    } catch (e) {
      return href;
    }
  }
  function parse4(element, { document }) {
    const video = element.querySelector("video");
    const source = video && (video.querySelector("source[src]") || (video.hasAttribute("src") ? video : null));
    const rawSrc = source && source.getAttribute("src") || video && video.getAttribute("data-src") || (element.querySelector('[data-src$=".mp4"], [data-video-src]') || { getAttribute: () => null }).getAttribute("data-src");
    const poster = element.querySelector(".video-thumbnail img, .video-content img, img");
    const posterSrc = poster && poster.getAttribute("src") || video && video.getAttribute("poster");
    if (!rawSrc && !posterSrc) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (rawSrc) {
      const href = absolute(rawSrc);
      const link = document.createElement("a");
      link.href = href;
      link.textContent = href;
      cells.push([link]);
    }
    if (posterSrc) {
      const img = document.createElement("img");
      img.src = absolute(posterSrc);
      img.alt = poster && poster.getAttribute("alt") || "";
      cells.push([img]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "video-poster", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quiz-plans.js
  function cleanText4(el) {
    return (el.textContent || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function parse5(element, { document }) {
    const cells = [];
    const photo = element.querySelector(".card-content img, :scope > div:not(.quiz-section) img");
    if (photo) {
      const img = document.createElement("img");
      img.src = photo.getAttribute("src");
      img.alt = photo.getAttribute("alt") || "";
      cells.push([img]);
    }
    const holders = [...element.querySelectorAll(".holder[id]")];
    holders.forEach((holder) => {
      const id = holder.id;
      if (holder.classList.contains("answers")) {
        const ul2 = document.createElement("ul");
        holder.querySelectorAll("li").forEach((li) => {
          const link = li.querySelector("a[href]");
          const item = document.createElement("li");
          if (link) {
            const h3 = document.createElement("h3");
            const a = document.createElement("a");
            a.href = link.getAttribute("href");
            a.textContent = cleanText4(link);
            h3.append(a);
            item.append(h3);
          }
          li.querySelectorAll("p").forEach((p) => {
            if (!cleanText4(p)) return;
            const np = document.createElement("p");
            np.textContent = cleanText4(p);
            item.append(np);
          });
          if (item.childNodes.length) ul2.append(item);
        });
        if (ul2.children.length) cells.push([id, "Result", ul2]);
        return;
      }
      const question = cleanText4(holder.querySelector(".question") || document.createElement("p"));
      const ul = document.createElement("ul");
      holder.querySelectorAll(".answer input").forEach((input) => {
        const label = input.id && holder.querySelector(`label[for="${input.id}"]`) || input.nextElementSibling;
        const text = label ? cleanText4(label) : input.getAttribute("value") || "";
        if (!text) return;
        const li = document.createElement("li");
        const target = input.getAttribute("data-target");
        if (target) {
          const a = document.createElement("a");
          a.href = target.startsWith("#") ? target : `#${target}`;
          a.textContent = text;
          li.append(a);
        } else {
          li.textContent = text;
        }
        ul.append(li);
      });
      if (question || ul.children.length) cells.push([id, question, ul]);
    });
    if (!holders.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "quiz-plans", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-cards.js
  var ORIGIN2 = "https://www.toyotafinancial.com";
  function cleanText5(el) {
    return (el.textContent || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function absolute2(href) {
    try {
      return new URL(href, ORIGIN2).href;
    } catch (e) {
      return href;
    }
  }
  function cleanNode(node) {
    const clone = node.cloneNode(true);
    [clone, ...clone.querySelectorAll("*")].forEach((el) => {
      [...el.attributes].forEach((attr) => {
        if (el.tagName === "A" && attr.name === "href") return;
        el.removeAttribute(attr.name);
      });
    });
    clone.querySelectorAll("br").forEach((br) => {
      let n = br.nextSibling;
      while (n && n.nodeType === 3 && !n.textContent.trim()) n = n.nextSibling;
      if (!n) br.remove();
    });
    return clone;
  }
  function parse6(element, { document }) {
    const filterLabel = element.querySelector(".dropdown-card .card-header, .dropdown-card p");
    const options = [...element.querySelectorAll(".materialized-dropdown li.option, .materialized-dropdown option")].map(cleanText5).filter(Boolean);
    const all = [...element.querySelectorAll(".populate-carousel")];
    let cards = all.filter((c) => !c.closest(".carousel-inner"));
    if (!cards.length) cards = all;
    const cells = [];
    if (filterLabel && cleanText5(filterLabel)) cells.push([cleanText5(filterLabel)]);
    cards.forEach((card) => {
      const imageCell = [];
      const srcImg = card.querySelector(".thumbnail img, img");
      if (srcImg) {
        const img = document.createElement("img");
        img.src = absolute2(srcImg.getAttribute("src"));
        img.alt = srcImg.getAttribute("alt") || "";
        imageCell.push(img);
      }
      const videoEl = card.querySelector("[data-src]");
      const videoSrc = videoEl && videoEl.getAttribute("data-src");
      if (videoSrc && /\.(mp4|webm)(\?|#|$)/i.test(videoSrc)) {
        const href = absolute2(videoSrc);
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = href;
        a.textContent = href;
        p.append(a);
        imageCell.push(p);
      }
      const bodyCell = [];
      const captionBody = card.querySelector(".caption-body") || card.querySelector(".caption");
      if (captionBody) {
        [...captionBody.children].forEach((child) => {
          if (!cleanText5(child)) return;
          if (/^H[1-6]$/.test(child.tagName)) {
            const h3 = document.createElement("h3");
            h3.textContent = cleanText5(child);
            bodyCell.push(h3);
            return;
          }
          if (child.tagName === "A") return;
          bodyCell.push(cleanNode(child));
        });
      }
      const caption = card.querySelector(".caption");
      if (caption) {
        [...caption.querySelectorAll("a[href]")].filter((a) => !captionBody || captionBody === caption || !captionBody.contains(a)).forEach((a) => {
          if (!cleanText5(a)) return;
          const p = document.createElement("p");
          const link = document.createElement("a");
          link.href = a.getAttribute("href");
          link.textContent = cleanText5(a);
          p.append(link);
          bodyCell.push(p);
        });
      }
      const categories = options.filter((label) => card.classList.contains(label.replace(/\s+/g, "_")));
      if (!imageCell.length && !bodyCell.length) return;
      cells.push([imageCell.length ? imageCell : "", bodyCell.length ? bodyCell : "", categories.join(", ")]);
    });
    if (!cards.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-cards", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-thumbnail.js
  function cleanText6(el) {
    return (el.textContent || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function cleanParagraph(p, document) {
    const np = document.createElement("p");
    [...p.childNodes].forEach((n) => np.append(n.cloneNode(true)));
    np.querySelectorAll("*").forEach((el) => {
      [...el.attributes].forEach((attr) => {
        if (el.tagName === "A" && attr.name === "href") return;
        el.removeAttribute(attr.name);
      });
    });
    let last = np.lastChild;
    while (last && (last.nodeType === 3 && !last.textContent.replace(/ /g, " ").trim() || last.nodeType === 1 && last.tagName === "BR")) {
      np.removeChild(last);
      last = np.lastChild;
    }
    return np;
  }
  function absoluteUrl(src, document) {
    if (!src) return src;
    try {
      const base = document.location && document.location.href || "https://www.toyotafinancial.com/";
      return new URL(src, base).href;
    } catch (e) {
      return src;
    }
  }
  function parse7(element, { document }) {
    const cards = [...element.querySelectorAll(".thumbnail-card")];
    const cells = [];
    cards.forEach((card) => {
      const srcImg = card.querySelector(".thumbnail img, img.img-responsive");
      let img = null;
      if (srcImg && srcImg.getAttribute("src")) {
        img = document.createElement("img");
        img.src = absoluteUrl(srcImg.getAttribute("src"), document);
        img.alt = (srcImg.getAttribute("alt") || "").trim();
      }
      const textCell = [];
      const caption = card.querySelector(".caption") || card;
      const body = caption.querySelector(".caption-body");
      const bodyNodes = body ? [...body.children] : [...caption.children].filter((c) => c.tagName !== "A");
      bodyNodes.forEach((child) => {
        if (!cleanText6(child)) return;
        if (/^H[1-6]$/.test(child.tagName)) {
          const h3 = document.createElement("h3");
          h3.textContent = cleanText6(child);
          textCell.push(h3);
        } else if (child.tagName === "P") {
          textCell.push(cleanParagraph(child, document));
        } else if (child.tagName !== "A") {
          textCell.push(child);
        }
      });
      [...caption.querySelectorAll("a[href]")].filter((a) => !body || !body.contains(a)).forEach((a) => {
        const label = cleanText6(a);
        if (!label) return;
        const p = document.createElement("p");
        const link = document.createElement("a");
        link.href = a.getAttribute("href");
        link.textContent = label;
        p.append(link);
        textCell.push(p);
      });
      if (!img && !textCell.length) return;
      if (img) cells.push([img, textCell.length ? textCell : ""]);
      else cells.push([textCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-thumbnail", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-caption.js
  function cleanText7(el) {
    return (el.textContent || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function stripAttributes2(root) {
    [root, ...root.querySelectorAll("*")].forEach((node) => {
      [...node.attributes].forEach((attr) => {
        if (node.tagName === "A" && attr.name === "href") return;
        if (node.tagName === "IMG" && (attr.name === "src" || attr.name === "alt")) return;
        node.removeAttribute(attr.name);
      });
    });
    return root;
  }
  function hasLineBreak(cell) {
    return [...cell.querySelectorAll("br")].some((br) => {
      let n = br.nextSibling;
      while (n) {
        if ((n.textContent || "").replace(/ /g, " ").trim()) return true;
        n = n.nextSibling;
      }
      return false;
    });
  }
  function isSimpleCell(cell) {
    if (cell.querySelector("ul, ol, table, img, a, b, strong, sup")) return false;
    if (hasLineBreak(cell)) return false;
    return cell.querySelectorAll("p").length <= 1;
  }
  function inlineContent(src, document) {
    const frag = document.createDocumentFragment();
    [...src.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const t = n.textContent.replace(/ /g, " ").replace(/\s+/g, " ");
        if (t.trim() || frag.lastChild && t === " ") frag.append(document.createTextNode(t));
        return;
      }
      if (n.nodeType !== 1 || n.tagName === "BR") return;
      if (/^(SUP|SUB|B|STRONG|EM|I|A)$/.test(n.tagName)) {
        if (!cleanText7(n)) return;
        const el = document.createElement(n.tagName.toLowerCase());
        if (n.tagName === "A" && n.getAttribute("href")) el.setAttribute("href", n.getAttribute("href"));
        el.append(inlineContent(n, document));
        frag.append(el);
        return;
      }
      if (frag.lastChild) frag.append(document.createTextNode(" "));
      frag.append(inlineContent(n, document));
    });
    return frag;
  }
  function trimEdges(el) {
    const first = el.firstChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
    const last = el.lastChild;
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, "");
    return el;
  }
  function buildLineCell(cell, document) {
    const frag = document.createDocumentFragment();
    let p = document.createElement("p");
    const flush = () => {
      trimEdges(p);
      if (cleanText7(p)) frag.append(p);
      p = document.createElement("p");
    };
    [...cell.childNodes].forEach((n) => {
      if (n.nodeType === 1 && n.tagName === "BR") {
        flush();
        return;
      }
      if (n.nodeType === 3) {
        p.append(document.createTextNode(n.textContent.replace(/ /g, " ").replace(/\s+/g, " ")));
        return;
      }
      if (n.nodeType === 1) p.append(stripAttributes2(n.cloneNode(true)));
    });
    flush();
    return frag;
  }
  function buildCell(cell, document) {
    if (isSimpleCell(cell)) return cleanText7(cell);
    if (hasLineBreak(cell) && !cell.querySelector("p, div, ul, ol, table")) return buildLineCell(cell, document);
    const frag = document.createDocumentFragment();
    [...cell.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        if (child.textContent.trim()) frag.append(document.createTextNode(cleanText7(child)));
        return;
      }
      if (child.nodeType !== 1) return;
      if (child.tagName === "BR") return;
      if (!cleanText7(child) && !child.querySelector("img")) return;
      frag.append(stripAttributes2(child.cloneNode(true)));
    });
    return frag;
  }
  function parse8(element, { document }) {
    const table = element.querySelector("table");
    if (!table) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const rows = [...table.querySelectorAll(":scope > thead > tr, :scope > tbody > tr, :scope > tr, :scope > tfoot > tr")].filter((tr) => cleanText7(tr) || tr.querySelector("img"));
    const width = Math.max(1, ...rows.map((tr) => tr.children.length));
    const cells = [];
    const wrapper = element.querySelector(".default-table") || element;
    const captionBox = [...wrapper.children].find((c) => c !== table && !c.contains(table) && cleanText7(c));
    if (captionBox) {
      const captionCell = [];
      captionBox.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
        if (!cleanText7(h)) return;
        const h3 = document.createElement("h3");
        h3.append(inlineContent(h, document));
        captionCell.push(trimEdges(h3));
      });
      [...captionBox.querySelectorAll("p")].filter((p) => !p.closest("h1, h2, h3, h4, h5, h6")).forEach((p) => {
        if (!cleanText7(p)) return;
        const np = document.createElement("p");
        np.append(inlineContent(p, document));
        captionCell.push(trimEdges(np));
      });
      if (captionCell.length) cells.push([captionCell]);
    }
    rows.forEach((tr, i) => {
      const row = [...tr.children].map((c) => i === 0 && tr.querySelector("th") ? cleanText7(c) : buildCell(c, document));
      while (row.length < width) row.push("");
      cells.push(row);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "table-caption", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-card.js
  function cleanText8(el) {
    return (el.textContent || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function isBlogCard(el) {
    if (!el || !el.matches || !el.matches(".card-component.parbase, .card-component")) return false;
    const caption = el.querySelector(".card.no-pd .caption, .card .caption");
    if (!caption) return false;
    if (caption.querySelector(".caption-header")) return true;
    return [...caption.querySelectorAll("a.btn[href]")].some((a) => cleanText8(a));
  }
  function buildBlogRow(cardEl, document) {
    const card = cardEl.querySelector(".card") || cardEl;
    const srcImg = card.querySelector("img");
    const caption = card.querySelector(".caption");
    const imageCell = [];
    if (srcImg) {
      const img = document.createElement("img");
      img.setAttribute("src", srcImg.getAttribute("src"));
      img.setAttribute("alt", srcImg.getAttribute("alt") || "");
      imageCell.push(img);
    }
    const textCell = [];
    if (caption) {
      [...caption.children].forEach((child) => {
        if (child.matches(".caption-header")) {
          if (!cleanText8(child)) return;
          const h3 = document.createElement("h3");
          h3.textContent = cleanText8(child);
          textCell.push(h3);
          return;
        }
        if (child.tagName === "A") {
          if (!cleanText8(child) || !child.getAttribute("href")) return;
          const p = document.createElement("p");
          const strong = document.createElement("strong");
          const a = document.createElement("a");
          a.setAttribute("href", child.getAttribute("href"));
          a.textContent = cleanText8(child);
          strong.append(a);
          p.append(strong);
          textCell.push(p);
          return;
        }
        if (!cleanText8(child) && !child.querySelector("img")) return;
        if (child.tagName === "P") {
          const p = document.createElement("p");
          [...child.childNodes].forEach((n) => p.append(n.cloneNode(true)));
          if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.textContent = p.lastChild.textContent.replace(/\s+$/, "");
          textCell.push(p);
          return;
        }
        textCell.push(child);
      });
    }
    if (!imageCell.length && !textCell.length) return null;
    return [imageCell.length ? imageCell : "", textCell.length ? textCell : ""];
  }
  function parseBlogCards(element, document) {
    const siblings = [element];
    let next = element.nextElementSibling;
    while (isBlogCard(next)) {
      siblings.push(next);
      next = next.nextElementSibling;
    }
    const cells = siblings.map((s) => buildBlogRow(s, document)).filter(Boolean);
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    siblings.slice(1).forEach((s) => s.remove());
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-card", cells });
    element.replaceWith(block);
  }
  function parseSingleCard(element, document) {
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
  function parse9(element, { document }) {
    if (!element.parentNode) return;
    if (isBlogCard(element)) {
      parseBlogCards(element, document);
      return;
    }
    parseSingleCard(element, document);
  }

  // tools/importer/parsers/tabs-plans.js
  var NEUTRAL_LABEL = "Select a plan";
  var NEUTRAL_GROUP = "Plans";
  function cleanText9(el) {
    return (el.textContent || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }
  function collectTabComponents(start, includeStart) {
    const list = includeStart ? [start] : [];
    let next = start.nextElementSibling;
    while (next) {
      if (next.tagName === "HR") {
        next = next.nextElementSibling;
        continue;
      }
      if (!next.matches(".tabcomponent")) break;
      list.push(next);
      next = next.nextElementSibling;
    }
    return list;
  }
  var CHROME = "nav, header, footer, .footer, .tfs-header-wrapper, iframe, script, style, noscript, link";
  function contentFollows(node, document) {
    const root = node.closest("main") || document.body;
    const walker = document.createTreeWalker(root, 1 | 4);
    walker.currentNode = node;
    let n = walker.nextNode();
    while (n && node.contains(n)) n = walker.nextNode();
    while (n) {
      if (n.nodeType === 1) {
        if (n.tagName === "HR") return false;
        if (/^(IMG|PICTURE|VIDEO|TABLE)$/.test(n.tagName) && !n.closest(CHROME)) return true;
      } else if (n.textContent.replace(/ /g, " ").trim() && !n.parentElement.closest(CHROME)) {
        return true;
      }
      n = walker.nextNode();
    }
    return false;
  }
  function removeTabComponent(tc) {
    const prev = tc.previousElementSibling;
    if (prev && prev.tagName === "HR") prev.remove();
    tc.remove();
  }
  function readPanels(tc, optionLabels, fallbackGroup) {
    const panels = [];
    const groupEls = [...tc.querySelectorAll(".materialized-dropdown-group")];
    const scopes = groupEls.length ? groupEls : [tc];
    scopes.forEach((scope) => {
      let group = fallbackGroup;
      if (scope !== tc) {
        const key = [...scope.classList].find((c) => optionLabels.has(c));
        if (key) group = optionLabels.get(key);
      }
      const tabLinks = [...scope.querySelectorAll('.nav-tabs a[href^="#"], .nav-tabs a[data-toggle="tab"]')];
      tabLinks.forEach((a) => {
        const id = (a.getAttribute("href") || "").replace(/^#/, "");
        const label = cleanText9(a);
        if (!id || !label) return;
        const pane = [...scope.querySelectorAll(".tab-pane")].find((p) => p.id === id);
        if (!pane) return;
        panels.push({ group, tab: label, pane });
      });
    });
    return panels;
  }
  function readCardGroups(card, optionLabels) {
    const panels = [];
    card.querySelectorAll(".materialized-dropdown-group").forEach((pane) => {
      if (pane.closest(".tabcomponent")) return;
      const key = [...pane.classList].find((c) => optionLabels.has(c));
      if (!key) return;
      pane.querySelectorAll("h1 > b, h2 > b, h3 > b, h4 > b, h5 > b, h6 > b, h1 > strong, h2 > strong, h3 > strong, h4 > strong, h5 > strong, h6 > strong").forEach((b) => b.replaceWith(...b.childNodes));
      const label = optionLabels.get(key);
      panels.push({ group: label, tab: label, pane });
    });
    return panels;
  }
  function buildOutput(document, label, panels) {
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-plans", cells: [[label]] });
    const rest = [];
    panels.forEach(({ group, tab, pane }) => {
      rest.push(document.createElement("hr"));
      const content = [...pane.childNodes].filter((n) => n.nodeType === 1 || n.nodeType === 3 && n.textContent.trim());
      rest.push(...content);
      const metaCells = {};
      if (group) metaCells["Tab Group"] = group;
      metaCells.Tab = tab;
      rest.push(WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: metaCells }));
    });
    return { block, rest };
  }
  function parse10(element, { document }) {
    if (!element.parentNode) return;
    const isDropdownCard = element.matches(".card-component, .card-component.parbase") && !!element.querySelector(".materialized-dropdown");
    let label = NEUTRAL_LABEL;
    const optionLabels = /* @__PURE__ */ new Map();
    let tabComponents;
    let fallbackGroup = NEUTRAL_GROUP;
    if (isDropdownCard) {
      const labelEl = element.querySelector("label.select-label, label, .card-header");
      if (labelEl && cleanText9(labelEl)) label = cleanText9(labelEl);
      element.querySelectorAll(".materialized-dropdown li.option, .materialized-dropdown option, select option").forEach((o) => {
        const key = o.getAttribute("data-value") || o.getAttribute("value");
        if (key && cleanText9(o)) optionLabels.set(key, cleanText9(o));
      });
      tabComponents = collectTabComponents(element, false);
      if (!tabComponents.length && element.parentElement) {
        tabComponents = [...element.parentElement.querySelectorAll(":scope > .tabcomponent")];
      }
      fallbackGroup = optionLabels.size ? [...optionLabels.values()][0] : NEUTRAL_GROUP;
    } else {
      let prev = element.previousElementSibling;
      while (prev && (prev.tagName === "HR" || prev.matches(".tabcomponent"))) prev = prev.previousElementSibling;
      if (prev && prev.matches(".card-component") && prev.querySelector(".materialized-dropdown")) return;
      tabComponents = collectTabComponents(element, true);
      fallbackGroup = "";
    }
    const panels = [];
    tabComponents.forEach((tc) => panels.push(...readPanels(tc, optionLabels, fallbackGroup)));
    if (isDropdownCard && !tabComponents.length) panels.push(...readCardGroups(element, optionLabels));
    if (!panels.length) {
      if (!isDropdownCard) element.replaceWith(...element.childNodes);
      else element.remove();
      return;
    }
    const { block, rest } = buildOutput(document, label, panels);
    if (isDropdownCard) {
      tabComponents.forEach(removeTabComponent);
      element.replaceWith(block);
    } else {
      tabComponents.slice(1).forEach(removeTabComponent);
      const prev = element.previousElementSibling;
      if (prev && prev.tagName === "HR") prev.remove();
      element.replaceWith(block);
    }
    block.after(...rest);
    const lastMeta = rest[rest.length - 1];
    if (contentFollows(lastMeta, document)) lastMeta.after(document.createElement("hr"));
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
    } catch {
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

  // tools/importer/import-content-page.js
  var parsers = {
    "columns-callout": parse,
    "accordion-faq": parse2,
    "accordion-boxed": parse3,
    "video-poster": parse4,
    "quiz-plans": parse5,
    "carousel-cards": parse6,
    "cards-thumbnail": parse7,
    "table-caption": parse8,
    "columns-card": parse9,
    "tabs-plans": parse10
  };
  var PAGE_TEMPLATE = {
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
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : [],
    transform3,
    transform4
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = {
      ...payload,
      template: PAGE_TEMPLATE
    };
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
  var import_content_page_default = {
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
  return __toCommonJS(import_content_page_exports);
})();
