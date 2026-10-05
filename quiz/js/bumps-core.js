// Lógica pura de los order bumps de la landing (sin DOM, para poder probarla).
// El enlace de compra es un permalink de carrito de Shopify: /cart/VARIANTE_PRINCIPAL:1,VARIANTE_BUMP:1,…
// Esto SOLO toca el camino (pathname): query y hash —attributes[pattern|qsid|src], utm_*, fbclid— quedan intactos.

const VARIANT_ID = /^\d+$/;

/** Devuelve `href` con el producto principal (el primer ítem del carrito) más los bumps marcados. Es idempotente. */
export function addBumpsToCartUrl(href, variantIds = []) {
  try {
    const url = new URL(href, 'https://placeholder.invalid');
    const match = url.pathname.match(/^\/cart\/([^/]+)$/);
    if (!match) return href;
    const main = match[1].split(',')[0];
    const mainId = main.split(':')[0];
    const bumps = [...new Set(variantIds.map(String))].filter((id) => VARIANT_ID.test(id) && id !== mainId);
    url.pathname = `/cart/${[main, ...bumps.map((id) => `${id}:1`)].join(',')}`;
    return /^https?:\/\//i.test(href) ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

/** Solo se muestran los bumps que ya existen como producto en Shopify (con ID de variante numérico). */
export function activeBumps(bumps = []) {
  return bumps.filter((b) => b && VARIANT_ID.test(String(b.variantId ?? ''))).slice(0, 2);
}

/** 11990 → "$11.990" */
export function formatArs(amount) {
  return `$${String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}
