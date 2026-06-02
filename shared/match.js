// Shared host → site-id matcher.
// Used by content scripts (via window.WebFishMatch) and by popup.js
// (which copies the same logic in its own context, since extension popups
// can't share runtime with content scripts).
'use strict';

(function (root) {
  const RULES = [
    { id: 'twitter', test: (host) => host === 'x.com' || host === 'twitter.com' || host.endsWith('.twitter.com') || host.endsWith('.x.com') },
    { id: 'linuxdo', test: (host) => host === 'linux.do' || host.endsWith('.linux.do') },
  ];

  function matchHost(host) {
    for (const rule of RULES) {
      if (rule.test(host)) return rule.id;
    }
    return null;
  }

  root.WebFishMatch = { matchHost };
})(typeof window !== 'undefined' ? window : globalThis);
