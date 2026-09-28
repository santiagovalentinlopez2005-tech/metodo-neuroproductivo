// TODO el contenido del quiz vive aquí: preguntas, opciones, textos de pantallas,
// resultados de cada perfil y texto del bloque puente. Para cambiar un texto no hace
// falta tocar el motor ni el scoring.
//
// Reglas de redacción (Fase 1): patrones de comportamiento, nunca diagnósticos; verbos
// de conducta ("te pasa", "aparece", "suele"), nunca "sos un/a…"; sin "dopamina" ni
// "circuito de recompensa" (ese vocabulario es de la VSL); sin porcentajes ni números.

// Texto enriquecido mínimo: un string es texto plano y { b: '…' } es negrita.
const b = (text) => ({ b: text });

export const PATTERNS = ['atajo', 'arranque', 'racha']; // orden de desempate final: A → B → C
export const INTENSITIES = ['leve', 'presente', 'marcado'];
export const CONTEXTS = ['estudio', 'trabajo', 'ambos', 'proyecto', 'otro'];
export const GOALS = ['arrancar', 'foco', 'plazos', 'culpa', 'progreso'];

// Palabras simples, no de escala médica. Los ids internos (leve/presente/marcado) no cambian.
export const INTENSITY_LABEL = { leve: 'Bajo', presente: 'Medio', marcado: 'Alto' };

// ── Contexto (pregunta 1) ─────────────────────────────────────────────────────

export const CONTEXT_LABEL = {
  estudio: 'Estudio',
  trabajo: 'Trabajo',
  ambos: 'Estudio y trabajo',
  proyecto: 'Tengo un proyecto o emprendimiento propio',
  otro: 'Otra situación',
};

// Verbo de la pregunta 8 según el contexto.
export const CONTEXT_VERB = {
  estudio: 'estudiar',
  trabajo: 'trabajar',
  ambos: 'estudiar o trabajar',
  proyecto: 'avanzar con tu proyecto',
  otro: 'hacer algo importante',
};

// Ejemplo del micro-paso del perfil Arranque Trabado según el contexto.
export const CONTEXT_EXAMPLE = {
  estudio: 'abrir el apunte y leer el primer párrafo',
  trabajo: 'abrir el archivo y escribir el título',
  ambos: 'abrir el material y escribir la primera línea',
  proyecto: 'abrir el documento del proyecto y escribir la primera línea',
  otro: 'abrir lo que necesitás y hacer la primera acción',
};

// ── Objetivo (pregunta 10) ────────────────────────────────────────────────────
// `plural`: si `tool` nombra varias cosas, la frase del resultado dice «ayudan» en vez de «ayuda».

export const GOAL_TEXT = {
  arrancar: {
    label: 'Empezar sin pelearme conmigo',
    tool: 'la Guía de Enfoque de 5\u00a0Minutos y el Sistema Diario de Ejecución',
    plural: true,
  },
  foco: {
    label: 'Mantener el foco durante horas',
    tool: 'la Guía de Enfoque de 5\u00a0Minutos, para concentrarte rápido, y la Guía Central, que te enseña a trabajar por tramos sin distraerte',
    plural: true,
  },
  plazos: {
    label: 'Terminar antes de la fecha límite',
    tool: 'el Sistema Diario de Ejecución y el Sistema de Planificación de 14\u00a0Días',
    plural: true,
  },
  culpa: {
    label: 'Dejar de sentir culpa al final del día',
    tool: 'el Cierre y Reflexión del Sistema Diario de Ejecución, que te lleva a reconocer lo que avanzaste en el día, por chico que sea',
    plural: false,
  },
  progreso: {
    label: 'Ver que estoy avanzando de verdad',
    tool: 'el Panel de Progreso, que te muestra en gráficos cuánto avanzás cada día',
    plural: false,
  },
};

// ── Escala de frecuencia (preguntas 2 a 7) ────────────────────────────────────

export const LIKERT_PROMPT = '¿Qué tan seguido te pasa esto?'; // frecuencia, igual que las opciones
export const LIKERT_OPTIONS = [
  { id: '0', label: 'Casi nunca', points: 0 },
  { id: '1', label: 'A veces', points: 1 },
  { id: '2', label: 'Seguido', points: 2 },
  { id: '3', label: 'Casi siempre', points: 3 },
];

