// Generic VSCode-style transformer skeleton.
// Owns: MutationObserver, line counter, vsc-injected lifecycle, processed flags.
// Adapter supplies: primaryColumnSelector, itemSelector(routeKind), transformItem,
// transformHeader, mediaSelectors (for image/video placeholders), helpers.
'use strict';

(function (root) {
  const TweetTransformer = {
    _observer: null,
    _adapter: null,
    _settings: { hideImages: false, hideVideos: false },
    _ctx: null,

    configure(adapter, settings) {
      this._adapter = adapter;
      this._settings = {
        hideImages: Boolean(settings && settings.hideImages),
        hideVideos: Boolean(settings && settings.hideVideos),
      };
      this._ctx = {
        lineCounter: { value: 1 },
        settings: this._settings,
        addLineNumbers: (host, lineCount) => this._addLineNumbers(host, lineCount),
        transformMedia: (article) => this._transformMedia(article),
        adapter,
      };
    },

    start() {
      this._ctx.lineCounter.value = 1;
      this._processAll();
      this._observer = new MutationObserver(mutations => {
        requestAnimationFrame(() => this._handleMutations(mutations));
      });
      this._observer.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
      if (this._observer) {
        this._observer.disconnect();
        this._observer = null;
      }
      // Site-agnostic cleanup: remove all injected elements + restore hidden ones.
      document.querySelectorAll('.vsc-injected').forEach(el => el.remove());
      document.querySelectorAll('[data-vsc-hidden]').forEach(el => {
        el.style.display = '';
        el.removeAttribute('data-vsc-hidden');
        el.removeAttribute('data-vsc-profile-native');
      });
      document.querySelectorAll('[data-vsc-processed]').forEach(el => {
        el.removeAttribute('data-vsc-processed');
      });
      document.querySelectorAll('.vsc-profile-container').forEach(el => {
        el.classList.remove('vsc-profile-container');
      });
      // Allow adapter-specific teardown if needed.
      if (this._adapter && this._adapter.transformer && typeof this._adapter.transformer.teardown === 'function') {
        try { this._adapter.transformer.teardown(); } catch (e) { /* swallow */ }
      }
      if (this._ctx) this._ctx.lineCounter.value = 1;
    },

    _itemSelector() {
      const sel = this._adapter.transformer.itemSelector;
      return typeof sel === 'function' ? sel(location.pathname) : sel;
    },

    _processAll() {
      this._processHeaderSafe();
      const sel = this._itemSelector();
      if (sel) document.querySelectorAll(sel).forEach(item => this._processItem(item));
    },

    _processHeaderSafe() {
      const fn = this._adapter.transformer.transformHeader;
      if (typeof fn === 'function') {
        try { fn(this._ctx); } catch (e) { console.warn('[WebFish] transformHeader error', e); }
      }
    },

    _processItem(item) {
      if (!item) return;
      try { this._adapter.transformer.transformItem(item, this._ctx); }
      catch (e) { console.warn('[WebFish] transformItem error', e); }
    },

    _handleMutations(mutations) {
      const sel = this._itemSelector();
      if (!sel) return this._processHeaderSafe();

      const items = new Set();
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches?.(sel)) items.add(node);
          const within = node.closest?.(sel);
          if (within) items.add(within);
          if (node.querySelectorAll) {
            node.querySelectorAll(sel).forEach(n => items.add(n));
          }
        }
      }
      items.forEach(it => this._processItem(it));
      this._processHeaderSafe();
    },

    // --- helpers exposed to adapters via ctx ---

    _addLineNumbers(host, lineCount) {
      if (!host || host.querySelector(':scope > .vsc-line-numbers')) return;
      const total = Math.max(1, lineCount | 0);
      const gutter = document.createElement('div');
      gutter.className = 'vsc-line-numbers vsc-injected';
      const numbers = [];
      const start = this._ctx.lineCounter.value;
      for (let i = 0; i < total; i++) {
        numbers.push(String(start + i).padStart(3, ' '));
      }
      gutter.textContent = numbers.join('\n');
      this._ctx.lineCounter.value = start + total + 1; // +1 blank line gap
      host.insertBefore(gutter, host.firstChild);
    },

    _transformMedia(article) {
      const mediaCfg = this._adapter.transformer.media;
      if (!mediaCfg || !mediaCfg.containerSelector) return;

      const containers = article.querySelectorAll(mediaCfg.containerSelector);
      containers.forEach(container => {
        if (container.dataset.vscProcessed) return;
        container.dataset.vscProcessed = '1';

        const desc = mediaCfg.describe ? mediaCfg.describe(container) : null;
        if (!desc) return; // adapter signals "not media, skip"
        const { kind, count, label } = desc;

        const placeholder = document.createElement('div');
        placeholder.className = 'vsc-media-comment vsc-injected';
        if (label) {
          placeholder.textContent = label;
        } else if (kind === 'video') {
          placeholder.textContent = '/* [video_asset.mp4] */';
        } else if (kind === 'cover') {
          placeholder.textContent = '/* [article_cover_image.png] */';
        } else {
          placeholder.textContent = count > 1
            ? `/* [image_assets: ${count} files] */`
            : '/* [image_asset.png] */';
        }

        const shouldHide = kind === 'video' ? this._settings.hideVideos : this._settings.hideImages;
        container.style.display = 'none';
        container.setAttribute('data-vsc-hidden', '1');
        if (!shouldHide) {
          container.parentNode.insertBefore(placeholder, container.nextSibling);
        }
      });
    },
  };

  root.TweetTransformer = TweetTransformer;
})(typeof window !== 'undefined' ? window : globalThis);
