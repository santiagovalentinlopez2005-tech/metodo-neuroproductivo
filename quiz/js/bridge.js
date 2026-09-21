// Bloque de continuidad para la copia de la landing (/metodo-quiz).
// Lee el resultado del quiz (URL o, como respaldo, almacenamiento de sesión), muestra un
// bloque pequeño encima de la VSL y decora los enlaces de compra. Si no hay un `pattern`
// válido no hace nada: la página queda idéntica a la landing normal.

import { CONFIG } from './config.js';
import { BRIDGE_UI, INTENSITY_LABEL, RESULTS } from './content.js';
import { el } from './dom.js';
import { extractAttribution, getAttribution } from './handoff.js';
import { decorateShopifyUrl, parseBridgeParams, sanitizeBridge } from './bridge-core.js';
import { session } from './storage.js';
import { track } from './tracking.js';

function readBridge() {
  return parseBridgeParams(window.location.search) || sanitizeBridge(session.getJSON(CONFIG.storage.resultKey));
}

function buildBlock(bridge) {
  const content = RESULTS[bridge.pattern];
  const name = bridge.intensity ? `${content.name} · ${INTENSITY_LABEL[bridge.intensity]}` : content.name;
  return el(
    'aside',
    { class: 'mnq-bridge', 'aria-label': 'Tu resultado del test' },
    el(
      'p',
      { class: 'mnq-bridge__chip' },
      el('span', { class: 'mnq-bridge__label', text: BRIDGE_UI.label }),
      el('span', { class: 'mnq-bridge__name', text: name }),
    ),
    el('p', { class: 'mnq-bridge__text', text: content.bridge }),
  );
}

function init() {
  const bridge = readBridge();
  if (!bridge) return;

  // 1. Bloque encima del reproductor (dentro del hero).
  const anchor = document.querySelector('.hero .vsl-outer') || document.querySelector('.vsl-outer');
  let shown = false;
  if (anchor && anchor.parentNode) {
    anchor.parentNode.insertBefore(buildBlock(bridge), anchor);
    shown = true;
  }

  // 2. Enlaces de compra: patrón + sesión + atribución (utm_* y fbclid) intactos.
  const attribution = { ...getAttribution(), ...extractAttribution(window.location.search) };
  document.querySelectorAll('a[href*="myshopify.com"]').forEach((link) => {
    link.setAttribute('href', decorateShopifyUrl(link.getAttribute('href'), { bridge, attribution }));
  });

  // 3. Eventos.
  const base = { qsid: bridge.qsid || 'none', pattern: bridge.pattern };
  if (shown) {
    track('bridge_view', { ...base, intensity: bridge.intensity || 'none', goal: bridge.goal || 'none' });
  }
  document.addEventListener(
    'click',
    (event) => {
      const link = event.target instanceof Element ? event.target.closest('a[href*="myshopify.com"]') : null;
      if (link) track('landing_cta_click', base);
    },
    true,
  );
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
