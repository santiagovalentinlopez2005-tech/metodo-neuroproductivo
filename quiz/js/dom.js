// Utilidades mínimas para construir el DOM. Todo el texto se inserta como texto (nunca como
// HTML), así ningún contenido ni parámetro de URL puede inyectar marcado.

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function svgEl(tag, attrs = {}, ...children) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  for (const child of children.flat()) if (child) node.append(child);
  return node;
}

// Texto enriquecido: string = texto plano, { b: '…' } = negrita.
export function rich(segments) {
  const fragment = document.createDocumentFragment();
  const list = Array.isArray(segments) ? segments : [segments];
  for (const segment of list) {
    if (typeof segment === 'string') fragment.append(document.createTextNode(segment));
    else if (segment && typeof segment.b === 'string') fragment.append(el('strong', { text: segment.b }));
  }
  return fragment;
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
