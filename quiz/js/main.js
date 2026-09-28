// Punto de entrada del quiz: arma el motor, restaura el progreso (si existe) y monta la interfaz.

import { CONFIG } from './config.js';
import { FLOW, LIKERT_OPTIONS, QUESTIONS } from './content.js';
import { createEngine } from './engine.js';
import { captureAttribution, generateQsid, getAttribution, buildLandingUrl } from './handoff.js';
import { local, session } from './storage.js';
import { initTracking, isProductionHost, track } from './tracking.js';
import { mountUI } from './ui.js';

function qaSeed() {
  // Semilla fija solo para pruebas (?seed=123) y solo fuera de producción.
  if (isProductionHost()) return null;
  const raw = new URLSearchParams(window.location.search).get('seed');
  return raw !== null && /^\d{1,10}$/.test(raw) ? Number(raw) : null;
}

// Precarga las imágenes para que aparezcan sin demora: los íconos ya (son livianos) y las
// ilustraciones del resultado cuando el navegador está libre.
function preloadImages() {
  const load = (src) => { const img = new Image(); img.decoding = 'async'; img.src = src; };
  Object.values(CONFIG.icons || {}).forEach((icon) => load(icon.src));
  const results = ['atajo', 'arranque', 'racha'].map((k) => CONFIG.images[k]).filter(Boolean);
  const later = () => results.forEach(load);
  if ('requestIdleCallback' in window) window.requestIdleCallback(later, { timeout: 3000 });
  else window.setTimeout(later, 1500);
}

function start() {
  initTracking();
  captureAttribution();

  const engine = createEngine({
    questions: QUESTIONS,
    flow: FLOW,
    likertOptions: LIKERT_OPTIONS,
    config: CONFIG,
    storage: { local, session },
    tracking: { track },
    handoff: { generateQsid, buildLandingUrl, getAttribution },
    seed: qaSeed(),
  });

  engine.restore();
  preloadImages();
  mountUI({ root: document.getElementById('app'), engine, config: CONFIG });

  // Mejor esfuerzo: la persona cierra la página a mitad del quiz. La medición fiable del
  // abandono se hace comparando cuántas personas llegaron a cada pantalla.
  window.addEventListener('pagehide', () => engine.abandon());

  if (!isProductionHost()) window.__mnq = { engine }; // depuración y pruebas, nunca en producción
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
