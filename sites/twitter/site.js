// Twitter / X site adapter.
'use strict';

(function (root) {
  if (!root.WebFish) {
    console.warn('[WebFish/twitter] registry not loaded yet');
    return;
  }

  const ROUTE_MAP = {
    '/home': { file: 'timeline.tsx', icon: 'tsx' },
    '/explore': { file: 'explore.ts', icon: 'ts' },
    '/notifications': { file: 'notifications.tsx', icon: 'tsx' },
    '/messages': { file: 'messages.ts', icon: 'ts' },
    '/bookmarks': { file: 'bookmarks.tsx', icon: 'tsx' },
    '/settings': { file: 'settings.json', icon: 'json' },
  };

  const FILE_TREE = [
    { type: 'section', label: 'TWITTER-APP' },
    { type: 'folder', label: 'src', open: true },
    { type: 'file', label: 'timeline.tsx', icon: 'tsx', route: '/home' },
    { type: 'file', label: 'post.tsx', icon: 'tsx', routeKind: 'status' },
    { type: 'file', label: 'explore.ts', icon: 'ts', route: '/explore' },
    { type: 'file', label: 'notifications.tsx', icon: 'tsx', route: '/notifications' },
    { type: 'file', label: 'messages.ts', icon: 'ts', route: '/messages' },
    { type: 'file', label: 'bookmarks.tsx', icon: 'tsx', route: '/bookmarks' },
    { type: 'folder', label: 'components', open: false },
    { type: 'file', label: 'types.d.ts', icon: 'dts' },
    { type: 'section', label: 'CONFIG' },
    { type: 'file', label: 'package.json', icon: 'json' },
    { type: 'file', label: 'tsconfig.json', icon: 'json' },
    { type: 'file', label: '.env.local', icon: 'env' },
  ];

  const RESERVED_FIRST_SEGMENTS = new Set([
    'home', 'explore', 'notifications', 'messages', 'bookmarks', 'settings',
    'i', 'compose', 'search', 'login', 'logout', 'signup',
  ]);

  function getProfileTab(path) {
    if (/^\/[^/]+\/status\/\d+/.test(path)) return { file: 'post.tsx', icon: 'tsx' };
    const m = path.match(/^\/([^/]+)(?:\/(?:with_replies|highlights|articles|media|likes))?$/);
    if (m && !RESERVED_FIRST_SEGMENTS.has(m[1])) {
      return { file: `@${m[1]}.tsx`, icon: 'tsx' };
    }
    return { file: 'timeline.tsx', icon: 'tsx' };
  }

  function getRouteTab(path) {
    return ROUTE_MAP[path] || getProfileTab(path);
  }

  function getRouteKind(path) {
    if (/^\/[^/]+\/status\/\d+/.test(path)) return 'status';
    if (/^\/[^/]+(?:\/(?:with_replies|highlights|articles|media|likes))?$/.test(path) && !ROUTE_MAP[path]) return 'profile';
    return 'timeline';
  }

  // CSS strings used by the legacy media-hide toggles (extension still
  // injects them via applyStyle so they can be turned on/off without
  // reloading content scripts).
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

  const CSS_HIDE_ADS = `
[data-testid="cellInnerDiv"]:has([data-testid="placementTracking"] article[data-testid="tweet"]) { display: none !important; }
`;

  root.WebFish.register({
    id: 'twitter',
    match(host) {
      return host === 'x.com' || host === 'twitter.com'
        || host.endsWith('.twitter.com') || host.endsWith('.x.com');
    },
    capabilities: { ads: true, hideImages: true, hideVideos: true, vscode: true },
    styles: {
      hideImages: CSS_HIDE_IMAGES,
      hideVideos: CSS_HIDE_VIDEOS,
      hideAds: CSS_HIDE_ADS,
    },
    shell: {
      title: 'TWITTER-APP',
      fileTree: FILE_TREE,
      routeMap: ROUTE_MAP,
      fallbackTab: { file: 'timeline.tsx', icon: 'tsx' },
      extraTabs: [{ label: 'types.d.ts', icon: 'dts' }],
      getRouteKind,
      getRouteTab,
      statusBarMeta: {
        language: 'TypeScript React', indent: 'Spaces: 2',
        encoding: 'UTF-8', formatter: 'Prettier',
      },
    },
    transformer: {
      // Twitter's primary column appears late; wait for it before starting.
      primaryColumnSelector: '[data-testid="primaryColumn"]',
      itemSelector: 'article[data-testid="tweet"]',
      transformItem: (article, ctx) => root.WebFishTwitterTransformer.transformItem(article, ctx),
      transformHeader: (ctx) => root.WebFishTwitterTransformer.transformHeader(ctx),
      media: {
        containerSelector: 'div[aria-labelledby]:not([role]):not([data-testid]):has([data-testid="tweetPhoto"]), [data-testid="article-cover-image"]',
        describe(container) {
          const hasVideo = container.querySelector('[data-testid="videoPlayer"]');
          const isCover = container.matches('[data-testid="article-cover-image"]');
          if (hasVideo) return { kind: 'video' };
          if (isCover) return { kind: 'cover' };
          const photos = container.querySelectorAll('[data-testid="tweetPhoto"]');
          return { kind: 'image', count: photos.length };
        },
      },
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
