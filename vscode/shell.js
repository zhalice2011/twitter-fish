// VSCode Shell — Injects activity bar, sidebar, tab bar, status bar
'use strict';

const VscodeShell = {
  _injected: false,

  // Route → file mapping
  _routeMap: {
    '/home': { file: 'timeline.tsx', icon: 'tsx' },
    '/explore': { file: 'explore.ts', icon: 'ts' },
    '/notifications': { file: 'notifications.tsx', icon: 'tsx' },
    '/messages': { file: 'messages.ts', icon: 'ts' },
    '/bookmarks': { file: 'bookmarks.tsx', icon: 'tsx' },
    '/settings': { file: 'settings.json', icon: 'json' },
  },

  _fileTree: [
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
  ],

  inject() {
    if (this._injected) return;
    const tryInject = () => {
      if (!document.body) return requestAnimationFrame(tryInject);
      this._build();
      this._injected = true;
      this._watchRoute();
    };
    tryInject();
  },

  remove() {
    if (!this._injected) return;
    ['vsc-activitybar', 'vsc-sidebar', 'vsc-tabbar', 'vsc-statusbar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    document.documentElement.removeAttribute('data-vsc-route');
    this._injected = false;
  },

  _build() {
    this._syncRouteState();
    this._buildActivityBar();
    this._buildSidebar();
    this._buildTabBar();
    this._buildStatusBar();
  },

  _buildActivityBar() {
    const bar = document.createElement('div');
    bar.id = 'vsc-activitybar';

    const icons = [
      { name: 'files', active: true, svg: '<path d="M17.5 0h-9L7 1.5V6H2.5L1 7.5v13l1.5 1.5h13l1.5-1.5V16h4.5l1.5-1.5v-11L17.5 0zM16 14.5l-1.5 1.5H3l-.5-.5v-12L3 3h3.5v9.5L8 14h8v.5zm5-1l-.5.5H8.5L8 13.5V2L8.5 1.5h8L20 5v8.5z"/>' },
      { name: 'search', svg: '<path d="M15.25 0a8.25 8.25 0 0 0-6.18 13.72L1 21.75l1.27 1.27 8.05-8.04A8.25 8.25 0 1 0 15.25 0zm0 15a6.75 6.75 0 1 1 0-13.5 6.75 6.75 0 0 1 0 13.5z"/>' },
      { name: 'git', svg: '<path d="M21.007 8.222A3.738 3.738 0 0 0 15.045 5.2a3.737 3.737 0 0 0 1.156 6.583 2.988 2.988 0 0 1-2.668 1.67h-2.99a4.456 4.456 0 0 0-2.989 1.165V7.4a3.737 3.737 0 1 0-1.494 0v9.117a3.776 3.776 0 1 0 1.816.099 2.99 2.99 0 0 1 2.668-1.667h2.99a4.484 4.484 0 0 0 4.223-3.039 3.736 3.736 0 0 0 3.25-3.687zM4.565 3.738a2.242 2.242 0 1 1 4.484 0 2.242 2.242 0 0 1-4.484 0zm4.484 16.441a2.242 2.242 0 1 1-4.484 0 2.242 2.242 0 0 1 4.484 0zm8.221-9.715a2.242 2.242 0 1 1 0-4.485 2.242 2.242 0 0 1 0 4.485z"/>' },
      { name: 'extensions', svg: '<path d="M13.5 1.5L15 0h7.5L24 1.5V9l-1.5 1.5H15L13.5 9V1.5zm1.5 0V9h7.5V1.5H15zM0 15L1.5 13.5H9L10.5 15v7.5L9 24H1.5L0 22.5V15zm1.5 0v7.5H9V15H1.5zM13.5 15L15 13.5h7.5L24 15v7.5L22.5 24H15l-1.5-1.5V15zm1.5 0v7.5h7.5V15H15zM0 1.5L1.5 0H9l1.5 1.5V9L9 10.5H1.5L0 9V1.5zm1.5 0V9H9V1.5H1.5z"/>' },
      { name: 'settings', svg: '<path d="M19.85 8.75l4.15.83v4.84l-4.15.83 2.35 3.52-3.42 3.42-3.52-2.35-.83 4.16H9.58l-.84-4.15-3.52 2.35-3.42-3.42 2.35-3.52L0 14.42V9.58l4.15-.84L1.8 5.22 5.22 1.8l3.52 2.35L9.58 0h4.84l.84 4.15 3.52-2.35 3.42 3.42-2.35 3.53zM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>' },
    ];

    icons.forEach(icon => {
      const btn = document.createElement('div');
      btn.className = 'vsc-ab-icon' + (icon.active ? ' active' : '');
      btn.innerHTML = `<svg viewBox="0 0 24 24">${icon.svg}</svg>`;
      bar.appendChild(btn);
    });

    document.body.appendChild(bar);
  },

  _buildSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'vsc-sidebar';

    const title = document.createElement('div');
    title.className = 'vsc-sidebar-title';
    title.textContent = 'EXPLORER';
    sidebar.appendChild(title);

    const currentPath = location.pathname;
    const routeKind = this._getRouteKind(currentPath);

    this._fileTree.forEach(item => {
      const el = document.createElement('div');

      if (item.type === 'section') {
        el.className = 'vsc-tree-section';
        el.innerHTML = `<span>▼</span> ${item.label}`;
      } else if (item.type === 'folder') {
        el.className = 'vsc-tree-item';
        el.style.paddingLeft = '28px';
        el.innerHTML = `<span>${item.open ? '▼' : '▶'}</span> <span style="color:#dcb67a">📁</span> ${item.label}`;
      } else {
        el.className = 'vsc-tree-item';
        el.style.paddingLeft = '40px';
        const isActive = (item.route && currentPath.startsWith(item.route)) || item.routeKind === routeKind;
        if (isActive) el.classList.add('active');
        el.innerHTML = `<span style="color:${this._getIconColor(item.icon)}">●</span> ${item.label}`;
        if (item.route) {
          el.addEventListener('click', () => {
            window.location.href = item.route;
          });
        }
      }

      sidebar.appendChild(el);
    });

    document.body.appendChild(sidebar);
  },

  _buildTabBar() {
    const tabbar = document.createElement('div');
    tabbar.id = 'vsc-tabbar';

    const currentPath = location.pathname;
    const currentRoute = this._getRouteTab(currentPath);

    // Always show a few tabs
    const tabs = [
      { label: 'timeline.tsx', icon: 'tsx', active: currentPath === '/home' },
    ];

    if (currentRoute && currentRoute.file !== 'timeline.tsx') {
      tabs.push({ label: currentRoute.file, icon: currentRoute.icon, active: true });
      tabs[0].active = false;
    }

    tabs.push({ label: 'types.d.ts', icon: 'dts', active: false });

    tabs.forEach(tab => {
      const el = document.createElement('div');
      el.className = 'vsc-tab' + (tab.active ? ' active' : '');
      el.innerHTML = `<span style="color:${this._getIconColor(tab.icon)}">●</span> ${tab.label}`;
      tabbar.appendChild(el);
    });

    document.body.appendChild(tabbar);
  },

  _buildStatusBar() {
    const bar = document.createElement('div');
    bar.id = 'vsc-statusbar';

    bar.innerHTML = `
      <div class="vsc-status-left">
        <span class="vsc-status-item">⑂ main</span>
        <span class="vsc-status-item">↑0 ↓0</span>
        <span class="vsc-status-item">⚠ 0 ✕ 0</span>
      </div>
      <div class="vsc-status-right">
        <span class="vsc-status-item">Ln 1, Col 1</span>
        <span class="vsc-status-item">Spaces: 2</span>
        <span class="vsc-status-item">UTF-8</span>
        <span class="vsc-status-item">TypeScript React</span>
        <span class="vsc-status-item">Prettier</span>
      </div>
    `;

    document.body.appendChild(bar);
  },

  _getProfileTab(path) {
    const statusMatch = path.match(/^\/([^/]+)\/status\/\d+/);
    if (statusMatch) {
      return { file: 'post.tsx', icon: 'tsx' };
    }

    // /@username or /username profile tab patterns
    const match = path.match(/^\/([^/]+)(?:\/(?:with_replies|highlights|articles|media|likes))?$/);
    if (match && !['home', 'explore', 'notifications', 'messages', 'bookmarks', 'settings'].includes(match[1])) {
      return { file: `@${match[1]}.tsx`, icon: 'tsx' };
    }
    return { file: 'timeline.tsx', icon: 'tsx' };
  },

  _getRouteTab(path) {
    return this._routeMap[path] || this._getProfileTab(path);
  },

  _getRouteKind(path) {
    if (/^\/[^/]+\/status\/\d+/.test(path)) return 'status';
    if (/^\/[^/]+(?:\/(?:with_replies|highlights|articles|media|likes))?$/.test(path) && !this._routeMap[path]) return 'profile';
    return 'timeline';
  },

  _syncRouteState() {
    document.documentElement.setAttribute('data-vsc-route', this._getRouteKind(location.pathname));
  },

  _getIconColor(type) {
    const colors = {
      tsx: '#61afef',
      ts: '#519aba',
      json: '#e5c07b',
      dts: '#519aba',
      env: '#98c379',
    };
    return colors[type] || '#abb2bf';
  },

  _watchRoute() {
    // Update tabs/sidebar when URL changes (X uses pushState)
    let lastPath = location.pathname;
    const observer = new MutationObserver(() => {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        this._updateForRoute();
      }
    });
    observer.observe(document.querySelector('title') || document.head, {
      childList: true,
      subtree: true,
      characterData: true
    });
  },

  _updateForRoute() {
    this._syncRouteState();
    // Rebuild tabs and sidebar active state
    const oldTabbar = document.getElementById('vsc-tabbar');
    const oldSidebar = document.getElementById('vsc-sidebar');
    if (oldTabbar) oldTabbar.remove();
    if (oldSidebar) oldSidebar.remove();
    this._buildSidebar();
    this._buildTabBar();
  }
};
