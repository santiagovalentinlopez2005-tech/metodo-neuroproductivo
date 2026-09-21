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
  mountUI({ root: document.getElementById('app'), engine, config: CONFIG });

  // Mejor esfuerzo: la persona cierra la página a mitad del quiz. La medición fiable del
  // abandono se hace comparando cuántas personas llegaron a cada pantalla.
  window.addEventListener('pagehide', () => engine.abandon());

  if (!isProductionHost()) window.__mnq = { engine }; // depuración y pruebas, nunca en producción
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
