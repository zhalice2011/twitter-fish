// Linuxdo (Discourse) transformer — site-specific DOM rewrites.
// itemSelector switches by route kind: feed -> tr.topic-list-item, thread -> .topic-post.
'use strict';

(function (root) {

  function transformItem(item, ctx) {
    if (!item) return;
    if (item.dataset.vscProcessed) {
      ctx.transformMedia(item);
      return;
    }
    item.dataset.vscProcessed = '1';

    if (item.matches('tr.topic-list-item')) {
      return transformTopicRow(item, ctx);
    }
    if (item.matches('.topic-post')) {
      return transformPost(item, ctx);
    }
  }

  // -------------------- Feed (topic list) --------------------
  function transformTopicRow(row, ctx) {
    const titleLink = row.querySelector('a.title.raw-topic-link, a.title');
    if (!titleLink) return;

    const topicId = row.getAttribute('data-topic-id') || '';
    const titleText = (titleLink.textContent || '').trim();
    const href = titleLink.getAttribute('href') || '';

    // Author = first poster (`.posters a.latest.single` or any `[data-user-card]` in posters cell)
    const postersCell = row.querySelector('td.posters');
    let author = '';
    if (postersCell) {
      const aWithCard = postersCell.querySelector('a[data-user-card]');
      author = aWithCard?.getAttribute('data-user-card')
        || aWithCard?.getAttribute('href')?.split('/u/')[1]
        || '';
    }

    // Time = `.activity` cell, or aria-label on date span
    const activityCell = row.querySelector('td.activity, .activity');
    const timeText = (activityCell?.textContent || '').trim();

    // Wrap title in an `import { topic_<id> } from "<href>"` line.
    // We don't replace the title link (keeps Discourse routing) — instead
    // we hide non-essential cells and prepend a comment line.
    const comment = document.createElement('div');
    comment.className = 'vsc-comment-line vsc-injected';
    const prefix = document.createTextNode('// ');
    const link = document.createElement('a');
    link.className = 'vsc-comment-link';
    link.href = author ? `/u/${author}` : (href || '#');
    link.textContent = author ? `@${author}` : '@unknown';
    const suffix = document.createTextNode(timeText ? ` · ${timeText}` : '');
    comment.appendChild(prefix);
    comment.appendChild(link);
    comment.appendChild(suffix);

    // Insert comment line + line numbers as the first child of the main-link cell.
    const mainCell = row.querySelector('td.main-link') || row.firstElementChild;
    if (mainCell) {
      mainCell.style.position = 'relative';
      mainCell.insertBefore(comment, mainCell.firstChild);
      ctx.addLineNumbers(mainCell, 2); // comment + title
    }

    // Hide secondary columns (avatar / posts count / views / activity)
    row.querySelectorAll('td.posters, td.posts, td.views, td.activity, td.posts-count').forEach(td => {
      td.style.display = 'none';
      td.setAttribute('data-vsc-hidden', '1');
    });
  }

  // -------------------- Thread (single topic) --------------------
  function transformPost(post, ctx) {
    const userLink = post.querySelector('.names .username a, .names a[data-user-card]');
    const username = userLink?.getAttribute('data-user-card')
      || userLink?.getAttribute('href')?.split('/u/')[1]?.split(/[/?#]/)[0]
      || '';

    const dateEl = post.querySelector('.post-date .relative-date, .post-date');
    const timeText = (dateEl?.textContent || '').trim();

    const comment = document.createElement('div');
    comment.className = 'vsc-comment-line vsc-injected';
    const prefix = document.createTextNode('// ');
    const link = document.createElement('a');
    link.className = 'vsc-comment-link';
    link.href = username ? `/u/${username}` : '#';
    link.textContent = username ? `@${username}` : '@unknown';
    const suffix = document.createTextNode(timeText ? ` · ${timeText}` : '');
    comment.appendChild(prefix);
    comment.appendChild(link);
    comment.appendChild(suffix);

    const body = post.querySelector('.topic-body, .post__body, article');
    if (!body) return;
    body.insertBefore(comment, body.firstChild);

    // Approximate line count from cooked content paragraphs.
    const cooked = post.querySelector('.cooked');
    const paraCount = cooked ? cooked.querySelectorAll('p, li, pre, blockquote').length : 1;
    const lineCount = Math.max(2, paraCount + 1); // +1 for comment line
    ctx.addLineNumbers(body, lineCount);

    ctx.transformMedia(post);
  }

  // -------------------- Profile header (/u/:username) --------------------
  function transformHeader(ctx) {
    if (document.documentElement.dataset.vscRoute !== 'profile') return;

    const handle = (location.pathname.match(/^\/u\/([^/?#]+)/) || [])[1];
    if (!handle) return;

    const userMain = document.querySelector('.user-main, .user-content, #main-outlet');
    if (!userMain) return;

    const existing = document.querySelector('.vsc-profile-card');
    if (existing?.dataset.vscProfileHandle === handle) return;
    if (existing) existing.remove();

    const displayName = (userMain.querySelector('.full-name, .username .name, h1.username')?.textContent || '').trim() || handle;
    const bio = (userMain.querySelector('.bio .bio-content, .user-profile-bio')?.textContent || '').trim();

    const card = document.createElement('section');
    card.className = 'vsc-profile-card vsc-injected';
    card.dataset.vscProfileHandle = handle;

    const lines = [
      `// profile: @${handle}`,
      `export const ${toIdentifier(handle)} = {`,
      `  name: ${JSON.stringify(displayName)},`,
      `  handle: "@${handle}",`,
    ];
    if (bio) lines.push(`  bio: ${JSON.stringify(bio)},`);
    lines.push('};');
    card.textContent = lines.join('\n');

    userMain.insertBefore(card, userMain.firstChild);
  }

  function toIdentifier(value) {
    const normalized = value.replace(/[^a-zA-Z0-9_$]/g, '_');
    return /^[a-zA-Z_$]/.test(normalized) ? normalized : `user_${normalized}`;
  }

  root.WebFishLinuxdoTransformer = { transformItem, transformHeader };
})(typeof window !== 'undefined' ? window : globalThis);
