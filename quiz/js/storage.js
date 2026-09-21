// Acceso seguro a localStorage / sessionStorage. Puede fallar (ventana privada, navegadores
// integrados de Instagram/Facebook, datos bloqueados): en ese caso se usa memoria y el quiz
// sigue funcionando hasta el final.

function makeStore(kind) {
  const memory = new Map();

  function backend() {
    try {
      const s = typeof window !== 'undefined' ? window[kind] : null;
      if (!s) return null;
      const probe = '__mnq_probe__';
      s.setItem(probe, '1');
      s.removeItem(probe);
      return s;
    } catch {
      return null;
    }
  }

  return {
    get(key) {
      const s = backend();
      if (s) {
        try {
          return s.getItem(key);
        } catch {
          /* cae a memoria */
        }
      }
      return memory.has(key) ? memory.get(key) : null;
    },
    set(key, value) {
      memory.set(key, value);
      const s = backend();
      if (s) {
        try {
          s.setItem(key, value);
        } catch {
          /* queda en memoria */
        }
      }
    },
    remove(key) {
      memory.delete(key);
      const s = backend();
      if (s) {
        try {
          s.removeItem(key);
        } catch {
          /* nada */
        }
      }
    },
    getJSON(key) {
      const raw = this.get(key);
      if (raw === null) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    setJSON(key, value) {
      this.set(key, JSON.stringify(value));
    },
  };
}

export const local = makeStore('localStorage');
export const session = makeStore('sessionStorage');
