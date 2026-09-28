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

  const [artW, artH] = CONFIG.imageSizes?.[result.pattern] || [];
  const art = CONFIG.images[result.pattern]
    ? el('img', {
        class: 'mnq-result__art',
        src: CONFIG.images[result.pattern],
        alt: '',
        decoding: 'async',
        ...(artW && artH ? { width: String(artW), height: String(artH) } : {}),
      })
    : null;

  const secondaryCard = result.secondary
    ? el('aside', { class: 'mnq-secondary' }, el('p', { text: RESULTS[result.secondary].secondaryCard }))
    : null;

  const goalLine =
    result.goal && GOAL_TEXT[result.goal]
      ? el('p', { class: 'mnq-goal', text: RESULT_UI.goalLine(GOAL_TEXT[result.goal].label, GOAL_TEXT[result.goal].tool, GOAL_TEXT[result.goal].plural) })
      : null;

  // Bloques opcionales (CONFIG.result): por defecto apagados para que el resultado sea corto.
  const show = CONFIG.result || {};
  const cycleCard = show.showCycle
    ? el(
        'section',
        { class: 'mnq-card mnq-cycle-card' },
        buildCycleDiagram({ primary: result.pattern, secondary: result.secondary }),
        el('p', { class: 'mnq-cycle-card__caption', text: RESULT_UI.cycleCaption(content.node) }),
      )
    : null;

  // Plegable: título visible, contenido al tocarlo.
  const fold = (title, ...content) =>
    el('details', { class: 'mnq-block mnq-why' }, el('summary', { class: 'mnq-why__summary', text: title }), ...content);

  // «En el video vas a ver»: la razón para tocar el botón, destacada y arriba. Cada punto está en el
  // guion de la VSL (el video es el mismo para los 3 perfiles; cambia qué parte se destaca).
  const videoCard = el(
    'section',
    { class: 'mnq-block mnq-video' },
    el('h2', { class: 'mnq-block__title mnq-video__title' }, el('span', { class: 'mnq-video__play', 'aria-hidden': 'true' }), RESULT_UI.sections.video),
    el('ul', { class: 'mnq-list mnq-video__list' }, content.video.map((line) => el('li', { text: line }))),
  );

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
      el('p', { class: 'mnq-kicker', text: result.lowSignal ? RESULT_UI.kickerLow : RESULT_UI.kicker }),
      el('h1', { class: 'mnq-result__name', tabindex: '-1', 'data-focus': '', text: content.name }),
      el('p', { class: 'mnq-result__descriptor', text: content.descriptor }),
      buildMeter(result.intensity),
    ),
    art,
    el('p', { class: 'mnq-result__intro', text: content.intro[result.intensity] }),
    videoCard,
    section(
      RESULT_UI.sections.seen,
      el('ul', { class: 'mnq-list' }, content.seen.map((line) => el('li', { text: line }))),
      show.showEcho ? echoLine(result.echoItems) : null,
    ),
    cycleCard,
    secondaryCard,
    // Apagados por defecto (CONFIG.result): el objetivo de esta pantalla es que toque el video.
    // La línea del objetivo se sigue viendo en la landing, debajo del video.
    show.showFirstStep ? section(RESULT_UI.sections.firstStep, el('p', { text: firstStep })) : null,
    show.showGoal && goalLine ? el('section', { class: 'mnq-block mnq-goal-block' }, goalLine) : null,
    show.showDetails ? fold(RESULT_UI.sections.method, el('p', {}, rich(content.method))) : null,
    show.showDetails ? fold(RESULT_UI.sections.why, el('p', { text: content.happening }), el('p', { text: content.loop })) : null,
    el(
      'div',
      { class: 'mnq-restart' },
      el('button', { class: 'mnq-restart__link', type: 'button', text: RESULT_UI.restart, onclick: onRestart }),
    ),
    el('footer', { class: 'mnq-result__foot' }, el('p', { class: 'mnq-disclaimer', text: RESULT_UI.disclaimer }), privacy),
  );

  const cta = el(
    'div',
    { class: 'mnq-cta-bar' },
    el('a', {
      class: 'mnq-btn mnq-btn--primary',
      href: landingUrl,
      text: content.cta || RESULT_UI.cta.button, // lo que gana, según el perfil
      onclick: onCtaClick,
    }),
    el('p', { class: 'mnq-microcopy', text: RESULT_UI.cta.microcopy }),
  );

  return { node, cta };
}
