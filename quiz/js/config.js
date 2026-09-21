// Configuración editable del quiz. Aquí se recalibra el scoring, se apagan funciones
// y se cambian rutas sin tocar la lógica del motor.

export const CONFIG = {
  routes: {
    landing: '/metodo-quiz',
  },

  // [PENDIENTE] URL definitiva de la política de privacidad. Mientras sea null no se
  // muestra ningún enlace (no se inventa ninguna URL).
  privacyUrl: null,

  showCounter: true, // "Pregunta X de 10" (apagable para probar con y sin)
  totalQuestions: 10,

  timing: {
    selectFeedbackMs: 160, // feedback visual al tocar una opción, antes de avanzar
    transitionMs: 240, // transición entre pantallas
    revealMs: 1000, // "Listo. Este es tu patrón principal." antes del resultado
    navigateDelayMs: 200, // margen para que el evento del CTA salga antes de navegar
  },

  storage: {
    progressKey: 'mnq_progress_v1',
    resultKey: 'mnq_result_v1',
    attribKey: 'mnq_attrib_v1',
    progressTtlMs: 6 * 60 * 60 * 1000, // el progreso guardado caduca a las 6 h
  },

  tracking: {
    pixelId: '1586292786039230', // el mismo Meta Pixel de la landing publicada
    // Solo en estos hosts se envían eventos reales a Meta. En cualquier otro host
    // (localhost, previews de Vercel) los eventos se registran en consola.
    productionHosts: ['metodo-neuroproductivoarg-sand.vercel.app'],
  },

  // Rutas de imágenes opcionales. null = no se muestra imagen (por defecto).
  // Se completan cuando existan las ilustraciones generadas (ver prompts de la Fase 1).
  images: {
    hook: null,
    atajo: null,
    arranque: null,
    racha: null,
  },
};

// Parámetros del scoring. Es una hipótesis de segmentación inicial, NO una medición
// validada: se recalibra con datos reales cambiando solo estos valores.
export const SCORING = {
  forcedPoints: 2, // puntos que suma la opción elegida en las preguntas 8 y 9
  intensity: { marcado: 8, presente: 5 }, // por debajo de "presente" = leve
  lowSignalMax: 3, // total del dominante <= 3 → variante "sin patrón marcado"
  secondary: { minTotal: 5, maxGap: 2 }, // condiciones para mostrar el secundario
  echoMinAnswer: 2, // el eco cita ítems respondidos "Seguido" (2) o "Casi siempre" (3)
  echoMax: 2,
};
