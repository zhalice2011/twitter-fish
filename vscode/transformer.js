// Tweet Transformer — Converts tweets to code-like appearance
'use strict';

const TweetTransformer = {
  _observer: null,
  _lineCounter: 1,
  _settings: {
    hideImages: false,
    hideVideos: false
  },

  configure(settings = {}) {
    this._settings = {
      hideImages: Boolean(settings.hideImages),
      hideVideos: Boolean(settings.hideVideos)
    };
  },

  start() {
    this._lineCounter = 1;
    this._processAll();

    this._observer = new MutationObserver(mutations => {
      requestAnimationFrame(() => this._handleMutations(mutations));
    });

    const target = document.querySelector('[data-testid="primaryColumn"]') || document.body;
    this._observer.observe(target, { childList: true, subtree: true });
  },

  stop() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    // Clean up injected elements
    document.querySelectorAll('.vsc-injected').forEach(el => el.remove());
    // Restore hidden elements
    document.querySelectorAll('[data-vsc-hidden]').forEach(el => {
      el.style.display = '';
      el.removeAttribute('data-vsc-hidden');
    });
    // Remove processed flags
    document.querySelectorAll('[data-vsc-processed]').forEach(el => {
      el.removeAttribute('data-vsc-processed');
    });
    this._lineCounter = 1;
  },

  _handleMutations(mutations) {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches && node.matches('[data-testid="cellInnerDiv"]')) {
          const tweet = node.querySelector('article[data-testid="tweet"]');
          if (tweet) this._processTweet(tweet);
        } else if (node.querySelectorAll) {
          const tweets = node.querySelectorAll('article[data-testid="tweet"]');
          tweets.forEach(t => this._processTweet(t));
        }
      }
    }
    this._processProfileHeader();
  },

  _processAll() {
    this._processProfileHeader();
    document.querySelectorAll('article[data-testid="tweet"]').forEach(t => this._processTweet(t));
  },

  _processTweet(article) {
    if (!article || article.dataset.vscProcessed) return;
    article.dataset.vscProcessed = '1';

    this._transformRetweet(article);
    this._transformUserLine(article);
    this._addLineNumbers(article);
    this._transformMedia(article);
  },

  _transformUserLine(article) {
    const timeEl = article.querySelector('time');
    if (!timeEl) return;

    // Find the user name area
    const userNameDiv = article.querySelector('[data-testid="User-Name"]');
    if (!userNameDiv) return;

    // Extract username
    const links = userNameDiv.querySelectorAll('a[href^="/"]');
    let username = '';
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href && href.match(/^\/[^/]+$/) && !href.includes('status')) {
        username = href.slice(1);
        break;
      }
    }

    // Extract time
    const timeText = timeEl.textContent || '';

    // Create comment line
    const comment = document.createElement('div');
    comment.className = 'vsc-comment-line vsc-injected';
    comment.textContent = `// @${username} · ${timeText}`;

    // Hide original user row and insert comment
    userNameDiv.style.display = 'none';
    userNameDiv.setAttribute('data-vsc-hidden', '1');
    userNameDiv.parentNode.insertBefore(comment, userNameDiv);
  },

  _addLineNumbers(article) {
    if (article.querySelector('.vsc-line-numbers')) return;

    const tweetText = article.querySelector('[data-testid="tweetText"]');
    const textContent = tweetText ? tweetText.textContent : '';
    const lineCount = Math.max(1, (textContent.match(/\n/g) || []).length + 1);

    // Account for comment line + possible import line + text lines + gap
    const totalLines = lineCount + 1; // +1 for the comment line

    const gutter = document.createElement('div');
    gutter.className = 'vsc-line-numbers vsc-injected';

    const numbers = [];
    for (let i = 0; i < totalLines; i++) {
      numbers.push(String(this._lineCounter + i).padStart(3, ' '));
    }
    gutter.textContent = numbers.join('\n');

    this._lineCounter += totalLines + 1; // +1 for blank line between "blocks"

    article.insertBefore(gutter, article.firstChild);
  },

  _transformMedia(article) {
    const mediaContainers = article.querySelectorAll(
      'div[aria-labelledby]:not([role]):not([data-testid]):has([data-testid="tweetPhoto"]), [data-testid="article-cover-image"]'
    );

    mediaContainers.forEach(container => {
      if (container.dataset.vscProcessed) return;
      container.dataset.vscProcessed = '1';

      const hasVideo = container.querySelector('[data-testid="videoPlayer"]');
      const isArticleCover = container.matches('[data-testid="article-cover-image"]');
      const photos = container.querySelectorAll('[data-testid="tweetPhoto"]');
      const count = photos.length;
      const shouldHide = hasVideo ? this._settings.hideVideos : this._settings.hideImages;

      const placeholder = document.createElement('div');
      placeholder.className = 'vsc-media-comment vsc-injected';

      if (isArticleCover) {
        placeholder.textContent = '/* [article_cover_image.png] */';
      } else if (hasVideo) {
        placeholder.textContent = '/* [video_asset.mp4] */';
      } else {
        placeholder.textContent = count > 1
          ? `/* [image_assets: ${count} files] */`
          : '/* [image_asset.png] */';
      }

      container.style.display = 'none';
      container.setAttribute('data-vsc-hidden', '1');

      if (!shouldHide) {
        container.parentNode.insertBefore(placeholder, container.nextSibling);
      }
    });
  },

  _transformRetweet(article) {
    const cell = article.closest('[data-testid="cellInnerDiv"]');
    if (!cell) return;

    const socialContext = cell.querySelector('[data-testid="socialContext"]');
    if (!socialContext) return;

    // Extract retweeter name
    const text = socialContext.textContent || '';
    const retweeter = text
      .replace(/\s*(reposted|retweeted|已转帖|已转发)\s*$/i, '')
      .trim();

    if (!retweeter) return;

    const retweetLine = document.createElement('div');
    retweetLine.className = 'vsc-retweet-line vsc-injected';
    retweetLine.textContent = `// ${retweeter} 已转帖`;

    // Insert at top of article
    article.insertBefore(retweetLine, article.firstChild);

    // Hide original social context
    socialContext.style.display = 'none';
    socialContext.setAttribute('data-vsc-hidden', '1');
  },

  _processProfileHeader() {
    if (document.documentElement.dataset.vscRoute !== 'profile') return;

    const primary = document.querySelector('[data-testid="primaryColumn"]');
    if (!primary) return;

    const userName = primary.querySelector('[data-testid="UserName"]');
    const profileNav = primary.querySelector(
      'nav[aria-label*="Profile"], nav[aria-label*="个人资料"]'
    );
    if (!userName || !profileNav) return;

    const handleLink = Array.from(userName.querySelectorAll('a[href^="/"]'))
      .find(link => /^\/[^/]+$/.test(link.getAttribute('href') || ''));
    const handle = handleLink?.getAttribute('href')?.slice(1) || location.pathname.slice(1);
    const existingCard = primary.querySelector('.vsc-profile-card');
    if (existingCard?.dataset.vscProfileHandle === handle) return;
    if (existingCard) existingCard.remove();

    const displayName = this._extractProfileDisplayName(userName, handle);
    const description = primary.querySelector('[data-testid="UserDescription"]')?.textContent.trim() || '';
    const metadata = primary.querySelector('[data-testid="UserProfileHeader_Items"]')?.textContent.trim() || '';
    const following = primary.querySelector(`a[href="/${handle}/following"]`)?.textContent.trim() || '';
    const followers = (
      primary.querySelector(`a[href="/${handle}/verified_followers"]`) ||
      primary.querySelector(`a[href="/${handle}/followers"]`)
    )?.textContent.trim() || '';

    const card = document.createElement('section');
    card.className = 'vsc-profile-card vsc-injected';
    card.dataset.vscProfileHandle = handle;
    card.setAttribute('aria-label', 'Profile summary');

    const lines = [
      `// profile: @${handle}`,
      `export const ${this._toIdentifier(handle)} = {`,
      `  name: ${JSON.stringify(displayName)},`,
      `  handle: "@${handle}",`
    ];

    if (description) lines.push(`  bio: ${JSON.stringify(description)},`);
    if (metadata) lines.push(`  meta: ${JSON.stringify(metadata)},`);
    if (following) lines.push(`  following: ${JSON.stringify(following)},`);
    if (followers) lines.push(`  followers: ${JSON.stringify(followers)},`);
    lines.push('};');

    card.textContent = lines.join('\n');

    const navWrapper = profileNav.parentElement || profileNav;
    navWrapper.parentNode.insertBefore(card, navWrapper);
    this._hideNativeProfileHeaderSiblings(card);
  },

  _extractProfileDisplayName(userName, handle) {
    const candidates = Array.from(userName.querySelectorAll('span'))
      .map(el => el.textContent.trim())
      .filter(Boolean)
      .filter(text => text !== `@${handle}` && !text.includes(`@${handle}`));

    return candidates[0] || handle;
  },

  _toIdentifier(value) {
    const normalized = value.replace(/[^a-zA-Z0-9_$]/g, '_');
    return /^[a-zA-Z_$]/.test(normalized) ? normalized : `user_${normalized}`;
  },

  _hideNativeProfileHeaderSiblings(card) {
    const container = card.parentElement;
    if (!container) return;

    let sibling = container.firstElementChild;
    while (sibling && sibling !== card) {
      const next = sibling.nextElementSibling;
      const isStickyTitle = Boolean(sibling.querySelector('[data-testid="app-bar-back"]'));
      if (!isStickyTitle) {
        sibling.style.display = 'none';
        sibling.setAttribute('data-vsc-hidden', '1');
      }
      sibling = next;
    }
  }
};