// ── Preguntas ─────────────────────────────────────────────────────────────────
// kind: 'single' (no puntúa) · 'likert' (0–3 a su dimensión) · 'forced' (+2 a la opción elegida)

export const QUESTIONS = [
  {
    id: 'q1',
    kind: 'single',
    role: 'context',
    title: '¿Qué describe mejor tu día a día ahora?',
    subtitle: 'Lo usamos para adaptar algunas preguntas y ejemplos.',
    options: CONTEXTS.map((id) => ({ id, label: CONTEXT_LABEL[id] })),
  },
  {
    id: 'q2',
    kind: 'likert',
    item: 'A1',
    dim: 'atajo',
    statement: 'Entro al celular «un segundo» y, cuando me doy cuenta, pasó mucho más tiempo del que pensaba.',
    echo: 'el celular se come más tiempo del que pensabas',
  },
  {
    id: 'q3',
    kind: 'likert',
    item: 'B1',
    dim: 'arranque',
    statement: 'Tengo la tarea enfrente y no tengo claro cuál sería el primer paso concreto.',
    echo: 'no tenés claro el primer paso concreto',
  },
  {
    id: 'q4',
    kind: 'likert',
    item: 'C1',
    dim: 'racha',
    statement: 'Arranco con muchas ganas, pero a los pocos días pierdo el ritmo.',
    echo: 'arrancás con ganas y a los pocos días perdés el ritmo',
  },
  {
    id: 'q5',
    kind: 'likert',
    item: 'A2',
    dim: 'atajo',
    statement:
      'Antes de hacer algo que me cuesta, busco algo más fácil o más lindo (redes, series, comida) para sentirme mejor primero.',
    echo: 'primero hacés lo fácil o lo lindo para sentirte mejor',
  },
  {
    id: 'q6',
    kind: 'likert',
    item: 'B2',
    dim: 'arranque',
    statement: 'Tengo tantas cosas pendientes que todo me parece urgente y no sé por cuál empezar.',
    echo: 'todo parece urgente y no sabés por dónde empezar',
  },
  {
    id: 'q7',
    kind: 'likert',
    item: 'C2',
    dim: 'racha',
    statement: 'Si un día no cumplo lo que me propuse, tiendo a abandonar todo el plan.',
    echo: 'después de un día sin cumplir, abandonás todo el plan',
  },
  {
    id: 'q8',
    kind: 'forced',
    slot: 'FC1',
    title: (ctx) => `Te sentás a ${CONTEXT_VERB[ctx] || CONTEXT_VERB.otro}. ¿Qué suele pasarte?`,
    options: [
      { id: 'a', dim: 'atajo', label: 'Me llama algo más fácil o más entretenido (celular, redes, otra cosa).' },
      { id: 'b', dim: 'arranque', label: 'Miro lo que tengo que hacer y no sé cómo arrancar.' },
      { id: 'c', dim: 'racha', label: 'Arranco bien, pero después me cuesta mantener el ritmo.' },
      { id: 'd', dim: null, label: 'Casi siempre arranco y lo sostengo sin problema.' },
    ],
    shuffle: ['a', 'b', 'c'], // "d" siempre queda última
  },
  {
    id: 'q9',
    kind: 'forced',
    slot: 'FC2',
    title: () => 'Pensá en las veces que intentaste ser más constante. ¿Qué te hizo abandonar?',
    options: [
      { id: 'a', dim: 'atajo', label: 'Me distraje y la tentación pudo más.' },
      { id: 'b', dim: 'arranque', label: 'El plan era demasiado grande o confuso.' },
      { id: 'c', dim: 'racha', label: 'Duró unos días y se fue apagando.' },
      { id: 'd', dim: null, label: 'Nunca probé un método o sistema.' },
    ],
    shuffle: ['a', 'b', 'c'],
  },
  {
    id: 'q10',
    kind: 'single',
    role: 'goal',
    title: 'Si pudieras cambiar una cosa primero, ¿cuál sería?',
    subtitle: 'Elegí la más importante para vos.',
    options: GOALS.map((id) => ({ id, label: GOAL_TEXT[id].label })),
  },
];

