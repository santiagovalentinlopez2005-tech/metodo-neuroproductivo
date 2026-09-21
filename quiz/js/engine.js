// Motor del quiz: estado, navegación, respuestas, orden aleatorio, persistencia y eventos.
// No conoce el DOM: emite "vistas" (qué pantalla mostrar) y la interfaz las dibuja.

import { computeResult } from './scoring.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffled(items, seed) {
  const rand = mulberry32(seed);
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function createEngine({
  questions,
  flow,
  likertOptions,
  config,
  storage, // { local, session }
  tracking, // { track }
  handoff, // { generateQsid, buildLandingUrl, getAttribution }
  now = () => Date.now(),
  seed = null,
}) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const questionIds = flow.filter((id) => byId.has(id));
  const listeners = new Set();

  function newState() {
    return {
      index: 0,
      answers: {},
      seed: seed ?? (Math.floor(Math.random() * 4294967295) >>> 0),
      qsid: handoff.generateQsid(),
      started: false,
      completed: false,
      result: null,
      freshResult: false,
      sent: { completion: false, resultView: false, abandon: false },
      startedAt: null,
      shownAt: now(),
    };
  }

  let state = newState();

  // ── Opciones y textos resueltos ─────────────────────────────────────────────

  function optionsFor(question) {
    if (question.kind === 'likert') return likertOptions;
    if (question.kind === 'forced') {
      const movable = question.options.filter((o) => question.shuffle.includes(o.id));
      const fixed = question.options.filter((o) => !question.shuffle.includes(o.id));
      return [...shuffled(movable, state.seed ^ hashString(question.id)), ...fixed];
    }
    return question.options;
  }

  function isValidAnswer(question, value) {
    const id = String(value);
    if (question.kind === 'likert') return likertOptions.some((o) => o.id === id);
    return question.options.some((o) => o.id === id);
  }

  function titleFor(question) {
    if (typeof question.title === 'function') return question.title(state.answers.q1);
    return question.title || null;
  }

  function view() {
    const id = flow[state.index];
    if (id === 'hook') return { kind: 'hook', id, canBack: false, counter: null };
    if (id === 'pause') return { kind: 'pause', id, canBack: true, counter: null };
    if (id === 'result') {
      return {
        kind: 'result',
        id,
        canBack: true,
        counter: null,
        result: state.result,
        fresh: state.freshResult,
        ctx: state.answers.q1 ?? null,
      };
    }
    const question = byId.get(id);
    return {
      kind: 'question',
      id,
      question,
      title: titleFor(question),
      options: optionsFor(question),
      selected: state.answers[id] ?? null,
      canBack: true,
      counter: { n: questionIds.indexOf(id) + 1, total: config.totalQuestions },
    };
  }

  function emit(direction) {
    const v = view();
    listeners.forEach((fn) => fn(v, direction));
  }

  // ── Persistencia ────────────────────────────────────────────────────────────

  function persist() {
    if (!state.started) return;
    storage.local.setJSON(config.storage.progressKey, {
      v: 1,
      ts: now(),
      seed: state.seed,
      qsid: state.qsid,
      index: state.index,
      answers: state.answers,
      started: state.started,
      completed: state.completed,
      sent: state.sent,
    });
  }

  function saveResultForBridge() {
    if (!state.result) return;
    const { pattern, secondary, intensity, goal } = state.result;
    storage.session.setJSON(config.storage.resultKey, { pattern, secondary, intensity, goal, qsid: state.qsid });
  }

  function restore() {
    const saved = storage.local.getJSON(config.storage.progressKey);
    if (!saved || saved.v !== 1 || typeof saved.answers !== 'object' || saved.answers === null) return false;
    if (now() - saved.ts > config.storage.progressTtlMs) {
      storage.local.remove(config.storage.progressKey);
      return false;
    }
    if (!Number.isInteger(saved.index) || saved.index < 1 || saved.index >= flow.length) return false;

    // Todas las respuestas guardadas deben ser válidas; si no, se descarta el estado completo.
    for (const [qid, value] of Object.entries(saved.answers)) {
      const q = byId.get(qid);
      if (!q || !isValidAnswer(q, value)) {
        storage.local.remove(config.storage.progressKey);
        return false;
      }
    }

    state = {
      ...newState(),
      seed: Number.isInteger(saved.seed) ? saved.seed >>> 0 : state.seed,
      qsid: typeof saved.qsid === 'string' && saved.qsid ? saved.qsid : state.qsid,
      index: saved.index,
      answers: Object.fromEntries(Object.entries(saved.answers).map(([k, v]) => [k, String(v)])),
      started: true,
      completed: Boolean(saved.completed),
      sent: { completion: false, resultView: false, abandon: false, ...(saved.sent || {}) },
    };

    if (flow[state.index] === 'result') {
      state.result = computeResult(state.answers);
      state.completed = true;
      state.freshResult = false;
      saveResultForBridge();
    }
    return true;
  }

  // ── Navegación ──────────────────────────────────────────────────────────────

  function goTo(index, direction) {
    state.index = index;
    state.shownAt = now();
    if (flow[index] === 'result') {
      state.result = computeResult(state.answers);
      state.completed = true;
      state.freshResult = true;
      saveResultForBridge();
      if (!state.sent.completion) {
        state.sent.completion = true;
        tracking.track('quiz_completion', {
          qsid: state.qsid,
          total_ms: state.startedAt ? now() - state.startedAt : null,
        });
      }
    } else {
      state.completed = false;
      state.freshResult = false;
    }
    persist();
    emit(direction);
  }

  const api = {
    getView: view,
    getState: () => state,

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    restore,

    start() {
      if (flow[state.index] !== 'hook') return;
      state.started = true;
      state.startedAt = now();
      tracking.track('quiz_start', { qsid: state.qsid });
      goTo(1, 'forward');
    },

    answer(questionId, value) {
      if (flow[state.index] !== questionId) return; // respuesta de una pantalla que ya no está
      const question = byId.get(questionId);
      if (!question || !isValidAnswer(question, value)) return;
      const chosen = String(value);
      state.answers[questionId] = chosen;
      tracking.track('quiz_question_answer', {
        qsid: state.qsid,
        question_id: questionId,
        option_id: chosen,
        index: questionIds.indexOf(questionId) + 1,
        ms_on_screen: now() - state.shownAt,
      });
      goTo(state.index + 1, 'forward');
    },

    // Botón "Seguir" de la pantalla de pausa.
    continue() {
      if (flow[state.index] !== 'pause') return;
      tracking.track('quiz_pause_continue', { qsid: state.qsid });
      goTo(state.index + 1, 'forward');
    },

    back() {
      if (state.index <= 1) return; // desde la primera pregunta no se vuelve al hook
      goTo(state.index - 1, 'back');
    },

    // La interfaz avisa cuando el resultado quedó visible (después de la entrada breve).
    resultShown() {
      if (flow[state.index] !== 'result' || !state.result) return;
      state.freshResult = false;
      if (!state.sent.resultView) {
        state.sent.resultView = true;
        const { pattern, secondary, intensity, lowSignal, goal, ctx } = state.result;
        tracking.track('result_view', {
          qsid: state.qsid,
          pattern,
          secondary: secondary || 'none',
          intensity,
          low_signal: lowSignal,
          goal: goal || 'none',
          ctx: ctx || 'none',
        });
        tracking.track(`result_profile_${pattern}`, { qsid: state.qsid, intensity });
      }
      persist();
    },

    // Devuelve la URL de la landing y registra el clic.
    ctaClicked() {
      if (!state.result) return null;
      tracking.track('result_cta_click', {
        qsid: state.qsid,
        pattern: state.result.pattern,
        intensity: state.result.intensity,
      });
      return handoff.buildLandingUrl({
        result: state.result,
        qsid: state.qsid,
        attribution: handoff.getAttribution(),
      });
    },

    getLandingUrl() {
      if (!state.result) return null;
      return handoff.buildLandingUrl({
        result: state.result,
        qsid: state.qsid,
        attribution: handoff.getAttribution(),
      });
    },

    // "Repetir el test": borra el estado anterior (progreso guardado, resultado de respaldo para
    // la landing, respuestas, semilla y sesión) y vuelve al hook como en una visita nueva. La
    // atribución del anuncio (utm_* y fbclid) se conserva porque sigue siendo la misma visita.
    restart() {
      const previousQsid = state.qsid;
      storage.local.remove(config.storage.progressKey);
      storage.session.remove(config.storage.resultKey);
      tracking.track('quiz_restart', { qsid: previousQsid });
      state = newState();
      emit('back');
    },

    // Mejor esfuerzo: la persona se va a mitad del quiz.
    abandon() {
      if (!state.started || state.completed || state.sent.abandon) return;
      state.sent.abandon = true;
      const id = flow[state.index];
      tracking.track('quiz_abandon', { qsid: state.qsid, last_question_id: id });
      persist();
    },
  };

  return api;
}
