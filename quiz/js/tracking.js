// Eventos hacia el Meta Pixel (los mismos del sitio publicado). No lleva ningún dato personal.
// Solo se envían eventos reales en los hosts de producción; en cualquier otro host
// (localhost, previews de Vercel) se registran en consola y en window.__mnqEvents.

import { CONFIG } from './config.js';

// Nombre canónico (especificación) → nombre del evento personalizado en el Pixel.
export const EVENT_NAMES = {
  quiz_start: 'QuizStart',
  quiz_question_answer: 'QuizAnswer',
  quiz_pause_continue: 'QuizPauseContinue',
  quiz_completion: 'QuizComplete',
  result_view: 'ResultView',
  result_profile_atajo: 'ResultProfileAtajo',
  result_profile_arranque: 'ResultProfileArranque',
  result_profile_racha: 'ResultProfileRacha',
  result_cta_click: 'ResultCtaClick',
  quiz_abandon: 'QuizAbandon',
  quiz_restart: 'QuizRestart', // agregado con el botón "Repetir el test" (no figuraba en la especificación)
  bridge_view: 'BridgeView',
  landing_cta_click: 'LandingCtaClick',
};

function hasWindow() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function isProductionHost() {
  return hasWindow() && CONFIG.tracking.productionHosts.includes(window.location.hostname);
}

function loadPixelBaseCode() {
  // Código base estándar del Pixel de Meta.
  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
}

// Inicializa el Pixel y dispara PageView (solo en producción y solo si la página no lo trae ya).
export function initTracking() {
  if (!hasWindow()) return;
  window.__mnqEvents = window.__mnqEvents || [];
  if (!isProductionHost()) return;
  if (typeof window.fbq !== 'function') {
    loadPixelBaseCode();
    window.fbq('init', CONFIG.tracking.pixelId);
    window.fbq('track', 'PageView');
  }
}

export function track(name, params = {}) {
  const pixelName = EVENT_NAMES[name];
  if (!pixelName) return;

  if (hasWindow()) {
    window.__mnqEvents = window.__mnqEvents || [];
    if (!isProductionHost()) {
      window.__mnqEvents.push({ name, pixelName, params });
      if (typeof console !== 'undefined') console.debug('[mnq]', pixelName, params);
      return;
    }
    if (typeof window.fbq === 'function') window.fbq('trackCustom', pixelName, params);
  }
}
