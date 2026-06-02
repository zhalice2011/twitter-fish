// Popup — adapts the toggle list to the active tab's site capabilities.
'use strict';

// Capabilities table — kept in sync with sites/<id>/site.js capabilities field.
// Popup runs in its own context and can't read content-script state, so we
// duplicate this small table. Adding a new site = add an entry here + a
// sites/<id>/ folder.
const SITE_CAPABILITIES = {
  twitter: { ads: true,  hideImages: true, hideVideos: true, vscode: true,  label: 'Twitter / X' },
  linuxdo: { ads: false, hideImages: true, hideVideos: true, vscode: true,  label: 'Linux.do' },
};

const DEFAULTS = { vscodeMode: false, hideImages: false, hideVideos: false, hideAds: true };

const elVscode = document.getElementById('vscodeMode');
const elImages = document.getElementById('hideImages');
const elVideos = document.getElementById('hideVideos');
const elAds    = document.getElementById('hideAds');
const elSiteLabel = document.getElementById('siteLabel');
const elEmpty  = document.getElementById('emptyState');

const sectionVscode = document.getElementById('sectionVscode');
const sectionAds    = document.getElementById('sectionAds');
const sectionMedia  = document.getElementById('sectionMedia');
const rowImages = document.getElementById('rowImages');
const rowVideos = document.getElementById('rowVideos');

function setVisible(el, visible) {
  if (!el) return;
  el.classList.toggle('hidden', !visible);
}

function applyCapabilities(caps, label) {
  if (!caps) {
    elSiteLabel.textContent = '当前站点';
    setVisible(elEmpty, true);
    setVisible(sectionVscode, false);
    setVisible(sectionAds, false);
    setVisible(sectionMedia, false);
    return;
  }
  elSiteLabel.textContent = label || '';
  setVisible(elEmpty, false);
  setVisible(sectionVscode, !!caps.vscode);
  setVisible(sectionAds, !!caps.ads);
  const showMedia = caps.hideImages || caps.hideVideos;
  setVisible(sectionMedia, showMedia);
  setVisible(rowImages, !!caps.hideImages);
  setVisible(rowVideos, !!caps.hideVideos);
}

function loadStateAndBind() {
  chrome.storage.sync.get(DEFAULTS, (data) => {
    elVscode.checked = data.vscodeMode;
    elImages.checked = data.hideImages;
    elVideos.checked = data.hideVideos;
    elAds.checked    = data.hideAds;
  });

  elVscode.addEventListener('change', () => chrome.storage.sync.set({ vscodeMode: elVscode.checked }));
  elImages.addEventListener('change', () => chrome.storage.sync.set({ hideImages: elImages.checked }));
  elVideos.addEventListener('change', () => chrome.storage.sync.set({ hideVideos: elVideos.checked }));
  elAds.addEventListener('change',    () => chrome.storage.sync.set({ hideAds:    elAds.checked }));
}

function detect() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    let host = '';
    try { host = tab && tab.url ? new URL(tab.url).hostname : ''; } catch (e) { /* ignore */ }
    const id = (window.WebFishMatch && host) ? window.WebFishMatch.matchHost(host) : null;
    const caps = id ? SITE_CAPABILITIES[id] : null;
    applyCapabilities(caps, caps ? caps.label : null);
    loadStateAndBind();
  });
}

detect();