// Orden de las pantallas (13). El "reveal" es una entrada breve al resultado, no una pantalla.
export const FLOW = ['hook', 'q1', 'q2', 'q3', 'q4', 'pause', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'result'];

// ── Textos de pantallas ───────────────────────────────────────────────────────

export const UI = {
  brand: { first: 'Método', second: 'Neuroproductivo' },
  back: 'Volver',
  counter: (n, total) => `Pregunta ${n} de ${total}`,
  hook: {
    kicker: 'Método Neuroproductivo · Test rápido',
    title: 'Descubrí qué patrón te hace postergar',
    scene: 'Te sentás a empezar y, de repente, estás en otra cosa.',
    lead: '10 preguntas para ubicar dónde se te traba: al distraerte, al arrancar o al sostener.',
    marks: ['Sin registro', 'Sin datos personales', 'Menos de 2 minutos'],
    button: 'Empezar el test',
    fineprint: 'Es una guía para conocerte mejor, no un diagnóstico.',
  },
  pause: {
    eyebrow: 'Vas bien.',
    title: 'No a todos se nos traba en el mismo lugar.', // misma construcción que el hook («dónde se te traba»)
    text: 'Puede pasar al distraerte, al arrancar o al sostener. Con las 6 preguntas que siguen, ubicamos el tuyo.',
    button: 'Seguir',
  },
  reveal: 'Listo. Este es tu patrón principal.',
  revealLow: 'Listo. Esto es lo que más aparece en tus respuestas.', // señal baja
};

// Nodos del diagrama del ciclo (pausa y resultado).
export const CYCLE_NODES = [
  { key: 'atajo', label: 'Distraerte' },
  { key: 'arranque', label: 'Arrancar' },
  { key: 'racha', label: 'Sostener' },
];
export const CYCLE_ALT = 'Dónde se puede trabar: al distraerte, al arrancar o al sostener.';

// ── Resultado ─────────────────────────────────────────────────────────────────

export const RESULT_UI = {
  kicker: 'TU PATRÓN PRINCIPAL',
  intensityCaption: 'Qué tan presente está en tu día a día',
  lowSignal: 'En tus respuestas no aparece un patrón fuerte. Si tuvieras que afinar algo, sería esto.',
  kickerLow: 'LO QUE MÁS APARECE', // en señal baja reemplaza a «TU PATRÓN PRINCIPAL»
  cycleCaption: (nodeLabel) => `Dónde se te traba: al ${nodeLabel.toLowerCase()}`, // igual que el hook
  sections: {
    why: 'Por qué suele pasar',
    happening: 'Lo que probablemente está pasando',
    seen: 'Cómo se suele ver',
    loop: 'Qué suele mantener el ciclo',
    firstStep: 'Por dónde empezar hoy',
    method: 'Cómo te ayuda el Método Neuroproductivo',
  },
  // Cada `echo` de las preguntas es una oración que sigue a «…te pasa seguido que»; «, y que» separa
  // dos respuestas sin chocar con las «y» que ya tienen adentro.
  echo: {
    prefix: 'Según tus respuestas, te pasa seguido que ',
    joiner: ', y que ',
    suffix: '.',
  },
  // Mismas palabras que la pregunta 10 y que la landing (BRIDGE_UI.goalLine): «cambiar primero».
  goalLine: (goalLabel, tool, plural) => `Lo que elegiste cambiar primero: «${goalLabel}». Ahí ${plural ? 'ayudan' : 'ayuda'} ${tool}.`,
  cta: {
    button: 'Ver el video de 5 minutos',
    microcopy: 'Explica por qué te pasa. Sin registro.', // «Sin registro.» no se separa
  },
  disclaimer:
    'Este resultado es una guía para conocerte mejor, basada en tus respuestas. No es un diagnóstico ni reemplaza la ayuda de un profesional.',
  privacyLabel: 'Política de privacidad',
  restart: 'Repetir el test',
};

