/**
 * Scene7 pads (letterboxes with white bars) any rendition requested wider than
 * the master asset. `fit=constrain` makes Scene7 return the largest unpadded
 * rendition instead, so the full-bleed background has no white edges.
 * String manipulation (not URLSearchParams) keeps literal `$` template params intact.
 */
function constrainScene7(url) {
  if (!url || !url.includes('/is/image/') || /[?&]fit=/.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}fit=constrain`;
}

export default function decorate(block) {
  // Background image + text rows are styled in CSS; the picture is positioned
  // absolutely behind the text content.
  block.querySelectorAll('picture source').forEach((source) => {
    source.srcset = constrainScene7(source.getAttribute('srcset'));
  });
  block.querySelectorAll('picture img').forEach((img) => {
    const src = img.getAttribute('src');
    const fixed = constrainScene7(src);
    if (fixed !== src) img.src = fixed;
  });
}
