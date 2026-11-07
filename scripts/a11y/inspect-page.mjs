// Runs inside the browser via page.evaluate; keep all helpers self-contained.
export function inspectPage() {
  const parse = (value) => {
    const n = value.match(/[\d.]+/g)?.map(Number) ?? [];
    return [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, n[3] ?? 1];
  };
  const blend = (front, back) => [0, 1, 2].map((i) => front[i] * front[3] + back[i] * (1 - front[3]));
  const background = (element) => {
    if (!element) return [255, 255, 255];
    const color = parse(getComputedStyle(element).backgroundColor);
    return color[3] >= 1 ? color.slice(0, 3) : blend(color, background(element.parentElement));
  };
  const luminance = (rgb) => rgb.map((c) => { c /= 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; })
    .reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
  const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
  const texts = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = walker.currentNode.textContent.trim();
    const element = walker.currentNode.parentElement;
    if (!text || !element || element.closest('script,style,[aria-hidden="true"],.sr-only,dialog:not([open])')) continue;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (!rect.width || !rect.height || style.visibility === 'hidden' || style.display === 'none') continue;
    const svgScale = element.tagName.toLowerCase() === 'text' ? Math.abs(element.getScreenCTM()?.a ?? 1) : 1;
    const size = parseFloat(style.fontSize) * svgScale;
    const bg = background(element);
    const fg = blend(parse(element instanceof SVGElement ? style.fill : style.color), bg);
    const contrast = ratio(fg, bg);
    const required = size >= 24 || size >= 18.666 && Number(style.fontWeight) >= 700 ? 3 : 4.5;
    texts.push({ text: text.slice(0, 65), class: element.getAttribute('class') ?? '', size: +size.toFixed(2),
      contrast: +contrast.toFixed(2), required, color: style.color, fill: style.fill, background: bg });
  }
  const controls = [...document.querySelectorAll('a,button,input,summary')].flatMap((element) => {
    if (element.closest('dialog:not([open]),[hidden]') || element.matches(':disabled')) return [];
    const target = element.matches('input[type="radio"],input[type="checkbox"]') ? element.closest('label') : element;
    if (!target) return [];
    const r = target.getBoundingClientRect();
    if (!r.width || !r.height || getComputedStyle(target).visibility === 'hidden') return [];
    return [{ name: element.getAttribute('aria-label') || target.textContent.trim().slice(0, 50),
      tag: element.tagName, width: +r.width.toFixed(1), height: +r.height.toFixed(1), inline: element.closest('p') !== null }];
  });
  return { title: document.title, route: location.hash, width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth, minimumFont: Math.min(...texts.map((t) => t.size)),
    smallText: texts.filter((t) => t.size < 15.99), lowContrast: texts.filter((t) => t.contrast + .001 < t.required),
    smallTargets: controls.filter((c) => (c.width < 24 || c.height < 24) && !c.inline),
    headings: [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => ({ level: h.tagName, text: h.textContent })),
    homeLinks: [...document.querySelectorAll('a')].filter((a) => a.getAttribute('href') === '#/').map((a) => a.textContent),
  };
}
