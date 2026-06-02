// Linuxdo (Discourse) site adapter.
'use strict';

(function (root) {
  if (!root.WebFish) {
    console.warn('[WebFish/linuxdo] registry not loaded yet');
    return;
  }

  const ROUTE_MAP = {
    '/': { file: 'latest.tsx', icon: 'tsx' },
    '/latest': { file: 'latest.tsx', icon: 'tsx' },
    '/new': { file: 'new.tsx', icon: 'tsx' },
    '/unread': { file: 'unread.tsx', icon: 'tsx' },
    '/top': { file: 'top.tsx', icon: 'tsx' },
    '/hot': { file: 'hot.tsx', icon: 'tsx' },
    '/categories': { file: 'categories.tsx', icon: 'tsx' },
    '/chat': { file: 'chat.ts', icon: 'ts' },
  };

  const FILE_TREE = [
    { type: 'section', label: 'LINUX-DO' },
    { type: 'folder', label: 'topics', open: true },
    { type: 'file', label: 'latest.tsx', icon: 'tsx', route: '/latest' },
    { type: 'file', label: 'new.tsx',    icon: 'tsx', route: '/new' },
    { type: 'file', label: 'hot.tsx',    icon: 'tsx', route: '/hot' },
    { type: 'file', label: 'top.tsx',    icon: 'tsx', route: '/top' },
    { type: 'file', label: 'unread.tsx', icon: 'tsx', route: '/unread' },
    { type: 'file', label: 'thread.tsx', icon: 'tsx', routeKind: 'thread' },
    { type: 'folder', label: 'categories', open: false },
    { type: 'file', label: 'develop.ts', icon: 'ts', route: '/c/develop/4' },
    { type: 'file', label: 'feedback.ts', icon: 'ts', route: '/c/feedback/2' },
    { type: 'section', label: 'USER' },
    { type: 'file', label: 'profile.tsx', icon: 'tsx', routeKind: 'profile' },
    { type: 'file', label: 'chat.ts',    icon: 'ts',  route: '/chat' },
    { type: 'section', label: 'CONFIG' },
    { type: 'file', label: 'package.json', icon: 'json' },
    { type: 'file', label: 'discourse.json', icon: 'json' },
  ];

  function getRouteKind(path) {
    if (/^\/t\/[^/]+\/\d+/.test(path) || /^\/t\/topic\/\d+/.test(path)) return 'thread';
    if (/^\/u\/[^/]+/.test(path)) return 'profile';
    if (/^\/c\//.test(path)) return 'category';
    return 'feed';
  }

  function getRouteTab(path) {
    if (ROUTE_MAP[path]) return ROUTE_MAP[path];
    if (/^\/t\//.test(path)) {
      // /t/topic-slug/12345 — use topic id (last numeric segment) as filename
      const m = path.match(/\/(\d+)(?:\/\d+)?\/?$/);
      const id = m ? m[1] : 'thread';
      return { file: `topic_${id}.tsx`, icon: 'tsx' };
    }
    if (/^\/u\/([^/?#]+)/.test(path)) {
      const handle = path.match(/^\/u\/([^/?#]+)/)[1];
      return { file: `@${handle}.tsx`, icon: 'tsx' };
    }
    if (/^\/c\//.test(path)) {
      const slug = (path.split('/c/')[1] || '').split('/')[0] || 'category';
      return { file: `${slug}.ts`, icon: 'ts' };
    }
    return { file: 'latest.tsx', icon: 'tsx' };
  }

  // Switch the tweet/post selector by route.
  function itemSelector(path) {
    const kind = getRouteKind(path);
    if (kind === 'thread') return '.topic-post';
    if (kind === 'profile') return null; // header-only; no per-item rewrite
    return 'tr.topic-list-item[data-topic-id]'; // feed / category
  }

  // CSS toggles for media hiding (Discourse markup).
  // :not(.emoji) protects inline emoji; iframes catch youtube/bilibili oneboxes.
  const CSS_HIDE_IMAGES = `
.cooked img:not(.emoji):not(.avatar) { display: none !important; }
.lightbox-wrapper, .d-image-wrapper, .topic-list-item img.avatar { display: none !important; }
.onebox img:not(.emoji) { display: none !important; }
`;

  const CSS_HIDE_VIDEOS = `
.video-container, video, .youtube-onebox { display: none !important; }
.cooked iframe[src*="youtube"], .cooked iframe[src*="youtu.be"], .cooked iframe[src*="bilibili"] { display: none !important; }
`;

  root.WebFish.register({
    id: 'linuxdo',
    match(host) {
      return host === 'linux.do' || host.endsWith('.linux.do');
    },
    capabilities: { ads: false, hideImages: true, hideVideos: true, vscode: true },
    styles: {
      hideImages: CSS_HIDE_IMAGES,
      hideVideos: CSS_HIDE_VIDEOS,
      // hideAds intentionally absent
    },
    shell: {
      title: 'LINUX-DO',
      fileTree: FILE_TREE,
      routeMap: ROUTE_MAP,
      fallbackTab: { file: 'latest.tsx', icon: 'tsx' },
      extraTabs: [{ label: 'discourse.json', icon: 'json' }],
      getRouteKind,
      getRouteTab,
      statusBarMeta: {
        language: 'TypeScript React', indent: 'Spaces: 2',
        encoding: 'UTF-8', formatter: 'Prettier',
      },
    },
    transformer: {
      // Discourse mounts content into #main-outlet asynchronously.
      primaryColumnSelector: '#main-outlet',
      itemSelector,
      transformItem: (item, ctx) => root.WebFishLinuxdoTransformer.transformItem(item, ctx),
      transformHeader: (ctx) => root.WebFishLinuxdoTransformer.transformHeader(ctx),
      // No `media` config: image/video hiding is purely CSS-driven on Linuxdo
      // (no inline placeholder text, since posts can have many inline images).
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
