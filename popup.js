const elVscode = document.getElementById('vscodeMode');
const elImages = document.getElementById('hideImages');
const elVideos = document.getElementById('hideVideos');
const elAds = document.getElementById('hideAds');

// Load saved state
chrome.storage.sync.get({ vscodeMode: false, hideImages: false, hideVideos: false, hideAds: true }, (data) => {
  elVscode.checked = data.vscodeMode;
  elImages.checked = data.hideImages;
  elVideos.checked = data.hideVideos;
  elAds.checked = data.hideAds;
});

// Save on toggle
elVscode.addEventListener('change', () => {
  chrome.storage.sync.set({ vscodeMode: elVscode.checked });
});

elImages.addEventListener('change', () => {
  chrome.storage.sync.set({ hideImages: elImages.checked });
});

elVideos.addEventListener('change', () => {
  chrome.storage.sync.set({ hideVideos: elVideos.checked });
});

elAds.addEventListener('change', () => {
  chrome.storage.sync.set({ hideAds: elAds.checked });
});