export const RESULTS = {
  atajo: {
    name: 'Atajo de Recompensa',
    descriptor: 'Tu atención elige lo rápido antes que lo importante.',
    node: 'Distraerte',
    intro: {
      marcado: 'Es un patrón muy presente en tu día a día: el atajo suele ganar antes de que puedas decidir.',
      presente: 'Es un patrón que aparece con frecuencia: muchas veces el atajo gana, aunque sepas lo que tenés que hacer.',
      leve: 'Aparece de a ratos: en general podés sostener lo importante, pero el atajo se cuela en algunos momentos.',
    },
    happening:
      'Cuando tenés que elegir entre algo que te alivia ya (el celular, las redes, una tarea fácil) y algo importante que recién se siente bien cuando lo terminás, la atención suele irse por el camino más rápido. No tiene por qué ser falta de disciplina: es una elección que se repite tanto que se vuelve automática. Por qué pasa —y qué se puede cambiar— es lo que explica el video al que te lleva el botón.',
    seen: [
      'Entrás al celular «un segundo» y el tiempo se estira más de lo que pensabas.',
      'Cuando algo cuesta, primero hacés lo fácil o lo lindo para sentirte mejor.',
      'Lo importante queda para «después», aunque sepas que corre.',
    ],
    loop: 'Cada vez que el atajo te da alivio, se vuelve el camino más fácil la próxima vez. Y avanzar, que recién te hace sentir bien más tarde, queda cada vez más lejos.',
    firstStep:
      'Probá 15 minutos seguidos: celular fuera de tu vista, notificaciones en silencio y una sola tarea. Al terminar, recién ahí, date un gusto simple (un café, una canción). Primero avanzás, después el premio.',
    method: [
      // Mismos recursos que el paso 01 de «Así funciona el método» de la landing (Guía Central).
      'Esto se mejora con pequeños premios cada vez que avanzás de verdad, menos distracciones que te alivian un rato pero no te acercan a lo que querés, y un orden claro: primero avanzás, después te das el gusto. En el Método Neuroproductivo, eso está en la ',
      b('Guía Central'),
      ' (por qué tu cerebro elige la distracción), el ',
      b('Sistema Diario de Ejecución'),
      ' y el ',
      b('Panel de Progreso'),
      '.',
    ],
    secondaryCard:
      'También aparece, en menor medida, el atajo de recompensa: a veces lo rápido gana antes de que decidas.',
    bridge:
      'Si te reconociste en el atajo, este video explica por qué tu atención elige lo rápido y qué se puede hacer con eso.',
  },

  arranque: {
    name: 'Arranque Trabado',
    descriptor: 'Te cuesta pasar de querer hacerlo a hacerlo.',
    // Titular de la landing para este perfil (el de «atajo» es el de la landing tal cual).
    hero: {
      title: ['Dame 5 minutos y te muestro cómo', 'dar el primer paso en lo que venís postergando.'],
      subtitle: 'No te falta voluntad. En 14 días, con 15 minutos por día, el método te da los pasos para empezar sin decidirlo desde cero.',
    },
    node: 'Arrancar',
    intro: {
      marcado: 'Es un patrón muy presente: muchas veces sabés qué querés hacer, pero el primer paso se siente como una pared.',
      presente: 'Aparece con frecuencia: empezar te pesa más que la tarea en sí.',
      leve: 'Aparece de a ratos: en general arrancás, pero hay tareas que se te traban antes de empezar.',
    },
    happening:
      'Cuando una tarea se ve grande, larga o borrosa, empezar pesa. Y lo que pesa tiende a postergarse: ordenás, planificás o esperás «tener ganas» mientras el primer paso sigue sin definirse. No tiene por qué ser falta de disciplina: muchas veces falta claridad sobre qué hacer primero. Cómo se arma un primer paso que no cueste una pelea es lo que muestra el video al que te lleva el botón.',
    seen: [
      'Preparás, ordenás o planificás… pero el arranque no llega.',
      'Esperás tener ganas o el momento ideal para empezar.',
      'Con muchas cosas pendientes, todo parece urgente y no sabés por cuál empezar.',
    ],
    loop: 'Cuanto más se pospone, más grande parece la tarea. Y cuanto más grande parece, más cuesta empezarla.',
    // {ejemplo} se reemplaza según el contexto (CONTEXT_EXAMPLE).
    firstStep:
      'Elegí UNA tarea y reducila a un primer paso de 2 minutos. Por ejemplo: {ejemplo}. Hacé solo eso; si querés seguir, seguís.',
    method: [
      'Esto se mejora con pasos concretos y chicos, y con un ritual corto para arrancar sin esperar las ganas. En el Método Neuroproductivo, eso está en el ',
      b('Sistema Diario de Ejecución'),
      ' (te dice qué hacer cada día, sin decidirlo desde cero) y en la ',
      b('Guía de Enfoque de 5\u00a0Minutos'),
      '.',
    ],
    secondaryCard:
      'También aparece, en menor medida, el arranque trabado: hay tareas donde empezar te pesa más de lo esperado.',
    bridge:
      'Si te reconociste en el arranque trabado, este video muestra qué cambia cuando el primer paso es específico y chico, y por qué eso alcanza para empezar sin depender de las ganas.',
  },

  racha: {
    name: 'Racha Frágil',
    descriptor: 'Empezás bien, pero el ritmo no se sostiene.',
    hero: {
      title: ['Dame 5 minutos y te muestro cómo', 'sostener lo que empezás.'],
      subtitle: 'No te falta voluntad. En 14 días, con 15 minutos por día, el método te da una estructura para sostener el ritmo.',
    },
    node: 'Sostener',
    intro: {
      marcado: 'Es un patrón muy presente: arrancás con fuerza, pero el ritmo se apaga rápido y un mal día alcanza para soltarlo todo.',
      presente: 'Aparece con frecuencia: te cuesta sostener lo que empezaste, sobre todo cuando se rompe la racha.',
      leve: 'Aparece de a ratos: en general sostenés, pero cuando se corta la racha cuesta retomar.',
    },
    happening:
      'Cuando el ritmo depende de las ganas, o de no fallar nunca, alcanza con un mal día para abandonar todo el plan. Tiende a ser menos un tema de carácter y más de cómo está armado el sistema. Por qué lo que arranca bien se apaga —y qué cambia cuando el sistema ya no depende de tus ganas— es lo que explica el video al que te lleva el botón.',
    seen: [
      'Arrancás planes con muchas ganas y a los pocos días ya no están.',
      'Un día que no cumplís y sentís que «ya está»: dejás todo.',
      'Avanzás cuando tenés ganas; los días sin ganas, casi nada.',
    ],
    loop: 'Los planes grandes, sin nada que te recuerde retomar y sin ver cuánto avanzaste, se apagan a la primera interrupción.',
    firstStep:
      'Elegí UN hábito chiquito (algo de 5 minutos) y atalo a un momento fijo del día. Si un día fallás, retomás al siguiente: un día no borra lo que ya avanzaste.',
    method: [
      'Esto se mejora con un plan corto y realista, hábitos chiquitos atados a algo que ya hacés todos los días y una forma de ver cuántos días venís cumpliendo. En el Método Neuroproductivo, eso está en el ',
      b('protocolo de 14 días'),
      ', el ',
      b('Panel de Progreso'),
      ' y el ',
      b('Sistema de Planificación de 14\u00a0Días'),
      '.',
    ],
    secondaryCard:
      'También aparece, en menor medida, la racha frágil: sostener lo que empezaste te cuesta cuando se corta el ritmo.',
    bridge:
      'Si te reconociste en la racha frágil, este video explica por qué lo que arranca bien se apaga y qué cambia cuando el sistema ya no depende de tus ganas.',
  },
};

// ── Bloque de continuidad de la landing para tráfico del quiz ─────────────────

export const BRIDGE_UI = {
  label: 'TU RESULTADO',
  level: (label) => `Nivel ${label.toLowerCase()}`, // «Arranque Trabado · Nivel medio»
  goalLine: (goalLabel) => `Lo que elegiste cambiar primero: «${goalLabel}».`,
};
