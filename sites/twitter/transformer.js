// Twitter / X transformer — site-specific DOM rewrites.
// Implements transformItem (per <article>) and transformHeader (profile page).
// Uses ctx helpers from core/transformer.js:
//   ctx.addLineNumbers(host, lineCount)
//   ctx.transformMedia(article)
//   ctx.lineCounter (read-only-ish)
'use strict';

(function (root) {
  const RESERVED = new Set([
    'home', 'explore', 'notifications', 'messages', 'bookmarks', 'settings',
    'i', 'compose', 'search', 'login', 'logout', 'signup',
  ]);

  function transformItem(article, ctx) {
    if (!article) return;
    if (article.dataset.vscProcessed) {
      // Media often mounts after the article shell — keep scanning.
      ctx.transformMedia(article);
      return;
    }
    article.dataset.vscProcessed = '1';

    transformRetweet(article);
    transformUserLine(article);
    addTweetLineNumbers(article, ctx);
    ctx.transformMedia(article);
  }

  function transformUserLine(article) {
    const timeEl = article.querySelector('time');
    if (!timeEl) return;

    const userNameDiv = article.querySelector('[data-testid="User-Name"]');
    if (!userNameDiv) return;

    const links = userNameDiv.querySelectorAll('a[href^="/"]');
    let username = '';
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href && href.match(/^\/[^/]+$/) && !href.includes('status')) {
        username = href.slice(1);
        break;
      }
    }

    const timeText = timeEl.textContent || '';

    const comment = document.createElement('div');
    comment.className = 'vsc-comment-line vsc-injected';
    const prefix = document.createTextNode('// ');
    const link = document.createElement('a');
    link.href = `/${username}`;
    link.className = 'vsc-comment-link';
    link.textContent = `@${username}`;
    const suffix = document.createTextNode(` · ${timeText}`);
    comment.appendChild(prefix);
    comment.appendChild(link);
    comment.appendChild(suffix);

    userNameDiv.style.display = 'none';
    userNameDiv.setAttribute('data-vsc-hidden', '1');
    userNameDiv.parentNode.insertBefore(comment, userNameDiv);
  }

  function addTweetLineNumbers(article, ctx) {
    const tweetText = article.querySelector('[data-testid="tweetText"]');
    const textContent = tweetText ? tweetText.textContent : '';
    const lineCount = Math.max(1, (textContent.match(/\n/g) || []).length + 1);
    // +1 for the comment line we just inserted
    ctx.addLineNumbers(article, lineCount + 1);
  }

  function transformRetweet(article) {
    const cell = article.closest('[data-testid="cellInnerDiv"]');
    if (!cell) return;
    const socialContext = cell.querySelector('[data-testid="socialContext"]');
    if (!socialContext) return;
    const text = socialContext.textContent || '';
    const retweeter = text.replace(/\s*(reposted|retweeted|已转帖|已转发)\s*$/i, '').trim();
    if (!retweeter) return;

    const retweetLine = document.createElement('div');
    retweetLine.className = 'vsc-retweet-line vsc-injected';
    retweetLine.textContent = `// ${retweeter} 已转帖`;
    article.insertBefore(retweetLine, article.firstChild);

    socialContext.style.display = 'none';
    socialContext.setAttribute('data-vsc-hidden', '1');
  }

  function transformHeader(ctx) {
    // Only run on profile route
    if (document.documentElement.dataset.vscRoute !== 'profile') return;

    const primary = document.querySelector('[data-testid="primaryColumn"]');
    if (!primary) return;

    const userName = primary.querySelector('[data-testid="UserName"]');
    const profileNav = findProfileNav(primary);
    if (!userName || !profileNav) return;

    const handleLink = Array.from(userName.querySelectorAll('a[href^="/"]'))
      .find(link => /^\/[^/]+$/.test(link.getAttribute('href') || ''));
    const handle = handleLink?.getAttribute('href')?.slice(1) || location.pathname.split('/')[1] || '';
    const existingCard = primary.querySelector('.vsc-profile-card');
    if (existingCard?.dataset.vscProfileHandle === handle) {
      hideNativeProfileHeaderSiblings(existingCard);
      return;
    }
    if (existingCard) existingCard.remove();

    const displayName = extractDisplayName(userName, handle);
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
      `export const ${toIdentifier(handle)} = {`,
      `  name: ${JSON.stringify(displayName)},`,
      `  handle: "@${handle}",`,
    ];
    if (description) lines.push(`  bio: ${JSON.stringify(description)},`);
    if (metadata) lines.push(`  meta: ${JSON.stringify(metadata)},`);
    if (following) lines.push(`  following: ${JSON.stringify(following)},`);
    if (followers) lines.push(`  followers: ${JSON.stringify(followers)},`);
    lines.push('};');
    card.textContent = lines.join('\n');

    const profileContainer = findProfileContainer(userName, profileNav);
    profileContainer.classList.add('vsc-profile-container');
    const navWrapper = getDirectChild(profileContainer, profileNav) || profileNav;
    profileContainer.insertBefore(card, navWrapper);
    hideNativeProfileHeaderSiblings(card);
  }

  function findProfileNav(primary) {
    return primary.querySelector(
      'nav[aria-label*="Profile"], nav[aria-label*="个人资料"], nav[role="navigation"]:has([role="tablist"])'
    );
  }

  function findProfileContainer(userName, profileNav) {
    let container = profileNav.parentElement;
    while (container && container !== document.body) {
      if (container.contains(userName) && container.contains(profileNav)) return container;
      container = container.parentElement;
    }
    return profileNav.parentElement?.parentElement || profileNav.parentElement || profileNav;
  }

  function getDirectChild(container, descendant) {
    let child = descendant;
    while (child && child.parentElement !== container) child = child.parentElement;
    return child?.parentElement === container ? child : null;
  }

  function extractDisplayName(userName, handle) {
    const candidates = Array.from(userName.querySelectorAll('span'))
      .map(el => el.textContent.trim())
      .filter(Boolean)
      .filter(text => text !== `@${handle}` && !text.includes(`@${handle}`));
    return candidates[0] || handle;
  }

  function toIdentifier(value) {
    const normalized = value.replace(/[^a-zA-Z0-9_$]/g, '_');
    return /^[a-zA-Z_$]/.test(normalized) ? normalized : `user_${normalized}`;
  }

  function hideNativeProfileHeaderSiblings(card) {
    const container = card.parentElement;
    if (!container) return;
    let sibling = container.firstElementChild;
    while (sibling && sibling !== card) {
      const next = sibling.nextElementSibling;
      sibling.style.display = 'none';
      sibling.setAttribute('data-vsc-hidden', '1');
      sibling.setAttribute('data-vsc-profile-native', '1');
      sibling = next;
    }
  }

  root.WebFishTwitterTransformer = { transformItem, transformHeader };
})(typeof window !== 'undefined' ? window : globalThis);
