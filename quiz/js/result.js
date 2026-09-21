// Pantalla de resultado: arma el contenido según patrón, intensidad, secundario, objetivo,
// contexto y señal baja. Los textos vienen de content.js; aquí solo se combinan.

import { CONFIG } from './config.js';
import {
  CONTEXT_EXAMPLE,
  GOAL_TEXT,
  INTENSITIES,
  INTENSITY_LABEL,
  QUESTIONS,
  RESULTS,
  RESULT_UI,
} from './content.js';
import { buildCycleDiagram } from './diagram.js';
import { el, rich } from './dom.js';

const ECHO_BY_ITEM = Object.fromEntries(QUESTIONS.filter((q) => q.kind === 'likert').map((q) => [q.item, q.echo]));

function buildMeter(intensity) {
  const level = INTENSITIES.indexOf(intensity) + 1; // leve=1 · presente=2 · marcado=3
  const segments = INTENSITIES.map((_, i) => el('span', { class: i < level ? 'mnq-meter__seg is-on' : 'mnq-meter__seg' }));
  const labels = INTENSITIES.map((key) =>
    el('li', { class: key === intensity ? 'is-active' : null, text: INTENSITY_LABEL[key] }),
  );
  return el(
    'div',
    { class: 'mnq-meter', role: 'img', 'aria-label': `${RESULT_UI.intensityCaption}: ${INTENSITY_LABEL[intensity]}` },
    el('p', { class: 'mnq-meter__caption', text: RESULT_UI.intensityCaption }),
    el('div', { class: 'mnq-meter__bar' }, segments),
    el('ul', { class: 'mnq-meter__labels' }, labels),
  );
}

function section(title, ...content) {
  return el('section', { class: 'mnq-block' }, el('h2', { class: 'mnq-block__title', text: title }), ...content);
}

function echoLine(items) {
  const phrases = items.map((item) => ECHO_BY_ITEM[item]).filter(Boolean);
  if (!phrases.length) return null;
  const { prefix, joiner, suffix } = RESULT_UI.echo;
  return el('p', { class: 'mnq-echo', text: `${prefix}${phrases.join(joiner)}${suffix}` });
}

// Devuelve { node, cta }: `node` es el contenido con scroll y `cta` la barra fija inferior.
export function buildResult(view, { landingUrl, onCtaClick, onRestart }) {
  const { result, ctx } = view;
  const content = RESULTS[result.pattern];

  const example = CONTEXT_EXAMPLE[ctx] || CONTEXT_EXAMPLE.otro;
  const firstStep = content.firstStep.replace('{ejemplo}', example);

  const art = CONFIG.images[result.pattern]
    ? el('img', { class: 'mnq-result__art', src: CONFIG.images[result.pattern], alt: '', loading: 'lazy' })
    : null;

  const secondaryCard = result.secondary
    ? el('aside', { class: 'mnq-secondary' }, el('p', { text: RESULTS[result.secondary].secondaryCard }))
    : null;

  const goalLine =
    result.goal && GOAL_TEXT[result.goal]
      ? el('p', { class: 'mnq-goal', text: RESULT_UI.goalLine(GOAL_TEXT[result.goal].label, GOAL_TEXT[result.goal].tool) })
      : null;

  const privacy = CONFIG.privacyUrl
    ? el('a', { class: 'mnq-privacy', href: CONFIG.privacyUrl, text: RESULT_UI.privacyLabel })
    : null;

  const node = el(
    'article',
    { class: 'mnq-screen mnq-result', dataset: { pattern: result.pattern } },
    result.lowSignal ? el('p', { class: 'mnq-note', text: RESULT_UI.lowSignal }) : null,
    el(
      'header',
      { class: 'mnq-result__head' },
      el('p', { class: 'mnq-kicker', text: RESULT_UI.kicker }),
      el('h1', { class: 'mnq-result__name', tabindex: '-1', 'data-focus': '', text: content.name }),
      el('p', { class: 'mnq-result__descriptor', text: content.descriptor }),
      buildMeter(result.intensity),
    ),
    art,
    el(
      'section',
      { class: 'mnq-card mnq-cycle-card' },
      buildCycleDiagram({ primary: result.pattern, secondary: result.secondary }),
      el('p', { class: 'mnq-cycle-card__caption', text: RESULT_UI.cycleCaption(content.node) }),
    ),
    secondaryCard,
    section(
      RESULT_UI.sections.happening,
      el('p', { class: 'mnq-lead-strong', text: content.intro[result.intensity] }),
      el('p', { text: content.happening }),
    ),
    section(
      RESULT_UI.sections.seen,
      el('ul', { class: 'mnq-list' }, content.seen.map((line) => el('li', { text: line }))),
      echoLine(result.echoItems),
    ),
    section(RESULT_UI.sections.loop, el('p', { text: content.loop })),
    section(RESULT_UI.sections.firstStep, el('p', { text: firstStep })),
    section(RESULT_UI.sections.method, el('p', {}, rich(content.method)), goalLine),
    el(
      'div',
      { class: 'mnq-restart' },
      el('button', { class: 'mnq-btn mnq-btn--ghost', type: 'button', text: RESULT_UI.restart, onclick: onRestart }),
    ),
    el('footer', { class: 'mnq-result__foot' }, el('p', { class: 'mnq-disclaimer', text: RESULT_UI.disclaimer }), privacy),
  );

  const cta = el(
    'div',
    { class: 'mnq-cta-bar' },
    el('a', {
      class: 'mnq-btn mnq-btn--primary',
      href: landingUrl,
      text: RESULT_UI.cta.button,
      onclick: onCtaClick,
    }),
    el('p', { class: 'mnq-microcopy', text: RESULT_UI.cta.microcopy }),
  );

  return { node, cta };
}
