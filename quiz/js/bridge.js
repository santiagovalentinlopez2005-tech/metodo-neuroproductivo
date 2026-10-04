// Bloque de continuidad para la copia de la landing (/metodo-quiz).
// Lee el resultado del quiz (URL o, como respaldo, almacenamiento de sesión), muestra el
// resultado en una línea encima de la VSL y el detalle debajo (así el video queda a la vista
// en celulares chicos) y decora los enlaces de compra. Si no hay un `pattern` válido no hace
// nada: la página queda idéntica a la landing normal.

import { CONFIG } from './config.js';
import { BRIDGE_UI, GOAL_TEXT, INTENSITY_LABEL, RESULTS } from './content.js';
import { el } from './dom.js';
import { extractAttribution, getAttribution } from './handoff.js';
import { decorateShopifyUrl, parseBridgeParams, sanitizeBridge } from './bridge-core.js';
import { session } from './storage.js';
import { track } from './tracking.js';

function readBridge() {
  return parseBridgeParams(window.location.search) || sanitizeBridge(session.getJSON(CONFIG.storage.resultKey));
}

// Encima del reproductor: solo el resultado, en una línea compacta.
function buildChip(bridge) {
  const content = RESULTS[bridge.pattern];
  const name = bridge.intensity ? `${content.name} · ${BRIDGE_UI.level(INTENSITY_LABEL[bridge.intensity])}` : content.name;
  return el(
    'aside',
    { class: 'mnq-bridge', 'aria-label': 'Tu resultado del test' },
    el(
      'p',
      { class: 'mnq-bridge__chip' },
      el('span', { class: 'mnq-bridge__label', text: BRIDGE_UI.label }),
      el('span', { class: 'mnq-bridge__name', text: name }),
    ),
  );
}

// Debajo del reproductor: qué muestra el video para este perfil y el objetivo elegido en el quiz.
function buildDetail(bridge) {
  const content = RESULTS[bridge.pattern];
  const goal = GOAL_TEXT[bridge.goal] || null; // `goal` ya viene validado por sanitizeBridge
  return el(
    'div',
    { class: 'mnq-bridge-detail' },
    el('p', { class: 'mnq-bridge__text', text: content.bridge }),
    goal ? el('p', { class: 'mnq-bridge__goal', text: BRIDGE_UI.goalLine(goal.label) }) : null,
  );
}

// VSL: además del resultado, mide si la persona llega a tocar play y si mira un tramo del
// video. Sirve para separar "no le interesó la VSL" de "nunca le dio play" (por ejemplo si la
// landing está toda destapada y la gente se la salta). Usa los eventos reales que dispara el
// reproductor de VTurb (la etiqueta <vturb-smartplayer>): `video:play` (se disparó recién con
// un clic real, no con el autoplay mudo — verificado a mano en la página publicada) y
// `video:timeupdate` (trae `detail.time` en segundos). `VslWatch60s` es una marca aproximada de
// "miró un buen tramo"; no sabemos en qué segundo entra la oferta del video, así que no es el
// momento exacto del pitch. Todo en su propio try/catch: si VTurb cambia el reproductor, esto
// puede dejar de andar, pero no tiene que romper el resto de la página.
function initVslTracking(base) {
  try {
    const player = document.querySelector('vturb-smartplayer');
    if (!player) return;
    player.addEventListener('video:play', () => track('vsl_play', base), { once: true });
    let watched60 = false;
    player.addEventListener('video:timeupdate', (event) => {
      if (watched60) return;
      const seconds = event && event.detail && event.detail.time;
      if (typeof seconds === 'number' && seconds >= 60) {
        watched60 = true;
        track('vsl_watch_60s', base);
      }
    });
  } catch {
    /* si el reproductor cambia de API, que no rompa el resto de la pagina */
  }
}

// Cambia el titular y el subtítulo del hero según el perfil del quiz. Si el perfil no define
// `hero` (atajo), la página queda con el titular original de la landing.
function applyHero(hero) {
  if (!hero) return;
  const h1 = document.querySelector('.hero h1');
  if (!h1) return;
  const [first, second] = hero.title;
  h1.replaceChildren(document.createTextNode(first), document.createElement('br'), el('span', { class: 'gold', text: second }));
  const sub = h1.nextElementSibling;
  if (sub && sub.tagName === 'P') sub.textContent = hero.subtitle;
}

function init() {
  const bridge = readBridge();
  if (!bridge) return;

  applyHero(RESULTS[bridge.pattern].hero);

  // 1. Resultado encima del reproductor y detalle debajo (dentro del hero).
  const anchor = document.querySelector('.hero .vsl-outer') || document.querySelector('.vsl-outer');
  let shown = false;
  if (anchor && anchor.parentNode) {
    anchor.parentNode.insertBefore(buildChip(bridge), anchor);
    anchor.parentNode.insertBefore(buildDetail(bridge), anchor.nextSibling);
    shown = true;
  }

  // 2. Enlaces de compra: patrón + sesión + atribución (utm_* y fbclid) intactos.
  const attribution = { ...getAttribution(), ...extractAttribution(window.location.search) };
  document.querySelectorAll('a[href*="myshopify.com"]').forEach((link) => {
    link.setAttribute('href', decorateShopifyUrl(link.getAttribute('href'), { bridge, attribution }));
  });

  // 3. Eventos. `utm_content` identifica el anuncio; es independiente de `pattern` (resultado
  // del quiz) y de `qsid` (sesión) — no se reemplazan entre sí, viajan los tres.
  const base = { qsid: bridge.qsid || 'none', pattern: bridge.pattern, utm_content: attribution.utm_content || 'none' };
  if (shown) {
    track('bridge_view', { ...base, intensity: bridge.intensity || 'none', goal: bridge.goal || 'none' });
  }
  initVslTracking(base);
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
