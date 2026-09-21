// Lógica pura del bloque de continuidad de la landing (sin DOM): validación de parámetros
// por lista blanca y armado de los enlaces de compra. Ningún valor de la URL se inserta
// tal cual en la página: solo sirve para elegir un texto ya escrito.

import { GOALS, INTENSITIES, PATTERNS } from './content.js';
import { extractAttribution } from './handoff.js';

const QSID_PATTERN = /^[a-f0-9-]{8,64}$/;

// Valida un objeto crudo { pattern, secondary, intensity, goal, qsid }. Devuelve null si no
// hay un `pattern` válido (en ese caso no se muestra ningún bloque).
export function sanitizeBridge(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!PATTERNS.includes(raw.pattern)) return null;
  return {
    pattern: raw.pattern,
    secondary: PATTERNS.includes(raw.secondary) && raw.secondary !== raw.pattern ? raw.secondary : null,
    intensity: INTENSITIES.includes(raw.intensity) ? raw.intensity : null,
    goal: GOALS.includes(raw.goal) ? raw.goal : null,
    qsid: typeof raw.qsid === 'string' && QSID_PATTERN.test(raw.qsid) ? raw.qsid : null,
  };
}

export function parseBridgeParams(search) {
  const p = new URLSearchParams(search || '');
  return sanitizeBridge({
    pattern: p.get('pattern'),
    secondary: p.get('secondary'),
    intensity: p.get('intensity'),
    goal: p.get('goal'),
    qsid: p.get('qsid'),
  });
}

// Agrega al enlace de compra (Shopify) el patrón y la sesión del quiz, y propaga los utm_*
// y el fbclid con los que llegó la persona. No pisa parámetros que el enlace ya tenga.
export function decorateShopifyUrl(href, { bridge, attribution = {} }) {
  try {
    const url = new URL(href, 'https://placeholder.invalid');
    const set = (key, value) => {
      if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
    };
    set('pattern', bridge.pattern);
    set('qsid', bridge.qsid);
    set('src', 'quiz');
    for (const [key, value] of Object.entries(extractAttribution(new URLSearchParams(attribution).toString()))) {
      set(key, value);
    }
    return /^https?:\/\//i.test(href) ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}
