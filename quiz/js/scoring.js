// Scoring del quiz (hipótesis de segmentación inicial, NO una medición validada).
// Lógica pura: sin DOM ni almacenamiento, para poder probarla y recalibrarla.
//
// Algoritmo (especificación cerrada de la Fase 1):
//  1. Cada pregunta 2–7 suma 0–3 a su dimensión. Las preguntas 8 y 9 suman +2 a la dimensión
//     de la opción elegida (la opción "d" no suma). Totales por dimensión: 0–10.
//  2. Dominante = dimensión con el total más alto.
//  3. Desempate: (1) dimensión elegida en la pregunta 8 si está entre las empatadas;
//     (2) la elegida en la pregunta 9; (3) la de ítem individual más alto; (4) orden A → B → C.
//  4. Secundario: la mejor de las otras dos (mismo desempate); solo se muestra si su total
//     >= 5 y la diferencia con el dominante <= 2.
//  5. Intensidad según el total del dominante: marcado >= 8 · presente 5–7 · leve <= 4.
//  6. Señal baja: total del dominante <= 3.

import { SCORING } from './config.js';
import { PATTERNS, QUESTIONS } from './content.js';

const LIKERT_QUESTIONS = QUESTIONS.filter((q) => q.kind === 'likert');
const FORCED_QUESTIONS = QUESTIONS.filter((q) => q.kind === 'forced');
const FC1 = FORCED_QUESTIONS.find((q) => q.slot === 'FC1');
const FC2 = FORCED_QUESTIONS.find((q) => q.slot === 'FC2');

function likertValue(answers, question) {
  const raw = answers[question.id];
  if (raw === undefined || raw === null) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

// Dimensión elegida en una pregunta de elección forzada (null si no eligió o eligió "d").
function forcedDim(answers, question) {
  const chosen = answers[question.id];
  if (!chosen) return null;
  const option = question.options.find((o) => o.id === chosen);
  return option ? option.dim : null;
}

export function computeTotals(answers, scoring = SCORING) {
  const totals = Object.fromEntries(PATTERNS.map((p) => [p, 0]));
  for (const q of LIKERT_QUESTIONS) totals[q.dim] += likertValue(answers, q);
  for (const q of FORCED_QUESTIONS) {
    const dim = forcedDim(answers, q);
    if (dim) totals[dim] += scoring.forcedPoints;
  }
  return totals;
}

// Ítem Likert individual más alto de una dimensión (paso 3 del desempate).
function highestSingleLikert(answers, dim) {
  return Math.max(0, ...LIKERT_QUESTIONS.filter((q) => q.dim === dim).map((q) => likertValue(answers, q)));
}

// Resuelve un empate entre `candidates` con la cadena de desempate de la especificación.
export function breakTie(candidates, answers) {
  if (candidates.length === 1) return candidates[0];

  for (const dim of [forcedDim(answers, FC1), forcedDim(answers, FC2)]) {
    if (dim && candidates.includes(dim)) return dim;
  }

  const best = Math.max(...candidates.map((d) => highestSingleLikert(answers, d)));
  const remaining = candidates.filter((d) => highestSingleLikert(answers, d) === best);
  if (remaining.length === 1) return remaining[0];

  return PATTERNS.find((d) => remaining.includes(d)); // orden A → B → C
}

function intensityFor(total, scoring) {
  if (total >= scoring.intensity.marcado) return 'marcado';
  if (total >= scoring.intensity.presente) return 'presente';
  return 'leve';
}

// Ítems del dominante respondidos "Seguido" o "Casi siempre", los más altos primero (máx. 2).
function echoItems(answers, dim, scoring) {
  return LIKERT_QUESTIONS.filter((q) => q.dim === dim)
    .map((q, order) => ({ q, order, value: likertValue(answers, q) }))
    .filter((x) => x.value >= scoring.echoMinAnswer)
    .sort((x, y) => y.value - x.value || x.order - y.order)
    .slice(0, scoring.echoMax)
    .map((x) => x.q.item);
}

export function computeResult(answers, scoring = SCORING) {
  const totals = computeTotals(answers, scoring);

  const top = Math.max(...PATTERNS.map((p) => totals[p]));
  const pattern = breakTie(
    PATTERNS.filter((p) => totals[p] === top),
    answers,
  );

  const others = PATTERNS.filter((p) => p !== pattern);
  const topOther = Math.max(...others.map((p) => totals[p]));
  const secondCandidate = breakTie(
    others.filter((p) => totals[p] === topOther),
    answers,
  );
  const showSecondary =
    totals[secondCandidate] >= scoring.secondary.minTotal && top - totals[secondCandidate] <= scoring.secondary.maxGap;

  const lowSignal = top <= scoring.lowSignalMax;

  return {
    totals, // solo para pruebas y recalibración: NUNCA se muestra al usuario
    pattern,
    secondary: showSecondary ? secondCandidate : null,
    intensity: intensityFor(top, scoring),
    lowSignal,
    ctx: answers.q1 ?? null,
    goal: answers.q10 ?? null,
    echoItems: lowSignal ? [] : echoItems(answers, pattern, scoring),
  };
}
