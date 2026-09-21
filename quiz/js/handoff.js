// Traspaso quiz → landing. Solo viajan valores de listas blancas y parámetros de atribución
// (utm_* y fbclid) con los que llegó la persona. Nunca datos personales.
//
// Nota: `utm_content` se propaga INTACTO. La carpeta ai-ads lo usa para identificar el
// anuncio (AF-ID), así que el patrón viaja en su propio parámetro (`pattern`).

import { CONFIG } from './config.js';
import { PATTERNS, INTENSITIES, GOALS } from './content.js';
import { session } from './storage.js';

const ATTRIBUTION_KEY = /^(utm_[a-z0-9_]{1,30}|fbclid)$/i;
const MAX_VALUE_LENGTH = 256;

export function extractAttribution(search) {
  const out = {};
  const params = new URLSearchParams(search || '');
  for (const [key, value] of params) {
    if (ATTRIBUTION_KEY.test(key) && value && value.length <= MAX_VALUE_LENGTH) {
      out[key.toLowerCase()] = value;
    }
  }
  return out;
}

// Guarda la atribución con la que llegó la persona (por si recarga la página).
export function captureAttribution(search = typeof location !== 'undefined' ? location.search : '') {
  const found = extractAttribution(search);
  if (Object.keys(found).length) session.setJSON(CONFIG.storage.attribKey, found);
  return getAttribution();
}

export function getAttribution() {
  const stored = session.getJSON(CONFIG.storage.attribKey);
  return stored && typeof stored === 'object' ? stored : {};
}

export function generateQsid() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* cae al generador manual */
  }
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  return Array.from({ length: 32 }, hex).join('');
}

// URL de la landing para tráfico del quiz con el resultado como parámetros.
export function buildLandingUrl({ result, qsid, attribution = {}, landingPath = CONFIG.routes.landing }) {
  const params = new URLSearchParams();
  if (PATTERNS.includes(result.pattern)) params.set('pattern', result.pattern);
  if (result.secondary && PATTERNS.includes(result.secondary)) params.set('secondary', result.secondary);
  if (INTENSITIES.includes(result.intensity)) params.set('intensity', result.intensity);
  if (result.goal && GOALS.includes(result.goal)) params.set('goal', result.goal);
  if (qsid) params.set('qsid', qsid);
  params.set('src', 'quiz');
  for (const [key, value] of Object.entries(attribution)) {
    if (ATTRIBUTION_KEY.test(key) && !params.has(key)) params.set(key, value);
  }
  return `${landingPath}?${params.toString()}`;
}
