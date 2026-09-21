// Diagrama del ciclo (SVG): Distraerte → Arrancar → Sostener.
// Estados de cada nodo: idle (pausa), primary (tu punto), secondary (atenuado).

import { CYCLE_NODES, CYCLE_ALT } from './content.js';
import { el, svgEl } from './dom.js';

const X = [44, 160, 276]; // posición horizontal de cada nodo (viewBox 320 × 104)
const Y = 34;
const R = 20;

export function buildCycleDiagram({ primary = null, secondary = null } = {}) {
  const svg = svgEl('svg', {
    viewBox: '0 0 320 104',
    'aria-hidden': 'true',
    focusable: 'false',
    class: 'mnq-cycle__svg',
  });

  // Conectores con punta de flecha.
  for (let i = 0; i < 2; i += 1) {
    const x1 = X[i] + R + 8;
    const x2 = X[i + 1] - R - 12;
    svg.append(svgEl('line', { x1, y1: Y, x2, y2: Y, class: 'mnq-cycle__link' }));
    svg.append(svgEl('path', { d: `M${x2 - 1} ${Y - 5} L${x2 + 7} ${Y} L${x2 - 1} ${Y + 5}`, class: 'mnq-cycle__arrow' }));
  }

  CYCLE_NODES.forEach((node, i) => {
    const state = node.key === primary ? 'primary' : node.key === secondary ? 'secondary' : 'idle';
    const group = svgEl('g', { class: `mnq-cycle__node mnq-cycle__node--${state}` });
    group.append(svgEl('circle', { cx: X[i], cy: Y, r: R, class: 'mnq-cycle__circle' }));
    const number = svgEl('text', { x: X[i], y: Y + 5, 'text-anchor': 'middle', class: 'mnq-cycle__number' });
    number.textContent = String(i + 1);
    group.append(number);
    const label = svgEl('text', { x: X[i], y: 86, 'text-anchor': 'middle', class: 'mnq-cycle__label' });
    label.textContent = node.label;
    group.append(label);
    svg.append(group);
  });

  const labelOf = (key) => (CYCLE_NODES.find((n) => n.key === key) || {}).label;
  let alt = CYCLE_ALT;
  if (primary) alt += ` Tu punto principal: ${labelOf(primary)}.`;
  if (secondary) alt += ` También aparece: ${labelOf(secondary)}.`;

  return el('figure', { class: 'mnq-cycle', role: 'img', 'aria-label': alt }, svg);
}
