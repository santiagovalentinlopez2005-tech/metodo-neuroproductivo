// Interfaz: dibuja la vista que emite el motor (hook, preguntas, pausa, entrada y resultado)
// y traduce toques en llamadas al motor. Todo el texto entra como texto, nunca como HTML.

import { FLOW, LIKERT_PROMPT, UI } from './content.js';
import { buildCycleDiagram } from './diagram.js';
import { el, prefersReducedMotion } from './dom.js';
import { buildResult } from './result.js';

const ARROW_BACK =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function mountUI({ root, engine, config }) {
  let token = 0; // invalida renders pendientes cuando llega uno más nuevo

  // ── Estructura fija ─────────────────────────────────────────────────────────
  const backButton = el('button', { class: 'mnq-back', type: 'button', 'aria-label': UI.back, onclick: () => engine.back() });
  backButton.insertAdjacentHTML('afterbegin', ARROW_BACK); // SVG estático propio, sin datos externos
  const counter = el('span', { class: 'mnq-counter' });
  // Barra de avance: decorativa (el avance ya lo dice «Pregunta X de 10», que se anuncia al lector de pantalla).
  const progressFill = el('span', { class: 'mnq-progress__fill' });
  const progress = el('div', { class: 'mnq-progress', 'aria-hidden': 'true' }, progressFill);
  progress.hidden = true;
  const header = el(
    'header',
    { class: 'mnq-header' },
    backButton,
    el('p', { class: 'mnq-brand' }, `${UI.brand.first} `, el('span', { text: UI.brand.second })),
    counter,
    progress,
  );
  const main = el('main', { class: 'mnq-main', id: 'mnq-main' });
  const ctaHost = el('div', { class: 'mnq-cta-host' });
  const live = el('div', { class: 'mnq-visually-hidden', 'aria-live': 'polite', 'aria-atomic': 'true' });
  root.replaceChildren(header, main, ctaHost, live);

  // ── Pantallas ───────────────────────────────────────────────────────────────

  function hookScreen() {
    return el(
      'section',
      { class: 'mnq-screen mnq-hook' },
      el('p', { class: 'mnq-kicker', text: UI.hook.kicker }),
      el('h1', { class: 'mnq-title', tabindex: '-1', 'data-focus': '', text: UI.hook.title }),
      el('p', { class: 'mnq-scene', text: UI.hook.scene }),
      el('p', { class: 'mnq-lead', text: UI.hook.lead }),
      el('ul', { class: 'mnq-marks' }, UI.hook.marks.map((mark) => el('li', { text: mark }))),
      config.images.hook
        ? el('img', { class: 'mnq-hook__art', src: config.images.hook, alt: '', width: String(config.imageSizes.hook[0]), height: String(config.imageSizes.hook[1]), decoding: 'async' })
        : null,
      el(
        'div',
        { class: 'mnq-actions' },
        el('button', { class: 'mnq-btn mnq-btn--primary', type: 'button', text: UI.hook.button, onclick: () => engine.start() }),
        el('p', { class: 'mnq-fineprint', text: UI.hook.fineprint }),
      ),
    );
  }

  function pauseScreen() {
    return el(
      'section',
      { class: 'mnq-screen mnq-pause' },
      el('p', { class: 'mnq-eyebrow', text: UI.pause.eyebrow }),
      el('h2', { class: 'mnq-title', tabindex: '-1', 'data-focus': '', text: UI.pause.title }),
      el('p', { class: 'mnq-lead', text: UI.pause.text }),
      el('div', { class: 'mnq-card' }, buildCycleDiagram()),
      el(
        'div',
        { class: 'mnq-actions' },
        el('button', { class: 'mnq-btn mnq-btn--primary', type: 'button', text: UI.pause.button, onclick: () => engine.continue() }),
      ),
    );
  }

  function questionScreen(view) {
    const { question, options, selected } = view;
    const isLikert = question.kind === 'likert';
    let chosen = false;

    const labelId = `mnq-q-${question.id}`;
    const group = el('div', { class: isLikert ? 'mnq-options mnq-options--scale' : 'mnq-options', role: 'radiogroup', 'aria-labelledby': labelId });

    const buttons = options.map((option) => {
      const isSelected = selected !== null && String(selected) === option.id;
      const button = el(
        'button',
        {
          class: isSelected ? 'mnq-option is-selected' : 'mnq-option',
          type: 'button',
          role: 'radio',
          'aria-checked': isSelected ? 'true' : 'false',
          dataset: { option: option.id },
        },
        el('span', { class: 'mnq-option__label', text: option.label }),
        el('span', { class: 'mnq-option__mark', 'aria-hidden': 'true' }),
      );
      button.addEventListener('click', () => {
        if (chosen) return;
        chosen = true;
        buttons.forEach((b) => {
          const on = b === button;
          b.classList.toggle('is-selected', on);
          b.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        window.setTimeout(() => engine.answer(question.id, option.id), config.timing.selectFeedbackMs);
      });
      return button;
    });
    group.append(...buttons);

    const icon = isLikert ? config.icons?.[question.dim] : null;
    const heading = isLikert
      ? [
          icon ? el('img', { class: 'mnq-dim-icon', src: icon.src, alt: '', width: String(icon.w), height: String(icon.h), decoding: 'async' }) : null,
          el('p', { class: 'mnq-eyebrow', text: LIKERT_PROMPT }),
          el('h2', { id: labelId, class: 'mnq-statement', tabindex: '-1', 'data-focus': '', text: question.statement }),
        ]
      : [
          el('h2', { id: labelId, class: 'mnq-title mnq-title--question', tabindex: '-1', 'data-focus': '', text: view.title }),
          question.subtitle ? el('p', { class: 'mnq-subtitle', text: question.subtitle }) : null,
        ];

    return el('section', { class: 'mnq-screen mnq-question', dataset: { question: question.id } }, heading, group);
  }

  function revealScreen(view) {
    const text = view.result && view.result.lowSignal ? UI.revealLow : UI.reveal;
    return el('section', { class: 'mnq-screen mnq-reveal' }, el('p', { class: 'mnq-reveal__text', 'data-focus': '', tabindex: '-1', text }));
  }

  // ── Render con transición ───────────────────────────────────────────────────

  function announce(view, node) {
    const heading = node.querySelector('[data-focus]');
    const parts = [];
    if (view.counter) parts.push(UI.counter(view.counter.n, view.counter.total));
    if (heading) parts.push(heading.textContent);
    live.textContent = parts.join('. ');
  }

  function swap(node, view, { animate }) {
    const current = ++token;
    const old = main.firstElementChild;
    const finish = () => {
      if (current !== token) return;
      main.classList.remove('is-busy');
      main.replaceChildren(node);
      if (animate) node.classList.add('mnq-in');
      window.scrollTo(0, 0);
      const focusTarget = node.querySelector('[data-focus]');
      if (focusTarget) focusTarget.focus({ preventScroll: true });
      announce(view, node);
    };
    if (old && animate && !prefersReducedMotion()) {
      main.classList.add('is-busy');
      old.classList.add('mnq-out');
      window.setTimeout(finish, Math.round(config.timing.transitionMs * 0.6));
    } else {
      finish();
    }
  }

  function setChrome(view) {
    root.dataset.screen = view.kind;
    root.dataset.counter = config.showCounter ? 'on' : 'off';
    backButton.style.visibility = view.canBack ? 'visible' : 'hidden';
    backButton.disabled = !view.canBack;
    counter.textContent = config.showCounter && view.counter ? UI.counter(view.counter.n, view.counter.total) : '';
    setProgress(view);
  }

  // Marca lo ya respondido: en la pregunta 1 un mínimo visible, en la 10 el 90%, y se llena recién en la
  // entrada al resultado («Listo…»). Pausa: las respondidas hasta ahí. Hook y resultado: oculta.
  const QUESTIONS_BEFORE_PAUSE = FLOW.slice(0, FLOW.indexOf('pause')).filter((id) => /^q\d+$/.test(id)).length;
  function setProgress(view) {
    const total = config.totalQuestions;
    let pct = null;
    if (view.kind === 'question') pct = Math.max(6, ((view.counter.n - 1) / total) * 100);
    else if (view.kind === 'pause') pct = (QUESTIONS_BEFORE_PAUSE / total) * 100;
    else if (view.kind === 'result' && view.fresh) pct = 100;
    progress.hidden = !config.showProgress || pct === null;
    if (pct !== null) progressFill.style.width = `${Math.round(pct)}%`;
  }

  function showResult(view, { animate }) {
    progress.hidden = true;
    const landingUrl = engine.getLandingUrl();
    const { node, cta } = buildResult(view, {
      landingUrl,
      onRestart: () => engine.restart(),
      onCtaClick: (event) => {
        const url = engine.ctaClicked();
        const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0;
        if (modified || !url) return; // el navegador sigue su curso normal
        event.preventDefault();
        window.setTimeout(() => window.location.assign(url), config.timing.navigateDelayMs);
      },
    });
    swap(node, view, { animate });
    ctaHost.replaceChildren(cta);
    engine.resultShown();
  }

  function render(view, direction, { first = false } = {}) {
    setChrome(view);
    const animate = !first;
    ctaHost.replaceChildren();

    if (view.kind === 'hook') return swap(hookScreen(), view, { animate });
    if (view.kind === 'pause') return swap(pauseScreen(), view, { animate });
    if (view.kind === 'question') return swap(questionScreen(view), view, { animate });

    // Resultado: si es recién calculado, primero la entrada breve.
    if (view.fresh) {
      swap(revealScreen(view), view, { animate });
      backButton.style.visibility = 'hidden';
      window.setTimeout(() => {
        // Si la persona volvió atrás o salió mientras tanto, este render ya no corresponde.
        const latest = engine.getView();
        if (latest.kind !== 'result') return;
        setChrome(latest);
        showResult(latest, { animate: true });
      }, config.timing.revealMs + Math.round(config.timing.transitionMs * 0.6));
      return undefined;
    }
    return showResult(view, { animate });
  }

  engine.subscribe((view, direction) => render(view, direction));
  render(engine.getView(), 'forward', { first: true });
}
