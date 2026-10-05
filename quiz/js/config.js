// Configuración editable del quiz. Aquí se recalibra el scoring, se apagan funciones
// y se cambian rutas sin tocar la lógica del motor.

export const CONFIG = {
  routes: {
    landing: '/metodo-quiz',
  },

  // Order bumps de la landing /metodo-quiz (hasta 2). Cada uno tiene que existir como producto en Shopify:
  // pegá acá el ID numérico de su VARIANTE. Mientras `variantId` sea null el bump no se muestra.
  // Los precios son los de Shopify; se usan solo para mostrar el total (el cobro lo hace el checkout).
  bumpsBasePrice: 9500,
  bumps: [
    {
      variantId: '67625610281039',
      name: 'Sistema Anticaos Digital',
      description: 'Limpiá tu celular y tu escritorio en 55 minutos para que enfocarte sea más fácil.',
      price: 2490,
      image: '/quiz/img/bump-anticaos.webp',
    },
    {
      variantId: '67625660579919',
      name: 'Protocolo de Reinicio',
      description: '¿Fallaste un día y se volvió una semana? Volvé al método en 5 minutos, sin culpa y sin empezar de cero.',
      price: 1990,
      image: '/quiz/img/bump-reinicio.webp',
    },
  ],

  // [PENDIENTE] URL definitiva de la política de privacidad. Mientras sea null no se
  // muestra ningún enlace (no se inventa ninguna URL).
  privacyUrl: null,

  showCounter: true, // "Pregunta X de 10" (apagable para probar con y sin)
  showProgress: true, // barra dorada de avance debajo del encabezado (preguntas y pausa)
  totalQuestions: 10,

  timing: {
    selectFeedbackMs: 160, // feedback visual al tocar una opción, antes de avanzar
    transitionMs: 240, // transición entre pantallas
    revealMs: 1800, // "Listo. Este es tu patrón principal." antes del resultado
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
    productionHosts: ['metodo-neuroproductivoarg-sand.vercel.app', 'metodo-neuroproductivoar.vercel.app'],
  },

  // Rutas de imágenes opcionales. null = no se muestra imagen (por defecto).
  // Se completan cuando existan las ilustraciones generadas (ver prompts de la Fase 1).
  images: {
    hook: '/quiz/img/hook.webp',
    atajo: '/quiz/img/result-atajo.webp',
    arranque: '/quiz/img/result-arranque.webp',
    racha: '/quiz/img/result-racha.webp',
  },

  // Pantalla de resultado: bloques opcionales. Apagados para que el resultado sea corto y lo más
  // convincente («Cómo se suele ver») quede arriba; se pueden volver a prender para probar.
  result: {
    showEcho: false, // «Según tus respuestas, te pasa seguido que…» (repetía las viñetas de arriba)
    showCycle: false, // diagrama Distraerte · Arrancar · Sostener (ya se ve en la pausa)
    showFirstStep: false, // «Por dónde empezar hoy» (un consejo gratis puede restarle ganas de ver el video)
    showGoal: false, // «Lo que elegiste cambiar primero…» (se ve en la landing, debajo del video)
    showDetails: false, // plegables «Cómo te ayuda el Método» y «Por qué suele pasar» (el porqué lo cuenta el video)
  },

  // Tamaño real de cada imagen (ancho, alto): reserva el espacio y evita saltos de diseño al cargar.
  imageSizes: {
    hook: [900, 675],
    atajo: [800, 600],
    arranque: [800, 600],
    racha: [800, 280],
  },

  // Ícono chico por dimensión, arriba de cada afirmación de escala (preguntas 2 a 7).
  // { src, w, h }: el tamaño evita saltos de diseño al cargar.
  icons: {
    atajo: { src: '/quiz/img/icon-atajo.webp', w: 256, h: 256 },
    arranque: { src: '/quiz/img/icon-arranque.webp', w: 256, h: 255 },
    racha: { src: '/quiz/img/icon-racha.webp', w: 480, h: 192 },
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
