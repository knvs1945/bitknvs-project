export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// CSS alone can't shrink text to fit a box based on its content length —
// only wrap or truncate. This does a cheap incremental shrink instead,
// for name labels that need to stay on one line at any length.
export function fitTextToWidth(el, { minFontSize = 8, maxFontSize = 16, step = 0.5 } = {}) {
  if (!el) return;
  let fontSize = maxFontSize;
  el.style.fontSize = `${fontSize}px`;
  let guard = 0;
  while (el.scrollWidth > el.clientWidth && fontSize > minFontSize && guard < 40) {
    fontSize -= step;
    el.style.fontSize = `${fontSize}px`;
    guard += 1;
  }
}
