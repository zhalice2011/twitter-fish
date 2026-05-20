const STYLE_ID_IMAGES = 'twitter-fish-hide-images';
const STYLE_ID_VIDEOS = 'twitter-fish-hide-videos';

const CSS_HIDE_IMAGES = `
div[aria-labelledby]:not([role]):not([data-testid]):has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) { display: none !important; }
[data-testid="card.layoutLarge.media"]:not(:has(video)) { display: none !important; }
[data-testid="card.layoutSmall.media"]:not(:has(video)) { display: none !important; }
[data-testid="article-cover-image"] { display: none !important; }
`;

const CSS_HIDE_VIDEOS = `
div[aria-labelledby]:not([role]):not([data-testid]):has([data-testid="videoPlayer"]) { display: none !important; }
[data-testid="card.layoutLarge.media"]:has(video) { display: none !important; }
[data-testid="card.layoutSmall.media"]:has(video) { display: none !important; }
`;

function applyStyle(id, css, enabled) {
  let el = document.getElementById(id);
  if (enabled) {
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      el.textContent = css;
      document.documentElement.appendChild(el);
    }
  } else {
    if (el) el.remove();
  }
}

function applyMediaSettings({ hideImages, hideVideos }) {
  applyStyle(STYLE_ID_IMAGES, CSS_HIDE_IMAGES, hideImages);
  applyStyle(STYLE_ID_VIDEOS, CSS_HIDE_VIDEOS, hideVideos);
}

function enableVscodeMode() {
  document.documentElement.classList.add('vscode-mode');
  VscodeShell.inject();
  // Wait for primary column to appear before starting transformer
  const waitForColumn = () => {
    if (document.querySelector('[data-testid="primaryColumn"]')) {
      TweetTransformer.start();
    } else {
      requestAnimationFrame(waitForColumn);
    }
  };
  waitForColumn();
}

function disableVscodeMode() {
  document.documentElement.classList.remove('vscode-mode');
  VscodeShell.remove();
  TweetTransformer.stop();
}

function applySettings(cfg) {
  applyMediaSettings(cfg);

  if (cfg.vscodeMode) {
    TweetTransformer.configure(cfg);
    enableVscodeMode();
  } else {
    disableVscodeMode();
  }
}

// Init
chrome.storage.sync.get({ vscodeMode: false, hideImages: false, hideVideos: false }, applySettings);

// React to changes from popup
chrome.storage.onChanged.addListener(() => {
  // First clean up any existing VSCode mode state
  disableVscodeMode();
  applyStyle(STYLE_ID_IMAGES, '', false);
  applyStyle(STYLE_ID_VIDEOS, '', false);

  // Then re-apply based on new settings
  chrome.storage.sync.get({ vscodeMode: false, hideImages: false, hideVideos: false }, applySettings);
});
