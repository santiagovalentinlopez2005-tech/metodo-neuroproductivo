// Order bumps de la landing /metodo-quiz: casilleros opcionales debajo del botón de compra principal.
// Cada bump marcado se suma al enlace de carrito de Shopify; el botón sigue siendo uno solo.
// No modifica los parámetros que arma bridge.js (attributes[*], utm_*): solo cambia el camino /cart/….
import { CONFIG } from './config.js';
import { activeBumps, addBumpsToCartUrl, formatArs } from './bumps-core.js';

const CART_LINKS = 'a[href*="myshopify.com/cart/"]';

function init() {
  const bumps = activeBumps(CONFIG.bumps);
  const anchor = document.getElementById('main-cta');
  if (!bumps.length || !anchor) return; // sin variantes cargadas no se muestra nada

  const box = document.createElement('div');
  box.className = 'bumps';
  box.innerHTML = '<p class="bumps-title">Sumá a tu pedido <span>(opcional)</span></p>';

  const total = document.createElement('p');
  total.className = 'bumps-total';

  const rows = bumps.map((bump) => {
    const label = document.createElement('label');
    label.className = 'bump';
    label.innerHTML =
      `<input type="checkbox" class="bump-input" value="${bump.variantId}">` +
      '<span class="bump-box" aria-hidden="true"></span>' +
      `<img class="bump-img" src="${bump.image}" alt="" width="56" height="78">` +
      '<span class="bump-text"><strong class="bump-name"></strong><span class="bump-desc"></span></span>' +
      '<span class="bump-price"></span>';
    label.querySelector('.bump-name').textContent = bump.name;
    label.querySelector('.bump-desc').textContent = bump.description;
    label.querySelector('.bump-price').textContent = `+ ${formatArs(bump.price)}`;
    box.appendChild(label);
    return { bump, input: label.querySelector('input'), label };
  });
  box.appendChild(total);
  anchor.insertAdjacentElement('afterend', box);

  const baseHrefs = new Map(); // href tal como lo dejó bridge.js (principal + attributes + utm)
  const update = () => {
    const chosen = rows.filter((r) => r.input.checked).map((r) => r.bump);
    document.querySelectorAll(CART_LINKS).forEach((link) => {
      if (!baseHrefs.has(link)) baseHrefs.set(link, link.getAttribute('href'));
      link.setAttribute('href', addBumpsToCartUrl(baseHrefs.get(link), chosen.map((b) => b.variantId)));
    });
    rows.forEach((r) => r.label.classList.toggle('on', r.input.checked));
    const sum = CONFIG.bumpsBasePrice + chosen.reduce((s, b) => s + b.price, 0);
    total.textContent = chosen.length ? `Tu total hoy: ${formatArs(sum)} ARS` : '';
  };
  rows.forEach((r) => r.input.addEventListener('change', update));
  update();
}

// bridge.js decora los enlaces en DOMContentLoaded; este módulo corre después (orden del <script>) y
// guarda ese href como base la primera vez que cambia un casillero.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
