// WebFish content-script bootstrap.
// Picks the site adapter that matches this tab and wires it to core/.
'use strict';

const STORAGE_DEFAULTS = { vscodeMode: false, hideImages: false, hideVideos: false, hideAds: true };

function getAdapter() {
  if (!window.WebFish) {
    console.warn('[WebFish] registry missing');
    return null;
  }
  const adapter = window.WebFish.match(location.hostname, location.pathname);
  if (!adapter) {
    console.warn('[WebFish] no adapter for', location.hostname);
  }
  return adapter;
}

function applyMediaToggles(adapter, cfg) {
  const styles = (adapter && adapter.styles) || {};
  const caps = (adapter && adapter.capabilities) || {};
  const apply = window.WebFishStyle.applyStyle;
  apply('webfish-hide-images', styles.hideImages || '', caps.hideImages && cfg.hideImages);
  apply('webfish-hide-videos', styles.hideVideos || '', caps.hideVideos && cfg.hideVideos);
  apply('webfish-hide-ads',    styles.hideAds    || '', caps.ads        && cfg.hideAds);
}

function enableVscodeMode(adapter, cfg) {
  document.documentElement.classList.add('vscode-mode');
  window.VscodeShell.inject(adapter);
  window.TweetTransformer.configure(adapter, cfg);
  // Wait for primary column before starting transformer
  const sel = adapter.transformer.primaryColumnSelector;
  const waitFor = () => {
    if (!sel || document.querySelector(sel)) {
      window.TweetTransformer.start();
    } else {
      requestAnimationFrame(waitFor);
    }
  };
  waitFor();
}

function disableVscodeMode() {
  document.documentElement.classList.remove('vscode-mode');
  window.VscodeShell.remove();
  window.TweetTransformer.stop();
}

function applySettings(adapter, cfg) {
  applyMediaToggles(adapter, cfg);
  const caps = (adapter && adapter.capabilities) || {};
  if (caps.vscode && cfg.vscodeMode) {
    enableVscodeMode(adapter, cfg);
  } else {
    disableVscodeMode();
  }
}

function refresh() {
  const adapter = getAdapter();
  if (!adapter) return;
  // Tear down before re-applying so style/state changes are clean.
  disableVscodeMode();
  ['webfish-hide-images', 'webfish-hide-videos', 'webfish-hide-ads'].forEach(id => {
    window.WebFishStyle.applyStyle(id, '', false);
  });
  chrome.storage.sync.get(STORAGE_DEFAULTS, cfg => applySettings(adapter, cfg));
}

// Init
chrome.storage.sync.get(STORAGE_DEFAULTS, cfg => {
  const adapter = getAdapter();
  if (adapter) applySettings(adapter, cfg);
});

// React to popup changes
chrome.storage.onChanged.addListener(refresh);
