// Site adapter registry. Each sites/<id>/site.js calls
// WebFish.register(adapter) at content_script load time.
'use strict';

(function (root) {
  if (root.WebFish) return; // already loaded by another content_scripts entry

  const adapters = new Map();

  function register(adapter) {
    if (!adapter || !adapter.id) {
      console.warn('[WebFish] register() ignored: missing id', adapter);
      return;
    }
    adapters.set(adapter.id, adapter);
  }

  function get(id) {
    return adapters.get(id) || null;
  }

  function match(host, path) {
    // Prefer adapter.match() if provided; otherwise fall back to shared host rule.
    for (const adapter of adapters.values()) {
      if (typeof adapter.match === 'function') {
        try {
          if (adapter.match(host, path)) return adapter;
        } catch (e) { /* keep going */ }
      }
    }
    if (root.WebFishMatch) {
      const id = root.WebFishMatch.matchHost(host);
      if (id) return adapters.get(id) || null;
    }
    return null;
  }

  root.WebFish = { register, get, match };
})(typeof window !== 'undefined' ? window : globalThis);
