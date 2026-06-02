// Inject / remove a <style id="..."> tag on <html>.
// Used to switch CSS rule sets on/off without touching manifest order.
'use strict';

(function (root) {
  function applyStyle(id, css, enabled) {
    let el = document.getElementById(id);
    if (enabled && css) {
      if (!el) {
        el = document.createElement('style');
        el.id = id;
        el.textContent = css;
        document.documentElement.appendChild(el);
      } else if (el.textContent !== css) {
        el.textContent = css;
      }
    } else if (el) {
      el.remove();
    }
  }

  root.WebFishStyle = { applyStyle };
})(typeof window !== 'undefined' ? window : globalThis);
