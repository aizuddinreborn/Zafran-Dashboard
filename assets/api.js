// Talks to the owner's Apps Script web app, which reads the Google Sheets and checks the PIN.
window.xpApi = (() => {
  const KEY = 'xp_script_url';
  const fixed = () => ((window.XP_CONFIG && window.XP_CONFIG.scriptUrl) || '').trim();
  const valid = (u) => /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/.test(String(u || '').trim());
  return {
    valid,
    isFixed: () => !!fixed(),
    url() {
      if (fixed()) return fixed();
      try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; }
    },
    setUrl(u) { try { localStorage.setItem(KEY, String(u).trim()); } catch (e) { /* private mode: kept for this visit only */ } window.__xpUrl = String(u).trim(); },
    clearUrl() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } window.__xpUrl = ''; },
    async call(action, body, timeoutMs) {
      const url = this.url() || window.__xpUrl;
      if (!url) throw new Error('no_url');
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), timeoutMs || 45000);
      try {
        // text/plain keeps this a "simple" request, which Apps Script answers without a CORS preflight
        let res;
        try {
          res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(Object.assign({ action }, body || {})),
            redirect: 'follow',
            signal: ctl.signal,
          });
        } catch (e) {
          // Aborted = no answer in time; otherwise the browser was refused (usually a sign-in page from Google)
          throw new Error(e && e.name === 'AbortError' ? 'timeout' : 'blocked');
        }
        if (!res.ok) throw new Error('http_' + res.status);
        const text = await res.text();
        try { return JSON.parse(text); } catch (e) { throw new Error('not_json'); }
      } finally {
        clearTimeout(timer);
      }
    },
  };
})();
